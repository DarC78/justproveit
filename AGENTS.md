# AGENTS.md

## Deployment Rules
- Deploy through GitHub only.
- Do not deploy Azure Static Web Apps, Azure Functions, or any live service by zip/package upload or direct CLI deployment.
- For this frontend, production deployment is triggered by pushing to `main` and letting the Azure Static Web Apps GitHub workflow run.

## Repository Boundary Rules
- Work only in this repository.
- Do not edit, stage, commit, pull, push, or otherwise operate inside nested or sibling repositories.
- If a change is needed in another repository, write a spec document in this repository describing the required change, rationale, affected files or APIs, and acceptance criteria.
- The owner will pass that spec to the other repository's team for implementation.
