import { test, expect } from '@playwright/test';

/**
 * FOCUSED TEST: Reproduce Students Page Search Issue
 * 
 * Issue reported: Search filter not working on Students Page
 * Expected: Typing in search box should filter students
 * Actual: Search returns "No Students Found" even when students exist
 */

test.describe('Students Page - Search Issue Reproduction', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher - FORCE PRODUCTION SITE
    await page.goto('https://edusync-sis.web.app', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'pedro.reyes@edusync.edu');
    await page.fill('input[type="password"]', 'teacher123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 30000 });
    
    // Navigate to Students page
    await page.click('text=Students');
    
    // Wait for Students page to load
    await page.waitForTimeout(2000);
  });

  test('REPRO: Search students by name', async ({ page }) => {
    console.log('\n=== REPRODUCING SEARCH ISSUE ===');
    
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Capture network requests for students API
    const networkCalls: any[] = [];
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('students') || url.includes('search')) {
        try {
          const responseBody = await response.json().catch(() => null);
          networkCalls.push({
            url,
            status: response.status(),
            body: responseBody
          });
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    
    // Get initial student count
    const studentRows = page.locator('table tbody tr, .grid > div');
    const initialCount = await studentRows.count();
    console.log(`Initial students visible: ${initialCount}`);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/students-before-search.png', fullPage: true });
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    
    // Type a search query (common name)
    const searchQuery = 'Maria';
    console.log(`\nTyping search query: "${searchQuery}"`);
    await searchInput.fill(searchQuery);
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Get student count after search
    const searchResults = page.locator('table tbody tr, .grid > div');
    const afterSearchCount = await searchResults.count();
    console.log(`Students visible after search: ${afterSearchCount}`);
    
    // Check for "No Students Found" message
    const noStudentsMsg = page.locator('text=/No Students Found/i, text=/No students match/i');
    const isNoStudentsVisible = await noStudentsMsg.isVisible().catch(() => false);
    
    if (isNoStudentsVisible) {
      console.error('❌ BUG REPRODUCED: "No Students Found" message is showing');
      const msgText = await noStudentsMsg.textContent();
      console.error(`Message text: ${msgText}`);
    }
    
    // Take screenshot of search results
    await page.screenshot({ path: 'test-results/students-after-search.png', fullPage: true });
    
    // Print network calls
    console.log('\n=== NETWORK CALLS ===');
    networkCalls.forEach((call, idx) => {
      console.log(`\nCall ${idx + 1}:`);
      console.log(`  URL: ${call.url}`);
      console.log(`  Status: ${call.status}`);
      if (call.body) {
        console.log(`  Response: ${JSON.stringify(call.body).substring(0, 200)}...`);
      }
    });
    
    // Print console logs
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    
    // Analysis
    console.log('\n=== ANALYSIS ===');
    console.log(`Initial count: ${initialCount}`);
    console.log(`After search count: ${afterSearchCount}`);
    console.log(`"No Students" shown: ${isNoStudentsVisible}`);
    
    if (initialCount > 0 && afterSearchCount === 0 && isNoStudentsVisible) {
      console.error('\n❌ BUG CONFIRMED:');
      console.error('   - Students exist before search');
      console.error('   - After typing search query, count drops to 0');
      console.error('   - "No Students Found" message appears');
      console.error('\n   This indicates search is incorrectly filtering out all results');
    } else if (initialCount === 0) {
      console.warn('\n⚠️ ENVIRONMENT ISSUE:');
      console.warn('   - No students loaded initially');
      console.warn('   - Cannot test search without students');
      console.warn('   - Check if teacher has assigned sections with students');
    } else if (afterSearchCount > 0) {
      console.log('\n✅ SEARCH WORKING:');
      console.log(`   - Search returned ${afterSearchCount} results`);
    }
  });

  test('REPRO: Clear search button', async ({ page }) => {
    console.log('\n=== TESTING CLEAR SEARCH ===');
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    
    // Type search
    await searchInput.fill('Test Search');
    await page.waitForTimeout(500);
    
    // Find clear button (X button)
    const clearButton = page.locator('button[title="Clear search"], button:has-text("×"), button:has-text("✕")').first();
    const isClearVisible = await clearButton.isVisible().catch(() => false);
    
    if (isClearVisible) {
      console.log('Clear button is visible');
      
      // Click clear
      await clearButton.click();
      await page.waitForTimeout(500);
      
      // Check if search input is cleared
      const searchValue = await searchInput.inputValue();
      console.log(`Search value after clear: "${searchValue}"`);
      
      if (searchValue === '') {
        console.log('✅ Clear button works - search input cleared');
      } else {
        console.error('❌ BUG: Clear button did not clear search input');
      }
    } else {
      console.warn('⚠️ Clear button not found');
    }
  });

  test('REPRO: Grade Level filter', async ({ page }) => {
    console.log('\n=== TESTING GRADE LEVEL FILTER ===');
    
    // Find grade level dropdown
    const gradeDropdown = page.locator('select').filter({ hasText: /Grade Level|Grade|All Grades/i }).first();
    const isGradeVisible = await gradeDropdown.isVisible().catch(() => false);
    
    if (isGradeVisible) {
      // Get options
      const options = await gradeDropdown.locator('option').allTextContents();
      console.log('Grade Level options:', options);
      
      // Check if only assigned grades are shown
      const hasOtherGrades = options.some(opt => 
        opt.match(/Grade [^4]/) && !opt.includes('All')
      );
      
      if (hasOtherGrades) {
        console.error('❌ BUG: Teacher can see grades they are not assigned to');
        console.error('Available grades:', options);
      } else {
        console.log('✅ Grade filter shows only assigned grades');
      }
      
      // Select a grade
      if (options.length > 1) {
        await gradeDropdown.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        const studentCount = await page.locator('table tbody tr, .grid > div').count();
        console.log(`Students after grade filter: ${studentCount}`);
      }
    } else {
      console.warn('⚠️ Grade Level dropdown not found');
    }
  });
});
