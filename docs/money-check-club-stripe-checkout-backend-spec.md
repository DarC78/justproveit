# Money Check Club Stripe Checkout Backend Spec

## Context

Frontend page:

`https://www.justproveit.co.uk/ro/hai-in-club`

Current CTAs that need Stripe checkout:

- `Hai in Club : £297`
- `Hai in Club: £99 * 3 luni`

Calendar CTA remains unchanged:

- `Programeaza un apel` -> Calendly

Frontend API base:

`https://launchingstack-func-dev.azurewebsites.net/api`

## Product

Service key:

`money-check-club`

Product name:

`Clubul Aici Sunt Banii Dumneavoastra`

Currency:

`gbp`

Plans:

- `full`: one payment of `£297` (`29700` pence)
- `installments`: three monthly instalments of `£99` (`9900` pence each), no interest, total `£297`

Frontend display label for the instalment plan remains:

`Hai in Club: £99 * 3 luni`

Live check on 2026-08-29:

- `plan=full` returns `200` with a Stripe Checkout URL and `amountTotal=29700`
- `plan=monthly-99x3-trial` returns `200` with a Stripe Checkout URL and `amountTotal=29700`
- `plan=installments` now returns `200` with a Stripe Checkout URL and `amountTotal=29700`, so the frontend uses `installments`

For the instalment plan, expected business behaviour:

- collect the first `£99` immediately at checkout
- charge the second `£99` one month later
- charge the third `£99` two months later
- automatically stop/cancel after the third successful payment

## Required LS Endpoint

Add a public endpoint:

`POST /api/justproveit/money-check/club/checkout-session`

No bearer token should be required. Validate allowed origin/CORS for:

- `https://www.justproveit.co.uk`
- local/dev origins if LS needs them for testing

### Request

```json
{
  "tenantKey": "justproveit",
  "plan": "full",
  "source": "ro-hai-in-club",
  "pageUrl": "https://www.justproveit.co.uk/ro/hai-in-club",
  "successUrl": "https://www.justproveit.co.uk/ro/hai-in-club?checkout=success&plan=full&session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://www.justproveit.co.uk/ro/hai-in-club?checkout=cancelled&plan=full",
  "fullName": "",
  "email": "",
  "phone": "",
  "leadId": "",
  "reportId": "",
  "reportToken": ""
}
```

For instalments:

```json
{
  "tenantKey": "justproveit",
  "plan": "installments",
  "source": "ro-hai-in-club",
  "pageUrl": "https://www.justproveit.co.uk/ro/hai-in-club",
  "successUrl": "https://www.justproveit.co.uk/ro/hai-in-club?checkout=success&plan=installments&session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://www.justproveit.co.uk/ro/hai-in-club?checkout=cancelled&plan=installments",
  "fullName": "",
  "email": "",
  "phone": "",
  "leadId": "",
  "reportId": "",
  "reportToken": ""
}
```

Contact and report fields are optional. If LS can resolve contact details from `reportToken` or `reportId`, use those to prefill Stripe customer data. Otherwise Stripe Checkout should collect at least email and phone.

### Response

```json
{
  "success": true,
  "id": "cs_live_...",
  "url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "plan": "full",
  "amountTotal": 29700,
  "currency": "gbp"
}
```

For failed requests, return non-2xx with:

```json
{
  "success": false,
  "error": "Useful human-readable error"
}
```

## Stripe Implementation

### Full Plan

Create a Stripe Checkout Session:

- `mode=payment`
- `currency=gbp`
- amount `29700`
- product `Clubul Aici Sunt Banii Dumneavoastra`
- success and cancel URLs from request, after validation
- metadata:
  - `tenantKey=justproveit`
  - `service=money-check-club`
  - `plan=full`
  - `amount_pence=29700`
  - `source=ro-hai-in-club`
  - optional `leadId`, `reportId`, `reportToken`

### Instalment Plan

Recommended implementation, matching the existing `saleconsultation` pattern:

1. Create a Stripe customer.
2. Create a Checkout Session in `mode=payment` for the first `£99`.
3. Set `payment_intent_data.setup_future_usage=off_session` so the payment method can be used for the remaining two instalments.
4. On successful checkout, create a Subscription Schedule for the remaining two monthly `£99` payments.
5. Set `end_behavior=cancel` so it stops automatically after the instalment schedule is complete.

Alternative acceptable implementation:

- create a recurring monthly `£99` Stripe Price
- create a subscription/schedule with `iterations=3`
- set `end_behavior=cancel`
- ensure the customer is charged exactly three times total, not indefinitely

Stripe references:

- Checkout Session create API: `https://docs.stripe.com/api/checkout/sessions/create`
- Subscription schedules: `https://docs.stripe.com/billing/subscriptions/subscription-schedules`

## Required Env / Config

LS should configure either reusable Stripe Price IDs or create prices server-side:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONEY_CHECK_CLUB_FULL_PRICE_ID` for `£297` one-time payment, or server-side `price_data`
- `STRIPE_MONEY_CHECK_CLUB_INSTALLMENT_PRICE_ID` for `£99/month`, or server-side `price_data`

Do not expose Stripe secret keys to the frontend.

## Webhooks / Fulfilment

LS should handle Stripe webhooks server-side, at minimum:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted` or schedule completion/cancel event used by LS

Persist enough data to support CRM/admin follow-up:

- Stripe customer id
- checkout session id
- payment intent id
- subscription id / schedule id for instalments
- customer name/email/phone
- plan key (`full` or `installments`)
- amount/currency
- payment status
- created/paid/failed timestamps
- lead/report reference if supplied

Recommended CRM linkage:

- create or update a JustProveIt lead by email/phone
- add service `FreeMoneyCheck`
- add intent/status indicating `Money Check Club Purchase`
- mark full plan as paid when Checkout completes
- mark instalment plan as active after first payment and keep later invoice statuses visible

## Frontend Implementation

The frontend replaces the previous `mailto:` CTAs with a click handler:

1. `POST /justproveit/money-check/club/checkout-session` with `plan: "full"` or `plan: "installments"`.
2. Read `response.url`.
3. Redirect browser with `window.location.assign(response.url)`.
4. Show a visible error if the endpoint fails.

Current frontend implementation uses `plan: "installments"` for the instalment CTA.

If LS instead provides two static Stripe Payment Links, frontend can simply set:

- full CTA `href=<full payment link>`
- instalment CTA `href=<instalment payment link>`

However, the endpoint approach is preferred because it can attach lead/report metadata and guarantee the instalment plan stops after exactly three payments.

## Acceptance Criteria

- Clicking `Hai in Club : £297` sends the user to Stripe Checkout for exactly `£297`.
- Clicking `Hai in Club: £99 * 3 luni` sends the user to Stripe Checkout for a plan totalling exactly three `£99` payments.
- The instalment plan does not continue after the third payment.
- Stripe Checkout collects or receives name, email and phone.
- Successful payments are persisted and visible enough for LS/CRM follow-up.
- The frontend receives a JSON response containing `url`.
- Endpoint works anonymously from `https://www.justproveit.co.uk`.
- CORS is configured for the live domain.
