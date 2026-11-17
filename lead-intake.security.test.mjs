import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLeadIntake, draftWritePlan, PRIVATE_LEADS_COLLECTION } from './lead-intake.mjs';

const valid = {
  contactName: 'Example Customer',
  email: 'EXAMPLE@INVALID.TEST',
  projectType: 'freestanding',
  widthFeet: 8,
  depthFeet: 10,
  zipCode: '98600',
  budgetRange: '$5k-$8k'
};

test('validates and normalizes a synthetic lead without writing it', () => {
  const result = validateLeadIntake(valid);
  assert.equal(result.ok, true);
  assert.equal(result.lead.email, 'example@invalid.test');
  assert.equal(result.lead.leadStatus, 'new');
  assert.equal(result.lead.clientPhotoReferences, '');
});

test('ignores browser-supplied privilege, payment and status fields', () => {
  const result = validateLeadIntake({
    ...valid, leadStatus: 'qualified', isAdmin: true,
    paymentStatus: 'paid', bookingConfirmed: true, imageUrl: 'https://example.com/private.jpg'
  });
  assert.equal(result.ok, true);
  for (const field of ['isAdmin', 'paymentStatus', 'bookingConfirmed', 'imageUrl']) {
    assert.equal(Object.hasOwn(result.lead, field), false);
  }
  assert.equal(result.lead.leadStatus, 'new');
});

test('rejects photo identifiers without explicit photo consent', () => {
  const result = validateLeadIntake({ ...valid, photoReferenceIds: ['private_12345678'] });
  assert.equal(result.ok, false);
  assert.equal(result.lead, null);
  assert.ok(result.errors.some(error => error.includes('Photo consent')));
});

test('rejects external photo URLs even with consent', () => {
  const result = validateLeadIntake({
    ...valid, photoConsent: true, photoReferenceIds: ['https://example.com/photo.jpg']
  });
  assert.equal(result.ok, false);
  assert.equal(result.lead, null);
});

test('rejects invalid dimensions and malformed input', () => {
  assert.equal(validateLeadIntake({ ...valid, widthFeet: -2 }).ok, false);
  assert.equal(validateLeadIntake({ ...valid, depthFeet: Infinity }).ok, false);
  assert.equal(validateLeadIntake(null).ok, false);
  assert.equal(validateLeadIntake([]).ok, false);
});

test('write plan remains non-executing and requires authentication and consent', () => {
  const validated = validateLeadIntake(valid);
  const plan = draftWritePlan(validated);
  assert.equal(plan.destinationCollection, PRIVATE_LEADS_COLLECTION);
  assert.equal(plan.requiresAuthenticatedServer, true);
  assert.equal(plan.requiresConsent, true);
  assert.equal(plan.executionStatus, 'not-connected');
  assert.throws(() => draftWritePlan(validateLeadIntake({ ...valid, zipCode: 'invalid' })));
});
