# WhatsApp reply pictures

Use **Upload a picture** beside the existing reply buttons wherever the shared
WhatsApp composer appears (contact history, inbound conversations and booking
history). The older contact reply dialog also supports picture uploads.

Choose a JPEG/PNG up to 5 MiB or a PDF up to 50 MiB, inspect the preview, and optionally write a caption
in the normal textbox (up to 1024 characters). Click **Send WhatsApp**, or use
**Schedule Reply** where available for the existing business hours. Uploading
alone never sends. **Remove picture** returns to a text reply.

The selected picture stays attached while delivery is uncertain. **Check send
status** uses the same request and cannot send a duplicate. A confirmed provider
acceptance or successfully saved schedule clears the attachment. Templates
cannot be combined with an uploaded picture. History displays privately stored
pictures through authenticated requests.

Backend contract: `docs/systems/crm-whatsapp-reply-pictures.md` in LaunchingStack.
Tests: upload-whatsapp-picture, whatsapp-reply-composer, scheduled-reply and
inbound-conversation-history. No real customer messages are used for tests.
