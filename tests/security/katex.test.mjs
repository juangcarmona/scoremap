import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { micromark } from 'micromark';
import { math, mathHtml } from 'micromark-extension-math';

for (const consumer of ['@mermaid-js/mermaid-cli', 'micromark-extension-math']) {
  test(`${consumer} renders maths without inheriting trust from Object.prototype`, () => {
    const require = createRequire(resolve('node_modules', consumer, 'package.json'));
    const katex = require('katex');
    const link = '\\href{https://example.com}{x}';
    assert.match(katex.renderToString(link, { trust: true }), /<a\b/);
    Object.prototype.trust = true;
    try {
      assert.match(katex.renderToString('x^2'), /katex/);
      assert.doesNotMatch(katex.renderToString(link), /<a\b/);
    } finally {
      delete Object.prototype.trust;
    }
  });
}

test('markdown math still renders through the actual extension', () => {
  const html = micromark('Area: $x^2$', { extensions: [math()], htmlExtensions: [mathHtml()] });
  assert.match(html, /class="katex"/);
});
