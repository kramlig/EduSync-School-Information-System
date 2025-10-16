#!/usr/bin/env node
const { spawn } = require('node:child_process');
const isWin = process.platform === 'win32';

const cmd = isWin
  ? `start "Firestore Emulator" cmd /k npx firebase emulators:start --only firestore --project edusync-local`
  : `sh -c "npx firebase emulators:start --only firestore --project edusync-local"`;

const child = spawn(cmd, { stdio: 'inherit', shell: true, detached: isWin });
if (isWin) child.unref();
console.log('[Emu] Starting Firestore emulator in a separate terminal. Close that window to stop it.');
