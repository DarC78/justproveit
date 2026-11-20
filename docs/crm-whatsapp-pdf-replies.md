# WhatsApp PDF replies

The shared **Upload a picture / PDF** button accepts JPEG, PNG or PDF files up to 5 MB. Uploading prepares the attachment; **Send WhatsApp** sends it with an optional caption. The same reference can be used for a scheduled reply. PDFs display their filename instead of an image preview, and appear in the timeline with an authenticated **Download PDF** control.

The server validates actual bytes and conversation ownership. Existing duplicate-send and uncertain-response protections apply. This control is separate from the Adrian-only private file vault. Backend contract: `docs/systems/crm-whatsapp-pdf-replies.md` in LaunchingStack.
