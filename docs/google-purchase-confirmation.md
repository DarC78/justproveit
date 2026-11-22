# Optional Google consent after payment

`/plata-confirmata/` verifies a paid live Checkout through the same-origin
`/api/google-purchase-consent` proxy. The backend derives identity from Stripe;
no browser-supplied email is accepted. Two unchecked choices are optional.
Skipping or declining preserves all purchase rights and original next steps.
The previous course receipt also offers this component without changing its flow.

The early attribution script removes the Checkout reference before SDKs and keeps
it only in page memory. Both receipt paths disable cache, referrers, indexing and
session recording. The API proxy targets the internal backend on loopback for
the in-house host and returns no-store JSON. Public grants cannot override an
existing refusal. No browser purchase conversion or email is sent by this page.

Deploy the backend route first, then this site through protected Gitea CI. The
routing generator now includes thirteen reviewed HTTP bindings. Only after live
receipt/API verification may Payment Link return settings be changed; keep the
original return metadata so the page can offer the original next step. Details:
backend `docs/systems/google-all-stripe-purchases.md`.