/**
 * Switch PayMongo between test and live modes for Cloud Functions.
 *
 * Usage:
 *   node scripts/switch-paymongo-env.cjs test   — Switch to test keys
 *   node scripts/switch-paymongo-env.cjs live   — Switch to live keys
 *   node scripts/switch-paymongo-env.cjs status — Show current mode
 */

const fs = require('fs');
const path = require('path');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const ENV_FILE = path.join(FUNCTIONS_DIR, '.env');
const ENV_LIVE = path.join(FUNCTIONS_DIR, '.env.live');
const ENV_TEST = path.join(FUNCTIONS_DIR, '.env.test');

const mode = process.argv[2];

if (!['test', 'live', 'status'].includes(mode)) {
  console.log('Usage: node scripts/switch-paymongo-env.cjs <test|live|status>');
  process.exit(1);
}

function detectMode() {
  const content = fs.readFileSync(ENV_FILE, 'utf8');
  if (content.includes('sk_live_')) return 'LIVE';
  if (content.includes('sk_test_')) return 'TEST';
  return 'UNKNOWN';
}

if (mode === 'status') {
  const current = detectMode();
  console.log(`Current PayMongo mode: ${current}`);
  process.exit(0);
}

if (mode === 'test') {
  // Backup current .env as .env.live if it has live keys
  const current = detectMode();
  if (current === 'LIVE') {
    fs.copyFileSync(ENV_FILE, ENV_LIVE);
    console.log('✅ Backed up live .env → .env.live');
  }

  if (!fs.existsSync(ENV_TEST)) {
    console.error('❌ functions/.env.test not found. Create it with your test PayMongo keys.');
    process.exit(1);
  }

  fs.copyFileSync(ENV_TEST, ENV_FILE);
  console.log('✅ Switched to TEST mode (functions/.env now uses sk_test_ keys)');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Replace PAYMONGO_SECRET_KEY and PAYMONGO_WEBHOOK_SECRET with your test keys');
  console.log('  2. Deploy: cd functions && npx firebase deploy --only functions');
  console.log('  3. Test with card: 4343 4343 4343 4345 (any future expiry, any CVC)');
}

if (mode === 'live') {
  if (!fs.existsSync(ENV_LIVE)) {
    console.error('❌ functions/.env.live not found. Was the live env backed up?');
    process.exit(1);
  }

  fs.copyFileSync(ENV_LIVE, ENV_FILE);
  console.log('✅ Switched to LIVE mode (functions/.env now uses sk_live_ keys)');
  console.log('');
  console.log('Next: Deploy: cd functions && npx firebase deploy --only functions');
}
