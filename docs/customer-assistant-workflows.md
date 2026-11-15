# The Catio Company — Customer Assistant Workflows (draft)
Status: implementation blueprint only. None of the actions below is connected or available in production.

## Architecture boundaries
- **Public portfolio**: Wix Editor draft site "The Catio Company 2", collection `CatioProjects`. It has 24 imported project records with project titles, original URLs, photo galleries and SEO draft fields. Do not store leads, addresses, customer-submitted photos, private discussions, payment records or full contact details in this collection.
- **Production shop**: the original `thecatiocompany.com` Wix site owns live digital-product orders and current business automations. Do not modify it until the new workflows are verified.
- **Backend**: Node HTTPS service; use server-side Wix authorization, never expose credentials to the visitor/browser.
- **Appointment fee**: $120 credited under written construction terms; do not advertise confirmed bookings, payments or availability until live integrations have actually succeeded.
- **Location**: only approved Portland–Vancouver metro full street addresses can book; ZIP can only pre-screen. Outside-area Signature Projects start at $35,000 and require manual approval.
- **Pricing**: freestanding custom starts $8,000; window from $4,000; patio conversions typically $12,000–$18,000; many complete builds $15,000–$20,000+; Signature Projects $35,000+. Figures are preliminary and subject to site/project review.

## Customer-facing branches
### A. New custom catio inquiry
1. Identify source/referring project `projectId` or original URL, and request desired project type.
2. Ask width and depth in feet, height if known, existing roof/patio, home access method, number of cats, and optional mobility considerations.
3. Ask for project address and ZIP (minimum city/ZIP for preliminary estimate, **full verified address** before actual consultation eligibility); ask HOA/landlord approvals.
4. Request a realistic budget range. Explain minimum spend and avoid trapping in an endless form when below threshold; offer DIY plans if appropriate.
5. Optionally request 1–10 photos (property overview, proposed entrance/window, roof/ground, dimensions sketch) with explicit consent and a clear privacy statement. Do not tell the client that any photo is saved or reviewed without a confirmed upload response.
6. Return a concise **preliminary range**, not a contract quote. Summarize missing information.
7. If eligible, offer to **request** a $120 consultation. Only display real times returned by Wix Bookings for their verified address; otherwise provide a manual follow-up.

### B. Paid consultation record (private)
Create a durable lead record with:
- internal lead ID and external Wix contact ID (if created);
- name, email, verified phone if supplied, address, geocoder outcome and scheduling region;
- project type, dimensions, roof, foundation, finish, access, cat count, HOA status, budget;
- originating `CatioProjects` reference when requesting a similar build;
- photo attachment IDs/URLs, user consent, created/updated timestamps, privacy retention date;
- consultation service ID, Wix booking ID, payment transaction ID, payment verified state;
- state transitions: `intake_started` → `qualified` → `appointment_requested` → `booking_confirmed` → `consultation_completed`, with `not_eligible` and `manual_review` branches.

**Write semantics:** require authentication/authorization, request idempotency keys, server-side validation, private collection ACL, malware/file type and size checks, timestamped audit events, deletion capability and rate limits. Reject client-supplied "paid" or "confirmed" flags. The public chatbot cannot write these states directly without a backend check.

**Notification:** send the team a concise project brief only after the backend confirms the private lead record and booking/payment state. Include secure admin links to photographs rather than public attachments. Send customer confirmations and reminders only after appointment confirmation.

### C. DIY plan download assistance
1. Ask for the email used at checkout and order identifier (if available).
2. Verify ownership using the *original live Wix Stores order service*, enforcing anti-enumeration protections. Do not use the draft duplicate's empty/old order data.
3. Require the correct order, paid status and corresponding digital product entitlement before a resend.
4. Trigger only a supported Wix resend/download action, and give generic status (not an exposed order record).
5. On failure or missing connector capability, provide `info@thecatiocompany.com` for private human support. Never generate or disclose a buyer's download URL.

### D. Similar catio request
A public project page's CTA should pass a stable project ID and title to the chatbot, not untrusted descriptions of price or materials. The assistant may show only verified project facts; where project CMS data is missing, link to the original published story and state that the detail must be checked. Add the chosen project reference to private intake.

## Integration dependencies and acceptance tests
- [ ] Read-only Wix CMS lookup by project ID works, with published-only visibility and safe field allowlist.
- [ ] Authenticated private leads storage is created; no public access to addresses, photos or chats.
- [ ] Photo upload uses signed short-lived URLs, validated file types, size quotas and consent capture.
- [ ] Full-address eligibility is rerun on the backend before bookings.
- [ ] Bookings availability comes from live Wix data, not the calculated first/third Saturday schedule.
- [ ] Payment status is verified server-side before saying "confirmed".
- [ ] Original Wix order lookup is available and ownership checked before a resend.
- [ ] Team and customer notifications are tested with fictitious test records.
- [ ] Red-team prompts cannot invent bookings, transaction confirmations or project facts.
- [ ] Domain migration, SEO redirects and consent/privacy disclosures are independently reviewed.

## Current implementation status
The existing `server.mjs` supports text/image questions and eligibility screening but **does not persist customer photos, collect lead records, issue Bookings reservations, take payments, confirm orders or resend plans**. Its current rate limit is per-process memory. Existing demo UI should continue stating its limitations. This blueprint does not activate any new customer-facing feature.
