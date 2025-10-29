/**
 * Form 137 Diagnostic Test
 * Simple test to see what's actually on the page
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'admin@school.edu';
const TEST_PASSWORD = 'admin123';

test('Diagnostic: Check Form 137 page', async ({ page }) => {
  console.log('1. Going to login page...');
  await page.goto(`${BASE_URL}/login`);
  
  console.log('2. Filling credentials...');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  
  console.log('3. Clicking submit...');
  await page.click('button[type="submit"]');
  
  console.log('4. Waiting for dashboard...');
  await page.waitForTimeout(5000); // Give it time
  
  console.log('5. Current URL:', page.url());
  
  // Navigate through UI
  console.log('6. Looking for DepEd Forms in sidebar...');
  
  // Try multiple selector strategies
  const depedFormsSelectors = [
    'a[href="/forms"]',
    'a:has-text("DepEd Forms")',
    '[href="/forms"]',
    'text=DepEd Forms'
  ];
  
  let clicked = false;
  for (const selector of depedFormsSelectors) {
    const element = page.locator(selector).first();
    if (await element.count() > 0 && await element.isVisible()) {
      console.log(`7. Found DepEd Forms link with selector "${selector}", clicking...`);
      try {
        await element.click({ timeout: 5000 });
        clicked = true;
        console.log('7b. Click successful');
        break;
      } catch (e: any) {
        console.log(`7b. Click failed with selector "${selector}":`, e?.message || e);
      }
    }
  }
  
  if (!clicked) {
    console.log('7. DepEd Forms link not found or not clickable, going directly to /forms');
    await page.goto(`${BASE_URL}/forms`);
  }
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('8. After clicking, URL:', page.url());
  
  // Now look for Form 137
  console.log('9. Looking for Form 137 link on forms page...');
  const form137Link = page.locator('a[href="/forms/137"], a:has-text("Form 137"), text=Form 137').first();
  
  if (await form137Link.count() > 0) {
    console.log('10. Found Form 137 link, clicking...');
    await form137Link.click();
    await page.waitForLoadState('networkidle');
  } else {
    console.log('10. Form 137 link not found, using direct navigation');
    await page.goto(`${BASE_URL}/forms/137`);
    await page.waitForLoadState('networkidle');
  }
  
  console.log('10. Current URL:', page.url());
  
  // Wait for the loading screen to disappear (max 30 seconds)
  console.log('11. Waiting for loading screen to disappear...');
  try {
    await page.waitForSelector('text=Loading your data...', { state: 'hidden', timeout: 30000 });
    console.log('12. ✅ Loading screen disappeared');
  } catch (e) {
    console.log('12. ❌ Loading screen still visible after 30s timeout');
  }
  
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'form137-diagnostic.png', fullPage: true });
  console.log('13. Screenshot saved to form137-diagnostic.png');
  
  // Get page title
  const title = await page.title();
  console.log('14. Page title:', title);
  
  // Get all h1 and h2 text
  const headings = await page.locator('h1, h2').allTextContents();
  console.log('15. All headings on page:', headings);
  
  // Get all text content to see what's actually rendered
  const bodyText = await page.locator('body').textContent();
  console.log('16. Page text preview (first 500 chars):', bodyText?.substring(0, 500));
  
  // Check if we're still on login or redirected elsewhere
  if (page.url().includes('/login')) {
    console.log('❌ STILL ON LOGIN PAGE - Authentication failed!');
  } else {
    console.log('✅ Not on login page');
  }
});
