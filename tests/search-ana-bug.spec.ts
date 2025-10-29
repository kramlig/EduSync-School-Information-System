import { test, expect } from '@playwright/test';

/**
 * REPRODUCE: Search for "Ana" returns 0 results when it should return 2
 */

test('Search for "Ana" should return 2 students', async ({ page }) => {
  console.log('\n=== REPRODUCING "Ana" SEARCH BUG ===\n');
  
  // Capture ALL console logs
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    // Print all useSchoolData and StudentList logs
    if (text.includes('useSchoolData') || text.includes('StudentList') || text.includes('Ana') || text.includes('ana')) {
      console.log(`📝 ${text}`);
    }
  });
  
  // Login to PRODUCTION
  await page.goto('https://edusync-sis.web.app');
  
  // Clear cache and storage to ensure fresh test
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  await page.fill('input[type="email"]', 'pedro.reyes@edusync.edu');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 30000 });
  
  // Navigate to Students page
  console.log('Navigating to Students page...');
  await page.click('text=Students');
  await page.waitForTimeout(2000);
  
  // Get initial count
  const initialTotal = await page.locator('text=TOTAL STUDENTS').locator('..').locator('text=/^\\d+$/').first().textContent();
  console.log(`Initial Total Students: ${initialTotal}`);
  
  const initialShowing = await page.locator('text=SHOWING').locator('..').locator('text=/^\\d+$/').first().textContent();
  console.log(`Initial Showing: ${initialShowing}`);
  
  // Screenshot before search
  await page.screenshot({ path: 'test-results/before-ana-search.png', fullPage: true });
  
  // Find search input
  const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
  await expect(searchInput).toBeVisible();
  
  // Type "Ana" exactly as user did
  console.log('\n🔍 Typing "Ana" in search box...');
  await searchInput.fill('Ana');
  
  // Wait for search to complete (increased to allow Firestore query to finish)
  await page.waitForTimeout(5000);
  
  // Get results after search
  const afterTotal = await page.locator('text=TOTAL STUDENTS').locator('..').locator('text=/^\\d+$/').first().textContent();
  const afterShowing = await page.locator('text=SHOWING').locator('..').locator('text=/^\\d+$/').first().textContent();
  
  console.log(`\nAfter searching "Ana":`);
  console.log(`  Total Students: ${afterTotal}`);
  console.log(`  Showing: ${afterShowing}`);
  
  // Count table rows
  const tableRows = await page.locator('table tbody tr').count();
  console.log(`  Table rows: ${tableRows}`);
  
  // Check for empty state
  const emptyState = await page.locator('text=/No Students Found|No students|No results/i').isVisible().catch(() => false);
  console.log(`  Empty state visible: ${emptyState}`);
  
  // Screenshot after search
  await page.screenshot({ path: 'test-results/after-ana-search.png', fullPage: true });
  
  // Get student names from table if any
  if (tableRows > 0) {
    const studentNames = await page.locator('table tbody tr td:first-child').allTextContents();
    console.log(`\n✅ Students found: ${studentNames.length}`);
    studentNames.forEach((name, idx) => {
      console.log(`  ${idx + 1}. ${name}`);
    });
  }
  
  // Print relevant console logs
  console.log('\n=== CONSOLE LOGS ===');
  const searchLogs = logs.filter(log => 
    log.toLowerCase().includes('search') ||
    log.toLowerCase().includes('ana') ||
    log.toLowerCase().includes('filter') ||
    log.toLowerCase().includes('visible')
  );
  searchLogs.forEach(log => console.log(log));
  
  // ANALYSIS
  console.log('\n=== ANALYSIS ===');
  if (afterShowing === '0' && emptyState) {
    console.error('❌ BUG CONFIRMED!');
    console.error('   Search for "Ana" returned 0 results');
    console.error('   Expected: 2 students with "Ana" in their name');
    console.error('\n   Possible causes:');
    console.error('   1. Search query is case-sensitive (searching "ana" vs "Ana")');
    console.error('   2. Server-side search not matching partial names');
    console.error('   3. Client-side filter still removing results after server returns them');
    console.error('   4. Search results being replaced by empty paginated list');
    throw new Error('Search for "Ana" returned 0 results when it should return 2 students');
  } else if (parseInt(afterShowing || '0') >= 2) {
    console.log('✅ Search working correctly!');
    console.log(`   Found ${afterShowing} students`);
  } else {
    console.warn(`⚠️ Found ${afterShowing} students, expected 2`);
  }
});
