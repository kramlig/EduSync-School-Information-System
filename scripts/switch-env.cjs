#!/usr/bin/env node
// Usage: node scripts/switch-env.cjs emu|prod
const fs = require('fs');
const path = require('path');

const profile = (process.argv[2] || '').toLowerCase();
if (!['emu','prod'].includes(profile)) {
  console.error('Usage: node scripts/switch-env.cjs emu|prod');
  process.exit(1);
}

const src = path.resolve(process.cwd(), `.env.local.${profile}`);
const dst = path.resolve(process.cwd(), `.env.local`);
if (!fs.existsSync(src)) {
  console.error(`Profile env file not found: ${src}`);
  process.exit(1);
}
fs.copyFileSync(src, dst);
console.log(`Switched .env.local to profile: ${profile}`);
