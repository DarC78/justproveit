# Chatbot handoffs in CRM Attention

The section “Alte lead-uri care ne-au contactat” also lists unresolved, unclaimed chatbot escalations. The backend returns the optional field `chatbotHandoff: {reason, requestedAtUtc, summary}` on these rows. Only rows carrying this field receive `bg-red-50` and the label “De preluat de la chatbot”; normal incoming leads retain their existing appearance. The handoff summary is rendered as plain text.

The backend includes handoffs even when the bot has acknowledged the transfer. It returns one row per contact in this section, avoiding duplicates in returned, overdue and VA_CUMPARA sections, and preserves existing-customer exclusions. Claimed/resolved handoffs and cases handled by a subsequent human interaction or CRM resolution no longer require pickup. The selected period still applies.

Existing Reply, Solve, assignment, history and Book a Call actions remain available. Reading Attention does not claim a handoff or send messages. The separate monitoring page can still claim a case and stop automation. The field is optional to support a coordinated backend/frontend rollout.

Backend contract: `docs/engineering/systems/crm-attention.md` in LaunchingStack. Regression coverage: `tests/crm-attention.test.cjs` and the backend's cross-provider `crmAttention.database.test.js`.
