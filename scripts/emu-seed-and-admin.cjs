#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

function run(cmd) {
  const res = spawnSync(cmd, { stdio: 'inherit', shell: true, env: { ...process.env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8086' } });
  if (res.status !== 0) process.exit(res.status || 1);
}

console.log('[Emu] Seeding complete dataset with seed-complete.cjs...');
run('node scripts/seed-complete.cjs');

console.log('[Emu] Verifying seeded data...');
run('node scripts/verify-seed.cjs --projectId=edusync-local --emuHost=127.0.0.1 --emuPort=8086');

console.log('[Emu] Done.');
