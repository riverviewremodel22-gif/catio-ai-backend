import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLeadIntake, draftWritePlan, PRIVATE_LEADS_COLLECTION } from './lead-intake.mjs';

const valid = {
  contactName: 'Test Visitor',
  email: 'visitor@example.test',
  projectType: 'freestanding',
  widthFeet: 8,
  depthFeet: 10,
  zipCode: '98660'
};

test('browser-supplied privilege, payment, booking and budget fields are never persisted', () => {
  const result = validateLeadIntake({
    ...valid,
    budgetRange: '$1',
    budget: 1,
    crmContactId: 'forged-contact',
    consultationStatus: 'booked',
    paid: true,
    paymentStatus: 'paid',
    leadStatus: 'qualified',
    privacyConsentDate: '2099-01-01',
    referenceProjectUrl: 'https://example.test/forged',
    wixSiteId: 'production-site',
    clientPhotoReferences: 'forged-photo',
    sourceChannel: 'visitor-controlled'
  });
  assert.equal(result.ok, true, result.errors.join(', '));
  for (const field of [
    'budgetRange', 'budget', 'crmContactId', 'consultationStatus',
    'paid', 'paymentStatus', 'privacyConsentDate', 'referenceProjectUrl',
    'wixSiteId'
  ]) assert.equal(Object.hasOwn(result.lead, field), false, field);
  assert.equal(result.lead.leadStatus, 'new');
  assert.equal(result.lead.clientPhotoReferences, '');
});

test('draft write plan is only a plan for private CatioLeadIntake, never an executed write', () => {
  const validated = validateLeadIntake(valid);
  assert.equal(validated.ok, true);
  const plan = draftWritePlan(validated);
  assert.equal(plan.destinationCollection, PRIVATE_LEADS_COLLECTION);
  assert.equal(plan.destinationCollection, 'CatioLeadIntake');
  assert.equal(plan.executionStatus, 'not-connected');
  assert.equal(plan.requiresAuthenticatedServer, true);
  assert.equal(plan.requiresConsent, true);
  assert.equal(Object.hasOwn(plan, 'saved'), false);
});
