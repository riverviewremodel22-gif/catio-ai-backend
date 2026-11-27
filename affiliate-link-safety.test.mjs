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

test('catalog product identifiers are unique and owner approval is explicit for populated links', async () => {
  const catalog = await readJson('./catalog.json');
  const ids = catalog.products.map(product => product.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate product IDs could route customers to the wrong link');
  for (const product of catalog.products) {
    if (product.amazonAffiliateUrl !== null && product.amazonAffiliateUrl !== undefined) {
      assert.equal(product.linkApprovedByOwner, true, `${product.id}: linked product must have explicit owner approval`);
      assert.equal(typeof product.linkVerificationStatus, 'string', `${product.id}: record verification status`);
      assert.ok(product.linkVerificationStatus.trim(), `${product.id}: verification status must not be blank`);
    }
  }
});

test('primary mesh affiliate URL is consistent across knowledge and catalog', async () => {
  const [knowledge, catalog] = await Promise.all([
    readJson('./knowledge.json'),
    readJson('./catalog.json')
  ]);
  const matches = catalog.products.filter(product => product.id === 'mesh-14ga-1in');
  assert.equal(matches.length, 1, 'exactly one primary mesh catalog entry required');
  assert.equal(knowledge.affiliateLinks.mesh, matches[0].amazonAffiliateUrl,
    'knowledge and catalog disagree on the default mesh purchase link');
});
