#!/usr/bin/env node
const { execSync } = require('node:child_process');
const port = process.argv[2] || '5173';

try {
  if (process.platform === 'win32') {
    const out = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe', encoding: 'utf8' });
    const lines = out.split(/\r?\n/).filter(Boolean);
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try { execSync(`taskkill /PID ${pid} /F`); } catch {}
    }
    console.log(`[Port] Killed ${pids.size} process(es) on port ${port}`);
  } else {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    console.log(`[Port] Cleared port ${port}`);
  }
} catch {
  console.log(`[Port] No processes found on port ${port}`);
}
