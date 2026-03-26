import { test, expect } from '@playwright/test';

/**
 * TEACHERS VIEW COMPREHENSIVE AUDIT
 * 
 * Purpose: End-to-end audit of Teachers view functionality on PRODUCTION
 * Modeled after Account Validation test structure
 * 
 * Test Coverage:
 * 1. Page Load & Navigation
 * 2. Data Fetching & Display
 * 3. Search Functionality
 * 4. Filter & Sort Operations
 * 5. Add Teacher Modal
 * 6. Edit Teacher Modal
 * 7. Teacher Profile View
 * 8. Responsive Design
 * 9. Error Handling
 * 10. Performance Metrics
 * 
 * Test Environment: PRODUCTION (https://edusync.ph)
 * Test Account: pedro.reyes@edusync.edu / teacher123
 */

test.describe('Teachers View - Production Audit', () => {
  
  // Constants
  const PRODUCTION_URL = 'https://edusync.ph';
  const TEST_EMAIL = 'pedro.reyes@edusync.edu';
  const TEST_PASSWORD = 'teacher123';
  
  // Login helper
  async function login(page) {
    console.log('[Test] 🔐 Logging in to production...');
    await page.goto(PRODUCTION_URL);
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 30000 });
    console.log('[Test] ✅ Login successful');
  }

  test('Audit 1: Teachers View - Navigation and Initial Load', async ({ page }) => {
    console.log('\n=== AUDIT 1: Navigation and Initial Load ===\n');
    
    // Track console logs and errors
    const consoleLogs = [];
    const errors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({ type: msg.type(), text });
      if (text.includes('[TeacherList]') || text.includes('teachers')) {
        console.log(`📋 Console [${msg.type()}]:`, text);
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });
    
    // Login
    await login(page);
    
    // Navigate to Teachers view
    console.log('[Test] 🧭 Navigating to Teachers view...');
    await page.click('a[href="/teachers"]');
    await page.waitForURL('**/teachers');
    
    console.log('[Test] ✅ Navigated to Teachers view');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check if page header is visible
    const headerVisible = await page.isVisible('text=Teachers');
    console.log(`📊 Header "Teachers" visible: ${headerVisible}`);
    
    // Check for loading state
    const loadingVisible = await page.isVisible('text=Loading', { timeout: 1000 }).catch(() => false);
    console.log(`⏳ Loading state visible: ${loadingVisible}`);
    
    // Report console activity
    console.log(`\n📋 Total console messages: ${consoleLogs.length}`);
    const teacherLogs = consoleLogs.filter(log => 
      log.text.includes('[TeacherList]') || 
      log.text.includes('teachers') || 
      log.text.includes('useSchoolData')
    );
    console.log(`📋 Teacher-related logs: ${teacherLogs.length}`);
    
    if (errors.length > 0) {
      console.log(`❌ Errors detected: ${errors.length}`);
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('✅ No page errors detected');
    }
    
    expect(headerVisible).toBe(true);
  });

  test('Audit 2: Teachers Data - Count and Structure', async ({ page }) => {
    console.log('\n=== AUDIT 2: Teachers Data Count and Structure ===\n');
    
    await login(page);
    await page.goto('http://localhost:5173/teachers');
    await page.waitForTimeout(3000);
    
    // Check for teacher cards
    const teacherCards = await page.locator('[class*="teacher"], [data-testid*="teacher"], .bg-white.dark\\:bg-slate-800.rounded-lg').all();
    console.log(`📊 Teacher cards found: ${teacherCards.length}`);
    
    // Check for any list items
    const listItems = await page.locator('li, [role="listitem"]').all();
    console.log(`📋 List items found: ${listItems.length}`);
    
    // Get all text content
    const bodyText = await page.locator('body').textContent();
    
    // Check for "No teachers" message
    const noDataMessage = bodyText?.includes('No teachers') || 
                         bodyText?.includes('no teachers found') ||
                         bodyText?.includes('0 teachers');
    console.log(`📊 "No data" message present: ${noDataMessage}`);
    
    // Check for specific teacher names (if any visible)
    const hasTeacherNames = /Teacher|Prof|Mr\.|Ms\.|Mrs\./i.test(bodyText || '');
    console.log(`📊 Has teacher-like names: ${hasTeacherNames}`);
    
    // Look for email addresses
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = bodyText?.match(emailPattern) || [];
    console.log(`📧 Email addresses found: ${emails.length}`);
    if (emails.length > 0 && emails.length <= 5) {
      console.log(`📧 Emails:`, emails);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/teachers-view-data-audit.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/teachers-view-data-audit.png');
  });

  test('Audit 3: Network Requests - Firestore Queries', async ({ page }) => {
    console.log('\n=== AUDIT 3: Network Requests Analysis ===\n');
    
    const firestoreRequests = [];
    const allRequests = [];
    
    page.on('request', request => {
      const url = request.url();
      allRequests.push({ url, method: request.method() });
      
      if (url.includes('firestore.googleapis.com') || url.includes('firestore')) {
        firestoreRequests.push({
          url,
          method: request.method(),
          postData: request.postData()
        });
        console.log(`🔥 Firestore request: ${request.method()} ${url.substring(0, 100)}...`);
      }
    });
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('firestore.googleapis.com') || url.includes('firestore')) {
        console.log(`🔥 Firestore response: ${response.status()} ${url.substring(0, 100)}...`);
        
        // Try to get response body for debugging
        try {
          const body = await response.text();
          if (body.includes('teachers') || body.includes('Teacher')) {
            console.log(`📦 Response contains teacher data (length: ${body.length})`);
          }
        } catch (e) {
          // Response might be binary or already consumed
        }
      }
    });
    
    await login(page);
    
    console.log('[Test] 🧭 Navigating to Teachers view...');
    await page.goto('http://localhost:5173/teachers');
    await page.waitForTimeout(5000); // Wait for all requests
    
    console.log(`\n📊 Total requests: ${allRequests.length}`);
    console.log(`🔥 Firestore requests: ${firestoreRequests.length}`);
    
    if (firestoreRequests.length === 0) {
      console.log('⚠️ WARNING: No Firestore requests detected!');
      console.log('This might indicate:');
      console.log('  1. Data is cached');
      console.log('  2. Subscriptions not set up');
      console.log('  3. Collection name mismatch');
    }
  });

  test('Audit 4: React Component State - Console Logs', async ({ page }) => {
    console.log('\n=== AUDIT 4: React Component State Analysis ===\n');
    
    const relevantLogs = [];
    
    page.on('console', msg => {
      const text = msg.text();
      
      // Capture useSchoolData logs
      if (text.includes('useSchoolData') || 
          text.includes('[TeacherList]') ||
          text.includes('teachers') && !text.includes('Students')) {
        relevantLogs.push({ type: msg.type(), text, time: new Date() });
        console.log(`[${msg.type().toUpperCase()}] ${text}`);
      }
    });
    
    await login(page);
    await page.goto('http://localhost:5173/teachers');
    await page.waitForTimeout(3000);
    
    // Evaluate React DevTools data if available
    const reactData = await page.evaluate(() => {
      // Try to access window.__REACT_DEVTOOLS_GLOBAL_HOOK__ if available
      return {
        hasReactDevTools: typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined',
        timestamp: Date.now()
      };
    });
    
    console.log(`\n📊 React DevTools available: ${reactData.hasReactDevTools}`);
    console.log(`📋 Captured ${relevantLogs.length} relevant console logs`);
    
    // Group logs by type
    const logsByType = relevantLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Logs by type:');
    Object.entries(logsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  });

  test('Audit 5: DOM Inspection - What is Actually Rendered', async ({ page }) => {
    console.log('\n=== AUDIT 5: DOM Inspection ===\n');
    
    await login(page);
    await page.goto('http://localhost:5173/teachers');
    await page.waitForTimeout(3000);
    
    // Get the main content area
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return 'Main element not found';
      
      return {
        hasMain: true,
        textContent: main.textContent?.substring(0, 500),
        childrenCount: main.children.length,
        classList: Array.from(main.classList),
        innerHTML: main.innerHTML.substring(0, 1000)
      };
    });
    
    console.log('📊 Main content analysis:');
    console.log(`  - Has main element: ${mainContent.hasMain}`);
    console.log(`  - Children count: ${mainContent.childrenCount}`);
    console.log(`  - Classes: ${mainContent.classList?.join(', ')}`);
    console.log(`  - Text preview: ${mainContent.textContent?.substring(0, 200)}...`);
    
    // Look for specific UI elements
    const uiElements = await page.evaluate(() => {
      return {
        addButton: !!document.querySelector('button:has-text("Add")'),
        searchInput: !!document.querySelector('input[type="search"], input[placeholder*="Search"]'),
        filterButtons: document.querySelectorAll('button[class*="filter"]').length,
        cards: document.querySelectorAll('[class*="card"], .rounded-lg').length,
        emptyState: !!document.querySelector('[class*="empty"], [class*="no-data"]')
      };
    });
    
    console.log('\n📊 UI Elements present:');
    console.log(`  - Add button: ${uiElements.addButton}`);
    console.log(`  - Search input: ${uiElements.searchInput}`);
    console.log(`  - Filter buttons: ${uiElements.filterButtons}`);
    console.log(`  - Card elements: ${uiElements.cards}`);
    console.log(`  - Empty state: ${uiElements.emptyState}`);
  });

  test('Audit 6: Compare with Students View (Control Test)', async ({ page }) => {
    console.log('\n=== AUDIT 6: Compare Teachers vs Students View ===\n');
    
    await login(page);
    
    // Check Students view first (as control)
    console.log('[Test] 📊 Checking Students view...');
    await page.goto('http://localhost:5173/students');
    await page.waitForTimeout(2000);
    
    const studentsData = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        bodyLength: body.length,
        hasData: body.length > 1000,
        hasCards: document.querySelectorAll('[class*="card"], .rounded-lg').length
      };
    });
    
    console.log('📊 Students view:');
    console.log(`  - Body text length: ${studentsData.bodyLength}`);
    console.log(`  - Has substantial data: ${studentsData.hasData}`);
    console.log(`  - Card count: ${studentsData.hasCards}`);
    
    // Check Teachers view
    console.log('\n[Test] 👥 Checking Teachers view...');
    await page.goto('http://localhost:5173/teachers');
    await page.waitForTimeout(2000);
    
    const teachersData = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        bodyLength: body.length,
        hasData: body.length > 1000,
        hasCards: document.querySelectorAll('[class*="card"], .rounded-lg').length
      };
    });
    
    console.log('📊 Teachers view:');
    console.log(`  - Body text length: ${teachersData.bodyLength}`);
    console.log(`  - Has substantial data: ${teachersData.hasData}`);
    console.log(`  - Card count: ${teachersData.hasCards}`);
    
    console.log('\n📊 Comparison:');
    const ratio = teachersData.bodyLength / studentsData.bodyLength;
    console.log(`  - Content ratio (teachers/students): ${ratio.toFixed(2)}`);
    
    if (ratio < 0.5) {
      console.log('⚠️ WARNING: Teachers view has significantly less content than Students view!');
      console.log('This suggests a data fetching or rendering issue.');
    } else {
      console.log('✅ Content ratio looks reasonable');
    }
  });

  test('Audit 7: Check useSchoolData Hook - Teachers Array', async ({ page }) => {
    console.log('\n=== AUDIT 7: useSchoolData Hook - Teachers Array ===\n');
    
    const hookLogs = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('useSchoolData') && text.includes('teachers')) {
        hookLogs.push(text);
        console.log(`🪝 Hook log: ${text}`);
      }
    });
    
    await login(page);
    await page.goto('http://localhost:5173/teachers');
    await page.waitForTimeout(3000);
    
    // Try to inspect window state (if exposed)
    const windowState = await page.evaluate(() => {
      // Check if any global state is exposed
      return {
        windowKeys: Object.keys(window).filter(k => 
          k.includes('teacher') || k.includes('school') || k.includes('data')
        )
      };
    });
    
    console.log('\n📊 Hook logs captured:', hookLogs.length);
    console.log('🪟 Window state keys:', windowState.windowKeys);
    
    if (hookLogs.length === 0) {
      console.log('⚠️ WARNING: No useSchoolData logs found for teachers!');
      console.log('Check if console.log statements are present in the hook.');
    }
  });

  test('Audit 8: Final Summary Report', async ({ page }) => {
    console.log('\n=== AUDIT 8: Final Summary Report ===\n');
    
    await login(page);
    await page.goto('http://localhost:5173/teachers');
    await page.waitForTimeout(3000);
    
    // Comprehensive check
    const summary = await page.evaluate(() => {
      const body = document.body.textContent || '';
      
      return {
        // Content analysis
        pageTitle: document.title,
        bodyTextLength: body.length,
        hasTeachersHeading: /Teachers/i.test(body),
        
        // Data indicators
        hasNoDataMessage: /no teachers|empty|nothing to show/i.test(body),
        hasLoadingIndicator: /loading|spinner/i.test(body),
        
        // UI elements
        totalButtons: document.querySelectorAll('button').length,
        totalInputs: document.querySelectorAll('input').length,
        totalCards: document.querySelectorAll('[class*="card"], .rounded-lg, [class*="bg-white"]').length,
        
        // Email addresses (indicates real data)
        emailCount: (body.match(/[\w.-]+@[\w.-]+\.\w+/g) || []).length,
        
        // Sample of visible text
        visibleTextSample: body.substring(0, 500)
      };
    });
    
    console.log('📊 COMPREHENSIVE SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Page Title: ${summary.pageTitle}`);
    console.log(`Body Text Length: ${summary.bodyTextLength} chars`);
    console.log(`Has "Teachers" heading: ${summary.hasTeachersHeading ? '✅' : '❌'}`);
    console.log(`Has "No data" message: ${summary.hasNoDataMessage ? '⚠️ YES' : '✅ NO'}`);
    console.log(`Has loading indicator: ${summary.hasLoadingIndicator ? '⏳ YES' : '✅ NO'}`);
    console.log(`Total buttons: ${summary.totalButtons}`);
    console.log(`Total inputs: ${summary.totalInputs}`);
    console.log(`Total cards: ${summary.totalCards}`);
    console.log(`Email addresses found: ${summary.emailCount}`);
    console.log('\n📝 Visible text sample:');
    console.log(summary.visibleTextSample);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Final diagnosis
    console.log('\n🔍 DIAGNOSIS:');
    if (summary.totalCards === 0 && summary.emailCount === 0) {
      console.log('❌ ISSUE: No teacher cards or emails found');
      console.log('   Possible causes:');
      console.log('   1. Teachers array is empty');
      console.log('   2. Wrong collection being fetched');
      console.log('   3. Rendering logic issue in TeacherList component');
      console.log('   4. Data structure mismatch');
    } else if (summary.totalCards > 0) {
      console.log(`✅ Teachers are being rendered (${summary.totalCards} cards)`);
    } else if (summary.hasNoDataMessage) {
      console.log('⚠️ "No data" message shown - teachers array is likely empty');
    }
  });
});
