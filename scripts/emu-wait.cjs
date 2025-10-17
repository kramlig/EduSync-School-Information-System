#!/usr/bin/env node
const net = require('net');

const host = process.argv[2] || '127.0.0.1';
const port = parseInt(process.argv[3] || '8085', 10);
const timeoutArg = (process.argv.find(a => a.startsWith('--timeout=')) || '').split('=')[1];
const timeoutMs = timeoutArg ? parseInt(timeoutArg, 10) : 60000;

const start = Date.now();

function tryConnect() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => { resolve(false); });
    socket.connect(port, host);
  });
}

(async () => {
  process.stdout.write(`[EmuWait] Waiting for ${host}:${port} ...`);
  while (Date.now() - start < timeoutMs) {
    const ok = await tryConnect();
    if (ok) {
      console.log(` OK`);
      process.exit(0);
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 1000));
  }
  console.error(`\n[EmuWait] Timed out after ${timeoutMs}ms waiting for ${host}:${port}`);
  process.exit(1);
})();
