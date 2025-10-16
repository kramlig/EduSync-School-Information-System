#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

function run(cmd) {
  const res = spawnSync(cmd, { stdio: 'inherit', shell: true, env: { ...process.env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085' } });
  if (res.status !== 0) process.exit(res.status || 1);
}

console.log('[Emu] Seeding small dataset to emulator...');
run('node scripts/seed-sample.cjs --useEmulator=true --projectId=edusync-local --teachers=8 --parents=20 --sections=4 --students=40');

console.log('[Emu] Creating admin user on emulator...');
run('node scripts/create-admin.cjs --useEmulator=true --projectId=edusync-local --emuHost=127.0.0.1 --emuPort=8085 --email=admin@school.edu --name="System Admin" --role=admin --id=admin-user');

console.log('[Emu] Done.');
