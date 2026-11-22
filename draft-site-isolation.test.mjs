import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeadService, DRAFT_SITE_ID, SubmissionError } from './lead-submission.mjs';

const validDraftEnv = {
  WIX_DRAFT_LEADS_ENABLED: 'true',
  WIX_SITE_ID: DRAFT_SITE_ID,
  WIX_DRAFT_API_KEY: 'fake-test-key-not-a-secret'
};

test('lead writes remain disabled for any site other than the authorized draft', async () => {
  for (const siteId of ['production-site-id', '', '148bc4c3-3959-451e-a251-634f05e36d40']) {
    let networkCalls = 0;
    const service = createLeadService({
      env: { ...validDraftEnv, WIX_SITE_ID: siteId },
      fetchImpl: async () => { networkCalls++; throw Error('unexpected network request'); }
    });
    assert.equal(service.enabled, false);
    await assert.rejects(service.submit({}), error =>
      error instanceof SubmissionError && error.status === 503 && error.code === 'LEADS_NOT_CONNECTED'
    );
    assert.equal(networkCalls, 0);
  }
});

test('lead writes remain disabled without explicit opt-in and credentials', async () => {
  for (const env of [
    { ...validDraftEnv, WIX_DRAFT_LEADS_ENABLED: 'false' },
    { ...validDraftEnv, WIX_DRAFT_LEADS_ENABLED: undefined },
    { ...validDraftEnv, WIX_DRAFT_API_KEY: '' }
  ]) {
    let networkCalls = 0;
    const service = createLeadService({
      env,
      fetchImpl: async () => { networkCalls++; throw Error('unexpected network request'); }
    });
    assert.equal(service.enabled, false);
    await assert.rejects(service.submit({}), error =>
      error instanceof SubmissionError && error.code === 'LEADS_NOT_CONNECTED'
    );
    assert.equal(networkCalls, 0);
  }
});
