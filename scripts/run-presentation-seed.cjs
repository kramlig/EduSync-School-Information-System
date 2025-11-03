#!/usr/bin/env node
/**
 * Quick Presentation Seed - Direct Connection
 * Run this when emulator is already running (via dev:emu)
 */

const { spawn } = require('child_process');

console.log('\n🎯 PRESENTATION SEED - Quick Run');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  Make sure Firebase emulator is running!');
console.log('   Run: npm run dev:emu (in another terminal)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const child = spawn('node', [
  'scripts/seed-presentation.cjs',
  '--useEmulator=true',
  '--projectId=edusync-local',
  '--emuHost=127.0.0.1',
  '--emuPort=8086'
], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
