import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://edusync-sis.web.app';

async function loginAsAdmin(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(2000);
  
  await page.click('button:has-text("Staff")');
  await page.waitForTimeout(500);
  
  await page.fill('input[type="email"]', 'admin@school.edu');
  await page.fill('input[type="password"]', 'password');
  
  await page.click('button[type="submit"]:has-text("Sign In")');
  await page.waitForTimeout(5000);
  
  console.log('✅ Logged in successfully');
}

test('Debug: Check sections data', async ({ page }) => {
  await loginAsAdmin(page);
  
  // Go to dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(5000);
  console.log('📊 Dashboard loaded');
  
  // Go to sections page to see if sections exist
  await page.goto(`${BASE_URL}/sections`);
  await page.waitForTimeout(3000);
  console.log('📚 Sections page loaded');
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/sections-page.png', fullPage: true });
  
  // Count sections in table/list
  const sectionCards = await page.locator('[class*="card"], tr').count();
  console.log(`Found ${sectionCards} section elements`);
  
  //  Now go to students page
  await page.goto(`${BASE_URL}/students`);
  await page.waitForTimeout(3000);
  console.log('👥 Students page loaded');
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/students-page.png', fullPage: true });
  
  // Open add modal
  await page.click('button:has-text("Add Student")');
  await page.waitForTimeout(3000);
  console.log('➕ Add Student modal opened');
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/add-student-modal.png', fullPage: true });
  
  // Check section dropdown
  const sectionOptions = await page.locator('select[name="sectionId"] option').count();
  console.log(`Found ${sectionOptions} section options in dropdown`);
  
  // List all options
  const options = await page.locator('select[name="sectionId"] option').allTextContents();
  console.log('Section options:', JSON.stringify(options));
  
  // Check if sections are being fetched (look for loading indicators)
  const loadingIndicators = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').count();
  console.log(`Found ${loadingIndicators} loading indicators`);
});
