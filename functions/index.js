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

// --- Protected utilities: seed and summarize ---
function getSeedToken() {
  try {
    const cfg = functions.config();
    const token = cfg?.seed?.token;
    return token || null;
  } catch {
    return null;
  }
}

function checkAuth(req) {
  const configured = getSeedToken();
  if (!configured) return false; // require explicit token to be set
  const header = (req.headers['authorization'] || '').toString();
  const bearer = header.startsWith('Bearer ') ? header.substring(7) : null;
  const query = req.query && (req.query.token || req.query.seedToken);
  return bearer === configured || query === configured;
}

// Upsert default core values, optionally backfill missing coreValueGrades for students
exports.seedCoreValues = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

    const db = admin.firestore();
    const { backfillGrades = false, dryRun = false, randomizeMarks = false } = req.body || {};

    const defaultCoreValues = [
      { id: 'cv_makadiyos', name: 'Maka-Diyos', behaviors: [
        'Expresses spiritual beliefs with respect for others',
        'Shows respect for religious beliefs and traditions',
        'Participates in spiritual or reflective activities',
      ]},
      { id: 'cv_makatao', name: 'Maka-tao', behaviors: [
        'Demonstrates empathy and compassion',
        'Shows respect and courtesy towards others',
        'Observes fairness and justice in actions',
      ]},
      { id: 'cv_makakalikasan', name: 'Makakalikasan', behaviors: [
        'Cares for the environment and school surroundings',
        'Practices proper waste segregation and disposal',
        'Conserves water, energy, and resources',
      ]},
      { id: 'cv_makabansa', name: 'Makabansa', behaviors: [
        'Shows love of country and community',
        'Respects the flag and national symbols',
        'Upholds school rules and the law',
      ]},
    ];

    const result = { upsertedCoreValues: 0, existedCoreValues: 0, createdGrades: 0 };
    try {
      // Upsert core values
      if (!dryRun) {
        const batch = db.batch();
        for (const cv of defaultCoreValues) {
          const ref = db.collection('coreValues').doc(cv.id);
          batch.set(ref, cv, { merge: true });
        }
        await batch.commit();
      }
      // Count which existed vs upserted (best-effort)
      const snap = await db.collection('coreValues').get();
      const ids = new Set(snap.docs.map(d => d.id));
      for (const cv of defaultCoreValues) {
        if (ids.has(cv.id)) result.existedCoreValues++; else result.upsertedCoreValues++;
      }

      if (backfillGrades && !dryRun) {
        // Load existing grade IDs once to avoid per-doc reads
        const existingSnap = await db.collection('coreValueGrades').select().get();
        const existingIds = new Set(existingSnap.docs.map(d => d.id));

        const studentsSnap = await db.collection('students').select().get();
        if (!studentsSnap.empty) {
          const students = studentsSnap.docs.map(d => ({ id: d.id }));
          const chunkSize = 400;

          // Helper to pick a random mark (skewed towards AO/SO as in local seeder)
          const pickMark = () => {
            const r = Math.random();
            if (r < 0.45) return 'AO';
            if (r < 0.8) return 'SO';
            if (r < 0.95) return 'RO';
            return 'NO';
          };

          for (let i = 0; i < students.length; i += chunkSize) {
            const batch = db.batch();
            const slice = students.slice(i, i + chunkSize);
            let writesInBatch = 0;
            for (const s of slice) {
              for (const cv of defaultCoreValues) {
                const gradeId = `cvg_${s.id}_${cv.id}`;
                if (existingIds.has(gradeId)) continue; // skip existing
                const gref = db.collection('coreValueGrades').doc(gradeId);
                const base = { id: gradeId, studentId: s.id, coreValueId: cv.id };
                const record = randomizeMarks
                  ? {
                      ...base,
                      q1: Object.fromEntries(cv.behaviors.map(b => [b, pickMark()])),
                      q2: Object.fromEntries(cv.behaviors.map(b => [b, pickMark()])),
                      q3: Object.fromEntries(cv.behaviors.map(b => [b, pickMark()])),
                      q4: Object.fromEntries(cv.behaviors.map(b => [b, pickMark()])),
                    }
                  : { ...base, q1: {}, q2: {}, q3: {}, q4: {} };
                batch.set(gref, record, { merge: false });
                result.createdGrades++;
                writesInBatch++;
              }
            }
            if (writesInBatch > 0) {
              await batch.commit();
            }
          }
        }
      }

      return res.json({ ok: true, result });
    } catch (e) {
      console.error('seedCoreValues error:', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'Internal error', details: e && e.message ? e.message : e });
    }
  });
});

// Read-only summary for quick verification in prod
exports.dataSummary = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const db = admin.firestore();
      const cols = ['teachers','parents','sections','students','classSchedules','coreValues','coreValueGrades','announcements'];
      const counts = {};
      for (const c of cols) {
        const snap = await db.collection(c).limit(1_000_000).get(); // simple count (free tier ok for now)
        counts[c] = snap.size;
      }
      res.json({ ok: true, counts });
    } catch (e) {
      console.error('dataSummary error:', e && e.message ? e.message : e);
      res.status(500).json({ error: 'Internal error' });
    }
  });
});

// --- Protected, idempotent seeding for Core Values (+ optional grades) ---
exports.seedCoreValuesSafe = functions.https.onRequest(async (req, res) => {
  // CORS with preflight
  return cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).send('');

      // Simple token-based guard; token can be provided via header or query/body
      const provided = req.get('x-seed-token') || req.query.token || (req.body && req.body.token);
      const expected = (functions.config() && functions.config().seed && functions.config().seed.token) || process.env.SEED_TOKEN || null;
      if (!expected) {
        return res.status(500).json({ error: 'Seed token not configured. Set functions config: seed.token=<value>' });
      }
      if (!provided || String(provided) !== String(expected)) {
        return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
      }

      const mode = (req.query.mode || req.body?.mode || 'both').toString(); // 'coreValuesOnly' | 'gradesOnly' | 'both'
      const limit = Math.max(0, parseInt((req.query.limit || req.body?.limit || '0').toString(), 10)); // 0 => all
      const dryRun = String(req.query.dryRun || req.body?.dryRun || 'false').toLowerCase() === 'true';

      const db = admin.firestore();

      const defaultCoreValues = [
        { id: 'cv_makadiyos', name: 'Maka-Diyos', behaviors: [
          'Expresses spiritual beliefs with respect for others',
          'Shows respect for religious beliefs and traditions',
          'Participates in spiritual or reflective activities',
        ]},
        { id: 'cv_makatao', name: 'Maka-tao', behaviors: [
          'Demonstrates empathy and compassion',
          'Shows respect and courtesy towards others',
          'Observes fairness and justice in actions',
        ]},
        { id: 'cv_makakalikasan', name: 'Makakalikasan', behaviors: [
          'Cares for the environment and school surroundings',
          'Practices proper waste segregation and disposal',
          'Conserves water, energy, and resources',
        ]},
        { id: 'cv_makabansa', name: 'Makabansa', behaviors: [
          'Shows love of country and community',
          'Respects the flag and national symbols',
          'Upholds school rules and the law',
        ]},
      ];

      const result = { upsertedCoreValues: 0, skippedCoreValues: 0, createdGrades: 0, skippedGrades: 0, inspectedStudents: 0 };

      // Upsert core values (non-destructive)
      if (mode !== 'gradesOnly') {
        if (!dryRun) {
          const batch = db.batch();
          for (const cv of defaultCoreValues) {
            const ref = db.collection('coreValues').doc(cv.id);
            batch.set(ref, cv, { merge: true });
          }
          await batch.commit();
        }
        result.upsertedCoreValues = defaultCoreValues.length;
      }

      // Optionally seed missing core value grades (idempotent; only creates docs that do not exist)
      if (mode !== 'coreValuesOnly') {
        const studentsRef = db.collection('students');
        const studentsSnap = await studentsRef.get();
        const allStudents = studentsSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
        const studentsToProcess = limit > 0 ? allStudents.slice(0, limit) : allStudents;
        const MARKS = ['AO','SO','RO','NO'];
        const pickMark = () => {
          const r = Math.random();
          if (r < 0.45) return 'AO';
          if (r < 0.8) return 'SO';
          if (r < 0.95) return 'RO';
          return 'NO';
        };

        // Pre-fetch all coreValues from DB to ensure we have current set
        const cvSnap = await db.collection('coreValues').get();
        const cvs = cvSnap.empty ? defaultCoreValues : cvSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));

        result.inspectedStudents = studentsToProcess.length;
        const chunkSize = 300;
        for (let i = 0; i < studentsToProcess.length; i += chunkSize) {
          const chunk = studentsToProcess.slice(i, i + chunkSize);
          const batch = db.batch();

          for (const s of chunk) {
            for (const cv of cvs) {
              const id = `cvg_${s.id}_${cv.id}`;
              const ref = db.collection('coreValueGrades').doc(id);
              const existing = await ref.get();
              if (existing.exists) { result.skippedGrades++; continue; }
              if (dryRun) { result.createdGrades++; continue; }
              const rec = { id, studentId: s.id, coreValueId: cv.id, q1: {}, q2: {}, q3: {}, q4: {} };
              for (const b of (cv.behaviors || [])) {
                rec.q1[b] = pickMark();
                rec.q2[b] = pickMark();
                rec.q3[b] = pickMark();
                rec.q4[b] = pickMark();
              }
              batch.set(ref, rec, { merge: false }); // create-only semantics since we checked exists
              result.createdGrades++;
            }
          }
          if (!dryRun) await batch.commit();
        }
      }

      return res.json({ ok: true, mode, limit, dryRun, ...result });
    } catch (err) {
      console.error('seedCoreValuesSafe error:', err && err.stack ? err.stack : err);
      return res.status(500).json({ error: 'Internal error', details: err && err.message ? err.message : String(err) });
    }
  });
});

// --- Protected seeding for Announcements ---
exports.seedAnnouncements = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

      const db = admin.firestore();
      const body = req.body || {};
      const { dryRun = false, clearExisting = false, count = 8, authors = [], startDaysAgo = 30, endDaysAhead = 30, targets = ['all','staff','parents','students'] } = body;

      // Helper: get random element
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
      const N = clamp(parseInt(count, 10) || 8, 1, 100);

      // Ensure we have authors; fallback to teachers collection if not provided.
      let authorIds = Array.isArray(authors) ? authors.filter(Boolean) : [];
      if (authorIds.length === 0) {
        const tSnap = await db.collection('teachers').select('id').get();
        authorIds = tSnap.docs.map(d => d.id);
        if (authorIds.length === 0) {
          // Fallback to a generic admin id
          authorIds = ['admin-user'];
        }
      }

      const sampleTitles = [
        'School Opening Advisory',
        'Parent-Teacher Conference Schedule',
        'Intramurals Week Announcement',
        'DepEd Brigada Eskwela',
        'Power Interruption Notice',
        'Earthquake Drill Reminder',
        'Submission of Requirements',
        'Recognition Day Program',
        'Campus Clean-up Drive',
      ];
      const sampleBodies = [
        'Please be informed of the following details. Your cooperation is appreciated.',
        'We encourage everyone to participate. Thank you for your support.',
        'Safety protocols will be strictly implemented. Kindly arrive on time.',
        'All students are required to wear proper school attire.',
        'For inquiries, please coordinate with your class adviser.',
        'Further updates will be posted in this channel.',
      ];

      const makeDate = () => {
        const now = new Date();
        const start = -Math.abs(parseInt(startDaysAgo, 10) || 30);
        const end = Math.abs(parseInt(endDaysAhead, 10) || 30);
        const offset = Math.floor(Math.random() * (end - start + 1)) + start; // inclusive range
        const d = new Date(now);
        d.setDate(now.getDate() + offset);
        return d.toISOString().slice(0, 10);
      };

      const gen = (i) => ({
        id: undefined, // let Firestore auto id; client can still read back
        title: pick(sampleTitles) + (Math.random() < 0.3 ? ` #${Math.floor(Math.random()*100)}` : ''),
        content: pick(sampleBodies) + '\n\n' + pick(sampleBodies),
        authorId: pick(authorIds),
        date: makeDate(),
        target: pick(Array.isArray(targets) && targets.length ? targets : ['all','staff','parents','students']),
      });

      if (clearExisting && !dryRun) {
        const snap = await db.collection('announcements').get();
        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        if (!snap.empty) await batch.commit();
      }

      const toCreate = Array.from({ length: N }, (_, i) => gen(i));
      if (dryRun) {
        return res.json({ ok: true, wouldCreate: toCreate.length, sample: toCreate.slice(0, 3) });
      }

      // Batched writes (chunks of 400)
      const chunkSize = 400;
      for (let i = 0; i < toCreate.length; i += chunkSize) {
        const batch = db.batch();
        const chunk = toCreate.slice(i, i + chunkSize);
        for (const a of chunk) {
          const ref = db.collection('announcements').doc();
          batch.set(ref, { ...a, id: ref.id }); // store id field too for consistency with client
        }
        await batch.commit();
      }

      const countSnap = await db.collection('announcements').get();
      return res.json({ ok: true, created: toCreate.length, total: countSnap.size });
    } catch (e) {
      console.error('seedAnnouncements error:', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'Internal error' });
    }
  });
});
