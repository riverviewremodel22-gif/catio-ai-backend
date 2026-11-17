import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeadService, DRAFT_SITE_ID, CONSENT_VERSION } from '../lead-submission.mjs';
const env = { WIX_SITE_ID: DRAFT_SITE_ID, WIX_DRAFT_LEADS_ENABLED: 'true', WIX_DRAFT_API_KEY: 'test-placeholder' };
const valid = { requestId: '87695750-c32e-4c47-a019-44cf226f3a11', contactName: 'Synthetic Test', email: 'synthetic@example.com', city: 'Vancouver', zipCode: '98662', projectType: 'freestanding', widthFeet: 8, depthFeet: 8, budgetRange: '6000-12000', numberOfCats: 2, contactConsent: true, consentVersion: CONSENT_VERSION, language: 'en' };
function mock({ permissions = {}, failContact = false, failItem = false, omitEmail = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ url, options, body });
    if (url.includes('/permissions')) return Response.json({ dataPermissions: { itemRead: 'CMS_EDITOR', itemInsert: 'CMS_EDITOR', itemUpdate: 'CMS_EDITOR', itemRemove: 'CMS_EDITOR', specialPermissions: [], ...permissions } });
    if (url.endsWith('/contacts')) return Response.json(failContact ? {} : { contact: { id: 'contact-test', email: omitEmail ? {} : body.contact.email } }, { status: failContact ? 409 : 200 });
    if (url.endsWith('/items')) return Response.json(failItem ? {} : { dataItem: body.dataItem }, { status: failItem ? 500 : 200 });
    throw Error('Unexpected URL');
  };
  return { calls, fetchImpl };
}
test('lead writes are disabled by default and on any other site', async () => {
  for (const config of [{}, { ...env, WIX_SITE_ID: 'production-site' }, { ...env, WIX_DRAFT_LEADS_ENABLED: 'false' }]) {
    const service = createLeadService({ env: config, fetchImpl: () => { throw Error('Must not call'); } });
    assert.equal(service.enabled, false);
    await assert.rejects(service.submit(valid), { code: 'LEADS_NOT_CONNECTED' });
  }
});
test('contact consent, valid details and known project references are required before any network call', async () => {
  const m = mock(), service = createLeadService({ env, ...m });
  for (const payload of [{ ...valid, contactConsent: false }, { ...valid, consentVersion: 'fake' }, { ...valid, email: '' }, { ...valid, numberOfCats: 1.5 }, { ...valid, city: '' }, { ...valid, photoReferenceIds: ['fake_private_id'] }, { ...valid, referenceProjectId: 'd6d12b42-98ff-46fe-b8ef-4f2a2c5a8ec1' }]) await assert.rejects(service.submit(payload));
  assert.equal(m.calls.length, 0);
});
test('private permissions are checked before creating contacts or records', async () => {
  for (const permissions of [{ itemRead: 'ANYONE' }, { itemInsert: 'SITE_MEMBER' }, { specialPermissions: [{ anyone: true }] }]) {
    const m = mock({ permissions }), service = createLeadService({ env, ...m });
    await assert.rejects(service.submit(valid), { code: 'PRIVATE_STORAGE_NOT_VERIFIED' });
    assert.equal(m.calls.length, 1);
  }
});
test('confirmed writes retain consent, reject privilege injection, and only return a receipt', async () => {
  const m = mock(), service = createLeadService({ env, ...m });
  const result = await service.submit({ ...valid, crmContactId: 'fake', bookingId: 'paid', paymentTransactionId: 'fake', leadStatus: 'qualified', sourceChannel: 'override', streetAddress: 'must-not-copy' });
  assert.equal(result.saved, true); assert.equal(result.crmSynced, true);
  assert.equal(result.booked, false); assert.equal(result.paid, false);
  const contact = m.calls[1].body;
  assert.equal(contact.allowDuplicates, false);
  assert.deepEqual(contact.contact.email, { email: valid.email });
  const data = m.calls[2].body.dataItem.data;
  assert.equal(data.crmContactId, 'contact-test'); assert.equal(data.leadStatus, 'new');
  assert.equal(data.sourceChannel, 'draft-chatbot'); assert.equal(data.streetAddress, undefined);
  assert.equal(data.bookingId, undefined); assert.equal(data.paymentTransactionId, undefined);
  assert.ok(data.privacyConsentDate); assert.match(data.projectNotes, /estimate-request-v1/);
  assert.ok(m.calls.every(x => x.options.headers['wix-site-id'] === DRAFT_SITE_ID));
  assert.deepEqual(await service.submit(valid), result); assert.equal(m.calls.length, 3);
  assert.equal(JSON.stringify(result).includes(valid.email), false);
});
test('no false saved confirmation or raw provider errors on partial failure', async () => {
  const m = mock({ failItem: true }), service = createLeadService({ env, ...m });
  await assert.rejects(service.submit(valid), error => error.code === 'WIX_REQUEST_FAILED' && error.partial === true);
  const missing = mock({ omitEmail: true });
  await assert.rejects(createLeadService({ env, ...missing }).submit(valid), { code: 'CRM_CONFIRMATION_MISSING', partial: true });
  assert.equal(missing.calls.length, 2);
});
