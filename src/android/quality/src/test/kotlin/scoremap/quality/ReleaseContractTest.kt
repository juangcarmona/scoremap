package scoremap.quality

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.nio.file.Files
import java.security.MessageDigest
import java.util.Properties
import java.util.concurrent.TimeUnit
import javax.xml.XMLConstants
import javax.xml.parsers.DocumentBuilderFactory

// Bootstrap input checks only; this does not qualify release artifacts or musical behavior.
public class ReleaseContractTest {
    private val root = File(requireNotNull(System.getProperty("scoremap.android.root")))

    @Test
    public fun officialWrapperRemainsPinnedAndExecutable() {
        val properties =
            Properties().apply {
                root.resolve("gradle/wrapper/gradle-wrapper.properties").inputStream().use(::load)
            }
        assertEquals(
            "https://services.gradle.org/distributions/gradle-9.7.0-bin.zip",
            properties.getProperty("distributionUrl"),
        )
        assertEquals(
            "84fbba45c7f4c64abc77460e1c00f541e9f960e3c7ed2538f1ede19eacd873ae",
            properties.getProperty("distributionSha256Sum"),
        )
        assertEquals("true", properties.getProperty("validateDistributionUrl"))
        val jar = root.resolve("gradle/wrapper/gradle-wrapper.jar").readBytes()
        val checksum = MessageDigest.getInstance("SHA-256").digest(jar).joinToString("") { "%02x".format(it) }
        assertEquals("7a9ce74cff467ca1bf60a4fcd9f05185acceda4d0f382434d393e17864262c5d", checksum)
        assertTrue("The committed Linux wrapper must be executable", root.resolve("gradlew").canExecute())
    }

    @Test
    public fun syntheticLauncherNeedsNoNetworkOrDevicePermission() {
        val factory =
            DocumentBuilderFactory.newInstance().apply {
                isNamespaceAware = true
                setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true)
                setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
                setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "")
                setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "")
            }
        val manifest = factory.newDocumentBuilder().parse(root.resolve("app/src/main/AndroidManifest.xml"))
        assertEquals(0, manifest.getElementsByTagName("uses-permission").length)
        val namespace = "http://schemas.android.com/apk/res/android"
        val application = manifest.getElementsByTagName("application").item(0) as org.w3c.dom.Element
        assertEquals("ScoreMap", application.getAttributeNS(namespace, "label"))
        val actions = manifest.getElementsByTagName("action")
        assertTrue(
            (0 until actions.length).any {
                (actions.item(it) as org.w3c.dom.Element).getAttributeNS(namespace, "name") ==
                    "android.intent.action.MAIN"
            },
        )
    }

    @Test
    public fun portableAdapterSelectsHelperWithoutDuplicatingItsWorkerArguments() {
        val script =
            """
            import assert from 'node:assert/strict';
            import { pathToFileURL } from 'node:url';
            import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
            import { spawnSync } from 'node:child_process';
            import { tmpdir } from 'node:os';
            import path from 'node:path';
            const { gradleInvocation, verifyLocalCatalogLock } = await import(pathToFileURL(process.env.SCOREMAP_ADAPTER_TEST_FILE));
            const managed = gradleInvocation(true, '/fixture-cache');
            assert.equal(managed.program, 'scoremap-android');
            assert.equal(managed.args[0], './gradlew');
            assert.equal(managed.args.filter(value => value.startsWith('--max-workers')).length, 0);
            const hosted = gradleInvocation(false, '/fixture-cache');
            assert.equal(hosted.program, './gradlew');
            assert.equal(hosted.args.filter(value => value === '--max-workers=2').length, 1);
            assert.ok(hosted.args.includes('-Duser.home=/fixture-cache/user-home'));
            assert.ok(hosted.args.includes('-Pandroid.builder.sdkDownload=false'));
            assert.equal(hosted.args.at(-1), 'verifyHost');

            const fixture = mkdtempSync(path.join(tmpdir(), 'scoremap-local-catalog-'));
            const lock = path.join(fixture, 'build-logic/settings-gradle.lockfile');
            try {
              verifyLocalCatalogLock(fixture);
              mkdirSync(path.dirname(lock));
              writeFileSync(lock, '# Generated local-file record\nempty=incomingCatalogForLibs0\n');
              verifyLocalCatalogLock(fixture);
              for (const content of ['external:catalog:1.0=incomingCatalogForLibs0', 'empty=incomingCatalogForLibs0,other', '']) {
                writeFileSync(lock, content);
                assert.throws(() => verifyLocalCatalogLock(fixture), /cannot contain module dependencies or additional state/);
              }
              rmSync(lock);
              symlinkSync(path.join(fixture, 'absent'), lock);
              assert.throws(() => verifyLocalCatalogLock(fixture), /must be a regular file/);
            } finally {
              rmSync(fixture, { recursive: true, force: true });
            }

            const repository = path.resolve(path.dirname(process.env.SCOREMAP_ADAPTER_TEST_FILE), '../../..');
            const pkg = JSON.parse(readFileSync(path.join(repository, 'package.json'), 'utf8'));
            const prettierCli = path.join(repository, 'node_modules/prettier/bin/prettier.cjs');
            const formatFixture = mkdtempSync(path.join(tmpdir(), 'scoremap-format-ownership-'));
            const formattedCss = 'a {\n  color: red;\n}\n';
            const unformattedCss = 'a{color:red}\n';
            const generated = 'src/android/app/build/reports/test/style.css';
            const legacy = 'src/legacy/build/retained.css';
            const native = 'src/android/app/src/main/assets/retained.css';
            const tokenize = command => [...command.matchAll(/"([^"]*)"|(\S+)/g)].map(match => match[1] ?? match[2]);
            function writeFormat(relative, content) {
              const file = path.join(formatFixture, relative);
              mkdirSync(path.dirname(file), { recursive: true });
              writeFileSync(file, content);
            }
            function runFormat(name) {
              const [program, ...args] = tokenize(pkg.scripts[name]);
              assert.equal(program, 'prettier');
              const result = spawnSync(process.execPath, [prettierCli, ...args], {
                cwd: formatFixture, encoding: 'utf8', timeout: 5000,
              });
              assert.ifError(result.error);
              return result;
            }
            try {
              writeFormat(generated, unformattedCss);
              writeFormat(legacy, formattedCss);
              writeFormat(native, formattedCss);
              writeFormat('tests/fixture.test.ts', 'export {};\n');
              writeFormat('fixture.config.ts', 'export {};\n');
              const valid = runFormat('format:check');
              assert.equal(valid.status, 0, 'Generated Android report CSS must be ignored: ' + valid.stdout + valid.stderr);
              for (const authored of [legacy, native]) {
                writeFormat(authored, unformattedCss);
                const refused = runFormat('format:check');
                assert.equal(refused.status, 1, 'Malformed authored CSS must fail: ' + authored);
                assert.ok((refused.stdout + refused.stderr).includes(authored));
                writeFormat(authored, formattedCss);
              }
              for (const authored of [legacy, native]) writeFormat(authored, unformattedCss);
              const written = runFormat('format');
              assert.equal(written.status, 0, written.stdout + written.stderr);
              for (const authored of [legacy, native]) {
                assert.equal(readFileSync(path.join(formatFixture, authored), 'utf8'), formattedCss);
              }
              assert.equal(readFileSync(path.join(formatFixture, generated), 'utf8'), unformattedCss);
              const patterns = ['src/**/*.{ts,tsx,css}', 'tests/**/*.{ts,tsx}', '*.config.{ts,js}', '!src/android/**/build/**'];
              assert.deepEqual(tokenize(pkg.scripts['format:check']), ['prettier', '--check', ...patterns]);
              assert.deepEqual(tokenize(pkg.scripts.format), ['prettier', '--write', ...patterns]);
            } finally {
              rmSync(formatFixture, { recursive: true, force: true });
            }
            """.trimIndent()
        val builder = ProcessBuilder("node", "--input-type=module", "-e", script).redirectErrorStream(true)
        builder.environment()["SCOREMAP_ADAPTER_TEST_FILE"] = root.resolve("scripts/verify-android.mjs").absolutePath
        val process = builder.start()
        val completed = process.waitFor(10, TimeUnit.SECONDS)
        if (!completed) process.destroyForcibly()
        assertTrue("Adapter selection check must complete within ten seconds", completed)
        val output = process.inputStream.bufferedReader().use { it.readText() }
        assertEquals(output, 0, process.exitValue())
    }

    @Test
    public fun nativeUnknownExtensionsAndPlainBinaryInputsPassWithoutImportSideEffects() {
        runCredentialFixture(
            """
            assert.equal(existsSync('.git'), false);
            assert.equal(existsSync('test-results'), false);
            assert.equal(typeof verifyCredentialInputs, 'function');
            const fixtures = new Map([
              ['src/android/fixtures/ordinary.unknown', 'public synthetic fixture without credentials'],
              ['src/android/fixtures/plain.binary', Buffer.from([0, 255, 128, 1, 10, 13, 65, 66])],
              ['src/android/gradlew', '#!/bin/sh\n# synthetic wrapper fixture\n'],
            ]);
            for (const [relative, content] of fixtures) writeFixture(relative, content);
            assert.equal(await verifyCredentialInputs([...fixtures.keys()]), undefined);
            assert.equal(existsSync('test-results'), false);
            """.trimIndent(),
        )
    }

    @Test
    public fun credentialLiteralsFailInEveryNativeSourceFormatAndInventoryDirectory() {
        runCredentialFixture(
            """
            const paths = [
              'src/android/app/src/main/kotlin/Fixture.kt',
              'src/android/build.gradle.kts',
              'src/android/gradle/libs.versions.toml',
              'src/android/gradle.properties',
              'src/android/gradlew',
              'src/android/fixtures/fixture.unknown',
              'src/android/bin/input.unknown',
              'src/android/obj/input.unknown',
              'src/android/node_modules/input.unknown',
            ];
            const syntheticLiterals = [
              ...['p', 'o', 'u', 's', 'r'].map(kind => ['gh', kind, '_', 'A'.repeat(36)].join('')),
              ['github', '_pat_', 'A'.repeat(45)].join(''),
              ['np', 'm_', 'A'.repeat(36)].join(''),
              ...['', 'RSA ', 'EC ', 'OPENSSH '].map(kind => ['-----BE', 'GIN ', kind, 'PRIVATE', ' KEY-----'].join('')),
              ['AK', 'IA', 'A'.repeat(16)].join(''),
              [['ey', 'J', 'a'.repeat(16)].join(''), 'b'.repeat(16), 'c'.repeat(16)].join('.'),
            ];
            for (const relative of paths) {
              for (const literal of syntheticLiterals) {
                writeFixture(relative, literal);
                await assert.rejects(() => verifyCredentialInputs([relative]), {
                  name: 'Error',
                  message: 'Credential-like material detected in ' + relative + '; keep actual secrets outside Git.',
                });
              }
            }
            """.trimIndent(),
        )
    }

    @Test
    public fun nativeSigningContainersFailEvenWhenTheirContentsAreInnocuous() {
        runCredentialFixture(
            """
            for (const extension of ['jks', 'keystore', 'p12', 'pfx', 'JKS', 'KeyStore', 'P12', 'PfX']) {
              const relative = 'src/android/fixtures/synthetic-signing.' + extension;
              writeFixture(relative, Buffer.from([0, 1, 2, 3]));
              await assert.rejects(() => verifyCredentialInputs([relative]), {
                name: 'Error',
                message: 'Native signing material must remain outside Git: ' + relative,
              });
            }
            """.trimIndent(),
        )
    }

    @Test
    public fun legacyCredentialInputsRemainScannedAndTheirExistingExclusionsRemainScoped() {
        runCredentialFixture(
            """
            const literal = ['gh', 'p_', 'A'.repeat(36)].join('');
            for (const relative of ['src/server/Fixture.cs', 'docs/synthetic-fixture.md']) {
              writeFixture(relative, literal);
              await assert.rejects(() => verifyCredentialInputs([relative]), {
                name: 'Error',
                message: 'Credential-like material detected in ' + relative + '; keep actual secrets outside Git.',
              });
            }
            const excluded = ['node_modules/fixture/index.js', 'src/server/bin/Fixture.cs', 'src/server/obj/Fixture.cs'];
            for (const relative of excluded) writeFixture(relative, literal);
            assert.equal(await verifyCredentialInputs(excluded), undefined);
            assert.equal(existsSync('test-results'), false);
            """.trimIndent(),
        )
    }

    @Test
    public fun refusesUnqualifiedPreviewLocksWhileAdmittingThePinnedAgpTestRunner() {
        val script =
            """
            import assert from 'node:assert/strict';
            import { readFileSync } from 'node:fs';
            import path from 'node:path';
            import { pathToFileURL } from 'node:url';
            const { verifyDependencyLockVersions } = await import(pathToFileURL(process.env.SCOREMAP_ADAPTER_TEST_FILE));
            const stable = 'example:stable:1.0.0=debugRuntimeClasspath\n';
            assert.doesNotThrow(() => verifyDependencyLockVersions(stable, ':app'));
            const qualified = 'com.google.testing.platform:core-proto:0.0.9-alpha04=unified-test-platform-android-device-provider-ddmlib\n';
            assert.doesNotThrow(() => verifyDependencyLockVersions(qualified, ':app'));
            const rejected = [
              qualified.replace('unified-test-platform-android-device-provider-ddmlib', 'debugRuntimeClasspath'),
              qualified.replace('alpha04', 'alpha05'),
              qualified.replace('core-proto', 'unknown-tool'),
              qualified.replace('core-proto', 'launcher'),
              qualified.replace('com.google.testing.platform', 'example'),
              qualified.replace('unified-test-platform-android-device-provider-ddmlib', 'unified-test-platform-unknown'),
              qualified.replace('\n', ',debugRuntimeClasspath\n'),
              ...['1.0-preview01', '1.0-M1', '1.0-milestone1', '1.0-SNAPSHOT', '1.0-rc01']
                .map(version => 'example:preview:' + version + '=debugRuntimeClasspath\n'),
            ];
            for (const input of rejected) {
              assert.throws(() => verifyDependencyLockVersions(input, ':app'), /Unqualified prerelease dependency/);
            }
            assert.throws(() => verifyDependencyLockVersions(qualified, ':quality'), /Unqualified prerelease dependency/);
            assert.throws(() => verifyDependencyLockVersions('malformed', ':app'), /Malformed dependency lock entry/);
            const root = path.dirname(path.dirname(process.env.SCOREMAP_ADAPTER_TEST_FILE));
            for (const [file, owner] of [['app', ':app'], ['quality', ':quality'], ['build-logic', ':build-logic']]) {
              verifyDependencyLockVersions(readFileSync(path.join(root, file, 'gradle.lockfile'), 'utf8'), owner);
            }
            """.trimIndent()
        val builder = ProcessBuilder("node", "--input-type=module", "-e", script).redirectErrorStream(true)
        builder.environment()["SCOREMAP_ADAPTER_TEST_FILE"] = root.resolve("scripts/verify-android.mjs").absolutePath
        val process = builder.start()
        val completed = process.waitFor(10, TimeUnit.SECONDS)
        if (!completed) process.destroyForcibly()
        assertTrue("Dependency lock fixtures must complete within ten seconds", completed)
        val output = process.inputStream.bufferedReader().use { it.readText() }
        assertEquals(output, 0, process.exitValue())
    }

    private fun runCredentialFixture(body: String) {
        val fixture = Files.createTempDirectory("and01-credential-inputs-").toFile()
        try {
            val script =
                """
                import assert from 'node:assert/strict';
                import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
                import path from 'node:path';
                import { pathToFileURL } from 'node:url';
                const { verifyCredentialInputs } = await import(pathToFileURL(process.env.SCOREMAP_SECURITY_TEST_FILE));
                function writeFixture(relative, content) {
                  mkdirSync(path.dirname(relative), { recursive: true });
                  writeFileSync(relative, content);
                }
                """.trimIndent() + "\n" + body + "\nconsole.log('SECURITY_FIXTURE_OK');\n"
            val builder =
                ProcessBuilder("node", "--input-type=module", "-e", script)
                    .directory(fixture)
                    .redirectErrorStream(true)
            builder.environment()["SCOREMAP_SECURITY_TEST_FILE"] =
                root.resolve("../../scripts/verify-security.mjs").canonicalPath
            val process = builder.start()
            val completed = process.waitFor(10, TimeUnit.SECONDS)
            if (!completed) process.destroyForcibly()
            assertTrue(
                "Credential-input fixture must complete within ten seconds without running CLI audits",
                completed,
            )
            val output = process.inputStream.bufferedReader().use { it.readText() }
            assertEquals(output, 0, process.exitValue())
            assertEquals("SECURITY_FIXTURE_OK", output.trim())
        } finally {
            assertTrue("Only this test's temporary fixture must be removed", fixture.deleteRecursively())
        }
    }
}
