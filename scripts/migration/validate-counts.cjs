#!/usr/bin/env node
// Simple validation utility: compare expected counts (JSON) against Firestore counts for listed collections

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');

const argv = yargs(hideBin(process.argv))
  .option('project', { type: 'string', demandOption: true })
  .option('expected', { type: 'string', demandOption: true, describe: 'Path to expected counts JSON (e.g. {"users":5000,...})' })
  .argv;

(async function main() {
  const admin = require('firebase-admin');
  admin.initializeApp({ projectId: argv.project });
  const db = admin.firestore();

  if (!fs.existsSync(argv.expected)) {
    console.error('Expected counts file not found:', argv.expected);
    process.exit(2);
  }

  const expected = JSON.parse(fs.readFileSync(argv.expected, 'utf8'));
  const results = [];
  for (const col of Object.keys(expected)) {
    try {
      const snap = await db.collection(col).count().get();
      const actual = snap.data().count;
      const exp = expected[col];
      const ok = actual === exp;
      results.push({ collection: col, expected: exp, actual, ok });
      console.log(`${ok ? 'PASS' : 'FAIL'}: ${col} expected=${exp} actual=${actual}`);
    } catch (e) {
      console.error('ERROR counting collection', col, e && e.message ? e.message : e);
      results.push({ collection: col, error: e.message || String(e) });
    }
  }

  const anyFail = results.some(r => r.ok === false || r.error);
  process.exit(anyFail ? 1 : 0);
})();
