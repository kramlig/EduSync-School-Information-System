import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Grades Display - PostgreSQL', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/admin`);
    await page.fill('input[type="email"]', 'default-admin@test.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display students and grades in academic gradebook', async ({ page }) => {
    // Navigate to academic grades
    await page.goto(`${BASE_URL}/admin/grades/academic`);
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[GradebookView]')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/grades-academic.png', fullPage: true });
    
    // Check if table body exists
    const tbody = page.locator('tbody');
    await expect(tbody).toBeVisible();
    
    // Count rows in table
    const rows = tbody.locator('tr');
    const rowCount = await rows.count();
    
    console.log('=== TEST RESULTS ===');
    console.log('Table rows found:', rowCount);
    console.log('Console logs:', consoleLogs);
    
    // Verify we have students
    expect(rowCount).toBeGreaterThan(0);
    
    // Print first student name if exists
    if (rowCount > 0) {
      const firstRow = rows.first();
      const studentName = await firstRow.locator('td').nth(1).textContent();
      console.log('First student:', studentName);
    }
  });

  test('should show section dropdown and select a section', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/grades/academic`);
    await page.waitForTimeout(2000);
    
    // Find section dropdown
    const sectionDropdown = page.locator('select').first();
    await expect(sectionDropdown).toBeVisible();
    
    // Get all options
    const options = await sectionDropdown.locator('option').all();
    console.log('Section options count:', options.length);
    
    for (const option of options) {
      const text = await option.textContent();
      console.log('Section option:', text);
    }
    
    // Select "All Sections" if available
    await sectionDropdown.selectOption({ index: 0 });
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/grades-all-sections.png', fullPage: true });
    
    // Count rows again
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    console.log('Rows after selecting all sections:', rowCount);
  });

  test('DEBUG: dump all data from page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/grades/academic`);
    await page.waitForTimeout(3000);
    
    // Get all console logs
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.waitForTimeout(1000);
    
    // Get page state
    const pageData = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        tableRows: document.querySelectorAll('tbody tr').length,
        hasTable: !!document.querySelector('table'),
        hasTbody: !!document.querySelector('tbody'),
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('=== PAGE DEBUG ===');
    console.log('URL:', pageData.url);
    console.log('Title:', pageData.title);
    console.log('Table exists:', pageData.hasTable);
    console.log('Tbody exists:', pageData.hasTbody);
    console.log('Table rows:', pageData.tableRows);
    console.log('Page text:', pageData.bodyText);
    console.log('\n=== CONSOLE LOGS ===');
    logs.filter(l => l.includes('GradebookView')).forEach(l => console.log(l));
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/grades-debug.png', fullPage: true });
  });
});
