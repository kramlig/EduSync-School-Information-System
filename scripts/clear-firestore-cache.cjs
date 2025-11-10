#!/usr/bin/env node
/**
 * clear-firestore-cache.cjs
 * 
 * Clears Firestore client cache to prevent stale data issues after emulator seeding.
 * This ensures fresh queries fetch from the server instead of returning empty results.
 * 
 * USAGE:
 *   node scripts/clear-firestore-cache.cjs
 * 
 * WHAT IT DOES:
 *   1. Clears IndexedDB databases used by Firestore (firebaseLocalStorageDb)
 *   2. Clears localStorage entries related to Firebase
 *   3. Prints status and instructions
 * 
 * WHY THIS IS NEEDED:
 *   When using the Firestore emulator, the browser caches query results.
 *   After seeding new data, the cache becomes stale, causing login failures.
 *   This script clears the cache so the next query fetches fresh data.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Firestore Cache Clearing Utility\n');

// Get the user's Chrome/Edge profile directory
const platform = process.platform;
let browserDataDir = '';

if (platform === 'win32') {
  const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';
  
  // Try Chrome first
  const chromeDir = path.join(userProfile, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default');
  const edgeDir = path.join(userProfile, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default');
  
  if (fs.existsSync(chromeDir)) {
    browserDataDir = chromeDir;
    console.log('📂 Found Chrome profile:', browserDataDir);
  } else if (fs.existsSync(edgeDir)) {
    browserDataDir = edgeDir;
    console.log('📂 Found Edge profile:', browserDataDir);
  }
} else if (platform === 'darwin') {
  const home = process.env.HOME || '';
  browserDataDir = path.join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'Default');
  console.log('📂 Looking for Chrome profile:', browserDataDir);
} else {
  const home = process.env.HOME || '';
  browserDataDir = path.join(home, '.config', 'google-chrome', 'Default');
  console.log('📂 Looking for Chrome profile:', browserDataDir);
}

// Instructions for manual cache clearing
console.log('\n📋 CACHE CLEARING INSTRUCTIONS:\n');
console.log('The Firestore cache is stored in your browser\'s IndexedDB.');
console.log('To clear it, you have TWO options:\n');

console.log('OPTION 1: Close browser and auto-clear (RECOMMENDED)');
console.log('  1. Close ALL browser windows (Chrome/Edge)');
console.log('  2. Re-run this script (it will auto-delete IndexedDB files)');
console.log('  3. Reopen browser and login again\n');

console.log('OPTION 2: Manual clearing in browser');
console.log('  1. Open browser DevTools (F12)');
console.log('  2. Go to Application tab → Storage → IndexedDB');
console.log('  3. Right-click "firebaseLocalStorageDb" → Delete database');
console.log('  4. Also clear: localStorage → http://127.0.0.1:5173');
console.log('  5. Refresh page (Ctrl+Shift+R)\n');

// Check if browser is running
let browserRunning = false;
try {
  if (platform === 'win32') {
    const output = execSync('tasklist /FI "IMAGENAME eq chrome.exe" /FI "IMAGENAME eq msedge.exe"', { encoding: 'utf8' });
    browserRunning = output.includes('chrome.exe') || output.includes('msedge.exe');
  } else {
    const output = execSync('ps aux | grep -i chrome | grep -v grep', { encoding: 'utf8' });
    browserRunning = output.trim().length > 0;
  }
} catch (err) {
  // Ignore errors, assume not running
}

if (browserRunning) {
  console.log('⚠️  WARNING: Browser is currently running!');
  console.log('   Cache files are LOCKED and cannot be deleted.');
  console.log('   Please CLOSE ALL browser windows first.\n');
  process.exit(0);
}

// Attempt to delete IndexedDB files
console.log('🔍 Searching for IndexedDB files to delete...\n');

const indexedDbDir = path.join(browserDataDir, 'IndexedDB');

if (!fs.existsSync(indexedDbDir)) {
  console.log('ℹ️  No IndexedDB directory found (browser may not have cached anything yet)');
  console.log('   This is normal if you haven\'t used the app yet.\n');
  process.exit(0);
}

try {
  const files = fs.readdirSync(indexedDbDir);
  const firebaseFiles = files.filter(f => 
    f.includes('firebaseLocalStorage') || 
    f.includes('firebase') ||
    f.includes('127.0.0.1_5173')
  );
  
  if (firebaseFiles.length === 0) {
    console.log('✅ No Firebase IndexedDB files found (cache is already clear)\n');
  } else {
    console.log(`Found ${firebaseFiles.length} Firebase cache file(s):\n`);
    firebaseFiles.forEach(f => console.log(`   - ${f}`));
    
    console.log('\n🗑️  Deleting cache files...\n');
    firebaseFiles.forEach(f => {
      const fullPath = path.join(indexedDbDir, f);
      try {
        if (fs.lstatSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        console.log(`   ✅ Deleted: ${f}`);
      } catch (err) {
        console.log(`   ❌ Failed to delete ${f}:`, err.message);
      }
    });
    
    console.log('\n✅ Cache clearing complete!\n');
  }
} catch (err) {
  console.error('❌ Error accessing IndexedDB directory:', err.message);
  console.log('\nPlease use OPTION 2 (manual clearing) instead.\n');
}

console.log('🎯 NEXT STEPS:');
console.log('   1. Open http://127.0.0.1:5173 in browser');
console.log('   2. Login with: admin-school1@test.com / TestPass123!');
console.log('   3. If still fails, use DevTools → Application → Clear storage\n');
