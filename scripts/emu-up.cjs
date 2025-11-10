#!/usr/bin/env node
const { spawn } = require('node:child_process');

console.log('[Emu] Starting Firestore+Auth+Storage emulators...');

// On Windows, start in a new terminal window so it stays visible and running
// On other platforms, use detached background process
const isWindows = process.platform === 'win32';

if (isWindows) {
  // Windows: Start in new terminal window
  const child = spawn(
    'cmd.exe',
    ['/c', 'start', 'cmd', '/k', 'npx firebase emulators:start --only firestore,auth,storage --project edusync-local'],
    { shell: true, detached: true, stdio: 'ignore' }
  );
  child.unref();
  console.log('[Emu] ✅ Started emulators in new window');
} else {
  // Unix: Use nohup to keep running
  const child = spawn(
    'nohup',
    ['npx', 'firebase', 'emulators:start', '--only', 'firestore,auth,storage', '--project', 'edusync-local'],
    { detached: true, stdio: 'ignore' }
  );
  child.unref();
  console.log('[Emu] ✅ Started emulators in background');
}

console.log('[Emu] Emulator UI will be at: http://127.0.0.1:4000');
