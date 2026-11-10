# WhatsApp history and reply channel

History labels distinguish WhatsApp Mediatel (API/MCIC) and WhatsApp Agenti (linked Linux gateway), with Client/ProveIt direction retained. The shared lead/booking composer loads authenticated reply-routing context and shows its channel/availability. The backend rechecks latest inbound messages on Send.

Latest Mediatel inbound under 24 hours uses Mediatel; latest Agenti inbound uses Agenti; expired/no Mediatel customer window uses Agenti. Agenti requires its explicit backend/Linux activation and uses free text. Templates remain Mediatel-only. First expired-window contact prepends the authenticated agent name and UK-time greeting.

Uncertain/queued requests retain the same request ID and lock the draft until checked. Queued never means delivered. No timeout or status check switches transports. The gateway status is shown in the same history.

Linux activation handover: LaunchingStack/docs/whatsapp-agent-replies-linux-handover.md. Cloud UI deployment does not imply the gateway is enabled. No service-case stages or chatbot automations are changed.
