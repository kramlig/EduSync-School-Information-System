#!/usr/bin/env node
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function listStudents() {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'edusync-local';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';

  initializeApp({ projectId });
  const db = getFirestore();

  console.log(`[ListStudents] Querying Firestore for students in project: ${projectId}, emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);

  try {
    const studentsRef = db.collection('students');
    const snapshot = await studentsRef.get();

    if (snapshot.empty) {
      console.log('[ListStudents] No student documents found.');
      return;
    }

    console.log(`[ListStudents] Found ${snapshot.size} student documents:`);
    snapshot.forEach(doc => {
      console.log(`- ID: ${doc.id}, Data:`, doc.data());
    });
  } catch (error) {
    console.error('[ListStudents] Error fetching student documents:', error);
  }
}

listStudents().catch(e => {
  console.error('[ListStudents] Script failed:', e && e.stack ? e.stack : e);
  process.exit(1);
});
