#!/usr/bin/env node
/**
 * Kill all Firebase Emulator processes
 * 
 * This script forcefully terminates processes listening on emulator ports:
 * - 8086 (Firestore)
 * - 9100 (Auth)
 * - 9200 (Storage)
 * - 4000 (Emulator UI)
 * - 5173 (Vite dev server)
 * 
 * Usage:
 *   node scripts/emu-kill.cjs
 *   npm run emu:kill
 */

const { execSync } = require('child_process');

const EMULATOR_PORTS = [8086, 9100, 9200, 4000, 5173];

console.log('🛑 Killing Firebase Emulator processes...\n');

let killedCount = 0;

for (const port of EMULATOR_PORTS) {
  try {
    // Find process using the port (Windows)
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    
    // Extract PIDs
    const lines = output.trim().split('\n');
    const pids = new Set();
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && !isNaN(pid)) {
        pids.add(pid);
      }
    }
    
    // Kill each unique PID
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8' });
        console.log(`   ✓ Killed process on port ${port} (PID: ${pid})`);
        killedCount++;
      } catch (killErr) {
        console.log(`   ⚠️  Could not kill PID ${pid} (may already be dead)`);
      }
    }
  } catch (err) {
    // No process on this port (this is fine)
    console.log(`   ℹ️  Port ${port}: No process found`);
  }
}

if (killedCount === 0) {
  console.log('\n✅ No emulator processes were running');
} else {
  console.log(`\n✅ Killed ${killedCount} process(es)`);
}

console.log('\nPorts checked: ' + EMULATOR_PORTS.join(', '));
console.log('You can now run: npm run dev:emu\n');
