# Marketing Leads Schema

This schema stores B2B lead data, outbound email activity, engagement events, and future service-specific email sequence enrolment.

## Main Tables

- `marketing.leads` stores one row per lead email address, plus business name, city, website, phone, source metadata, unsubscribe state, and status.
- `marketing.lead_sources` records where a batch came from, for example the DataForSEO plumbing CSV.
- `marketing.services` is the service catalogue used for segmentation: plumbing, emergency plumber, gas engineer, boiler repair, boiler installation, central heating, bathroom plumbing, and drainage.
- `marketing.lead_service_interests` records inferred or behavioural interest by lead and service. Imported categories start with a low score; clicks can raise the score later.
- `marketing.email_templates` stores reusable templates, optionally attached to a service.
- `marketing.email_messages` stores each outbound email sent or queued to a lead.
- `marketing.email_links` stores tracked URLs inside an email, optionally mapped to a service. This is how a click becomes service interest.
- `marketing.email_events` is the event stream for sent, delivered, open, click, bounce, unsubscribe, complaint, failed, and dropped events.
- `marketing.email_unsubscribes` stores global or service-specific unsubscribe state.
- `marketing.email_sequences`, `marketing.email_sequence_steps`, and `marketing.lead_sequence_enrollments` support future automated follow-up sequences.

## Reporting

`marketing.v_lead_service_engagement` aggregates message events by lead and service so we can answer questions such as:

- Which leads clicked boiler repair links?
- Which service has the highest click interest?
- Which leads opened but never clicked?
- Which leads should be enrolled into a service-specific sequence?

Example:

```sql
SELECT TOP 100
  email,
  business_name,
  city_name,
  service_name,
  click_count,
  last_clicked_at,
  interest_score
FROM marketing.v_lead_service_engagement
WHERE service_key = N'boiler_repair'
  AND click_count > 0
ORDER BY last_clicked_at DESC;
```

## Import

Apply the schema and import the current master CSV:

```powershell
node scripts\import-marketing-leads.mjs --apply-schema=true --input="leads\Small-Plumbing-Companies-UK-Master.csv"
```

Re-importing the same file is safe: leads are upserted by normalised email address.

## Event Flow

1. Send an email and insert a row into `marketing.email_messages`.
2. Create one `marketing.email_links` row per tracked link. Assign `service_id` when that link relates to a service.
3. Webhook events insert rows into `marketing.email_events`.
4. A click event with a service updates `marketing.lead_service_interests`.
5. Sequence logic can enrol the lead into the matching `marketing.email_sequences` row.
