#!/usr/bin/env node
// Deletes documents in given collections that are mock data (mock: true or id startsWith 'mock-')
// Usage: node cleanup-mock-data.cjs --project <project-id> --collections users,students,grades

const { Firestore } = require('@google-cloud/firestore');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('project', { type: 'string', demandOption: true })
  .option('collections', { type: 'string', demandOption: true })
  .help()
  .argv;

async function main() {
  const firestore = new Firestore({ projectId: argv.project });
  const collections = argv.collections.split(',').map(s=>s.trim()).filter(Boolean);
  for (const col of collections) {
    console.log('Scanning', col);
    const snap = await firestore.collection(col).get();
    let deleted = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      const id = doc.id;
      if (data && data.mock === true || id.startsWith('mock-')) {
        await firestore.collection(col).doc(id).delete();
        deleted++;
      }
    }
    console.log(`Deleted ${deleted} docs from ${col}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
