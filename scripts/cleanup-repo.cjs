#!/usr/bin/env node
// Remove transient exports and development artifacts from the repo working tree
// Safe and idempotent: skips missing files; only deletes known junk patterns.

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const rm = (p) => {
  const full = path.resolve(root, p);
  try {
    if (!fs.existsSync(full)) return;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
    } else {
      fs.unlinkSync(full);
    }
    console.log('[cleanup] removed', p);
  } catch (e) {
    console.warn('[cleanup] failed to remove', p, e.message || e);
  }
};

// Single-file junk at repo root
[
  'live_bundle.js',
  'live_index.html',
  'response.json',
  'test_payload.json',
  'metadata.json',
  'pitch.html',
  'new_gemini_key.txt',
  'seeder-key.json',
  // migrate checkpoints
  'migrate-bulk-2k.checkpoint.json',
  'migrate-bulk-5k.checkpoint.json',
  'migrate-bulk-subset.checkpoint.json',
  'migrate-prod.checkpoint.json',
  'migrate-staging-fresh.checkpoint.json',
  'migrate-staging-run.checkpoint.json',
  'migrate.checkpoint.json',
].forEach(rm);

// Dynamic patterns
const removeByPrefix = (prefix) => {
  try {
    for (const name of fs.readdirSync(root)) {
      if (name.startsWith(prefix)) rm(name);
    }
  } catch {}
};

removeByPrefix('emu-export-');
removeByPrefix('firebase-export-');
removeByPrefix('run-');

console.log('[cleanup] done');
