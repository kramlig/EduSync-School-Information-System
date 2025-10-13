const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const sm = new SecretManagerServiceClient();

let _cachedGeminiKey = null;

async function getGeminiKey() {
  // Priority: 1) environment variable (process.env.GEMINI_KEY) 2) Secret Manager secret named 'gemini-key' 3) legacy functions.config().gemini.key
  if (_cachedGeminiKey) return _cachedGeminiKey;
  if (process.env.GEMINI_KEY) {
    _cachedGeminiKey = process.env.GEMINI_KEY;
    return _cachedGeminiKey;
  }

  // Try Secret Manager. Expect secret name: projects/<PROJECT_NUMBER>/secrets/gemini-key/versions/latest
  try {
  // Determine project id robustly. Cloud Functions typically sets GCLOUD_PROJECT or GCP_PROJECT.
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || (admin.app && admin.app().options && admin.app().options.projectId) || process.env.GCP_PROJECT_NUMBER || process.env.GCLOUD_PROJECT_NUMBER;
  const secretName = `projects/${projectId}/secrets/gemini-key/versions/latest`;
    const [accessResponse] = await sm.accessSecretVersion({ name: secretName });
    const payload = accessResponse.payload && accessResponse.payload.data ? accessResponse.payload.data.toString('utf8') : null;
    if (payload) {
      _cachedGeminiKey = payload.trim();
      return _cachedGeminiKey;
    }
  } catch (smErr) {
    // secret might not exist or access denied; we'll fall back to functions.config()
    console.debug('Secret Manager lookup failed (will try functions.config()):', smErr && smErr.message);
  }

  // Fallback to legacy functions.config
  try {
    const cfg = functions.config();
    const key = cfg?.gemini?.key;
    if (key) {
      _cachedGeminiKey = key;
      return _cachedGeminiKey;
    }
  } catch (e) {
    // ignore
  }
  // No API key found in env/Secret Manager/functions.config(). Return null so callers
  // can choose to fall back to Application Default Credentials (ADC) when available.
  return null;
}

// Lazy-load the genai client only when a request arrives.
async function createGenAIClient() {
  let key = null;
  try {
    key = await getGeminiKey();
  } catch (err) {
    console.debug('getGeminiKey threw, will attempt ADC fallback:', err && err.message ? err.message : err);
  }

  const mod = await import('@google/genai');

  // If we found an API key, use it. Otherwise, attempt to use ADC by constructing
  // the client without an apiKey. On GCP, the function will run with the runtime
  // service account's credentials (ADC).
  let client;
  if (key) {
    client = new mod.GoogleGenAI({ apiKey: key });
  } else {
    console.info('No Gemini API key found; using Application Default Credentials (ADC). Ensure the function service account has permission to call the Generative Language API.');
    client = new mod.GoogleGenAI();
  }

  return { client, mod };
}

exports.generateLessonPlan = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    // Log only the keys of the incoming body to help debug malformed JSON without printing secrets
    console.debug('generateLessonPlan request body keys:', Object.keys(req.body || {}));
    const { topic, gradeLevel, objectives } = req.body || {};
    if (!topic || !gradeLevel || !objectives) return res.status(400).json({ error: 'Missing parameters', required: ['topic','gradeLevel','objectives'] });

    try {
  const pair = await createGenAIClient();
  const ai = pair.client;
  const mod = pair.mod;
      const prompt = `You are an expert instructional designer creating a lesson plan for an elementary school teacher.\nTopic: ${topic}\nGrade Level: ${gradeLevel}\nObjectives: ${objectives}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: mod.Type.OBJECT,
            properties: {
              title: { type: mod.Type.STRING },
              objectives: { type: mod.Type.ARRAY, items: { type: mod.Type.STRING } },
              activities: { type: mod.Type.ARRAY, items: { type: mod.Type.STRING } },
              materials: { type: mod.Type.ARRAY, items: { type: mod.Type.STRING } },
              assessment: { type: mod.Type.ARRAY, items: { type: mod.Type.STRING } }
            },
            required: ['title','objectives','activities','materials','assessment']
          }
        }
      });

      // The library returns text which should be JSON in this case. Guard parse errors.
      try {
        const json = JSON.parse(response.text);
        res.json(json);
      } catch (parseErr) {
        console.error('Failed to parse Gemini response as JSON', { parseErr: parseErr.message, responseTextSample: (response.text || '').slice(0, 1000) });
        return res.status(502).json({ error: 'Invalid response from Generative API', details: parseErr.message });
      }
    } catch (err) {
      console.error('generateLessonPlan error:', err && err.message ? err.message : err);
      // If the underlying client returned a permission/API key error, include the message to help debug
      const message = err && err.message ? err.message : 'Internal error';
      // Prefer structured JSON error responses for easier machine parsing during tests.
      if (err instanceof functions.https.HttpsError) {
        res.status(400).json({ error: message });
      } else {
        res.status(500).json({ error: 'Internal error', details: message });
      }
    }
  });
});

exports.generateStudentReport = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { prompt, studentId } = req.body || {};
    if (!prompt || !studentId) return res.status(400).send('Missing parameters');

    try {
      const pair = await createGenAIClient();
      const ai = pair.client;
      // Forward prompt to Gemini
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (err) {
      console.error('generateStudentReport error:', err);
      if (err instanceof functions.https.HttpsError) {
        res.status(400).send(err.message);
      } else {
        res.status(500).send('Internal error');
      }
    }
  });
});
