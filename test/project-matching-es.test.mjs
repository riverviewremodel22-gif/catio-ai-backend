import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { findSimilarProjects } from '../project-matching.mjs';
const catalog=JSON.parse(await readFile(new URL('../catalog.json',import.meta.url),'utf8'));
test('Spanish window and freestanding type terms match documented English categories',()=>{
 for(const [es,en] of [['ventana','window'],['independiente','freestanding']]) {
  const left=findSimilarProjects(catalog,{query:es}).projects.map(p=>p.projectId);
  const right=findSimilarProjects(catalog,{query:en}).projects.map(p=>p.projectId);
  assert.deepEqual(left,right);
 }
});
