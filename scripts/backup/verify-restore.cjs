#!/usr/bin/env node
// Simple verifier: count documents in a list of collections for a target project
// Usage: node verify-restore.js --project <project-id> --collections grades,students,users

const { Firestore } = require('@google-cloud/firestore');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('project', { type: 'string', demandOption: true })
  .option('collections', { type: 'string', demandOption: true, describe: 'comma-separated collection ids' })
  .help()
  .argv;

async function main() {
  const firestore = new Firestore({ projectId: argv.project });
  const collections = argv.collections.split(',').map(s => s.trim()).filter(Boolean);
  const result = {};
  for (const col of collections) {
    const snap = await firestore.collection(col).get();
    result[col] = snap.size;
    console.log(`Collection ${col}: ${snap.size} documents`);
  }
  console.log('Summary:', JSON.stringify(result, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
