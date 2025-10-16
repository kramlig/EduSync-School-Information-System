#!/usr/bin/env node
// Run seeder then verifier sequentially. Designed to be executed inside `firebase emulators:exec`.

const { spawnSync } = require('node:child_process');

function parseArgs(argv) {
  return argv.slice(2).reduce((acc, cur) => {
    const [k, v] = cur.split('=');
    if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
    return acc;
  }, {});
}

const args = parseArgs(process.argv);
const projectId = args.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'edusync-local';

function runNodeScript(scriptPath, passArgs) {
  const res = spawnSync(process.execPath, [scriptPath, ...passArgs], { stdio: 'inherit', env: process.env });
  return res.status ?? (res.error ? 1 : 0);
}

// Build shared args for seeder and verifier
const shared = [
  `--useEmulator=true`,
  `--projectId=${projectId}`
];

// Seeder-specific counts
const counts = [];
if (args.teachers) counts.push(`--teachers=${args.teachers}`);
if (args.parents) counts.push(`--parents=${args.parents}`);
if (args.sections) counts.push(`--sections=${args.sections}`);
if (args.students) counts.push(`--students=${args.students}`);
if (args.emuHost) counts.push(`--emuHost=${args.emuHost}`);
if (args.emuPort) counts.push(`--emuPort=${args.emuPort}`);

console.log('[Runner] Seeding sample data...');
const seedCode = runNodeScript('scripts/seed-sample.cjs', [...shared, ...counts]);
if (seedCode !== 0) {
  console.error(`[Runner] Seeder exited with code ${seedCode}. Aborting.`);
  process.exit(seedCode);
}

console.log('[Runner] Verifying seeded data...');
const verifyCode = runNodeScript('scripts/verify-seed.cjs', [...shared]);
if (verifyCode !== 0) {
  console.error(`[Runner] Verifier exited with code ${verifyCode}.`);
  process.exit(verifyCode);
}

console.log('[Runner] Done.');
