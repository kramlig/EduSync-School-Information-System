Migration scripts for Firestore

This folder contains a scaffold migration runner to import JSON datasets into Firestore.

Main entrypoint: `index.cjs` (CommonJS) — use Node to run the runner. The script supports a safe dry-run mode, configurable transforms, auth-id remapping, retries/backoff, checkpoints, and logging.

Quick start (dry-run):

```powershell
cd scripts/migrate-to-firestore
node index.cjs --source ../sample-data --dry-run
```

Run against a Firestore project (non-dry-run):

- Ensure Application Default Credentials (ADC) are available, for example:
	- `gcloud auth application-default login`
	- or set `GOOGLE_APPLICATION_CREDENTIALS` to point at a service account JSON with Firestore write permissions.

Example (staging project):

```powershell
node index.cjs --project <staging-project-id> --source ../sample-data --dry-run=false \
	--transform-config ./transform-config.sample.json \
	--auth-map ./auth-map.sample.json \
	--log-file ./migrate.log
```

Important flags and files:

- `--source <path>`: directory containing collection JSON files (each file should be an array of documents). Example: `../sample-data`.
- `--project <gcp-project>`: target Firestore project id (required for non-dry-run writes).
- `--dry-run` / `--dry-run=false`: default is safe to run as a dry-run; set to `--dry-run=false` to perform real writes.
- `--batch-size <n>`: number of documents per batch write (defaults to 500).
- `--checkpoint <file>`: path to checkpoint file (default: `./migrate.checkpoint.json`) used to resume progress.
- `--transform-config <file>`: optional JSON file to configure whitelist/blacklist and field mappings (see `transform-config.sample.json`).
- `--auth-map <file>`: optional JSON file to remap legacy user IDs to Firebase Auth UIDs (see `auth-map.sample.json`).
- `--max-retries <n>` and `--retry-base-ms <ms>`: retry/backoff tuning (defaults: 5, 500).
- `--log-file <file>`: append logs to this file (default: `./migrate.log`).

Behavior and safety features:

- Dry-run mode will report how many documents would be written per collection without performing any writes.
- The runner checkpoints progress to `migrate.checkpoint.json` so runs can be resumed after interruption.
- Writes use retries with exponential backoff and jitter. Documents that ultimately fail are written to `./failed_batches/<collection>-<timestamp>.json` for inspection.
- By default the runner strips obvious sensitive fields such as `password`. Use `--transform-config` to customise field whitelists/blacklists and to map/rename fields.
- Use `--auth-map` to translate legacy user IDs to Firebase Authentication UIDs when migrating user references.

Files provided in this folder:

- `index.cjs` — migration runner (CommonJS).
- `transform-config.sample.json` — example transform configuration (whitelist/blacklist/mapFields).
- `auth-map.sample.json` — example mapping old ids -> firebase auth uids.
- `../sample-data/*.json` — sample dataset used for dry-run/testing.

Recommended next steps before production:

1. Run many dry-runs with representative datasets.
2. Validate document shapes and security rules against a staging Firestore project.
3. Backup existing production data and schedule a maintenance window for any final cutover.

If you need, I can re-run a controlled non-dry-run migration against a staging project once you provide the project id and ADC or a service-account key.
