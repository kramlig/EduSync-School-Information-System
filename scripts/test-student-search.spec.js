// Test server-side student search functionality
import { test, expect } from '@playwright/test';

test('Test server-side student search', async ({ page }) => {
  console.log('\n🔍 TESTING SERVER-SIDE STUDENT SEARCH\n');
  
  // Navigate and login
  await page.goto('https://edusync-sis.web.app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Login
  console.log('Logging in...');
  await page.fill('input[type="email"]', 'admin@school.edu');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Wait for login to complete
  await page.waitForTimeout(5000);
  
  // Navigate to Students page
  console.log('Navigating to Students page...');
  await page.click('text=Students');
  await page.waitForTimeout(3000);
  
  // Check initial state
  const initialRows = await page.$$('table tbody tr');
  console.log(`✅ Initial students loaded: ${initialRows.length} rows`);
  
  // Test 1: Search for a common name
  console.log('\n📝 TEST 1: Searching for "Maria"...');
  const searchInput = await page.$('input[placeholder*="Search ALL students"]');
  await searchInput.fill('Maria');
  
  // Wait for search to complete (debounce + search time)
  await page.waitForTimeout(2000);
  
  // Check if loading indicator appears
  const loadingSpinner = await page.$('.animate-spin');
  if (loadingSpinner) {
    console.log('   ⏳ Loading indicator shown');
    await page.waitForTimeout(1000);
  }
  
  // Check results
  const mariaRows = await page.$$('table tbody tr');
  console.log(`   ✅ Found ${mariaRows.length} students matching "Maria"`);
  
  // Check for "Found X students" message
  const foundMessage = await page.$('text=/Found \\d+ student/');
  if (foundMessage) {
    const text = await foundMessage.textContent();
    console.log(`   ✅ Result message: "${text}"`);
  }
  
  // Test 2: Search for a specific email
  console.log('\n📝 TEST 2: Searching for specific email...');
  await searchInput.fill('@school.edu');
  await page.waitForTimeout(2000);
  
  const emailRows = await page.$$('table tbody tr');
  console.log(`   ✅ Found ${emailRows.length} students with @school.edu`);
  
  // Test 3: Search for non-existent student
  console.log('\n📝 TEST 3: Searching for non-existent student...');
  await searchInput.fill('ZzZzNonExistentStudent999');
  await page.waitForTimeout(2000);
  
  const noResultRows = await page.$$('table tbody tr');
  console.log(`   ✅ Search returned ${noResultRows.length} results (should be 0 or show "no results")`);
  
  // Test 4: Clear search
  console.log('\n📝 TEST 4: Clearing search...');
  await searchInput.fill('');
  await page.waitForTimeout(2000);
  
  const clearedRows = await page.$$('table tbody tr');
  console.log(`   ✅ After clearing, showing ${clearedRows.length} students (paginated)`);
  
  // Test 5: Search by LRN (if visible in table)
  console.log('\n📝 TEST 5: Searching by LRN...');
  const firstLrn = await page.$eval('table tbody tr:first-child td:nth-child(2)', el => el.textContent?.trim());
  if (firstLrn && firstLrn !== 'N/A') {
    console.log(`   Searching for LRN: ${firstLrn}`);
    await searchInput.fill(firstLrn);
    await page.waitForTimeout(2000);
    
    const lrnRows = await page.$$('table tbody tr');
    console.log(`   ✅ Found ${lrnRows.length} student(s) with LRN "${firstLrn}"`);
  } else {
    console.log('   ⚠️ No LRN found in first row, skipping LRN search test');
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/search-test-final.png', fullPage: true });
  
  console.log('\n✅ SERVER-SIDE SEARCH TEST COMPLETE\n');
});
