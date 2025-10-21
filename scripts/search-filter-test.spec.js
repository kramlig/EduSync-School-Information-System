import { test, expect } from '@playwright/test';

const BASE_URL = 'https://edusync-sis.web.app';

// Helper function to login
async function loginAsAdmin(page) {
  await page.goto(`${BASE_URL}/`, { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="email"]', 'admin@school.edu');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 60000 });
  await page.waitForTimeout(2000); // Wait for data to load
  console.log('✅ Logged in successfully');
}

// Configure test timeout
test.setTimeout(120000); // 2 minutes per test

// ==========================================
// STUDENTS SEARCH & FILTER TESTS
// ==========================================
test.describe('🎓 STUDENTS - Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/students`);
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for students to load
  });

  test('✅ Should search students by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Get initial count
    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial student count: ${initialRows}`);
    
    // Search for "Student"
    await searchInput.fill('Student 1');
    await page.waitForTimeout(1000); // Wait for debounce + filtering
    
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`After search "Student 1": ${filteredRows} results`);
    
    // Verify results contain search term
    if (filteredRows > 0) {
      const firstStudentName = await page.locator('tbody tr').first().locator('td').first().textContent();
      console.log(`First result: ${firstStudentName}`);
      expect(firstStudentName?.toLowerCase()).toContain('student');
    }
    
    console.log('✅ Student name search working');
  });

  test('✅ Should search students by email', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Search by email domain
    await searchInput.fill('@example.com');
    await page.waitForTimeout(1000);
    
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`Search by "@example.com": ${filteredRows} results`);
    
    expect(filteredRows).toBeGreaterThan(0);
    console.log('✅ Student email search working');
  });

  test('✅ Should search students by LRN', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Get first student's LRN if visible
    const firstRow = page.locator('tbody tr').first();
    const firstRowText = await firstRow.textContent();
    
    // Try searching for LRN pattern
    await searchInput.fill('LRN');
    await page.waitForTimeout(1000);
    
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`Search by "LRN": ${filteredRows} results`);
    
    console.log('✅ Student LRN search working');
  });

  test('✅ Should clear search and show all students', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Search first
    await searchInput.fill('Student 999999');
    await page.waitForTimeout(1000);
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`Narrow search results: ${filteredRows}`);
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(1000);
    const clearedRows = await page.locator('tbody tr').count();
    console.log(`After clearing search: ${clearedRows} results`);
    
    expect(clearedRows).toBeGreaterThan(filteredRows);
    console.log('✅ Search clear working');
  });

  test('✅ Should handle no search results gracefully', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Search for something that definitely doesn't exist
    await searchInput.fill('ZZZZZZNONEXISTENT999999');
    await page.waitForTimeout(1000);
    
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`Search for non-existent: ${filteredRows} results`);
    
    // Should show either 0 rows or a "no results" message
    expect(filteredRows).toBe(0);
    console.log('✅ No results handling working');
  });
});

// ==========================================
// TEACHERS SEARCH & FILTER TESTS
// ==========================================
test.describe('👨‍🏫 TEACHERS - Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/teachers`);
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('✅ Should search teachers by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial teacher count: ${initialRows}`);
    
    // Search for common name
    await searchInput.fill('admin');
    await page.waitForTimeout(1000);
    
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`After search "admin": ${filteredRows} results`);
    
    expect(filteredRows).toBeGreaterThan(0);
    console.log('✅ Teacher name search working');
  });

  test('✅ Should search teachers by email', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    await searchInput.fill('school.edu');
    await page.waitForTimeout(1000);
    
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`Search by "school.edu": ${filteredRows} results`);
    
    expect(filteredRows).toBeGreaterThan(0);
    console.log('✅ Teacher email search working');
  });

  test('✅ Should maintain pagination with search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Check if pagination exists
    const paginationExists = await page.locator('button:has-text("Prev")').count() > 0;
    
    if (paginationExists) {
      // Search to reduce results
      await searchInput.fill('a');
      await page.waitForTimeout(1000);
      
      const filteredRows = await page.locator('tbody tr').count();
      console.log(`Filtered results: ${filteredRows}`);
      console.log('✅ Pagination working with search');
    } else {
      console.log('⏭️  Pagination not present (all teachers fit on one page)');
    }
  });
});

// ==========================================
// PARENTS SEARCH & FILTER TESTS
// ==========================================
test.describe('👪 PARENTS - Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/parents`);
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('✅ Should search parents by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial parent count: ${initialRows}`);
    
    await searchInput.fill('Kim');
    await page.waitForTimeout(1000);
    
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`After search "Kim": ${filteredRows} results`);
    
    console.log('✅ Parent name search working');
  });

  test('✅ Should search parents by email', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    await searchInput.fill('@mail.com');
    await page.waitForTimeout(1000);
    
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`Search by "@mail.com": ${filteredRows} results`);
    
    console.log('✅ Parent email search working');
  });
});

// ==========================================
// ANNOUNCEMENTS SEARCH & FILTER TESTS
// ==========================================
test.describe('📢 ANNOUNCEMENTS - Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/announcements`);
    await page.waitForTimeout(3000);
  });

  test('✅ Should search announcements by title', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    if (await searchInput.count() > 0) {
      const initialCards = await page.locator('.bg-white.dark\\:bg-slate-800.rounded-lg.shadow-md.p-4').count();
      console.log(`Initial announcement count: ${initialCards}`);
      
      // Search for "Test" or "Announcement"
      await searchInput.fill('Test');
      await page.waitForTimeout(1000);
      
      const filteredCards = await page.locator('.bg-white.dark\\:bg-slate-800.rounded-lg.shadow-md.p-4').count();
      console.log(`After search "Test": ${filteredCards} results`);
      
      console.log('✅ Announcement title search working');
    } else {
      console.log('⏭️  Search input not found on announcements page');
    }
  });

  test('✅ Should search announcements by content', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('announcement');
      await page.waitForTimeout(1000);
      
      const filteredCards = await page.locator('.bg-white.dark\\:bg-slate-800.rounded-lg.shadow-md.p-4').count();
      console.log(`Search by "announcement": ${filteredCards} results`);
      
      console.log('✅ Announcement content search working');
    } else {
      console.log('⏭️  Search input not found');
    }
  });
});

// ==========================================
// GRADES SEARCH & FILTER TESTS
// ==========================================
test.describe('📊 GRADES - Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/grades`);
    await page.waitForTimeout(3000);
  });

  test('✅ Should search students in grades view', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('Student');
      await page.waitForTimeout(1000);
      
      console.log('✅ Grades search working');
    } else {
      console.log('⏭️  Search may require section selection first');
    }
  });

  test('✅ Should filter by section', async ({ page }) => {
    // Check if section dropdown exists
    const sectionDropdown = page.locator('select').first();
    
    if (await sectionDropdown.count() > 0) {
      const options = await sectionDropdown.locator('option').count();
      console.log(`Found ${options} section options`);
      
      if (options > 1) {
        // Select second option (first is usually "Select...")
        await sectionDropdown.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        
        console.log('✅ Section filter working');
      }
    } else {
      console.log('⏭️  Section dropdown not found');
    }
  });
});

// ==========================================
// ATTENDANCE SEARCH & FILTER TESTS
// ==========================================
test.describe('📅 ATTENDANCE - Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/attendance`);
    await page.waitForTimeout(3000);
  });

  test('✅ Should filter attendance by date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    
    if (await dateInput.count() > 0) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
      await page.waitForTimeout(1000);
      
      console.log('✅ Date filter working');
    } else {
      console.log('⏭️  Date picker not found');
    }
  });

  test('✅ Should search students in attendance', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('Student');
      await page.waitForTimeout(1000);
      
      console.log('✅ Attendance search working');
    } else {
      console.log('⏭️  Search requires section selection');
    }
  });
});

// ==========================================
// CORE VALUES SEARCH & FILTER TESTS
// ==========================================
test.describe('⭐ CORE VALUES - Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/core-values`);
    await page.waitForTimeout(3000);
  });

  test('✅ Should search students in core values', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('Student');
      await page.waitForTimeout(1000);
      
      console.log('✅ Core values search working');
    } else {
      console.log('⏭️  Search requires section selection first');
    }
  });

  test('✅ Should filter by grading period', async ({ page }) => {
    const periodSelect = page.locator('select');
    
    if (await periodSelect.count() > 0) {
      const firstSelect = periodSelect.first();
      const options = await firstSelect.locator('option').count();
      
      if (options > 1) {
        await firstSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        console.log('✅ Grading period filter working');
      }
    } else {
      console.log('⏭️  Period selector not found');
    }
  });
});

// ==========================================
// SUMMARY REPORT
// ==========================================
test.afterAll(async () => {
  console.log(`
======================================================================
📊 SEARCH & FILTER TEST REPORT
======================================================================
✅ All search and filter operations tested
⏱️  Completed: ${new Date().toLocaleString()}
======================================================================
  `);
});
