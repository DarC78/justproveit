# Manual SMS from the reply composer

The yellow **Send SMS** action appears immediately after **Upload a picture / PDF** in the lead and scheduled-call reply composers. It sends the trimmed text in the shared textbox to the current lead phone, with a maximum of 1600 characters. Attachments and Meta templates are not sent by SMS. Sending an SMS does not solve the lead or change its stage.

The backend authenticates CRM access and rereads the contact or booking phone before sending. A request ID reserves a durable SMS record before the Twilio request. Repeating the same request checks that record; changed text or recipient cannot reuse its key. The composer keeps the draft on failure and locks other send actions while an outcome is uncertain.

SMS history records the authenticated agent, text, timestamp, provider receipt and outcome. Provider acceptance is shown separately from confirmed delivery or failure. A confirmed send refreshes lead history.

Simulation emails also retain their complete text and HTML in the backend delivery record. The existing recipient-scoped email history imports confirmed Resend sends and displays the local body when expanded.
