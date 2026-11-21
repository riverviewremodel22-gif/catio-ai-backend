import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeadService, DRAFT_SITE_ID, CONSENT_VERSION } from '../lead-submission.mjs';

// Synthetic values only. These tests must never access Wix or customer records.
const env = {
  WIX_DRAFT_LEADS_ENABLED: 'true',
  WIX_SITE_ID: DRAFT_SITE_ID,
  WIX_DRAFT_API_KEY: 'synthetic-test-key'
};
const valid = {
  requestId: 'e743c9e0-7799-4f2b-8f0c-c37c5128ab91',
  contactName: 'Test Only',
  email: 'nobody@example.invalid',
  city: 'Portland',
  zipCode: '97213',
  projectType: 'freestanding',
  widthFeet: 8,
  depthFeet: 8,
  budgetRange: '6000-12000',
  numberOfCats: 2,
  language: 'en',
  contactConsent: true,
  consentVersion: CONSENT_VERSION
};

test('rejects malformed request IDs and unsupported languages before Wix network access', async () => {
  let calls = 0;
  const service = createLeadService({
    env,
    fetchImpl: async () => { calls++; throw Error('Unexpected external request'); }
  });
  const variants = [
    { requestId: 'not-a-uuid' },
    { requestId: 'e743c9e0-7799-1f2b-8f0c-c37c5128ab91' },
    { language: 'fr' },
    { language: 'EN' },
    { consentVersion: 'estimate-request-v0' },
    { contactConsent: 'true' },
    { photo: 'data:image/jpeg;base64,ZmFrZQ==', photoConsent: true },
    { clientPhotoReferences: ['fake-private-id'] }
  ];
  for (const changes of variants) {
    await assert.rejects(service.submit({ ...valid, ...changes }));
  }
  assert.equal(calls, 0);
});

test('only verified catalog projects can be referenced by a lead', async () => {
  let calls = 0;
  const service = createLeadService({
    env,
    catalog: { cmsProjects: [{ cmsId: 'private-project', verified: false }] },
    fetchImpl: async () => { calls++; throw Error('Unexpected external request'); }
  });
  await assert.rejects(
    service.submit({ ...valid, referenceProjectId: 'private-project' }),
    { code: 'UNKNOWN_REFERENCE_PROJECT' }
  );
  assert.equal(calls, 0);
});
