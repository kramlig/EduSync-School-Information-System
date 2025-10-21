/**
 * STUDENT SEARCH - COMPREHENSIVE DIAGNOSTIC TOOL
 * 
 * This script performs intensive debugging and testing of the student search functionality
 * Reports detailed information about data flow, component state, and potential issues
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://edusync-sis.web.app';

test.setTimeout(180000); // 3 minutes per test

// Login helper
async function loginAsAdmin(page) {
  console.log('\n🔐 STEP 1: Logging in...');
  await page.goto(`${BASE_URL}/`, { timeout: 90000, waitUntil: 'domcontentloaded' });
  
  // Clear any old session from localStorage
  await page.evaluate(() => {
    localStorage.clear();
    console.log('[Test] 🗑️ Cleared localStorage');
  });
  
  // Reload to ensure clean state
  await page.reload({ waitUntil: 'domcontentloaded' });
  
  // Wait for data to load first
  await page.waitForFunction(() => {
    const log = localStorage.getItem('edusync_session');
    return !log; // Wait until there's no session (clean state)
  }, { timeout: 5000 }).catch(() => {});
  
  // Try Quick Login button instead (debug feature)
  console.log('   Looking for Quick Login button...');
  const quickLoginButton = await page.$('button:has-text("Quick Login")');
  
  if (quickLoginButton) {
    console.log('   Found Quick Login button, clicking it...');
    await quickLoginButton.click();
  } else {
    console.log('   Quick Login not found, using form...');
    await page.fill('input[type="email"]', 'admin@school.edu');
    await page.fill('input[type="password"]', 'password');
    console.log('   Clicking submit...');
    await page.click('button[type="submit"]');
  }
  
  // Wait for navigation with extended timeout
  try {
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    console.log('   ✅ Login successful - Redirected to dashboard');
  } catch (error) {
    console.log('   ⚠️  URL didn\'t change to dashboard, checking current URL...');
    const currentURL = page.url();
    console.log(`   Current URL: ${currentURL}`);
    
    if (currentURL.includes('/dashboard')) {
      console.log('   ✅ Already on dashboard');
    } else {
      throw new Error(`Failed to reach dashboard. Current URL: ${currentURL}`);
    }
  }
  
  await page.waitForTimeout(3000); // Wait for initial data load
  console.log('   ✅ Login complete\n');
}

test.describe('🔬 INTENSIVE STUDENT SEARCH DEBUGGING', () => {
  
  test('🧪 DIAGNOSTIC 1: Check students page loads and data is available', async ({ page }) => {
    // Enable console monitoring
    const consoleLogs = [];
    const consoleErrors = [];
    const consoleWarnings = [];
    const networkRequests = [];
    const networkErrors = [];

    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`   ❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`   ⚠️  Console Warning: ${text}`);
      } else if (text.includes('Firestore') || text.includes('student') || text.includes('Student')) {
        consoleLogs.push(text);
        console.log(`   📝 Console: ${text}`);
      }
    });

    page.on('request', request => {
      if (request.url().includes('firestore') || request.url().includes('students')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log(`   🌐 Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure()
      });
      console.log(`   ❌ Request Failed: ${request.url()}`);
    });

    // Login
    await loginAsAdmin(page);
    
    console.log('🔍 STEP 2: Navigating to students page...');
    await page.goto(`${BASE_URL}/students`, { timeout: 90000, waitUntil: 'networkidle' });
    console.log('   ✅ Students page loaded\n');
    
    console.log('⏱️  STEP 3: Waiting for students to load...');
    await page.waitForTimeout(10000); // Extended wait for data
    
    // Check if loading indicator is visible
    const loadingIndicator = await page.locator('text=Loading').count();
    console.log(`   Loading indicators found: ${loadingIndicator}`);
    
    // Check search input
    console.log('\n🔍 STEP 4: Checking search input field...');
    const searchInput = page.locator('input[placeholder*="Search"]');
    const searchInputCount = await searchInput.count();
    console.log(`   Search input elements found: ${searchInputCount}`);
    
    if (searchInputCount > 0) {
      const isVisible = await searchInput.first().isVisible();
      const isEnabled = await searchInput.first().isEnabled();
      const placeholder = await searchInput.first().getAttribute('placeholder');
      console.log(`   ✅ Search input visible: ${isVisible}`);
      console.log(`   ✅ Search input enabled: ${isEnabled}`);
      console.log(`   ✅ Placeholder text: "${placeholder}"`);
    } else {
      console.log('   ❌ No search input found!');
    }
    
    // Check table presence
    console.log('\n📊 STEP 5: Checking student table...');
    const tableRows = await page.locator('tbody tr').count();
    console.log(`   Table rows found: ${tableRows}`);
    
    if (tableRows > 0) {
      // Get first 3 students' names
      console.log('\n   First 3 students:');
      for (let i = 0; i < Math.min(3, tableRows); i++) {
        const row = page.locator('tbody tr').nth(i);
        const nameCell = await row.locator('td').first().textContent();
        console.log(`   ${i + 1}. ${nameCell}`);
      }
    } else {
      console.log('   ⚠️  No student rows found in table');
      
      // Check for "no results" message
      const noResults = await page.locator('text=No students found').count();
      if (noResults > 0) {
        console.log('   ℹ️  "No students found" message is displayed');
      }
    }
    
    // Check pagination
    console.log('\n📄 STEP 6: Checking pagination...');
    const nextButton = await page.locator('button:has-text("Next")').count();
    const prevButton = await page.locator('button:has-text("Prev")').count();
    console.log(`   Next button found: ${nextButton > 0 ? 'Yes' : 'No'}`);
    console.log(`   Prev button found: ${prevButton > 0 ? 'Yes' : 'No'}`);
    
    if (nextButton > 0) {
      const nextDisabled = await page.locator('button:has-text("Next")').isDisabled();
      console.log(`   Next button disabled: ${nextDisabled}`);
    }
    
    // Check showing count text
    const showingText = await page.locator('text=/Showing .* of .* Students/').count();
    if (showingText > 0) {
      const countText = await page.locator('text=/Showing .* of .* Students/').textContent();
      console.log(`   ✅ Count display: "${countText}"`);
    }
    
    // Summary of console activity
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log(`   Console Errors: ${consoleErrors.length}`);
    console.log(`   Console Warnings: ${consoleWarnings.length}`);
    console.log(`   Console Logs (relevant): ${consoleLogs.length}`);
    console.log(`   Network Requests: ${networkRequests.length}`);
    console.log(`   Network Errors: ${networkErrors.length}`);
    console.log(`   Students Loaded: ${tableRows}`);
    console.log('═══════════════════════════════════════\n');
    
    // Report errors if any
    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS DETECTED:');
      consoleErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }
    
    if (networkErrors.length > 0) {
      console.log('\n❌ NETWORK ERRORS DETECTED:');
      networkErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err.url} - ${JSON.stringify(err.failure)}`));
    }
    
    // Verify basic functionality
    expect(searchInputCount).toBeGreaterThan(0);
    expect(consoleErrors.length).toBe(0);
  });

  test('🧪 DIAGNOSTIC 2: Test search functionality step-by-step', async ({ page }) => {
    console.log('\n===========================================');
    console.log('   TESTING SEARCH FUNCTIONALITY');
    console.log('===========================================\n');
    
    // Monitor search-related console logs
    const searchLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.toLowerCase().includes('search') || text.toLowerCase().includes('filter') || text.toLowerCase().includes('student')) {
        searchLogs.push({ type: msg.type(), text });
        console.log(`   [${msg.type().toUpperCase()}] ${text}`);
      }
    });
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/students`, { timeout: 90000, waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    
    // Test 1: Get initial state
    console.log('📊 TEST 1: Initial state');
    const initialRows = await page.locator('tbody tr').count();
    console.log(`   Initial student rows: ${initialRows}`);
    
    if (initialRows === 0) {
      console.log('   ⚠️  WARNING: No students visible initially!');
      console.log('   This could indicate:');
      console.log('   1. Data not loaded');
      console.log('   2. Permission issue');
      console.log('   3. Component rendering issue');
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/no-students-initial.png' });
      console.log('   📸 Screenshot saved: test-results/no-students-initial.png');
    }
    
    // Test 2: Type search query slowly
    console.log('\n📊 TEST 2: Typing search query "Student"');
    await searchInput.clear();
    await searchInput.fill('Student', { delay: 100 }); // Slow typing to see each character
    console.log('   Query typed, waiting for debounce (500ms)...');
    await page.waitForTimeout(1000); // Wait for debounce + filtering
    
    const searchRows = await page.locator('tbody tr').count();
    console.log(`   Rows after search: ${searchRows}`);
    
    // Test 3: Check input value
    const inputValue = await searchInput.inputValue();
    console.log(`   Input value: "${inputValue}"`);
    
    // Test 4: Try different search terms
    const searchTerms = [
      { term: 'Student 1', expected: 'Should find students starting with "Student 1"' },
      { term: '@example.com', expected: 'Should find students with example.com email' },
      { term: 'NONEXISTENT999', expected: 'Should show no results' }
    ];
    
    for (const { term, expected } of searchTerms) {
      console.log(`\n📊 TEST: Searching for "${term}"`);
      console.log(`   Expected: ${expected}`);
      
      await searchInput.clear();
      await searchInput.fill(term);
      await page.waitForTimeout(1000); // Debounce + filter
      
      const rows = await page.locator('tbody tr').count();
      console.log(`   Results: ${rows} rows`);
      
      if (rows > 0) {
        const firstName = await page.locator('tbody tr').first().locator('td').first().textContent();
        console.log(`   First result: ${firstName}`);
      }
      
      // Take screenshot
      const safeTerm = term.replace(/[^a-zA-Z0-9]/g, '_');
      await page.screenshot({ path: `test-results/search-${safeTerm}.png` });
    }
    
    // Test 5: Clear search
    console.log('\n📊 TEST 5: Clearing search');
    await searchInput.clear();
    await page.waitForTimeout(1000);
    
    const clearedRows = await page.locator('tbody tr').count();
    console.log(`   Rows after clear: ${clearedRows}`);
    
    // Test 6: Check if search is affecting pagination
    console.log('\n📊 TEST 6: Search + Pagination interaction');
    await searchInput.fill('Student');
    await page.waitForTimeout(1000);
    
    const hasNext = await page.locator('button:has-text("Next")').count() > 0;
    if (hasNext) {
      const nextDisabled = await page.locator('button:has-text("Next")').isDisabled();
      console.log(`   Next button exists: Yes`);
      console.log(`   Next button disabled: ${nextDisabled}`);
      
      if (!nextDisabled) {
        console.log('   Clicking Next button...');
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(2000);
        
        const page2Rows = await page.locator('tbody tr').count();
        console.log(`   Page 2 rows: ${page2Rows}`);
      }
    }
    
    // Final summary
    console.log('\n📊 SEARCH TEST SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log(`   Initial rows: ${initialRows}`);
    console.log(`   After "Student": ${searchRows}`);
    console.log(`   After clear: ${clearedRows}`);
    console.log(`   Search-related logs: ${searchLogs.length}`);
    console.log('═══════════════════════════════════════\n');
    
    expect(searchInput).toBeTruthy();
  });

  test('🧪 DIAGNOSTIC 3: Check React component state and data flow', async ({ page }) => {
    console.log('\n===========================================');
    console.log('   CHECKING REACT STATE & DATA FLOW');
    console.log('===========================================\n');
    
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/students`, { timeout: 90000 });
    await page.waitForTimeout(5000);
    
    // Inject debug script to check React state
    const componentState = await page.evaluate(() => {
      // Try to access React DevTools
      const root = document.getElementById('root');
      if (!root) return { error: 'No root element' };
      
      // Get all table rows
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const studentData = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          name: cells[0]?.textContent?.trim(),
          email: cells[1]?.textContent?.trim() || 'N/A'
        };
      });
      
      // Get search input
      const searchInput = document.querySelector('input[placeholder*="Search"]');
      
      return {
        studentsVisible: rows.length,
        studentsSample: studentData.slice(0, 3),
        searchInputExists: !!searchInput,
        searchInputValue: searchInput?.value || '',
        searchInputPlaceholder: searchInput?.placeholder || '',
        hasLoadingIndicator: !!document.querySelector('text=Loading'),
        hasErrorMessage: !!document.querySelector('[class*="error"]'),
      };
    });
    
    console.log('📊 REACT COMPONENT STATE:');
    console.log(JSON.stringify(componentState, null, 2));
    
    // Check if we can access window variables
    const windowVars = await page.evaluate(() => {
      return {
        hasReactDevTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        userAgent: navigator.userAgent,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      };
    });
    
    console.log('\n📊 WINDOW STATE:');
    console.log(JSON.stringify(windowVars, null, 2));
    
    expect(componentState.searchInputExists).toBe(true);
  });

  test('🧪 DIAGNOSTIC 4: Performance and timing analysis', async ({ page }) => {
    console.log('\n===========================================');
    console.log('   PERFORMANCE & TIMING ANALYSIS');
    console.log('===========================================\n');
    
    const timings = {
      loginStart: 0,
      loginEnd: 0,
      pageLoadStart: 0,
      pageLoadEnd: 0,
      dataLoadStart: 0,
      dataLoadEnd: 0,
      searchStart: 0,
      searchEnd: 0,
    };
    
    timings.loginStart = Date.now();
    await loginAsAdmin(page);
    timings.loginEnd = Date.now();
    
    timings.pageLoadStart = Date.now();
    await page.goto(`${BASE_URL}/students`, { timeout: 90000 });
    timings.pageLoadEnd = Date.now();
    
    timings.dataLoadStart = Date.now();
    await page.waitForTimeout(5000);
    timings.dataLoadEnd = Date.now();
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    
    timings.searchStart = Date.now();
    await searchInput.fill('Student');
    await page.waitForTimeout(1000); // Debounce
    timings.searchEnd = Date.now();
    
    console.log('⏱️  TIMING ANALYSIS:');
    console.log('═══════════════════════════════════════');
    console.log(`   Login time: ${timings.loginEnd - timings.loginStart}ms`);
    console.log(`   Page load time: ${timings.pageLoadEnd - timings.pageLoadStart}ms`);
    console.log(`   Data load time: ${timings.dataLoadEnd - timings.dataLoadStart}ms`);
    console.log(`   Search execution: ${timings.searchEnd - timings.searchStart}ms`);
    console.log(`   Total time: ${timings.searchEnd - timings.loginStart}ms`);
    console.log('═══════════════════════════════════════\n');
    
    // Check if times are reasonable
    const loginTime = timings.loginEnd - timings.loginStart;
    const searchTime = timings.searchEnd - timings.searchStart;
    
    if (loginTime > 60000) {
      console.log('   ⚠️  WARNING: Login took over 60 seconds!');
    }
    
    if (searchTime > 5000) {
      console.log('   ⚠️  WARNING: Search took over 5 seconds!');
    }
    
    console.log('✅ Performance analysis complete\n');
  });
});

// Final report
test.afterAll(async () => {
  console.log('\n===========================================');
  console.log('   DIAGNOSTIC TEST SUITE COMPLETE');
  console.log('===========================================\n');
  console.log('📁 Check test-results/ folder for screenshots');
  console.log('📊 Review console output above for details\n');
});
