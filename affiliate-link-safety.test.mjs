import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

function assertSafeAffiliateUrl(value, label) {
  if (value === null || value === undefined) return;
  assert.equal(typeof value, 'string', `${label}: URL must be a string or null`);
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', `${label}: HTTPS required`);
  assert.equal(url.username, '', `${label}: embedded username forbidden`);
  assert.equal(url.password, '', `${label}: embedded password forbidden`);
  assert.equal(url.hash, '', `${label}: fragments forbidden`);
  assert.ok(url.hostname, `${label}: hostname required`);
  assert.doesNotMatch(value, /[\r\n]/, `${label}: newline forbidden`);
}

test('knowledge base affiliate links use safe HTTPS URLs or null placeholders', async () => {
  const knowledge = await readJson('./knowledge.json');
  assert.ok(knowledge.affiliateLinks && typeof knowledge.affiliateLinks === 'object');
  for (const [category, url] of Object.entries(knowledge.affiliateLinks)) {
    assertSafeAffiliateUrl(url, `knowledge.affiliateLinks.${category}`);
  }
});

test('product affiliate links use safe HTTPS URLs or null placeholders', async () => {
  const catalog = await readJson('./catalog.json');
  assert.ok(Array.isArray(catalog.products));
  for (const product of catalog.products) {
    assert.ok(product.id, 'product must have a stable ID');
    assertSafeAffiliateUrl(product.amazonAffiliateUrl, `catalog.products.${product.id}`);
  }
});
