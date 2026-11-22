# Catio Assistant development integration

Only authorized Wix target: **The Catio Company 2**, `148bc4c3-3959-451e-a251-634f05e36d41`.
Do not publish, merge to main, change domains, enable bookings/payments, or use production credentials.

## What runs

`DEV_CHAT_PREVIEW=true` enables `/dev/chat` and its script. Set `ALLOWED_ORIGIN` to the exact origin received by the backend. The private Codespaces proxy was observed rewriting the browser origin to `https://localhost:8787`; that is the value used in this Codespace. No origin checks were disabled. Keep the Codespaces port private. The UI uses same-origin requests, supports English/Spanish, estimates by category, verified project references, optional consented photo inference and a separate project form. It never renders AI HTML. No transcripts or photos are persisted.

The estimate form remains disabled until the server reports lead integration enabled. It only confirms success after both CRM contact creation and private CMS insertion return confirmations. It does not book, charge, subscribe to marketing or email the team. The assistant cannot submit a form on the visitor's behalf.

## Wix CRM adapter — prepared, not verified end to end

The draft already has `CatioLeadIntake`. Its permissions were inspected through the connector: all item operations are `CMS_EDITOR`, no special permissions; legacy collection permissions are `ADMIN`. The runtime rechecks privacy before every write. It never writes to CatioProjects.

To enable only after owner approval and credential provisioning, provide a dedicated development key in the server secret environment (`WIX_DRAFT_API_KEY`), `WIX_SITE_ID=148bc4c3-3959-451e-a251-634f05e36d41`, and `WIX_DRAFT_LEADS_ENABLED=true`. Never put the key in this repository, browser, Wix embed or chat. Required permissions: read collection permissions, create contacts, insert data items. No credentials were created by this implementation.

The adapter intentionally refuses any other site. Contacts use duplicates disallowed; duplicate conflicts require staff review rather than exposing an existing contact. A contact could be created before the CMS write fails. The UI reports an unconfirmed/partial submission and stops retries; staff must reconcile. In-memory receipt deduplication lasts 15 minutes and is not durable across restarts. A durable idempotency/outbox workflow and abuse controls are required before public launch. Existing in-memory IP limiting is development only.

Project submissions require name, email, city, ZIP, type, approximate width/depth, budget, cat count, versioned explicit contact consent and request UUID. Server timestamps consent, records its exact bilingual text, ignores client CRM/payment/booking privileges and validates catalog references. Contact consent is not marketing consent. Raw photos and client-provided private photo IDs are rejected by the submission endpoint until private storage is implemented. Images may be separately sent for AI inference with explicit photo consent; provider retention is separate from this backend's no-storage behavior.

## Preview integration

An iframe may point at the private development `/dev/chat` URL in the authorized Wix draft only. A private Codespaces URL requires developer authentication and is not customer hosting. If authentication/cookies block the iframe, do not make the port public. A Velo backend bridge and approved stable development host should replace it before broader testing.

## Verification

`node --check server.mjs`, `git diff --check`, and `npm test`. New tests use a fake Wix transport and never write real contacts. Separately test `/health`, live AI category pricing, bilingual conversation, catalog references, photo consent rejection, disabled lead submission, and responsive browser layout.

Official contracts used:

- https://dev.wix.com/docs/api-reference/crm/members-contacts/contacts/contacts-v5/create-contact
- https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/insert-data-item
- https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-permissions/get-permissions
- https://dev.wix.com/docs/api-reference/articles/rest-authentication/rest-api-authentication


## Current Wix preview result

A hidden page named **Catio Assistant Preview** was created in the authorized draft. The private GitHub tunnel cannot authenticate inside its iframe (GitHub refuses framing), so the embedded copy is explicitly a **design preview** with local, verified sample pricing/material answers, disabled submissions/photos, and a link opening the real private AI chat separately. It is not a live Wix AI/CRM integration. The full live development UI at `/dev/chat` is operational outside the iframe.

The editor displayed a first-save URL selection dialog. It was dismissed to respect the no-domain-change instruction. The page remains available in the open editor preview, but durable Wix save has not been confirmed. The full embed source is retained in this repository as `public/wix-embed-preview.html`. Nothing was published or deployed to a Wix Test Site.

The knowledge file now includes short source-grounded FAQs from company maintenance and safety articles. All owner-corrected prices are preserved.

## Mesh affiliate links pending product identification

The owner supplied these exact mesh links. The product titles and opening sizes still need to be matched to each link. Keep them out of the customer-facing catalog until the mapping is confirmed. The first recommendation for a general mesh question is the established 1 × 1-inch, 14-gauge black PVC-coated welded wire, using its existing catalog-approved link.

1. https://link.amazon/B0bgv88LL
2. https://link.amazon/B0h7a4Gom
3. https://link.amazon/B052RBGaw
4. https://link.amazon/B01R9H46U
5. https://link.amazon/B08lYEKlE
6. https://link.amazon/B0fSV7gnx
