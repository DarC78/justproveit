# AGENTS.md

## Deployment Rules
- Deploy through GitHub only.
- Do not deploy Azure Static Web Apps, Azure Functions, or any live service by zip/package upload or direct CLI deployment.
- For this frontend, production deployment is triggered by pushing to `main` and letting the Azure Static Web Apps GitHub workflow run.
