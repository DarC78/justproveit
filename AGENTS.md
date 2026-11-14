# AGENTS.md

## Email delivery: Resend only

- Never send email through the user's connected accounts, including Gmail or Outlook, using connectors, MCP tools, plugins, browser automation, or any other route.
- When the user asks to send an email, use the application's Resend delivery route and its configured sender. A request to send email does not authorize using a connected mailbox.
- If Resend is unavailable or delivery fails, report the failure and stop. Never fall back to a connected email account.
- Verify the Resend response and report the actual delivery status; do not claim an email was sent without provider evidence. Check existing delivery state before retrying to avoid duplicates.
- This rule applies to every agent and delegated task. Code delivery authorization does not authorize sending email; recipient and content must be authorized by the user.

## Deployment Rules

- Explicit user-authorized exception: SignWell delivers IPC and Private Pension authority signing invitations and their existing signing notifications after the agent reviews and confirms the named recipients. This exception is limited to those signing flows and never authorizes connected mailboxes or unrelated messages.

- Deploy through GitHub only.
- Do not deploy Azure Static Web Apps, Azure Functions, or any live service by zip/package upload or direct CLI deployment.
- For this frontend, production deployment is triggered by pushing to `main` and letting the Azure Static Web Apps GitHub workflow run.

## End-to-end development across both repositories
- Own requested development end to end, including the frontend in `C:\DevProjects\JustProveit\justproveit` and the backend in `C:\DevProjects\LaunchingStack`.
- You may read, edit, test, stage, commit, pull, push, and deliver changes in both repositories as needed for the requested task. Follow each repository's applicable instructions and GitHub deployment workflow.
- Implement and verify related frontend and backend changes directly; do not stop at a specification or hand work over to another repository's team.
- Keep development work within these two folders unless the user explicitly authorizes another location. This replaces earlier single-repository restrictions and cross-repository handoff requirements.
- Keep commits scoped to the relevant repository and requested changes, and preserve unrelated work.

## Code Delivery
- After implementing requested code changes and passing the relevant checks, commit, push, and deploy through GitHub unless the user explicitly asks otherwise.
- Verify the deployment before reporting completion. This standing authorization applies to code delivery, not publishing posts or sending messages.

## Continuous delivery for every feature

- Before developing each new feature, fetch and pull the latest sources from the repository's remote branch. Preserve unrelated local work; never discard or overwrite it while synchronizing.
- Deliver each requested feature end to end: implement it, pass the relevant checks, commit the scoped changes, and push them to the repository without waiting for a separate commit/push/release request, unless the user explicitly asks otherwise.
- Release through the repository's GitHub deployment workflow and verify the deployed feature before reporting completion. Keep delivery continuous with small, focused commits and minimal delay between validation and release.
- For work spanning both repositories, synchronize and deliver each affected repository, coordinating backend/frontend releases so dependencies are available before the feature uses them.
- This standing authorization covers source synchronization and code delivery only; it does not authorize sending emails, publishing social content, or other external messages.

## Existing-client service workflow specifications

- Before working on service stages, agent actions, client events or their resulting tasks/automations in CRM `allCustomersView`, read the latest user-maintained [International pensions client workflow specification](https://docs.google.com/document/d/1TtiqQYsh5os8J_DDI916e5L9vSAeTlwP3eWhh-nm1r8/edit).
- This Google Doc is the working business specification for existing-client international pensions delivery, separate from the WhatsApp lead-qualification funnel. It is currently a draft template: examples and `[TO DEFINE]` fields are not approved requirements or implemented behavior. Use subsequent explicit user decisions to resolve them; do not silently implement example rules.
- Fetch the current document when doing related work; do not rely on an old copied version. If access is unavailable, report the access gap rather than inventing the flow. Keep this locator current if the specification moves.
- Frontend contract: `docs/crm-all-customers-backend-spec.md`. Backend counterpart: `C:\DevProjects\LaunchingStack\docs\systems\crm-all-customers-view.md`. Keep implemented behavior documented separately from proposed workflow changes.
