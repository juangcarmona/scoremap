import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const matchers = Object.keys(lock.packages).filter(path => /(?:^|\/)node_modules\/picomatch$/.test(path));
assert.ok(matchers.length > 0, 'Exercise the actual installed dependency tree.');

for (const path of matchers) {
  test(`${path} refuses repeated-extglob denial of service within a bounded process`, () => {
    const script = `
      const assert = require('node:assert/strict');
      const pm = require(${JSON.stringify(resolve(path))});
      for (const options of [{}, { windows: true }, { capture: true }]) {
        for (const [pattern, input] of [
          ['+(*a)', 'a'.repeat(80) + '!'],
          ['*(*a)', 'a'.repeat(80) + '!'],
          ['+(*)', 'a'.repeat(80) + '/'],
          ['*(*)b', 'a'.repeat(80) + '!'],
          ['+(a*b)', 'ab'.repeat(40) + '!'],
          ['+(@(*a))', 'a'.repeat(80) + '!'],
          ['+(a|aa)', 'a'.repeat(80) + '!']
        ]) assert.equal(pm.isMatch(input, pattern, options), false, pattern);
      }
      assert.equal(pm.isMatch('src/music/piano.ts', '**/*.{ts,tsx}'), true);
      assert.equal(pm.isMatch('src/music/piano.js', '**/*.{ts,tsx}'), false);
      assert.equal(pm.isMatch('foo.js', '!(*.test).js'), true);
      assert.equal(pm.isMatch('foo.test.js', '!(*.test).js'), false);
      assert.equal(pm.isMatch('abcabc', '+(abc)'), true);
      assert.equal(pm.isMatch('foobar', '*(foo|bar)'), true);
      const micromatch = require('micromatch');
      assert.deepEqual(micromatch(['a'.repeat(80) + '!'], '+(*a)'), []);
      assert.deepEqual(micromatch(['src/piano.ts', 'src/piano.test.ts'], ['**/*.ts', '!**/*.test.ts']), ['src/piano.ts']);
    `;
    const result = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 2500 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
  });
}

test('every consumer resolves the locked reviewed replacement', () => {
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!entry.dependencies?.picomatch && !entry.optionalDependencies?.picomatch) continue;
    const consumer = createRequire(resolve(path, 'package.json'));
    const manifest = consumer('picomatch/package.json');
    assert.equal(manifest.name, '@ryotsu/picomatch', path);
    assert.equal(manifest.version, '4.0.7-a', path);
  }
  // The registry integrity binds all reviewed executable bytes, including the patch.
  for (const path of matchers) {
    assert.equal(lock.packages[path].name, '@ryotsu/picomatch', path);
    assert.equal(lock.packages[path].integrity, 'sha512-JroBFEmaejC7szGSfqOhF1QZHLKvX2wTA1+fWyfkpy3BjzdQKNPLKa2FtgeKVUDy5/UPUNkXEeCHJ5ZRBMLTVA==', path);
  }
  assert.equal(typeof require('micromatch'), 'function');
});
