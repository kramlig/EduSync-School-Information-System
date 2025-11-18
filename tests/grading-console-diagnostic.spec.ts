/**
 * Diagnostic Test: Capture Browser Console During Grading Page Load
 * 
 * This test logs in as a teacher and monitors browser console to see:
 * 1. What Firestore queries are being made
 * 2. If there are any JavaScript errors
 * 3. If data is being fetched but not displayed
 * 4. If there are security/permission errors
 */

import { test, expect } from '@playwright/test';

test.describe('Grading System Console Diagnostics', () => {
  test('Teacher gradebook - capture all console logs and errors', async ({ page }) => {
    console.log('\n🔬 DIAGNOSTIC TEST: Grading System Browser Console Analysis');
    console.log('═'.repeat(80));
    
    // Capture ALL console messages
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`   🔴 ERROR: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`   ⚠️  WARN: ${text}`);
      } else if (text.includes('[useSchoolData]') || text.includes('Firestore') || text.includes('grades') || text.includes('📊')) {
        consoleLogs.push(text);
        console.log(`   💬 LOG: ${text}`);
      }
    });
    
    // Capture page errors (unhandled exceptions)
    page.on('pageerror', err => {
      console.log(`   💥 PAGE ERROR: ${err.message}`);
      consoleErrors.push(`PAGE ERROR: ${err.message}`);
    });
    
    console.log('\n1️⃣  LOGGING IN AS TEACHER');
    console.log('─'.repeat(80));
    
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Login as teacher
    await page.fill('input[type="email"]', 'teacher@edusync-demo.ph');
    await page.fill('input[type="password"]', 'teacher123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    const greetingHeading = page.getByRole('heading', { level: 1 }).filter({ hasText: /good (morning|afternoon|evening)/i });
    await greetingHeading.waitFor({ timeout: 15000 });
    console.log('   ✅ Teacher logged in successfully');
    
    console.log('\n2️⃣  NAVIGATING TO GRADEBOOK');
    console.log('─'.repeat(80));
    
    // Navigate to gradebook
    await page.goto('/gradebook');
    console.log('   📍 Navigated to /gradebook');
    
    // Wait a bit for data to load (or timeout)
    console.log('   ⏳ Waiting 30 seconds for data to load...');
    await page.waitForTimeout(30000);
    
    console.log('\n3️⃣  ANALYZING PAGE STATE');
    console.log('─'.repeat(80));
    
    // Check what's visible
    const pageHTML = await page.content();
    const hasLoadingText = pageHTML.includes('Loading your data');
    const hasGradeTable = await page.locator('table').count() > 0;
    const hasStudentList = await page.locator('[data-testid*="student"], [class*="student"]').count() > 0;
    
    console.log(`   📄 Page contains "Loading your data": ${hasLoadingText}`);
    console.log(`   📊 Page has tables: ${hasGradeTable}`);
    console.log(`   👨‍🎓 Page has student elements: ${hasStudentList}`);
    
    // Get all h1/h2/h3 headings
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log(`   📌 Page headings: ${headings.join(', ')}`);
    
    // Check for specific UI elements
    const sectionSelector = await page.locator('select, [role="combobox"]').filter({ hasText: /section/i }).count();
    const subjectSelector = await page.locator('select, [role="combobox"]').filter({ hasText: /subject|learning area/i }).count();
    
    console.log(`   📋 Section selector found: ${sectionSelector > 0 ? 'YES' : 'NO'}`);
    console.log(`   📚 Subject selector found: ${subjectSelector > 0 ? 'YES' : 'NO'}`);
    
    console.log('\n4️⃣  CONSOLE LOG SUMMARY');
    console.log('─'.repeat(80));
    
    console.log(`   Total console messages captured: ${consoleLogs.length + consoleErrors.length + consoleWarnings.length}`);
    console.log(`   - Regular logs: ${consoleLogs.length}`);
    console.log(`   - Warnings: ${consoleWarnings.length}`);
    console.log(`   - Errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n   🔴 ERRORS FOUND:');
      consoleErrors.forEach((err, i) => {
        console.log(`      ${i + 1}. ${err}`);
      });
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\n   ⚠️  WARNINGS FOUND:');
      consoleWarnings.slice(0, 10).forEach((warn, i) => {
        console.log(`      ${i + 1}. ${warn}`);
      });
      if (consoleWarnings.length > 10) {
        console.log(`      ... and ${consoleWarnings.length - 10} more warnings`);
      }
    }
    
    // Check for specific Firestore-related messages
    const firestoreLogs = consoleLogs.filter(log => 
      log.includes('Firestore') || 
      log.includes('grades') || 
      log.includes('useSchoolData') ||
      log.includes('📊') ||
      log.includes('📦') ||
      log.includes('📡')
    );
    
    if (firestoreLogs.length > 0) {
      console.log('\n   📊 FIRESTORE/DATA LOADING LOGS:');
      firestoreLogs.forEach((log, i) => {
        console.log(`      ${i + 1}. ${log}`);
      });
    } else {
      console.log('\n   ⚠️  NO Firestore/data loading logs found - this is unusual!');
    }
    
    console.log('\n5️⃣  NETWORK REQUESTS');
    console.log('─'.repeat(80));
    
    // Check for Firestore API calls
    const networkRequests: string[] = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('firestore.googleapis.com')) {
        networkRequests.push(`${req.method()} ${url}`);
      }
    });
    
    await page.waitForTimeout(5000); // Wait a bit more for network activity
    
    if (networkRequests.length > 0) {
      console.log(`   📡 Firestore API requests: ${networkRequests.length}`);
      networkRequests.slice(0, 5).forEach((req, i) => {
        console.log(`      ${i + 1}. ${req}`);
      });
    } else {
      console.log(`   ⚠️  NO Firestore API requests detected`);
    }
    
    console.log('\n6️⃣  SCREENSHOT AND TRACE');
    console.log('─'.repeat(80));
    
    await page.screenshot({ path: 'test-results/gradebook-diagnostic.png', fullPage: true });
    console.log('   📸 Screenshot saved: test-results/gradebook-diagnostic.png');
    
    console.log('\n═'.repeat(80));
    console.log('🏁 DIAGNOSTIC COMPLETE');
    console.log('═'.repeat(80));
    
    // Document findings
    console.log('\n📋 DIAGNOSTIC FINDINGS:');
    
    if (hasLoadingText) {
      console.log('   🔴 ISSUE: Page stuck on "Loading your data..." spinner');
      console.log('      → Data fetch is hanging or failing silently');
    }
    
    if (consoleErrors.some(err => err.includes('permission') || err.includes('Missing or insufficient'))) {
      console.log('   🔴 ISSUE: Firestore permission errors detected');
      console.log('      → Security rules may be blocking authenticated user');
    }
    
    if (firestoreLogs.some(log => log.includes('❌') || log.includes('error'))) {
      console.log('   🔴 ISSUE: useSchoolData hook reporting errors');
      console.log('      → Check the specific error messages above');
    }
    
    if (!hasGradeTable && !hasStudentList && !hasLoadingText) {
      console.log('   🔴 ISSUE: Page loaded but shows nothing');
      console.log('      → Component may have crashed or failed to render');
    }
    
    console.log('\n');
  });
});
