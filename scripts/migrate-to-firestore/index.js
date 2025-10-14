#!/usr/bin/env node
/*
Simple, idempotent Firestore migration runner (scaffold)
Usage:
  node index.js --project <gcp-project> --source ./sample-data --dry-run

This scaffold supports:
 - reading JSON files from a source directory (one file per collection, e.g. users.json)
 - dry-run mode (no writes)
 - batching writes (batch size configurable)
 - transforms: drops `password` fields by default
 - resume via a checkpoint file

IMPORTANT: This is a scaffold. For production use, run tests and add robust error handling and retries.
*/

const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('project', { type: 'string', describe: 'GCP project id for target Firestore' })
  .option('source', { type: 'string', describe: 'Path to source JSON directory', default: './sample-data' })
  .option('dry-run', { type: 'boolean', describe: 'Do not write to Firestore', default: true })
  .option('batch-size', { type: 'number', default: 500 })
  .option('checkpoint', { type: 'string', default: './migrate.checkpoint.json' })
  .argv;

async function main() {
  const sourceDir = path.resolve(argv.source);
  if (!fs.existsSync(sourceDir)) {
    console.error('Source directory not found:', sourceDir);
    process.exit(2);
  }

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));
  console.log('Found collection files:', files);

  // Load checkpoint
  let checkpoint = {};
  if (fs.existsSync(argv.checkpoint)) {
    try { checkpoint = JSON.parse(fs.readFileSync(argv.checkpoint,'utf8')); } catch(e) { checkpoint = {}; }
  }

  for (const file of files) {
    const collectionName = file.replace(/\.json$/, '');
    const filePath = path.join(sourceDir, file);
    console.log('\n--- Processing collection', collectionName, 'from', filePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    let docs = [];
    try { docs = JSON.parse(raw); } catch (e) { console.error('Failed to parse', filePath, e); process.exit(1); }
    if (!Array.isArray(docs)) { console.error('Expected array of documents in', filePath); process.exit(2); }

    const startIndex = checkpoint[collectionName] || 0;
    console.log(`Total docs: ${docs.length}, starting at index ${startIndex}`);

    // Apply transforms (drop password, demo-only fields)
    for (let i = startIndex; i < docs.length; i += argv['batch-size']) {
      const batch = docs.slice(i, i + argv['batch-size']);
      const transformed = batch.map(d => transformDocument(collectionName, d));

      if (argv['dry-run']) {
        console.log(`Dry-run: would write ${transformed.length} docs to collection ${collectionName} (indexes ${i}..${i+transformed.length-1})`);
      } else {
        // Real write: use Firestore Admin SDK
        if (!global.admin) {
          const admin = require('firebase-admin');
          admin.initializeApp({ projectId: argv.project });
          global.admin = admin;
          global.db = admin.firestore();
        }
        const db = global.db;

        const promises = transformed.map(doc => writeDoc(db, collectionName, doc));
        await Promise.all(promises);
        console.log(`Wrote ${transformed.length} docs to ${collectionName}`);
      }

      // Update checkpoint
      checkpoint[collectionName] = i + batch.length;
      fs.writeFileSync(argv.checkpoint, JSON.stringify(checkpoint, null, 2));
    }

    console.log(`Finished collection ${collectionName}`);
  }

  console.log('\nMigration scaffold complete.');
}

function transformDocument(collectionName, doc) {
  // Default transform: remove demo/plaintext passwords and local-only fields
  const copy = JSON.parse(JSON.stringify(doc));
  if (copy.password) delete copy.password;
  // Add collection-specific transforms here
  return copy;
}

async function writeDoc(db, collectionName, doc) {
  // Use id if present, otherwise auto-id
  try {
    if (doc.id) {
      await db.collection(collectionName).doc(doc.id).set(doc, { merge: true });
    } else {
      await db.collection(collectionName).add(doc);
    }
  } catch (e) {
    console.error('Write failed for', collectionName, doc.id || '(auto-id)', e.message || e);
    throw e;
  }
}

main().catch(err => { console.error(err); process.exit(1); });
