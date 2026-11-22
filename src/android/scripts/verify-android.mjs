import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { accessSync, constants, lstatSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const androidRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distribution = 'https://services.gradle.org/distributions/gradle-9.7.0-bin.zip';
const distributionSha = '84fbba45c7f4c64abc77460e1c00f541e9f960e3c7ed2538f1ede19eacd873ae';
const wrapperSha = '7a9ce74cff467ca1bf60a4fcd9f05185acceda4d0f382434d393e17864262c5d';

const qualifiedAgpUtpModules = new Map([
  ['unified-test-platform-launcher', ['launcher']],
  ['unified-test-platform-core', ['core']],
  ['unified-test-platform-gradle-work-action', ['core-proto', 'launcher']],
  ['unified-test-platform-android-device-provider-ddmlib', ['core-proto', 'android-device-provider-local']],
  ['unified-test-platform-android-driver-instrumentation', ['android-driver-instrumentation']],
  ['unified-test-platform-android-test-plugin', ['android-test-plugin']],
  ['unified-test-platform-android-test-plugin-host-device-info', ['android-device-provider-local']],
  ['unified-test-platform-android-test-plugin-host-additional-test-output', ['android-device-provider-local']],
  ['unified-test-platform-android-test-plugin-host-apk-installer', ['core-proto', 'android-device-provider-local']],
  ['unified-test-platform-android-test-plugin-host-coverage', ['android-device-provider-local']],
  ['unified-test-platform-android-test-plugin-host-logcat', ['android-device-provider-local']],
  ['unified-test-platform-android-test-plugin-host-emulator-control', ['android-device-provider-local', 'android-driver-instrumentation']],
  ['unified-test-platform-android-test-plugin-result-listener-gradle', ['core-proto', 'android-device-provider-local']],
]);

export function verifyDependencyLockVersions(contents, projectPath) {
  for (const line of contents.split(/\r?\n/).map(value => value.trim())) {
    if (!line || line.startsWith('#') || line.startsWith('empty=')) continue;
    const [coordinate, configurations, ...extra] = line.split('=');
    const parts = coordinate.split(':');
    assert.ok(parts.length === 3 && parts.every(Boolean) && configurations && extra.length === 0, 'Malformed dependency lock entry.');
    const [group, module, version] = parts;
    const qualifiedTool = projectPath === ':app' && group === 'com.google.testing.platform' && version === '0.0.9-alpha04'
      && configurations.split(',').every(configuration => qualifiedAgpUtpModules.get(configuration)?.includes(module));
    assert.ok(qualifiedTool || !/(?:^|[-.])(snapshot|alpha|beta|rc|dev|eap|preview|milestone|m)(?:[-.0-9]|$)/i.test(version), `Unqualified prerelease dependency: ${coordinate} in ${projectPath}.`);
  }
}

export function verifyLocalCatalogLock(root) {
  const lock = path.join(root, 'build-logic/settings-gradle.lockfile');
  const status = lstatSync(lock, { throwIfNoEntry: false });
  if (!status) return;
  assert.ok(status.isFile() && !status.isSymbolicLink(), 'The generated local catalog record must be a regular file.');
  const entries = readFileSync(lock, 'utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  assert.deepEqual(entries, ['empty=incomingCatalogForLibs0'], 'The ignored local catalog record cannot contain module dependencies or additional state.');
}

export function gradleInvocation(useHelper, cacheRoot) {
  if (useHelper) {
    return {
      program: 'scoremap-android',
      args: ['./gradlew', '--console=plain', '-Dorg.gradle.jvmargs=-Xmx768m -XX:MaxMetaspaceSize=768m -Dfile.encoding=UTF-8', 'verifyHost'],
    };
  }
  return {
    program: './gradlew',
    args: [
      '--no-daemon', '--max-workers=2', '--project-cache-dir', path.join(cacheRoot, 'project-cache'),
      `-Duser.home=${path.join(cacheRoot, 'user-home')}`,
      '-Dorg.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8',
      '-Pkotlin.compiler.execution.strategy=in-process',
      `-Pkotlin.project.persistent.dir=${path.join(cacheRoot, 'kotlin')}`,
      '-Pandroid.builder.sdkDownload=false', '--console=plain', 'verifyHost',
    ],
  };
}

function helperAvailable() {
  return (process.env.PATH ?? '').split(path.delimiter).some(directory => {
    try {
      const file = path.join(directory, 'scoremap-android');
      accessSync(file, constants.X_OK);
      return statSync(file).isFile();
    } catch { return false; }
  });
}

function verifyProjectLockVersions() {
  for (const [directory, owner] of [['app', ':app'], ['quality', ':quality'], ['build-logic', ':build-logic']]) {
    verifyDependencyLockVersions(readFileSync(path.join(androidRoot, directory, 'gradle.lockfile'), 'utf8'), owner);
  }
}

function main() {
  verifyProjectLockVersions();
  verifyLocalCatalogLock(androidRoot);
  const wrapper = path.join(androidRoot, 'gradlew');
  accessSync(wrapper, constants.X_OK);
  const properties = readFileSync(path.join(androidRoot, 'gradle/wrapper/gradle-wrapper.properties'), 'utf8');
  const property = name => properties.split(/\r?\n/).find(line => line.startsWith(`${name}=`))?.slice(name.length + 1).replaceAll('\\:', ':');
  assert.equal(property('distributionUrl'), distribution, 'Unexpected Gradle distribution URL.');
  assert.equal(property('distributionSha256Sum'), distributionSha, 'Unexpected Gradle distribution checksum.');
  assert.equal(property('validateDistributionUrl'), 'true', 'Wrapper URL validation must remain enabled.');
  const jar = readFileSync(path.join(androidRoot, 'gradle/wrapper/gradle-wrapper.jar'));
  assert.equal(createHash('sha256').update(jar).digest('hex'), wrapperSha, 'Unexpected official wrapper JAR.');

  const java = spawnSync('java', ['-version'], { encoding: 'utf8' });
  assert.ok(!java.error && java.status === 0 && /version "21\./.test(`${java.stdout}${java.stderr}`), 'Android build requires JDK 21.');
  const cacheRoot = process.env.SCOREMAP_ANDROID_CACHE_ROOT ?? path.resolve(androidRoot, '../../.runtime/android');
  assert.ok(path.isAbsolute(cacheRoot), 'Android cache root must be absolute.');
  const env = {
    ...process.env,
    SCOREMAP_ANDROID_CACHE_ROOT: cacheRoot,
    GRADLE_USER_HOME: process.env.GRADLE_USER_HOME ?? path.join(cacheRoot, 'gradle-user-home'),
    ANDROID_USER_HOME: process.env.ANDROID_USER_HOME ?? path.join(cacheRoot, 'android-user'),
  };
  for (const directory of [env.GRADLE_USER_HOME, env.ANDROID_USER_HOME, ...['project-cache', 'kotlin', 'user-home'].map(name => path.join(cacheRoot, name))]) {
    mkdirSync(directory, { recursive: true });
  }
  const invocation = gradleInvocation(helperAvailable(), cacheRoot);
  const result = spawnSync(invocation.program, invocation.args, { cwd: androidRoot, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  verifyProjectLockVersions();
  verifyLocalCatalogLock(androidRoot);
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
