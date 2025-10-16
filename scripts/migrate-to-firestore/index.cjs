#!/usr/bin/env node
/*
Simple, idempotent Firestore migration runner (scaffold) - CommonJS
Usage:
  node index.cjs --project <gcp-project> --source ./sample-data --dry-run

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
  .option('transform-config', { type: 'string', describe: 'Path to transform config JSON (whitelist/blacklist, mapFields)' })
  .option('auth-map', { type: 'string', describe: 'Path to auth mapping JSON (oldId -> newUid)' })
  .option('max-retries', { type: 'number', default: 5, describe: 'Max retries for transient writes' })
  .option('retry-base-ms', { type: 'number', default: 500, describe: 'Base backoff in ms for retries' })
  .option('log-file', { type: 'string', default: './migrate.log', describe: 'Path to local migration log file' })
  .argv;

async function main() {
  const sourceDir = path.resolve(argv.source);
  if (!fs.existsSync(sourceDir)) {
    console.error('Source directory not found:', sourceDir);
    process.exit(2);
  }

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));
  console.log('Found collection files:', files);

  // Setup logging
  const logFile = path.resolve(argv['log-file']);
  function log(...args) {
    const line = `[${new Date().toISOString()}] ${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}\n`;
    try { fs.appendFileSync(logFile, line); } catch (e) { /* ignore */ }
    console.log(...args);
  }

  // Load transform config
  let transformConfig = { blacklist: ['password'], whitelist: null, mapFields: [] };
  if (argv['transform-config']) {
    try {
      const cfgRaw = fs.readFileSync(path.resolve(argv['transform-config']), 'utf8');
      transformConfig = Object.assign(transformConfig, JSON.parse(cfgRaw));
      log('Loaded transform config from', argv['transform-config']);
    } catch (e) {
      log('Failed to load transform-config', argv['transform-config'], e.message || e);
      process.exit(1);
    }
  }

  // Load auth map
  let authMap = null;
  if (argv['auth-map']) {
    try {
      authMap = JSON.parse(fs.readFileSync(path.resolve(argv['auth-map']), 'utf8'));
      log('Loaded auth map from', argv['auth-map']);
    } catch (e) {
      log('Failed to load auth-map', argv['auth-map'], e.message || e);
      process.exit(1);
    }
  }

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
  log(`Processing collection ${collectionName}: total docs ${docs.length}, starting at ${startIndex}`);

    // Apply transforms (drop password, demo-only fields)
    for (let i = startIndex; i < docs.length; i += argv['batch-size']) {
      const batch = docs.slice(i, i + argv['batch-size']);
  const transformed = batch.map(d => transformDocument(collectionName, d, transformConfig, authMap));

      if (argv['dry-run']) {
        log(`Dry-run: would write ${transformed.length} docs to collection ${collectionName} (indexes ${i}..${i+transformed.length-1})`);
      } else {
        // Real write: use Firestore Admin SDK
        if (!global.admin) {
          const admin = require('firebase-admin');
          admin.initializeApp({ projectId: argv.project });
          global.admin = admin;
          global.db = admin.firestore();
        }
        const db = global.db;

        // Write documents with retries and backoff
        for (const doc of transformed) {
          try {
            await writeWithRetry(db, collectionName, doc, argv['max-retries'], argv['retry-base-ms']);
            log('Wrote doc', collectionName, doc.id || '(auto-id)');
          } catch (e) {
            log('Failed to write doc after retries', collectionName, doc.id || '(auto-id)', e && e.message ? e.message : e);
            // Save failed batch for inspection
            const failedDir = path.resolve('./failed_batches');
            if (!fs.existsSync(failedDir)) fs.mkdirSync(failedDir, { recursive: true });
            const failFile = path.join(failedDir, `${collectionName}-${Date.now()}.json`);
            try { fs.writeFileSync(failFile, JSON.stringify(doc, null, 2)); } catch (e2) { log('Failed to write failed batch file', e2.message || e2); }
          }
        }
      }

      // Update checkpoint
      checkpoint[collectionName] = i + batch.length;
      fs.writeFileSync(argv.checkpoint, JSON.stringify(checkpoint, null, 2));
    }

    console.log(`Finished collection ${collectionName}`);
  }

  console.log('\nMigration scaffold complete.');
}

function transformDocument(collectionName, doc, transformConfig, authMap) {
  // Default transform: remove demo/plaintext passwords and local-only fields
  const copy = JSON.parse(JSON.stringify(doc));
  // Apply whitelist/blacklist
  if (transformConfig && transformConfig.whitelist && Array.isArray(transformConfig.whitelist)) {
    const keep = {};
    for (const k of transformConfig.whitelist) { if (k in copy) keep[k] = copy[k]; }
    Object.keys(copy).forEach(k => { if (!(k in keep)) delete copy[k]; });
  } else if (transformConfig && transformConfig.blacklist && Array.isArray(transformConfig.blacklist)) {
    for (const b of transformConfig.blacklist) { if (b in copy) delete copy[b]; }
  }

  // Field mapping
  if (transformConfig && transformConfig.mapFields && Array.isArray(transformConfig.mapFields)) {
    for (const map of transformConfig.mapFields) {
      if (copy[map.from] !== undefined) {
        copy[map.to] = copy[map.from];
        if (map.removeSource) delete copy[map.from];
      }
    }
  }

  // Auth mapping: if authMap provided and there's a creatorId or user id, remap
  if (authMap) {
    if (copy.creatorId && authMap[copy.creatorId]) copy.creatorId = authMap[copy.creatorId];
    if (copy.id && authMap[copy.id]) copy.id = authMap[copy.id];
    if (copy.studentId && authMap[copy.studentId]) copy.studentId = authMap[copy.studentId];
    if (copy.teacherId && authMap[copy.teacherId]) copy.teacherId = authMap[copy.teacherId];
    if (copy.originalTeacherId && authMap[copy.originalTeacherId]) copy.originalTeacherId = authMap[copy.originalTeacherId];
  }

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

async function writeWithRetry(db, collectionName, doc, maxRetries, baseMs) {
  let attempt = 0;
  while (true) {
    try {
      await writeDoc(db, collectionName, doc);
      return;
    } catch (err) {
      attempt++;
      const retriable = isRetriableError(err);
      if (!retriable || attempt > maxRetries) throw err;
      const backoff = baseMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * baseMs);
      log(`Retry attempt ${attempt} for ${collectionName}/${doc.id || '(auto)'} after ${backoff}ms due to ${err && err.message}`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
}

function isRetriableError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  // Network, timeout, rate-limit-like messages
  return msg.includes('etimedout') || msg.includes('econnreset') || msg.includes('unavailable') || msg.includes('rate') || msg.includes('timeout') || msg.includes('503') || msg.includes('500');
}

main().catch(err => { console.error(err); process.exit(1); });
