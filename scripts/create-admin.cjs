#!/usr/bin/env node
/**
 * Creates (or upserts) an admin teacher document and a users collection mirror.
 * Usage: node scripts/create-admin.cjs --email admin@school.edu --name "System Admin" --role admin
 *
 * Note: firebase-admin v13+ is ESM-only. This CJS script uses dynamic import()
 * to load ESM modules without changing the file extension.
 */
const path = require('path');
const fs = require('fs');

// Simple arg parse
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k,v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
  return acc;
}, {});

const email = args.email || 'admin@school.edu';
const name = args.name || 'System Admin';
const role = args.role || 'admin';
const id = args.id || 'admin-user';
const useEmulator = String(args.useEmulator || '').toLowerCase() === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = args.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'edusync-local';
const emuHostArg = args.emuHost || args.emulatorHost || null;
const emuPortArg = args.emuPort || args.emulatorPort || null;

async function run() {
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  // Try to find service account json (seeder-key.json)
  if (useEmulator) {
    // Point admin SDK to emulator. No credentials required.
    // If explicit args were provided, override any existing env var.
    if (emuHostArg || emuPortArg) {
      const hostPart = emuHostArg && !emuHostArg.includes(':') ? emuHostArg : (emuHostArg || '127.0.0.1');
      const portPart = emuPortArg || (emuHostArg && emuHostArg.includes(':') ? emuHostArg.split(':')[1] : '8085');
      process.env.FIRESTORE_EMULATOR_HOST = `${hostPart.replace(/^https?:\/\//, '')}:${portPart}`;
    } else if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';
    }
    initializeApp({ projectId });
    console.log(`[Seeder] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST} (projectId=${projectId})`);
  } else {
    const candidate = path.resolve(__dirname, '..', 'seeder-key.json');
    if (fs.existsSync(candidate)) {
      const credential = cert(require(candidate));
      initializeApp({ credential, projectId });
      console.log('[Seeder] Using Firestore production project (service account credential).');
    } else {
      // Fall back to Application Default Credentials (ADC), same as seed-sample.cjs
      initializeApp({ projectId });
      console.log('[Seeder] Using Firestore production project (ADC fallback).');
    }
  }
  const db = getFirestore();

  const teacherDoc = db.collection('teachers').doc(id);
  const usersDoc = db.collection('users').doc(id);
  const teacherData = {
    id,
    name,
    email,
    role: role === 'admin' ? 'admin' : role,
    assignments: [],
    createdAt: new Date().toISOString(),
  };
  await teacherDoc.set(teacherData, { merge: true });
  await usersDoc.set({ ...teacherData, mock: false }, { merge: true });
  console.log('Upserted admin teacher & user:', teacherData);
  const verify = await teacherDoc.get();
  console.log('Verify teacher exists:', verify.exists);
}

run().catch(e => {
  // Improve error visibility
  console.error('[Seeder] Failed to create admin:', e && e.stack ? e.stack : e);
  process.exit(1);
});
