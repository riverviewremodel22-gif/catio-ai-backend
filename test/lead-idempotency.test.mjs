import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeadService, CONSENT_VERSION, DRAFT_SITE_ID } from '../lead-submission.mjs';

const valid = {
  requestId: 'c347b15b-1745-4144-9c4d-b58aee2a8d6a',
  contactName: 'Test Only', email: 'test@example.invalid', city: 'Vancouver',
  zipCode: '98662', projectType: 'freestanding', widthFeet: 8, depthFeet: 8,
  budgetRange: '6000-12000', numberOfCats: 2, contactConsent: true,
  consentVersion: CONSENT_VERSION, language: 'en'
};
const env = {
  WIX_DRAFT_LEADS_ENABLED: 'true',
  WIX_SITE_ID: DRAFT_SITE_ID,
  WIX_DRAFT_API_KEY: 'fake-test-key'
};

test('simultaneous submissions with the same request ID cannot create duplicate contacts', async () => {
  let releaseContact;
  let signalContact;
  const contactStarted = new Promise(resolve => { signalContact = resolve; });
  const contactGate = new Promise(resolve => { releaseContact = resolve; });
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(url);
    if (url.includes('/permissions')) return Response.json({
      dataPermissions: {
        itemRead: 'CMS_EDITOR', itemInsert: 'CMS_EDITOR',
        itemUpdate: 'CMS_EDITOR', itemRemove: 'CMS_EDITOR',
        specialPermissions: []
      }
    });
    if (url.endsWith('/contacts')) {
      signalContact();
      await contactGate;
      return Response.json({ contact: { id: 'synthetic-contact', email: { email: valid.email } } });
    }
    if (url.endsWith('/items')) {
      const body = JSON.parse(options.body);
      return Response.json({ dataItem: body.dataItem });
    }
    throw new Error('Unexpected mocked endpoint');
  };
  const service = createLeadService({ env, fetchImpl });
  const first = service.submit(valid);
  try {
    await contactStarted;
    await assert.rejects(service.submit(valid), { code: 'REQUEST_IN_PROGRESS', status: 409 });
  } finally {
    releaseContact();
  }
  const receipt = await first;
  assert.equal(receipt.saved, true);
  assert.equal(receipt.booked, false);
  assert.equal(receipt.paid, false);
  assert.deepEqual(await service.submit(valid), receipt);
  assert.equal(calls.filter(url => url.endsWith('/contacts')).length, 1);
  assert.equal(calls.filter(url => url.endsWith('/items')).length, 1);
});
