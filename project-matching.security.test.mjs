import test from 'node:test';
import assert from 'node:assert/strict';
import { findSimilarProjects } from './project-matching.mjs';

const verified = {
  cmsId: 'verified-patio',
  name: 'Screened-in patio catio with barn doors',
  shortDescription: 'A patio conversion with barn doors.',
  sourceUrl: 'https://www.thecatiocompany.com/items/verified-patio',
  verified: true
};
const second = {
  cmsId: 'verified-porch',
  name: 'Screened-in porch catio',
  shortDescription: 'A porch conversion for cats.',
  sourceUrl: 'https://www.thecatiocompany.com/items/verified-porch',
  verified: true
};
const catalog = { cmsProjects: [
  verified, second,
  { ...verified, cmsId: 'unverified', verified: false },
  { ...verified, cmsId: 'external', sourceUrl: 'https://example.com/items/other' },
  { ...verified, cmsId: 'insecure', sourceUrl: 'http://www.thecatiocompany.com/items/other' }
] };

test('does not disclose unverified or external project references', () => {
  const result = findSimilarProjects(catalog, { query: 'screened patio barn doors', limit: 5 });
  assert.ok(result.projects.length > 0);
  assert.ok(result.projects.every(p => ['verified-patio', 'verified-porch'].includes(p.projectId)));
  assert.ok(result.projects.every(p => p.sourceUrl.startsWith('https://www.thecatiocompany.com/')));
  assert.ok(result.projects.every(p => !('price' in p) && !('address' in p)));
});

test('empty search requests details rather than inventing recommendations', () => {
  const result = findSimilarProjects(catalog, {});
  assert.equal(result.needsDetails, true);
  assert.deepEqual(result.projects, []);
});

test('project ID search excludes the reference itself', () => {
  const result = findSimilarProjects(catalog, { projectId: 'verified-patio', limit: 5 });
  assert.equal(result.reference.projectId, 'verified-patio');
  assert.ok(result.projects.every(p => p.projectId !== 'verified-patio'));
});

test('result count is capped at five even for oversized limits', () => {
  const result = findSimilarProjects(catalog, { query: 'patio', limit: 1000 });
  assert.ok(result.projects.length <= 5);
});

test('rejects catalogs without a project array', () => {
  assert.throws(() => findSimilarProjects({}), TypeError);
});
