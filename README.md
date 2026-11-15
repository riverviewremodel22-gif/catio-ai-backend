# The Catio Company — AI backend starter

Status: **source package only; not deployed or connected**. The development branch adds a source-grounded catio-matching endpoint and tests; it has NOT been deployed. This is a starter for a developer-managed Node 20+ backend, not a Wix static HTML file. It uses the OpenAI API from the server, keeping the API key out of browser code.

## Configuration

Set these private environment variables in your secure backend host:

- `OPENAI_API_KEY` — server-side OpenAI API key (never share in chat or paste into page source)
- `ALLOWED_ORIGIN` — the exact allowed website origin, e.g. `https://your-staging-domain.example` (required)
- `OPENAI_MODEL` — optional approved multimodal model ID; confirm current model access before deployment
- `PORT` — optional, default `8787`

Run `npm start` with Node 20 or later. `GET /health` returns only readiness; `POST /api/chat` accepts `{"message":"...","history":[],"photo":"data:image/jpeg;base64,..."}`. No customer data is persisted in this starter. Raw photos are forwarded only for inference and are not saved by this code. See provider retention practices and publish appropriate customer notice before enabling production uploads.

## Before production

1. Host on HTTPS with secrets in the host's secret manager; never serve this code or its environment variables as frontend assets.
2. Replace in-memory IP rate limiting with a shared, trusted-proxy-aware limiter and add abuse monitoring and spending caps.
3. Add explicit photo consent and proper secure storage/retention if photos or customer leads must be saved; enforce image validation and antivirus / content limits server-side.
4. Connect the website's chat UI to `/api/chat`, with visible error/retry and appropriate user notice. The current published Wix demo is intentionally not connected.
5. Use Wix APIs through authenticated server calls for CRM submissions and verified digital order recovery; do not send download links until ownership is verified.
6. Configure Wix Bookings and payment confirmation separately. Do not claim appointments are available until true slots have been checked.
7. Audit the calculation model and the $150 consultation credit policy before activating customer-facing payments.
8. When enabling a production model, test factual responses, unsafe prompt injection, fee rules, links, and the no-final-quote constraint.


## Draft project matching feature (development branch only)

`POST /api/projects/match` with `{"query":"patio catio with barn doors","limit":3}` or `{"projectId":"<a known catalog cmsId>","limit":3}` ranks comparable published-original project references from 24 project entries in `catalog.json`. Returns only catalog-backed links, names, short descriptions, and similarity reasons. It does not return prices, warranties, site-specific advice or fabricated specifications.

For security, the same `ALLOWED_ORIGIN` and basic rate limit apply. It is read-only; no client address, photos, or chat data are stored. Treat the matcher as a candidate shortlist, not a definitive design recommendation. Wix CMS live synchronization, customer lead storage and appointment/payment integrations remain NOT CONNECTED.

To run tests locally: `npm test`. Do not claim tests have passed until run by a trusted CI runner or developer.
