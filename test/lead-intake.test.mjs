import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLeadIntake, draftWritePlan, PRIVATE_LEADS_COLLECTION} from '../lead-intake.mjs';

const valid = {
  contactName:'Test Customer',
  email:'test@example.com',
  projectType:'patio-conversion',
  widthFeet:12,
  depthFeet:10,
  zipCode:'97219',
  budgetRange:'$15k–$20k',
  referenceProjectId:'d6d12b42-98ff-46fe-b8ef-4f2a2c5a8ec1',
  city:'Portland',
  state:'OR'
};

test('valid lead generates a private write plan without writing or booking',()=>{
  const v=validateLeadIntake(valid);
  assert.equal(v.ok,true);
  assert.equal(v.lead.leadStatus,'new');
  const plan=draftWritePlan(v);
  assert.equal(plan.destinationCollection,PRIVATE_LEADS_COLLECTION);
  assert.equal(plan.executionStatus,'not-connected');
  assert.equal(plan.requiresAuthenticatedServer,true);
});

test('rejects missing identity and invalid dimensions',()=>{
  const v=validateLeadIntake({...valid,email:'',widthFeet:-3});
  assert.equal(v.ok,false);
  assert.equal(v.lead,null);
  assert.ok(v.errors.length>=2);
});

test('does not accept client-controlled payment, booking or CRM confirmation',()=>{
  const v=validateLeadIntake({...valid,paymentTransactionId:'fake-paid',bookingId:'fake-booking',leadStatus:'qualified',crmContactId:'admin'});
  assert.equal(v.ok,true);
  for (const key of ['paymentTransactionId','bookingId','crmContactId']) assert.equal(key in v.lead,false);
  assert.equal(v.lead.leadStatus,'new');
});

test('rejects photos lacking consent',()=>{
  const v=validateLeadIntake({...valid,photoReferenceIds:['private_file_abc12345'],photoConsent:false});
  assert.equal(v.ok,false);
});

test('passes validated private photo IDs with consent',()=>{
  const v=validateLeadIntake({...valid,photoReferenceIds:['private_file_abc12345'],photoConsent:true});
  assert.equal(v.ok,true);
  assert.equal(v.lead.clientPhotoReferences,'private_file_abc12345');
});

test('never copies a client-supplied public image URL or street address unverified',()=>{
  const v=validateLeadIntake({...valid,photoUrl:'https://example.com/private.jpg',streetAddress:'123 Unverified Road'});
  assert.equal(v.ok,true);
  assert.equal('photoUrl' in v.lead,false);
  assert.equal('streetAddress' in v.lead,false);
});

test('rejects unknown project ID and collection writes for invalid leads',()=>{
  const v=validateLeadIntake({...valid,referenceProjectId:'guess'});
  assert.equal(v.ok,false);
  assert.throws(()=>draftWritePlan(v));
});

test('ignores forged privileges and unexpected nested client data',()=>{
  const payload={...valid,
    consentTimestamp:'2020-01-01T00:00:00Z',
    contactConsent:true,
    wixSiteId:'production-site',
    wixCollection:'CatioProjects',
    marketingSubscribed:true,
    paymentStatus:'paid',
    bookingConfirmed:true,
    privateNotes:{secret:'do not persist'},
    extraPhotos:[{url:'https://example.com/private.png'}]
  };
  const v=validateLeadIntake(payload);
  assert.equal(v.ok,true);
  for(const key of ['consentTimestamp','contactConsent','wixSiteId','wixCollection','marketingSubscribed','paymentStatus','bookingConfirmed','privateNotes','extraPhotos']){
    assert.equal(Object.hasOwn(v.lead,key),false,key);
  }
  assert.equal(draftWritePlan(v).destinationCollection,'CatioLeadIntake');
});
