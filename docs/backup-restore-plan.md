# Backup & Restore Plan for Firestore

This document describes a safe procedure to export production Firestore data to GCS, retain snapshots, and restore to a staging project for verification.

Goals
- Produce a point-in-time backup export of production Firestore to GCS.
- Verify integrity by restoring the export into a staging Firestore project.
- Provide runnable scripts and a verification helper.

Preconditions and assumptions
- You have the `gcloud` SDK installed and authenticated with an account that has the required permissions:
  - `roles/datastore.importExportAdmin` or appropriate permissions to run `gcloud firestore export` and `gcloud firestore import`.
- A GCS bucket exists for storing exports (e.g., `gs://edusync-firestore-backups`).
- Production data is in the `edusync-sis` project and staging project id is `edusync-sis-staging` (replace where necessary).

High-level steps
1. Create a GCS bucket for backups (if not already present) and set lifecycle rules to retain exports for your retention window.
2. Run a Firestore export from the production project into a timestamped folder in the backup bucket.
3. Copy or grant read access to the staging project service account (or perform the import under an account that has staging import permissions).
4. Import the export into a staging Firestore project.
5. Run verification scripts to compare document counts and sample documents on staging vs. the original export manifest.

Scripted helpers (in `scripts/backup/`)
- `export-firestore.ps1` — runs a `gcloud firestore export` to a timestamped GCS path.
- `import-firestore.ps1` — imports from a GCS folder to a target project.
- `verify-restore.js` — Node script to count documents in specified collections in a target project and compare to expected counts.

Retention and safety
- Keep multiple timestamped snapshots and use GCS lifecycle rules to expire old snapshots after your retention period.
- Before performing a production export or an import, notify stakeholders and record the export path used.
- Always import into an isolated staging project — never import production exports into a production project.

Rollback strategy
- If a migration or restore causes issues, restore the production project from the latest export (follow Import steps and then switch traffic or rollback app config as needed).

Next steps
- Review and edit the scripts in `scripts/backup/` for your exact bucket names and project ids.
- Run an export on a test schedule to ensure permissions and network egress are correct.
- I'll add the helper scripts now; I will not run any export/import without your explicit confirmation.

Examples

Export production Firestore to GCS (PowerShell):
```powershell
cd scripts/backup
.\export-firestore.ps1 -project edusync-sis -bucket gs://edusync-firestore-backups -prefix prod-export
```

Import an export into staging (PowerShell):
```powershell
cd scripts/backup
.\import-firestore.ps1 -project edusync-sis-staging -gcsPath gs://edusync-firestore-backups/prod-export-20251014-021000
```

Verify restored collections (Node):
```powershell
cd scripts/backup
node verify-restore.js --project edusync-sis-staging --collections grades,students,users,schools,lessons
```
