import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findSimilarProjects} from '../project-matching.mjs';

const catalog = JSON.parse(await readFile(new URL('../catalog.json', import.meta.url), 'utf8'));

test('catalog includes all 24 Wix source projects with original links', () => {
  assert.equal(catalog.cmsProjects.length,24);
  assert.ok(catalog.cmsProjects.every(p=>p.sourceUrl.startsWith('https://www.thecatiocompany.com/')));
});

test('selects documented barn-door patio case study', () => {
  const found=findSimilarProjects(catalog,{query:'patio catio with barn doors',limit:5});
  assert.ok(found.projects.length > 0);
  assert.ok(found.projects.some(p=>p.title.toLowerCase().includes('barn door')));
  assert.ok(found.projects.every(p=>p.reasons.length));
});

test('exact project reference retained but excluded from similar results', () => {
  const westLinn=catalog.cmsProjects.find(p=>p.name.includes('West Linn'));
  const found=findSimilarProjects(catalog,{projectId:westLinn.cmsId,query:'large custom catio'});
  assert.equal(found.reference.projectId,westLinn.cmsId);
  assert.ok(found.projects.every(p=>p.projectId!==westLinn.cmsId));
  assert.ok(found.projects.length<=3);
});

test('a vague request asks for details rather than guessing', () => {
  const found=findSimilarProjects(catalog,{query:''});
  assert.equal(found.needsDetails,true);
  assert.deepEqual(found.projects,[]);
});

test('no invented prices or dimensions or unpublished draft links', () => {
  const found=findSimilarProjects(catalog,{query:'tunnel and cat run'});
  for(const p of found.projects){
    assert.ok(!('price' in p));
    assert.ok(!('dimensions' in p));
    assert.ok(p.sourceUrl.startsWith('https://www.thecatiocompany.com/'));
  }
});

test('unknown reference IDs cannot be faked', () => {
  const found=findSimilarProjects(catalog,{projectId:'not-a-real-project-id'});
  assert.equal(found.reference,null);
  assert.equal(found.needsDetails,true);
});

test('limit bounded to 5', () => {
  const found=findSimilarProjects(catalog,{query:'custom catio',limit:100});
  assert.ok(found.projects.length<=5);
});
