# AGENTS.md

## Email delivery: Resend only

- Never send email through the user's connected accounts, including Gmail or Outlook, using connectors, MCP tools, plugins, browser automation, or any other route.
- When the user asks to send an email, use the application's Resend delivery route and its configured sender. A request to send email does not authorize using a connected mailbox.
- If Resend is unavailable or delivery fails, report the failure and stop. Never fall back to a connected email account.
- Verify the Resend response and report the actual delivery status; do not claim an email was sent without provider evidence. Check existing delivery state before retrying to avoid duplicates.
- This rule applies to every agent and delegated task. Code delivery authorization does not authorize sending email; recipient and content must be authorized by the user.

## Deployment Rules
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
