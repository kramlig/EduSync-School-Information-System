#!/usr/bin/env node
// Verify seeded data counts and basic relationships on Firestore emulator

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k,v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
  return acc;
}, {});

const useEmulator = String(args.useEmulator || '').toLowerCase() === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = args.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'edusync-local';
const emuHostArg = args.emuHost || args.emulatorHost || null;
const emuPortArg = args.emuPort || args.emulatorPort || null;

async function main() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (useEmulator) {
    if (emuHostArg || emuPortArg) {
      const hostPart = emuHostArg && !emuHostArg.includes(':') ? emuHostArg : (emuHostArg || '127.0.0.1');
      const portPart = emuPortArg || (emuHostArg && emuHostArg.includes(':') ? emuHostArg.split(':')[1] : '8085');
      process.env.FIRESTORE_EMULATOR_HOST = `${hostPart.replace(/^https?:\/\//, '')}:${portPart}`;
    } else if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';
    }
  }

  initializeApp({ projectId });
  const db = getFirestore();

  const collections = ['teachers','parents','sections','students','classSchedules','coreValues','coreValueGrades'];
  const counts = {};
  for (const col of collections) {
    const snap = await db.collection(col).get();
    counts[col] = snap.size;
  }

  // Relationship checks
  let adviserOk = 'N/A';
  let parentLinkOk = 'N/A';
  const sectionsSnap = await db.collection('sections').limit(1).get();
  if (!sectionsSnap.empty) {
    const sec = sectionsSnap.docs[0].data();
    if (sec?.adviserId) {
      const t = await db.collection('teachers').doc(sec.adviserId).get();
      adviserOk = t.exists ? 'OK' : 'Missing adviser teacher';
    }
  }
  const parentsSnap = await db.collection('parents').limit(1).get();
  if (!parentsSnap.empty) {
    const p = parentsSnap.docs[0].data();
    if (p?.studentIds?.length) {
      const s = await db.collection('students').doc(p.studentIds[0]).get();
      parentLinkOk = s.exists ? 'OK' : 'Missing linked student';
    } else {
      parentLinkOk = 'No studentIds on sampled parent';
    }
  }

  // Basic sanity: if there are students and core values, expect at least one coreValueGrades record
  let cvGradeOk = 'N/A';
  if ((counts.students || 0) > 0 && (counts.coreValues || 0) > 0) {
    cvGradeOk = (counts.coreValueGrades || 0) > 0 ? 'OK' : 'No coreValueGrades found';
  }

  console.log('[Verify] Counts:', counts);
  console.log('[Verify] Section adviser link:', adviserOk);
  console.log('[Verify] Parent->Student link:', parentLinkOk);
  console.log('[Verify] CoreValues grades presence:', cvGradeOk);
}

main().catch(e => { console.error('[Verify] Failed:', e && e.stack ? e.stack : e); process.exit(1); });
