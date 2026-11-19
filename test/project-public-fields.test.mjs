import test from 'node:test';
import assert from 'node:assert/strict';
import { findSimilarProjects } from '../project-matching.mjs';

test('public project matching never leaks private CRM or customer fields', () => {
  const catalog = { cmsProjects: [
    {
      cmsId: 'safe-reference',
      name: 'Window catio',
      shortDescription: 'Window catio with cedar shelves',
      sourceUrl: 'https://www.thecatiocompany.com/post/window-catio',
      verified: true,
      customerEmail: 'private@example.invalid',
      customerPhone: '555-0100',
      streetAddress: 'Private address',
      internalNotes: 'Confidential project notes',
      crmContactId: 'private-contact'
    },
    {
      cmsId: 'safe-comparison',
      name: 'Another window catio',
      shortDescription: 'Window catio and perches',
      sourceUrl: 'https://www.thecatiocompany.com/post/another-window-catio',
      verified: true,
      customerEmail: 'other@example.invalid',
      internalNotes: 'Do not publish'
    }
  ] };
  const result = findSimilarProjects(catalog, { projectId: 'safe-reference', query: 'window catio' });
  assert.deepEqual(Object.keys(result.reference).sort(), ['projectId','sourceUrl','title']);
  assert.equal(result.projects.length, 1);
  assert.deepEqual(Object.keys(result.projects[0]).sort(), ['description','projectId','reasons','source','sourceUrl','title']);
  const publicResponse = JSON.stringify(result);
  for (const secret of ['private@example.invalid','other@example.invalid','555-0100','Private address','Confidential project notes','private-contact','Do not publish']) {
    assert.equal(publicResponse.includes(secret), false, secret);
  }
});

test('unverified projects are excluded from public results', () => {
  const catalog = { cmsProjects: [
    {cmsId:'draft',name:'Window catio',shortDescription:'Window catio',sourceUrl:'https://www.thecatiocompany.com/post/draft',verified:false}
  ] };
  const result = findSimilarProjects(catalog, { query:'window catio' });
  assert.deepEqual(result.projects, []);
  assert.equal(result.needsDetails, true);
});
