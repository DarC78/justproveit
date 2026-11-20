# Lead private files and notes

The shared `ContactActions` and `LeadPipelineRowActions` include **Private files & notes**. All CRM users can upload supported files (10 MB maximum) and append notes (10,000 characters maximum). Only the authenticated Adrian account can consult stored notes/files and download attachments. The server supplies these capabilities; client-side email checks do not authorize access.

Each saved note/file has a server timestamp and authenticated author. The modal shows UK time, newest entries first, with older-entry pagination. Saves retain their request UUID when retrying a failed request. Private content is cleared on close, hidden tab, lead/token change and after five minutes; nothing is persisted in localStorage. Downloads use authenticated fetch and a short-lived local object URL, never public storage links.

The workspace is separate from normal lead history and from the existing imported private-data password feature. Backend contract: `C:\DevProjects\LaunchingStack\docs\systems\crm-lead-private-workspace.md`.
