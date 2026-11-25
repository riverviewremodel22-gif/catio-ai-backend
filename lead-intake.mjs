/**
 * The Catio Company — draft lead intake validation.
 *
 * This module does NOT collect, transmit, persist, email, or publish any lead.
 * Only an authenticated, server-side integration may write valid output into
 * the Wix ADMIN-only CatioLeadIntake collection after explicit user consent.
 * Never log raw input or output: they may contain personal information.
 */
export const PRIVATE_LEADS_COLLECTION = 'CatioLeadIntake';
const permittedProjectTypes = new Set(['freestanding', 'window', 'patio-conversion', 'other']);
const permittedStatus = new Set(['new', 'needs-review', 'qualified', 'not-eligible']);
const trim = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const clampNumeric = (value, max) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= max ? number : null;
};

export function validateLeadIntake(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return {ok:false,errors:['Expected a lead intake object'],lead:null};
  }
  const errors = [];
  const contactName = trim(payload.contactName,120);
  const email = trim(payload.email,200).toLowerCase();
  const phone = trim(payload.phone,32);
  const projectType = trim(payload.projectType,40);
  const widthFeet = clampNumeric(payload.widthFeet,200);
  const depthFeet = clampNumeric(payload.depthFeet,200);
  const zipCode = trim(payload.zipCode,10);
  const referenceProjectId = trim(payload.referenceProjectId,100);
  const photoConsent = payload.photoConsent === true;

  if (!contactName) errors.push('Customer name is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid customer email is required');
  if (!permittedProjectTypes.has(projectType)) errors.push('Choose a supported project type');
  if (widthFeet === null || depthFeet === null) errors.push('Width and depth must be positive numbers (feet)');
  if (!/^\d{5}$/.test(zipCode)) errors.push('A valid 5-digit ZIP code is required');
  if (payload.photoReferenceIds && !photoConsent) errors.push('Photo consent required before attaching private photo references');
  if (payload.photoReferenceIds && (!Array.isArray(payload.photoReferenceIds) || payload.photoReferenceIds.length > 10 ||
    !payload.photoReferenceIds.every(x => typeof x === 'string' && /^[a-zA-Z0-9:_-]{8,180}$/.test(x)))) {
    errors.push('Photo references must be validated private storage identifiers');
  }
  if (payload.referenceProjectId && !/^[0-9a-f-]{36}$/i.test(referenceProjectId)) errors.push('Invalid reference project ID');

  // Explicit allowlist: never accept payment status, booking confirmation,
  // Wix CRM ownership, image URLs, or privilege flags from a browser request.
  const lead = {
    contactName,
    email,
    phone,
    projectType,
    widthFeet,
    depthFeet,
    heightFeet: clampNumeric(payload.heightFeet,80),
    city: trim(payload.city,100),
    state: trim(payload.state,2).toUpperCase(),
    zipCode,
    existingStructure: trim(payload.existingStructure,400),
    accessMethod: trim(payload.accessMethod,200),
    hoaApproval: trim(payload.hoaApproval,100),
    preferredFinish: trim(payload.preferredFinish,160),
    roofPreference: trim(payload.roofPreference,160),
    numberOfCats: clampNumeric(payload.numberOfCats,100),
    projectNotes: trim(payload.projectNotes,2000),
    referenceProjectId,
    sourceChannel: trim(payload.sourceChannel,80) || 'website-chatbot',
    photoConsent,
    clientPhotoReferences: photoConsent ? (payload.photoReferenceIds || []).join(',') : '',
    leadStatus: 'new'
  };
  if (!permittedStatus.has(lead.leadStatus)) throw Error('Invalid internal state');
  return {ok:errors.length === 0,errors,lead:errors.length === 0?lead:null};
}

/**
 * Back-end-only write gate. Returns a plan, not a result.
 * Caller must independently confirm contact consent, authenticated Wix API
 * connection, private permissions and storage retention policy.
 */
export function draftWritePlan(validated) {
  if (!validated?.ok || !validated.lead) throw Error('Valid lead is required');
  return {
    destinationCollection:PRIVATE_LEADS_COLLECTION,
    requiresAuthenticatedServer:true,
    requiresConsent:true,
    executionStatus:'not-connected',
    fieldNames:Object.keys(validated.lead)
  };
}
