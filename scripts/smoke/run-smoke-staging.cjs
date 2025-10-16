#!/usr/bin/env node
// Quick smoke tests against staging Firestore
// Usage: node run-smoke-staging.cjs --project edusync-sis-staging
import { db } from './services/firestoreService';
import { doc, getDoc } from 'firebase/firestore';
const snap = await getDoc(doc(db, 'users', 'mock-user-1'));

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');

const argv = yargs(hideBin(process.argv))
  .option('project', { type: 'string', demandOption: true })
  .argv;

async function main() {
  const admin = require('firebase-admin');
  admin.initializeApp({ projectId: argv.project });
  const db = admin.firestore();

  const checks = [];

  // 1) counts
  checks.push((async () => {
    const usersSnap = await db.collection('users').count().get();
    const studentsSnap = await db.collection('students').count().get();
    const gradesSnap = await db.collection('grades').count().get();
    return { name: 'counts', ok: true, result: { users: usersSnap.data().count, students: studentsSnap.data().count, grades: gradesSnap.data().count } };
  })());

  // 2) fetch a sample user
  checks.push((async () => {
    const q = await db.collection('users').limit(1).get();
    if (q.empty) return { name: 'sample-user', ok: false, error: 'no users found' };
    const doc = q.docs[0];
    return { name: 'sample-user', ok: true, result: doc.data() };
  })());

  // 3) fetch grades for the first student (if any)
  checks.push((async () => {
    const s = await db.collection('students').limit(1).get();
    if (s.empty) return { name: 'student-grades', ok: false, error: 'no students found' };
    const studentId = s.docs[0].id;
    const gq = await db.collection('grades').where('studentId','==', studentId).limit(5).get();
    return { name: 'student-grades', ok: true, studentId, count: gq.size, sampleGrades: gq.docs.map(d => d.data()) };
  })());

  // 4) query sections (if present)
  checks.push((async () => {
    try {
      const sq = await db.collection('sections').limit(5).get();
      return { name: 'sections', ok: true, count: sq.size, sample: sq.docs.map(d => d.data()) };
    } catch (e) {
      return { name: 'sections', ok: false, error: e.message || e };
    }
  })());

  // 5) run a security-rules check: attempt a disallowed write (requires emulator or rules testing infra); skip here but note.

  const results = await Promise.all(checks);
  console.log('Smoke test results:');
  for (const r of results) {
    if (r.ok) console.log(`PASS: ${r.name}`, JSON.stringify(r.result || { count: r.count }, null, 2));
    else console.log(`FAIL: ${r.name}`, r.error || r);
  }

  // Exit code
  const anyFail = results.some(r => !r.ok);
  process.exit(anyFail ? 2 : 0);
}

main().catch(e => { console.error('Smoke script error', e); process.exit(1); });
