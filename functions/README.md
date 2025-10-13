# Firebase Functions for EduSync

This folder contains a small Firebase Cloud Function that proxies requests to the Gemini API so the API key remains server-side.

Setup

1. Install dependencies inside the `functions` folder:

```powershell
cd functions
npm install
```

2. Set your Gemini API key in Firebase Functions config (do not commit secrets):

```powershell
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
```

3. Deploy functions:

```powershell
firebase deploy --only functions:generateLessonPlan
```

4. Test the endpoint (example using curl):

```powershell
curl -X POST "https://us-central1-YOUR_PROJECT.cloudfunctions.net/generateLessonPlan" -H "Content-Type: application/json" -d '{"topic":"Local ecosystems","gradeLevel":4,"objectives":"Students will identify components of ecosystems."}'
```

Notes
- Keep the API key in `functions` config. The front-end should call this endpoint instead of directly calling Gemini.
- If using Firebase Hosting, you can add a rewrite to proxy `/api/*` routes to the function.
