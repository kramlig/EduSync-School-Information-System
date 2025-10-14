# Firestore Migration Plan

Status: draft

This document defines the migration plan to move the EduSync SIS data model to Cloud Firestore, including collection layout, indexes, migration contract, data transforms, risk/rollback strategy, and run instructions.

## Goals
- Migrate all application data to Cloud Firestore with minimal downtime.
- Preserve data integrity and PII protection (remove plaintext passwords).
- Ensure security rules and indexes are correct and tested before production migration.
- Provide idempotent, resumable migration scripts and a tested rollback plan.

## High-level decisions
- Use Cloud Firestore (Native mode) with per-school data modeled under `schools/{schoolId}/...` where appropriate.
- Keep `users` as a top-level collection keyed by Firebase Auth uid. `users` store profile data and role.
- For high-cardinality, query-heavy collections (e.g., `grades`), consider top-level collections with `schoolId` and `collectionGroup` queries. Current rules allow `schools/{schoolId}/{collection}/{docId}` and collectionGroup indexes are included.

## Canonical collection mapping (recommended)
- `users/{uid}`
  - Fields: { displayName, email, role, schoolId, guardianIds? }
  - Note: do NOT migrate plaintext `password` fields — use Firebase Authentication and link uid.

- `schools/{schoolId}`
  - Fields: { name, createdAt, settings? (see types.ts) }
  - Subcollections:
    - `schools/{schoolId}/courses/{courseId}`
      - Fields: { title, teacherId, gradeLevel, term }
    - `schools/{schoolId}/lessons/{lessonId}`
      - Fields: { creatorId, title, objectives, activities, materials, assessment, createdAt, gradeLevel }
    - `schools/{schoolId}/students/{studentId}` or top-level `students/{id}` with `schoolId`
      - Fields align to `types.ts` `Student` interface
    - `schools/{schoolId}/sections/{sectionId}`
    - `schools/{schoolId}/assignments/{assignmentId}`
    - `schools/{schoolId}/grades/{gradeId}`
      - Fields align to `types.ts` `Grade` interface

- Alternative (when global queries are frequent):
  - `students/{studentId}` (top-level) with field `schoolId`
  - `grades/{gradeId}` top-level, use `schoolId`, `assignmentId`, `date` and collectionGroup indexes

## Indexes (proposed)
Re-use the existing `firestore.indexes.json` and add where necessary:
- `collectionGroup: lessons` -> gradeLevel ASC, createdAt DESC (existing)
- `collectionGroup: courses` -> teacherId ASC, term ASC (existing)
- `collectionGroup: students` -> lastName ASC, firstName ASC (existing)
- `collectionGroup: grades` -> assignmentId ASC, date DESC (existing)

Add if needed:
- `collectionGroup: assignments` -> dueDate ASC, sectionId ASC
- `collectionGroup: grades` -> studentId ASC, learningAreaId ASC

## Data transforms & rules
- Remove/omit fields:
  - `password` fields in demo/local IndexedDB should NOT be migrated.
  - Any local-only demo flags should be dropped.
- Map auth-linked users:
  - If source uses `id` strings for users and you have Firebase Auth, map records to Auth uids and set `users/{uid}` accordingly.
- ID strategy:
  - Use existing stable ids where present (e.g., student IDs from system) to maintain references.
  - If converting from auto-increment or relational PKs, generate stable uuids and record mapping table for crosswalk.
- Referential integrity:
  - Write parent docs (e.g., `schools/{schoolId}`) first, then child collections to avoid dangling references.

## Migration contract (script interface)
Command-line flags:
- `--project <GCP_PROJECT>` Firestore target project (staging/prod)
- `--source <path|gcs://bucket/prefix>` directory or GCS export to read from (JSON exports or structured files)
- `--dry-run` print counts and sample documents without writing
- `--batch-size` default 500
- `--resume-file <path>` checkpoint file to resume partial runs
- `--transform-config <path>` JSON file that can instruct per-collection transforms (e.g., fields to drop)

Input shapes:
- Source: JSON lines or arrays per collection with object fields matching `types.ts` where possible.
- Output: documents written to Firestore with the mapped fields.

Success criteria (per collection):
- Document counts match source counts (after allowed drops for sensitive fields).
- Referential fields that reference other objects (studentId, assignmentId) are preserved or translated via mapping table.

Error handling:
- Retry transient errors with exponential backoff.
- On repeated failures for a batch, write the failed batch to `failed_batches/<collection>-<batch>-YYYYMMDD.json` and continue.

## Rollback strategy
- Because Firestore writes are destructive, create backups first (see Backup section).
- Rollback options:
  - Restore from a pre-migration Firestore export to a staging project and switch traffic back after verification.
  - If using feature flags, disable the Firestore-enabled code paths and revert to previous datastore until restored.

## Backup & Snapshot (pre-migration)
- Run:

  gcloud firestore export gs://<BUCKET>/backups/pre-migration-YYYYMMDD --project=<PROJECT>

- Verify export completed and export size. Keep at least two copies in separate GCS buckets if possible.

## Staging run checklist
1. Create staging project or staging Firestore instance.
2. Run migration scripts with `--dry-run` and validate counts.
3. Run migration to staging (non-dry-run).
4. Run unit tests and smoke tests (UI + rules-unit tests). CI already runs rules tests — re-run them against staging populated dataset.
5. Validate PII removal and auth mapping.

## Production run checklist
1. Schedule maintenance window and notify stakeholders.
2. Take production export snapshot (see Backup & Snapshot).
3. Run migration scripts against production with `--resume-file` disabled (fresh run). Monitor progress and errors.
4. Run smoke tests and spot checks.
5. If OK, flip feature flag or switch clients to read from Firestore.
6. Keep export snapshot for the retention window.

## Operational considerations
- Permissions: ensure migration runner has roles: `roles/datastore.importExportAdmin` for exports, `roles/datastore.user` or Firestore write rights, and access to Secret Manager if necessary.
- Service Account: prefer ADC or Secret Manager rather than storing SA keys in the repo.
- Monitoring: set alerts for Firestore write errors, storage size, and index failures.

## Next deliverables (I will implement next)
- `scripts/migrate-to-firestore/` scaffold with:
  - `index.js` runner that reads JSON exports and writes to Firestore in batches, supports dry-run and resume.
  - `README.md` with usage, permissions, and best practices.
- A test dataset generator (using `live_bundle.js` logic) to produce a realistic dataset for staging migration tests.

---

If this looks good I will scaffold `scripts/migrate-to-firestore/` now (dry-run capable), commit it, and then you can run it pointing to a staging project. If you'd like changes to the collection mapping before I scaffold, tell me which collections you want top-level vs subcollection.
