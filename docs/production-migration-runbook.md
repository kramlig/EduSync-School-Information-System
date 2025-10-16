# Production migration runbook — Firestore migration

This runbook documents the safe production migration for EduSync School Information System to Cloud Firestore. Follow the checklist strictly. Only perform the production write after you have completed the pre-checks and received approval from the on-call/owner.

## Quick summary
- Goal: migrate existing data export into Firestore using the repository migration runner `scripts/migrate-to-firestore/index.cjs`.
- Scope: full dataset (users, students, grades, lessons, schools).
- Estimated write count: users ~5000, students ~4500, grades ~9000, lessons 1, schools 1.
- Estimated time: depends on write throughput and network; plan for 30–90 minutes for large datasets; run a staged test-run first.

## Roles & Contacts
- Migration owner: Add real owner name/email here
- On-call DBA/Infra: Add contact
- App lead: Add contact
- Rollback owner: Add contact

## Preconditions (do not proceed until all are green)
- CI pipeline green (unit tests + rules tests passing).
- Production export exists in GCS (timestamped) and is validated.
- A production backup/restore test has been performed on staging previously.
- Billing and project quotas verified (Firestore writes, storage, network).
- Deployment window scheduled and communicated to stakeholders.
- Have the following credentials ready (service account with Firestore Datastore role and Storage access): path to JSON key or ADC configured in CI runner.

## Pre-migration checklist (run on production control machine)
- [ ] Run a final smoke test on staging to confirm expected app behaviour.
- [ ] Create a timestamped export of production Firestore (GCS) OR ensure a current SQL/legacy DB export exists.
  - Example (gcloud):
    ```powershell
    gcloud firestore export gs://<bucket-name>/firestore-export-$(Get-Date -Format yyyyMMdd-HHmmss) --project=<prod-project>
    ```
- [ ] Copy production export to migration-runner-accessible bucket (if needed).
- [ ] Ensure `scripts/migrate-to-firestore` and `scripts/sample-data` are up-to-date in the working repo.
- [ ] Prepare transform config and auth-map files (if you need to remap UIDs or drop fields). Place them in the workspace and test locally.
- [ ] Create a fresh checkpoint file (so migration starts from zero) and save it as `migrate-production-fresh.checkpoint.json`.
  - Example content:
    ```json
    { "grades": 0, "lessons": 0, "schools": 0, "students": 0, "users": 0 }
    ```
- [ ] Notify stakeholders and set maintenance page / feature flag to disable writes from the app during migration window.

## Migration command (PowerShell examples)
Note: run a dry-run first, then the real write with the same checkpoint file.

1) Dry-run (validate what will be written) — NO production writes
```powershell
node .\scripts\migrate-to-firestore\index.cjs --project <prod-project> --source <path-to-export-jsons> --checkpoint .\migrate-production-fresh.checkpoint.json --dry-run=true --log-file .\migrate-production-dryrun.log
```

2) Production write (real migration) — this writes to production
```powershell
node .\scripts\migrate-to-firestore\index.cjs --project <prod-project> --source <path-to-export-jsons> --checkpoint .\migrate-production-fresh.checkpoint.json --dry-run=false --log-file .\migrate-production-write.log
```

Flags to consider
- `--transform-config` — path to JSON transform config (whitelist/blacklist, field mapping)
- `--auth-map` — path to auth map JSON (oldId -> newUid)
- `--batch-size` — tune if you hit quotas (default 500); smaller = safer
- `--max-retries` / `--retry-base-ms` — tune for resiliency

## Monitoring during migration
- Watch the migration log file: `migrate-production-write.log` (it will print `Wrote doc ...` lines and update checkpoint file).
- Monitor Firestore quotas/usage in Cloud Console.
- Monitor Cloud Logging for errors and rate-limited errors.
- Have Cloud Monitoring alerting on high error rates or quota exhaustion.
- Keep an eye on application errors (frontend/backend logs) for permission or unexpected reads/writes.

## Post-migration verification
- Run smoke tests (admin counts + sample reads) against production:
```powershell
node .\scripts\smoke\run-smoke-staging.cjs --project <prod-project> --log-file .\smoke-production.log
```
- Run the Firestore rules unit tests in the emulator (to validate rules separately) and review rule audit logs in production only for immediate anomalies.
- Run the validation script (included) to compare expected counts (from the export manifest) vs Firestore counts:
```powershell
node .\scripts\migration\validate-counts.cjs --project <prod-project> --expected ./scripts/sample-data/bulk/counts.json
```
- Spot-check random records for referential integrity.

## Rollback plan (if critical failures)
- If migration introduces incorrect data at scale, restore from the production export snapshot (GCS) using `gcloud firestore import`.
  - Example:
    ```powershell
    gcloud firestore import gs://<bucket-name>/firestore-export-YYYYMMDD-HHMMSS --project=<prod-project>
    ```
  - Note: Imports replace documents and may require disabling dependent services; coordinate with app teams.
- If only a subset of docs is impacted, use the `failed_batches` outputs (the runner writes failed batch files) or re-run the migration with corrected transform configs/auth-map.

## Post-migration cleanup
- Remove or rotate any temporary service account keys used during migration.
- Re-enable app writes / lift maintenance mode.
- Schedule regular exports and monitoring dashboards for Firestore usage.

## Troubleshooting
- If you see permission errors: verify the service account has the correct roles (roles/datastore.importExportAdmin, roles/datastore.owner or appropriate Firestore Admin roles) and the project is correct.
- If writes are rate-limited: reduce `--batch-size` and add a small delay between batches (modify runner to sleep briefly between batches if needed).
- If checkpoint shows progress but console counts are low: ensure you targeted the correct project and collection path mapping.

## Appendices
- Useful commands and quick references
  - Check checkpoint:
    ```powershell
    Get-Content .\migrate-production-fresh.checkpoint.json
    ```
  - Tail migration log (PowerShell):
    ```powershell
    Get-Content .\migrate-production-write.log -Tail 200 -Wait
    ```


---

Keep this runbook updated with real contacts, the production bucket name, and any company-specific policies.
