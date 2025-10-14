Migration scripts for Firestore

This folder contains a scaffold migration runner to import JSON datasets into Firestore.

Quick start (dry-run):

```powershell
cd scripts/migrate-to-firestore
node index.js --source ../sample-data --dry-run
```

To run against a Firestore project (non-dry-run):
- Ensure you have Application Default Credentials set (e.g., using `gcloud auth application-default login`) or set `GOOGLE_APPLICATION_CREDENTIALS` to a JSON service account key.
- Run:

```powershell
node index.js --project <your-gcp-project> --source ../sample-data --dry-run=false
```

Notes:
- This is a scaffold. For production, add batching retry/backoff and logging.
- The script removes `password` fields by default. Adjust transforms in `index.js` if needed.
