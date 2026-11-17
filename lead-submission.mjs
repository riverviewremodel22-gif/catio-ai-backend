import { randomUUID } from 'node:crypto';
import { validateLeadIntake, PRIVATE_LEADS_COLLECTION } from './lead-intake.mjs';

export const DRAFT_SITE_ID = '148bc4c3-3959-451e-a251-634f05e36d41';
export const CONSENT_VERSION = 'estimate-request-v1';
export const CONSENT_TEXT = {
  en: 'I agree that The Catio Company may privately save these details and contact me about my project. This does not subscribe me to marketing, book a consultation or authorize a charge.',
  es: 'Acepto que The Catio Company guarde estos datos de forma privada y me contacte sobre mi proyecto. Esto no me suscribe a publicidad, reserva una consulta ni autoriza un cobro.'
};

export class SubmissionError extends Error {
  constructor(status, code, partial = false) { super(code); this.status = status; this.code = code; this.partial = partial; }
}

// Credentials stay on this server. No caller-controlled URL, collection or site.
export function createLeadService({ env = process.env, fetchImpl = fetch, catalog = {} } = {}) {
  const enabled = env.WIX_DRAFT_LEADS_ENABLED === 'true' && env.WIX_SITE_ID === DRAFT_SITE_ID && Boolean(env.WIX_DRAFT_API_KEY);
  const completed = new Map(); // bounded, short-lived receipts only; no contact data.
  const pending = new Set();
  async function request(path, method = 'GET', body) {
    const response = await fetchImpl('https://www.wixapis.com' + path, {
      method, redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Authorization: env.WIX_DRAFT_API_KEY, 'wix-site-id': DRAFT_SITE_ID, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) throw new SubmissionError(502, 'WIX_REQUEST_FAILED');
    return response.json();
  }
  return {
    enabled,
    async submit(payload) {
      if (!enabled) throw new SubmissionError(503, 'LEADS_NOT_CONNECTED');
      if (payload?.contactConsent !== true || payload?.consentVersion !== CONSENT_VERSION) throw new SubmissionError(400, 'CONTACT_CONSENT_REQUIRED');
      if (!['en', 'es'].includes(payload.language)) throw new SubmissionError(400, 'INVALID_LANGUAGE');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.requestId || '')) throw new SubmissionError(400, 'INVALID_REQUEST_ID');
      // Private photo storage is intentionally unavailable. Do not accept invented IDs.
      if (payload.photoReferenceIds || payload.photo || payload.clientPhotoReferences) throw new SubmissionError(400, 'PHOTO_STORAGE_NOT_CONNECTED');
      const validated = validateLeadIntake(payload);
      if (!validated.ok) throw new SubmissionError(400, 'INVALID_PROJECT_DETAILS');
      const lead = validated.lead;
      if (!lead.city || !Number.isInteger(lead.numberOfCats)) throw new SubmissionError(400, 'CITY_AND_CAT_COUNT_REQUIRED');
      const reference = lead.referenceProjectId ? catalog.cmsProjects?.find(p => p.cmsId === lead.referenceProjectId && p.verified === true) : null;
      if (lead.referenceProjectId && !reference) throw new SubmissionError(400, 'UNKNOWN_REFERENCE_PROJECT');
      const now = Date.now();
      for (const [id, entry] of completed) if (now - entry.time > 15 * 60000) completed.delete(id);
      if (completed.has(payload.requestId)) return completed.get(payload.requestId).receipt;
      if (pending.has(payload.requestId) || pending.size >= 50) throw new SubmissionError(409, 'REQUEST_IN_PROGRESS');
      pending.add(payload.requestId);
      let contactCreated = false;
      try {
        const { dataPermissions: permissions } = await request('/wix-data/v1/permissions?data_collection_id=CatioLeadIntake');
        if (!permissions || ['itemRead', 'itemInsert', 'itemUpdate', 'itemRemove'].some(key => permissions[key] !== 'CMS_EDITOR') || permissions.specialPermissions?.length) throw new SubmissionError(503, 'PRIVATE_STORAGE_NOT_VERIFIED');
        const contactResult = await request('/contacts/v5/contacts', 'POST', {
          contact: { name: { first: lead.contactName }, email: { email: lead.email }, locale: payload.language === 'es' ? 'es-US' : 'en-US' },
          allowDuplicates: false
        });
        const contact = contactResult.contact;
        if (!contact?.id || contact.email?.email?.toLowerCase() !== lead.email) throw new SubmissionError(502, 'CRM_CONFIRMATION_MISSING', true);
        contactCreated = true;
        const receiptId = randomUUID();
        const data = {
          ...lead, photoConsent: false, clientPhotoReferences: '',
          leadReference: receiptId, crmContactId: contact.id,
          privacyConsentDate: new Date().toISOString(),
          projectNotes: [lead.projectNotes, 'Consent: ' + CONSENT_VERSION + ' (' + payload.language + ')', CONSENT_TEXT[payload.language]].filter(Boolean).join('\n'),
          sourceChannel: 'draft-chatbot', consultationStatus: 'not-booked', serviceAreaStatus: 'not-verified',
          ...(reference ? { referenceProjectUrl: reference.sourceUrl } : {})
        };
        const result = await request('/wix-data/v2/items', 'POST', { dataCollectionId: PRIVATE_LEADS_COLLECTION, dataItem: { id: receiptId, data } });
        if (result.dataItem?.id !== receiptId || result.dataItem?.data?.crmContactId !== contact.id) throw new SubmissionError(502, 'LEAD_CONFIRMATION_MISSING', true);
        const receipt = { saved: true, receiptId, crmSynced: true, booked: false, paid: false };
        if (completed.size >= 1000) completed.delete(completed.keys().next().value);
        completed.set(payload.requestId, { time: now, receipt });
        return receipt;
      } catch (error) {
        // Contact and request writes are not transactional. Never claim full success
        // or auto-retry a partial failure. Staff must reconcile before resubmission.
        if (error instanceof SubmissionError) { error.partial ||= contactCreated; throw error; }
        throw new SubmissionError(502, 'LEAD_SERVICE_UNAVAILABLE', contactCreated);
      } finally { pending.delete(payload.requestId); }
    }
  };
}
