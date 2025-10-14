<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18ZbY_sg55ZNe0pIpJ6BAr1mgcmsuwFvp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firestore: emulator, seed and rules

Local development and tests use the Firestore emulator. Quick commands:

1. Start emulator and seed (single command):
```
# Start the emulator and run the seed script (emulator shuts down afterwards)
npx firebase emulators:exec --only firestore -- node ./scripts/seed-firestore.cjs
```

2. Alternatively, start the emulator in a separate window and seed manually:
```
# In one terminal (leave open):
npx firebase emulators:start --only firestore

# In another terminal:
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8085'
node ./scripts/seed-firestore.cjs
```

3. Run the Firestore rules unit tests locally:
```
npm ci
node ./scripts/test-firestore-rules.cjs
```

4. Deploy rules and indexes to Firebase (requires Firebase CLI + project access):
```
npx firebase deploy --only firestore --project=edusync-sis
```

CI: A GitHub Actions workflow (`.github/workflows/firestore-rules.yml`) runs the rules tests on PRs and will auto-deploy rules/indexes when changes are merged to `main`. To allow deploys, add the `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_TOKEN` secrets to the repository.

ci: trigger workflow - 2025-10-14T08:42:41.8440505+08:00

ci: re-run workflow - 2025-10-14T08:52:04.6215515+08:00
