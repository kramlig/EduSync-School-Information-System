#!/usr/bin/env node
// Windows-friendly runner: start Firestore emulator, run seeding + verification, export to unique dir.

const { spawnSync } = require('node:child_process');
const path = require('node:path');

function parseArgs(argv) {
  return argv.slice(2).reduce((acc, cur) => {
    const [k, v] = cur.split('=');
    if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
    return acc;
  }, {});
}

const args = parseArgs(process.argv);
const projectId = args.projectId || 'edusync-local';
const host = args.emuHost || '127.0.0.1';
const port = args.emuPort || '8085';
const noExport = String(args.noExport || '').toLowerCase() === 'true';

// Unique export dir to avoid EPERM rename on Windows
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const exportDir = path.join(process.cwd(), `emu-export-${stamp}`);

// Build the inner command to run inside emulator
const innerArgs = [
  'node',
  'scripts/seed-and-verify.cjs',
  `--projectId=${projectId}`,
  `--teachers=${args.teachers || 4}`,
  `--parents=${args.parents || 6}`,
  `--sections=${args.sections || 2}`,
  `--students=${args.students || 0}`,
  `--emuHost=${host}`,
  `--emuPort=${port}`
].join(' ');

// Build a single command string quoting the inner command (Windows-friendly)
const exportFlag = noExport ? '' : ` --export-on-exit "${exportDir}"`;
const cmd = `npx firebase emulators:exec --only firestore --project ${projectId}${exportFlag} "${innerArgs}"`;

console.log(noExport
  ? `[Runner] Starting Firestore emulator (no export on exit).`
  : `[Runner] Starting Firestore emulator, exporting to: ${exportDir}`
);
console.log(`[Runner] Exec: ${cmd}`);
const res = spawnSync(cmd, { stdio: 'inherit', env: process.env, shell: true });
if (res.status !== 0) {
  console.error(`[Runner] emulators:exec failed with code ${res.status}`);
  process.exit(res.status);
}

console.log(`[Runner] Completed. Export dir: ${exportDir}`);
