import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyChecksum, scope, metadataCheck, installedCheck, requireKvm, reportCheck, wrapperCheck } from '../../scripts/android-ci-toolchain.mjs';

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scoremap-android-ci-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}
const pin = { id: 'fixture', revision: '1.0.0', archive: 'fixture.zip', checksum: 'abc', checksumType: 'sha1', repository: 'sdk' };
const metadata = '<repository><remotePackage path="fixture"><revision><major>1</major></revision><channelRef ref="channel-0"/><archives><archive><complete><checksum type="sha1">abc</checksum><url>fixture.zip</url></complete><host-os>linux</host-os></archive></archives></remotePackage></repository>';

test('archive checksum accepts exact bytes and refuses changed bytes', async t => {
  const file = path.join(await fixture(t), 'fixture');
  await fs.writeFile(file, 'fixture');
  const checksum = 'f16d05ec6b29248d2c61adb1e9263f78e4f7bace1b955014a2d17872cfe4064d';
  await verifyChecksum(file, checksum);
  await fs.writeFile(file, 'changed');
  await assert.rejects(verifyChecksum(file, checksum), /Checksum mismatch/);
});

test('scope is absent only without the Android directory; even incomplete source activates it', async t => {
  const directory = await fixture(t);
  const android = path.join(directory, 'android');
  const output = path.join(directory, 'output');
  assert.equal(await scope(android, output), false);
  await fs.mkdir(android);
  assert.equal(await scope(android, output), true);
  assert.equal(await fs.readFile(output, 'utf8'), 'present=false\npresent=true\n');
  await assert.rejects(wrapperCheck(android), /ENOENT/);
});

test('SDK metadata refuses checksum, revision, channel and archive drift', async t => {
  const file = path.join(await fixture(t), 'metadata.xml');
  await fs.writeFile(file, metadata);
  metadataCheck({ sdk: file }, [pin]);
  for (const changed of [{ checksum: 'wrong' }, { revision: '2.0.0' }, { archive: 'wrong.zip' }]) {
    assert.throws(() => metadataCheck({ sdk: file }, [{ ...pin, ...changed }]), /no longer matches pin/);
  }
  await fs.writeFile(file, metadata.replace('channel-0', 'channel-1'));
  assert.throws(() => metadataCheck({ sdk: file }, [pin]), /no longer matches pin/);
});

test('installed SDK components must have exact package and revision', async t => {
  const directory = await fixture(t);
  await fs.mkdir(path.join(directory, 'fixture'));
  const file = path.join(directory, 'fixture/package.xml');
  await fs.writeFile(file, '<repository><localPackage path="fixture"><revision><major>1</major></revision></localPackage></repository>');
  installedCheck(directory, [pin]);
  assert.throws(() => installedCheck(directory, [{ ...pin, revision: '2.0.0' }]), /revision drift/);
  await fs.rm(file);
  assert.throws(() => installedCheck(directory, [pin]), /failed/);
});

test('device job refuses absent KVM and a regular file pretending to be KVM', async t => {
  const device = path.join(await fixture(t), 'kvm');
  await assert.rejects(requireKvm(device), /ENOENT/);
  await fs.writeFile(device, 'not a device');
  await assert.rejects(requireKvm(device), /KVM character device is required/);
});

test('host and device report guards require fresh actual cases in their own result directories', async t => {
  const directory = await fixture(t);
  const host = path.join(directory, 'app/build/test-results/testDebugUnitTest/TEST-fixture.xml');
  const device = path.join(directory, 'app/build/outputs/androidTest-results/managedDevice/debug/tablet/TEST-fixture.xml');
  const valid = '<testsuite tests="1" failures="0"><testcase name="passes"/></testsuite>';
  assert.throws(() => reportCheck(directory, 'host', 0), /No fresh executed/);
  for (const file of [host, device]) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, valid); }
  assert.equal(reportCheck(directory, 'host', 0).tests, 1);
  assert.equal(reportCheck(directory, 'device', 0).tests, 1);
  assert.throws(() => reportCheck(directory, 'host', Date.now() + 10000), /No fresh executed/);
  for (const invalid of ['<testsuite tests="0"/>', '<testsuite tests="1" skipped="1"><testcase name="skip"><skipped/></testcase></testsuite>', '<testsuite tests="1" failures="1"><testcase name="fails"><failure/></testcase></testsuite>', '<testsuite tests="1" errors="1"><testcase name="error"><error/></testcase></testsuite>', '<testsuite tests="1"/>', '<testsuite tests="1"><testcase name="skip"><skipped/></testcase></testsuite>', '<malformed']) {
    await fs.writeFile(host, invalid);
    assert.throws(() => reportCheck(directory, 'host', 0), /failed/);
  }
});

test('all CI jobs check out the immutable event SHA for verification pushes', async () => {
  const workflow = await fs.readFile(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const checkouts = [...workflow.matchAll(/      - uses: actions\/checkout@v4([^]*?)(?=      -|$)/g)];
  assert.equal(checkouts.length, 3);
  for (const checkout of checkouts) assert.match(checkout[1], /with:\s+ref: \$\{\{ github\.sha \}\}/);
});

test('the required gate waits for every verification job while the jobs run in parallel', async () => {
  const workflow = await fs.readFile(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const jobs = workflow.slice(workflow.indexOf('\njobs:\n')).split(/^  (?=[a-z_]+:\n)/m).slice(1);
  const byName = Object.fromEntries(jobs.map(job => [job.slice(0, job.indexOf(':')), job]));
  assert.deepEqual(Object.keys(byName), ['android_host', 'android_device', 'verify_core', 'verify']);
  for (const name of ['android_host', 'android_device', 'verify_core']) assert.doesNotMatch(byName[name], /\n    needs:/);
  assert.match(byName.verify, /name: Verify ScoreMap/);
  assert.match(byName.verify, /needs: \[android_host, android_device, verify_core\]/);
  assert.match(byName.verify, /if: always\(\)/);
  for (const result of ['ANDROID_HOST_RESULT', 'ANDROID_DEVICE_RESULT', 'DELIVERY_RESULT']) {
    assert.match(byName.verify, new RegExp(`"\\$${result}" = success`));
  }
});

test('the aggregate skips the duplicate Gradle run only inside Actions and still checks the static Android inputs', async () => {
  const script = await fs.readFile(new URL('../../src/android/scripts/verify-android.mjs', import.meta.url), 'utf8');
  const skip = script.indexOf("SCOREMAP_ANDROID_HOST_PROVEN_BY_GATE === '1'");
  assert.ok(skip > script.indexOf('Unexpected official wrapper JAR.'), 'wrapper and lock checks must run before the skip');
  assert.match(script.slice(skip - 60, skip), /GITHUB_ACTIONS === 'true'/);
  assert.ok(skip < script.indexOf("spawnSync('java'"));
});

test('technical verification refs require a detached checkout while named branch rules remain enforced', async t => {
  const directory = await fixture(t);
  const git = args => execFileSync('git', args, { cwd: directory, stdio: 'pipe' });
  git(['init', '--quiet']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'test: fixture']);
  git(['checkout', '-b', 'lighthouse/verification-1-' + 'a'.repeat(40)]);
  const guard = fileURLToPath(new URL('../../scripts/lighthouse-guard.mjs', import.meta.url));
  const run = () => spawnSync(process.execPath, [guard, 'verify'], { cwd: directory, encoding: 'utf8' });
  const refused = run();
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /does not match/);
  git(['checkout', '--detach']);
  assert.equal(run().status, 0);
});
