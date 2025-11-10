#!/usr/bin/env node
/**
 * print-cache-warning.cjs
 * 
 * Prints a warning about browser cache before starting dev server.
 * This reminds developers to clear cache if experiencing login issues.
 */

console.log('\n' + '='.repeat(80));
console.log('🧹 BROWSER CACHE WARNING');
console.log('='.repeat(80));
console.log('');
console.log('  If you experience SLOW LOGIN or "No documents found" errors:');
console.log('');
console.log('  QUICK FIX:');
console.log('    1. Open DevTools (F12)');
console.log('    2. Right-click Refresh button → Empty Cache and Hard Reload');
console.log('    3. Or use Incognito Mode (Ctrl+Shift+N)');
console.log('');
console.log('  ROOT CAUSE:');
console.log('    - Browser IndexedDB caches Firestore queries');
console.log('    - Cache persists after emulator restarts');
console.log('    - Stale cache returns empty results');
console.log('');
console.log('  PREVENTION:');
console.log('    - This has been FIXED in LoginScreen.tsx');
console.log('    - Now uses getDocsFromServer() to bypass cache');
console.log('    - You should NOT need to clear cache anymore!');
console.log('');
console.log('='.repeat(80) + '\n');
