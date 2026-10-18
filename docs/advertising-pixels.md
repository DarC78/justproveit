# Advertising pixels on JustProveIt

## Installed website integration

- Meta Pixel: `674835348003619`
- TikTok Pixel: `CLLIILJC77UBIO8OFG1G`
- Google Ads: `AW-11386018124`

Meta and TikTok IDs were extracted from the public Proveit Wix site on 18 October 2026.
The owner supplied the Google Ads installation snippet from the Proveit account.
`AdvertisingConsent` is mounted inside the existing `ClarityBoundary` in `_app`.
Owner-requested test rollout: it loads `/advertising-pixels.js?v=google-ads-1`
on arrival on public pages, before a visitor makes a choice, unless a current
refusal is already stored. No fabricated accepted choice is written. The banner
explains that the services are used and retains Accept/Reject controls.
Choices expire after 180 days and can be changed using the persistent
advertising-preferences button. A refusal revokes tracking, removes accessible
first-party advertising cookies and reloads the page; it is respected on future
visits. Storage errors block the SDK bootstrap. Previously transmitted events
cannot be withdrawn by deleting cookies. There is no noscript tracking image.
Declining advertising does not change the existing Clarity integration.

The SDKs send explicit page views on public pages, including `/bani-uk-ai/`.
Repeated renders and query/fragment-only navigation do not duplicate page views.
No purchase tracking, form capture, email/phone advanced matching, GA4 property,
server-side events, or campaign spending is configured by this integration.
Meta automatic event configuration is disabled in code. Review TikTok enhanced
data postback, automatic advanced matching, and automatic events in Events
Manager, since account-controlled features cannot be verified from this repo.

The Google tag queues Consent Mode defaults before configuration, using the
same default-on advertising policy as Meta/TikTok. It keeps `analytics_storage`
denied, disables automatic initial page views, and sends one explicit
`page_view` to the supplied Ads ID per public pathname. Refusal updates
`ad_storage`, `ad_user_data`, `ad_personalization` and `analytics_storage` to
denied before the document reloads. Accessible `_gcl_*` and `_gac_*` cookies are
expired. Consent updates themselves can generate vendor requests; no SDK loads
on subsequent visits while refusal remains stored. Existing account-side
connected destinations/settings are not changed by this installation.

Google account follow-up: use Tag Assistant to verify the Ads ID, then Google
Ads Audience manager to create a website-visitor data segment for the course URL.
Website deployment does not create that segment or verify account event receipt.

CRM, admin, authentication, APIs, report forms and bearer-link report pages use
the existing exclusion list. The Clarity boundary also forces full-document
navigation when crossing between public and protected pages, destroying loaded
advertising SDKs before protected content mounts. The standalone SDK bootstrap
independently rejects protected paths and current stored refusals. Withdrawal
revokes vendor consent and reloads the document to remove SDK listeners; known
first-party advertising cookies are expired where accessible. Vendor-domain
cookies cannot be deleted by this website.

## Account-side completion

Installing the website code does not create advertising audiences. In each
platform's Events Manager, verify that the shared pixel is assigned to the
intended advertising account and receives page views from `www.justproveit.co.uk`.
Configure the shared pixels' domain/traffic permissions if the new domain is
restricted. Use each platform's Test Events and browser pixel helper on an
initial public-page visit; repeat after rejection to verify no new events.

Create a website-traffic custom audience with a 30-day membership window and
URL containing `justproveit.co.uk/bani-uk-ai`, including both trailing-slash
variants. Prefer an exact hostname/path rule when supported. Suggested name:
`JPI | Bani UK AI | Visitors | 30d`. Enable automatic refresh on TikTok.
These account operations require access to the user's advertising accounts;
they are not performed by website deployment. An audience must meet each
platform's minimum eligible size before ads can use it.

Sources: [TikTok website audiences](https://ads-useast2a.tiktok.com/resources/help/article/how-to-create-a-website-traffic-audience?lang=en),
[TikTok consent mode](https://business-api.tiktok.com/portal/docs/pixel-cookie-consent-mode/v1.3),
[Meta consent integration](https://developers.facebook.com/docs/meta-pixel/implementation/gdpr/).

## Checks

`node --test tests/advertising-pixels.test.cjs tests/clarity.test.cjs`
verifies consent gating, protected routes, IDs, duplicate initialization, page
views, withdrawal and the public/private full-navigation boundary. Build with
`npm run build`; publish only through GitHub `main` and the existing SWA workflow.
Live source verification confirms deployment, not delivery into vendor accounts.
