import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pins = JSON.parse(await fs.readFile(new URL('./android-ci-toolchain-pins.json', import.meta.url), 'utf8'));
const android = path.join(root, 'src/android');
const evidence = path.join(root, 'test-results/android-ci');
const python = (code, ...args) => command('python3', ['-c', code, ...args], { capture: true });
function command(program, args, { capture = false, cwd = root, env = process.env, input } = {}) {
  const result = spawnSync(program, args, { cwd, env, input, encoding: 'utf8',
    stdio: capture ? 'pipe' : input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit'],
    maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${program} failed (${result.status ?? result.error?.code})${capture ? `: ${result.stderr}` : ''}`);
  return result.stdout?.trim();
}
async function digest(file, algorithm = 'sha256') {
  const hash = createHash(algorithm);
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function verifyChecksum(file, expected) {
  assert.equal(await digest(file), expected, `Checksum mismatch: ${path.basename(file)}`);
}
async function download(url, destination, expected) {
  command('curl', ['--fail', '--silent', '--show-error', '--location', '--retry', '3', '--output', destination, url]);
  await verifyChecksum(destination, expected);
}
async function scope(directory = android, output = process.env.GITHUB_OUTPUT) {
  const present = await fs.stat(directory).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error; });
  console.log(present ? 'Android source is in scope; native prerequisites and suites are required.' : 'Android source is absent; native execution is explicitly out of scope.');
  if (output) await fs.appendFile(output, `present=${present}\n`);
  return present;
}
function metadataCheck(files, selected) {
  return python(`import json,sys,xml.etree.ElementTree as E
records=json.loads(sys.argv[1]); pins=json.loads(sys.argv[2])
for p in pins:
 root=E.parse(records[p['repository']]).getroot()
 found=False
 for item in root:
  if item.tag.split('}')[-1]!='remotePackage' or item.get('path')!=p['id']: continue
  rev=item.find('revision')
  actual='.'.join(rev.findtext(k,'0') for k in ['major','minor','micro'])
  channel=item.find('channelRef')
  if actual!=p['revision'] or (channel is not None and channel.get('ref')!='channel-0'): continue
  for archive in item.findall('./archives/archive'):
   if archive.findtext('host-os','linux')!='linux' or archive.findtext('host-arch','x64')!='x64': continue
   complete=archive.find('complete'); checksum=complete.find('checksum')
   if complete.findtext('url')==p['archive'] and checksum.text==p['checksum'] and checksum.get('type')==p['checksumType']: found=True
 if not found: raise SystemExit('Official SDK metadata no longer matches pin: '+p['id'])
print('Official SDK metadata matches all selected archive pins.')`, JSON.stringify(files), JSON.stringify(selected));
}
function installedCheck(sdk, selected) {
  return python(`import json,sys,pathlib,xml.etree.ElementTree as E
sdk=pathlib.Path(sys.argv[1]); pins=json.loads(sys.argv[2])
for p in pins:
 root=E.parse(sdk.joinpath(*p['id'].split(';'),'package.xml')).getroot()
 packages=[x for x in root.iter() if x.tag.split('}')[-1]=='localPackage' and x.get('path')==p['id']]
 if len(packages)!=1: raise SystemExit('Missing/ambiguous installed package: '+p['id'])
 rev=next(x for x in packages[0] if x.tag.split('}')[-1]=='revision')
 values={x.tag.split('}')[-1]:x.text for x in rev}
 actual='.'.join(values.get(k,'0') for k in ['major','minor','micro'])
 if actual!=p['revision']: raise SystemExit('Installed SDK revision drift: '+p['id']+' '+actual)
print('Installed SDK revisions match all selected pins.')`, sdk, JSON.stringify(selected));
}
async function requireKvm(device = '/dev/kvm') {
  assert.ok((await fs.stat(device)).isCharacterDevice(), 'KVM character device is required.');
  await fs.access(device, fs.constants.R_OK | fs.constants.W_OK);
}
async function install(kind) {
  const state = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), `scoremap-android-${kind}`);
  await fs.mkdir(state, { recursive: true });
  const java = path.join(state, 'jdk');
  const sdk = path.join(state, 'sdk');
  await fs.mkdir(java, { recursive: true });
  const container = command('docker', ['create', pins.jdkImage], { capture: true });
  try { command('docker', ['cp', `${container}:/opt/java/openjdk/.`, java]); }
  finally { command('docker', ['rm', container], { capture: true }); }
  const version = command(path.join(java, 'bin/java'), ['--version'], { capture: true });
  assert.ok(version.includes(pins.javaVersion), `Unexpected JDK: ${version}`);
  console.log(version);
  const tools = path.join(sdk, 'cmdline-tools', pins.commandLineTools.version);
  // A restored SDK cache skips the archive download; package pins are still re-verified below.
  const restored = await fs.stat(path.join(tools, 'bin/sdkmanager')).then(() => true, () => false);
  if (restored) console.log('Reusing the cached Android command-line tools; package pins are re-verified.');
  else {
    const archive = path.join(state, 'command-line-tools.zip');
    await download(pins.commandLineTools.url, archive, pins.commandLineTools.sha256);
    const unpack = path.join(state, 'unpack');
    await fs.mkdir(unpack, { recursive: true });
    python(`import pathlib,sys,zipfile
root=pathlib.Path(sys.argv[2]).resolve()
with zipfile.ZipFile(sys.argv[1]) as archive:
 for member in archive.infolist():
  target=(root/member.filename).resolve()
  if not target.is_relative_to(root): raise SystemExit('Unsafe command-line tools archive path')
  archive.extract(member,root)
  mode=(member.external_attr>>16)&0o777
  if mode: target.chmod(mode)
`, archive, unpack);
    await fs.mkdir(path.join(sdk, 'cmdline-tools'), { recursive: true });
    await fs.rename(path.join(unpack, 'cmdline-tools'), path.join(sdk, 'cmdline-tools', pins.commandLineTools.version));
  }
  const selected = pins.packages.filter(p => p.scope === 'host' || kind === 'device');
  const metadata = {};
  for (const name of new Set(selected.map(p => p.repository))) {
    metadata[name] = path.join(state, `${name}.xml`);
    command('curl', ['--fail', '--silent', '--show-error', '--location', '--retry', '3', '--output', metadata[name], pins.repositories[name]]);
  }
  console.log(metadataCheck(metadata, selected));
  const cache = path.join(root, '.runtime/android-ci', kind);
  const variables = { JAVA_HOME: java, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk,
    GRADLE_USER_HOME: path.join(cache, 'gradle-user-home'), ANDROID_USER_HOME: path.join(cache, 'android-user') };
  const bins = [path.join(java, 'bin'), path.join(sdk, 'cmdline-tools', pins.commandLineTools.version, 'bin'), path.join(sdk, 'platform-tools'), path.join(sdk, 'emulator')];
  const env = { ...process.env, ...variables, PATH: [...bins, process.env.PATH].join(path.delimiter) };
  for (const directory of [variables.GRADLE_USER_HOME, variables.ANDROID_USER_HOME]) await fs.mkdir(directory, { recursive: true });
  const manager = path.join(sdk, 'cmdline-tools', pins.commandLineTools.version, 'bin/sdkmanager');
  command(manager, [`--sdk_root=${sdk}`, '--licenses'], { env, input: 'y\n'.repeat(100) });
  command(manager, [`--sdk_root=${sdk}`, '--channel=0', ...selected.map(p => p.id)], { env, input: 'y\n'.repeat(100) });
  console.log(installedCheck(sdk, selected));
  command(path.join(sdk, 'platform-tools/adb'), ['version'], { env });
  if (kind === 'device') {
    await requireKvm();
    command(path.join(sdk, 'emulator/emulator'), ['-accel-check'], { env });
  }
  assert.ok(process.env.GITHUB_ENV && process.env.GITHUB_PATH, 'Installation must export its toolchain to the Actions job.');
  await fs.appendFile(process.env.GITHUB_ENV, Object.entries(variables).map(([name, value]) => `${name}=${value}\n`).join(''));
  await fs.appendFile(process.env.GITHUB_PATH, bins.join('\n') + '\n');
  await fs.mkdir(evidence, { recursive: true });
  await fs.writeFile(path.join(evidence, `${kind}-toolchain.json`), JSON.stringify({ sourceRevision: process.env.GITHUB_SHA, javaVersion: pins.javaVersion, jdkImage: pins.jdkImage, packages: selected }, null, 2) + '\n');
}
async function wrapperCheck(directory = android) {
  const wrapper = path.join(directory, 'gradlew');
  assert.ok((await fs.stat(wrapper)).mode & 0o111, 'Gradle wrapper must be committed executable.');
  const properties = await fs.readFile(path.join(directory, 'gradle/wrapper/gradle-wrapper.properties'), 'utf8');
  const property = name => properties.split(/\r?\n/).find(line => line.startsWith(`${name}=`))?.slice(name.length + 1).replaceAll('\\:', ':');
  assert.equal(property('distributionUrl'), pins.gradle.url, 'Unexpected Gradle distribution URL.');
  assert.equal(property('distributionSha256Sum'), pins.gradle.sha256, 'Missing/unexpected Gradle distribution checksum.');
  assert.equal(await digest(path.join(directory, 'gradle/wrapper/gradle-wrapper.jar')), pins.gradle.wrapperJarSha256, 'Unexpected Gradle wrapper JAR.');
}
function reportCheck(directory, kind, startedAt) {
  return JSON.parse(python(`import json,sys,pathlib,xml.etree.ElementTree as E
root=pathlib.Path(sys.argv[1]); kind=sys.argv[2]; started=float(sys.argv[3]); reports=[]; count=0
needle='/build/test-results/' if kind=='host' else '/build/outputs/androidTest-results/'
for file in root.rglob('*.xml'):
 if needle not in file.as_posix(): continue
 if file.stat().st_mtime < started-1: continue
 tree=E.parse(file).getroot()
 suites=[x for x in tree.iter() if x.tag.split('}')[-1]=='testsuite' and not any(c.tag.split('}')[-1]=='testsuite' for c in x)]
 if not suites: raise SystemExit('Missing JUnit suite: '+str(file))
 for suite in suites:
  tests=int(suite.get('tests','0'))
  if tests<=0 or any(int(suite.get(k,'0')) for k in ['failures','errors','skipped','disabled']): raise SystemExit('Empty/failed/skipped suite: '+str(file))
  cases=[x for x in suite.iter() if x.tag.split('}')[-1]=='testcase']
  if len(cases)!=tests: raise SystemExit('JUnit test count mismatch: '+str(file))
  if any(x.tag.split('}')[-1] in ['failure','error','skipped'] for c in cases for x in c): raise SystemExit('Failed/skipped case: '+str(file))
  count+=tests
 reports.append(str(file.relative_to(root)))
if count<=0: raise SystemExit('No fresh executed '+kind+' JUnit tests found.')
print(json.dumps({'tests':count,'reports':reports}))`, directory, kind, String(startedAt / 1000)));
}
async function run(kind) {
  const startedAt = Date.now();
  const receipt = { sourceRevision: process.env.GITHUB_SHA, kind, startedAt: new Date(startedAt).toISOString(), status: 'failed' };
  await fs.mkdir(evidence, { recursive: true });
  try {
    await wrapperCheck();
    command('./gradlew', ['--no-daemon', '--max-workers=2', '-Dorg.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8',
      '-Pkotlin.compiler.execution.strategy=in-process', '-Pandroid.builder.sdkDownload=false',
      'help', '--task', kind === 'host' ? 'verifyHost' : 'verifyDevice'], { cwd: android });
    if (kind === 'host') {
      const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
      assert.ok(pkg.scripts?.['verify:android'], 'Root verify:android is required for Android source.');
      command('npm', ['run', 'verify:android']);
    } else {
      command('./gradlew', ['--no-daemon', '--max-workers=2', '-Dorg.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8',
        '-Pkotlin.compiler.execution.strategy=in-process', '-Pandroid.builder.sdkDownload=false',
        '-Pandroid.testoptions.manageddevices.emulator.gpu=swiftshader_indirect', 'verifyDevice'], { cwd: android });
    }
    // The Gradle aggregates own the complete expected-suite inventory; this also rejects a no-op CI entry point.
    receipt.execution = reportCheck(android, kind, startedAt);
    receipt.status = 'passed';
  } finally {
    receipt.endedAt = new Date().toISOString();
    await fs.writeFile(path.join(evidence, `${kind}-execution.json`), JSON.stringify(receipt, null, 2) + '\n');
  }
}
export { digest, verifyChecksum, scope, metadataCheck, installedCheck, requireKvm, reportCheck, wrapperCheck };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, kind] = process.argv.slice(2);
  assert.ok(['scope', 'install', 'run'].includes(action), 'Expected scope, install host|device, or run host|device.');
  if (action !== 'scope') assert.ok(['host', 'device'].includes(kind), 'Expected host or device.');
  if (action === 'scope') await scope();
  if (action === 'install') await install(kind);
  if (action === 'run') await run(kind);
}
