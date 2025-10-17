#!/usr/bin/env node
const { spawn } = require('node:child_process');

// Start Firebase emulators (firestore,auth) as a detached background process.
// We don't open a new window; 'emu-wait.cjs' will probe readiness and subsequent steps can proceed.
const child = spawn(
  'npx',
  ['firebase', 'emulators:start', '--only', 'firestore,auth', '--project', 'edusync-local'],
  { stdio: 'ignore', shell: true, detached: true }
);
try { child.unref(); } catch {}
console.log('[Emu] Starting Firestore+Auth emulators in background...');
