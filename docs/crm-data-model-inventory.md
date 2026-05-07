# CRM Data Model Inventory

Inventory date: 2026-05-07

## Source CRM Page

The Wix CRM page lives in:

- `C:\Users\adria\proveitweb-live\src\pages\CRM.z9gdm.js`

The page currently reads/writes Wix collections directly through `wixData` and calls Wix backend functions for side effects.

## Wix Collections Used By CRM

These are the collection names observed in the CRM page and its backend dependencies:

| Wix collection | CRM use |
| --- | --- |
| `crmLeads12Nov` | Main CRM lead record: lead details, status, language, notes, follow-up date, finance company, car details, assigned agents |
| `ozClients` | Sales/customer purchase list |
| `ozLeads` | Original lead records; language is synced from CRM by email/phone |
| `ozClientsActivity` | Activity history searched by email via lead id |
| `ozEmailCampaigns` | Scheduled email sequence rows |
| `ozSMSCampaigns` | Scheduled SMS follow-up rows |
| `ozLogs` | Journey/action logging from `stampuser` |

## Core CRM Lead Fields Observed

Observed from `CRM.z9gdm.js`:

| Field | Notes |
| --- | --- |
| `_id` | Wix record id; equivalent should become SQL `Id` |
| `leadDate` | Lead creation/capture date |
| `fullName` | Customer/lead display name |
| `phoneNumber` | Primary phone |
| `leadid` | Usually last 6 digits of normalized phone |
| `email` | Primary email |
| `secondaryemail` | Semicolon-style secondary emails |
| `isCustomer` | Displayed as customer/to-recover marker in current UI |
| `statusOriginal` | Current lead status |
| `observation` | Prepended notes/action history |
| `dataUrmatorContact` | Next contact/follow-up date |
| `financeCompany` | Lender/finance company |
| `year` | Car/year field |
| `nrInmatriculare` | Car registration |
| `language` | `ro`, `es`, etc. |
| `initialAgent` | First owning agent |
| `lastAgent` | Latest editing agent |
| `emailLeads` | Legacy email-related field |
| `emailAsap` | Legacy ASAP email-related field |
| `addToDialler` | Dialer flag/status |

## LaunchingStack SQL Inventory

Connection source:

- `C:\Users\adria\LaunchingStack\backend\functions\local.settings.json`
- Key present: `SqlConnectionString`

Metadata query was run using:

- `scripts/inventory-launchingstack-crm.mjs`

Current database has 41 base tables and 2 reporting views.

CRM-relevant existing tables:

| SQL table | Current fit |
| --- | --- |
| `app.Leads` | Generic lead capture only. It has 3 rows and does not have CRM-specific fields such as `leadid`, `dataUrmatorContact`, `financeCompany`, `language`, `initialAgent`, or `lastAgent`. |
| `app.EmailTemplates` | Existing email template catalog. Could be reused for some CRM email sends, but Wix template keys need mapping/import. |
| `app.EmailOutbox` | Existing queued email table. Could be reused for immediate/scheduled CRM emails if we add sequence metadata or a separate campaign table. |
| `app.EmailLogs` | Existing email delivery logs. Reusable. |
| `app.AuditLogs` | Existing audit trail. Reusable for admin CRM actions. |

CRM-specific missing tables:

| Needed concept | Current status |
| --- | --- |
| CRM leads equivalent to `crmLeads12Nov` | Missing |
| Sales/customers equivalent to `ozClients` | Missing |
| Original leads equivalent to `ozLeads` | Missing |
| Client activity equivalent to `ozClientsActivity` | Missing |
| Email campaign sequence equivalent to `ozEmailCampaigns` | Missing |
| SMS campaign sequence equivalent to `ozSMSCampaigns` | Missing |
| CRM/dialer/missed-call integration state | Missing locally; likely external Azure/MCC endpoint |

## Recommended SQL Model

Create CRM-specific tables instead of overloading `app.Leads`.

Proposed tables:

| Table | Purpose |
| --- | --- |
| `app.CrmLeads` | Main migrated CRM lead records |
| `app.CrmLeadNotes` | Optional normalized note/action history; can also keep `Observation` text for compatibility |
| `app.CrmSales` | Migrated `ozClients` sales/customer rows |
| `app.CrmSourceLeads` | Migrated `ozLeads` source/original lead rows |
| `app.CrmClientActivity` | Migrated `ozClientsActivity` rows |
| `app.CrmEmailCampaigns` | CRM email sequence queue/state |
| `app.CrmSmsCampaigns` | CRM SMS sequence queue/state |
| `app.CrmDialerActions` | Local audit of dialer stop/missed-call actions |

All tenant-owned tables should include `TenantId` and follow the existing LaunchingStack pattern.

## Next Step

Build `sql/029_justproveit_crm.sql` in LaunchingStack with the CRM tables and indexes, then add a small import/mapping plan from the Wix collection export fields into those SQL columns.
