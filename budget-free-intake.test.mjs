import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLeadIntake, draftWritePlan } from './lead-intake.mjs';

const valid = {
  contactName: 'Test Customer', email: 'test@example.invalid',
  projectType: 'freestanding', widthFeet: 8, depthFeet: 10,
  zipCode: '98671', city: 'Washougal', numberOfCats: 2
};

test('draft intake accepts a complete request without a budget', () => {
  const result = validateLeadIntake(valid);
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.equal(Object.hasOwn(result.lead, 'budgetRange'), false);
  assert.equal(draftWritePlan(result).fieldNames.includes('budgetRange'), false);
});

test('browser-supplied budget is discarded rather than persisted', () => {
  const result = validateLeadIntake({ ...valid, budgetRange: '$100,000' });
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.equal(Object.hasOwn(result.lead, 'budgetRange'), false);
});

test('budget-free intake still requires identity, project and ZIP', () => {
  for (const omitted of ['contactName', 'email', 'projectType', 'widthFeet', 'depthFeet', 'zipCode']) {
    const payload = { ...valid };
    delete payload[omitted];
    const result = validateLeadIntake(payload);
    assert.equal(result.ok, false, omitted + ' must remain required');
  }
});
