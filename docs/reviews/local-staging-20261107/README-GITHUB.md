# Isolated staging review snapshot

This branch preserves the tested November7 local staging application snapshot. It is based on the exact commits in reports/revisions-and-modifications.json; later GitHub main changes have not been merged or overwritten. Application changes, staging-only tools and optional runtime configuration are separate commits. Runtime credentials, settings, customer records, volumes and raw logs are excluded.

The adjacent README.md preserves the original archive-transfer instructions; patch/configuration files named there are supplied in the separate local review archive. This Git branch already contains those code layers. Do not use its staging-only layers in production. No PR is opened because the frontend PR workflow can deploy to Azure. No main branch update or deployment is authorized here.

The four manual acceptances remain historical user feedback. Dispatch hydration was subsequently verified automatically. Full test counts and scope, including carried-forward backend/database evidence, are in REGRESSION-REPORT.md. Existing security/operational/proprietary vendor acceptance remains in RELEASE-BLOCKERS.md.
