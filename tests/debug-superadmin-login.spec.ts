import { test, expect } from '@playwright/test';

/**
 * DEBUG TEST: Verify superadmin login and role
 * This test checks if superadmin@test.com actually logs in with superadmin role
 */

test('DEBUG: Login as superadmin and check session', async ({ page }) => {
  console.log('🔍 DEBUG: Starting superadmin login test');
  
  // Capture console logs from the browser
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });
  
  // Capture page errors
  page.on('pageerror', err => {
    console.error(`[PAGE ERROR]:`, err);
  });
  
  // Navigate to login
  await page.goto('http://localhost:5173/admin');
  await page.waitForLoadState('domcontentloaded');
  
  // Login
  console.log('🔐 Logging in as superadmin@test.com');
  await page.getByRole('textbox', { name: /email/i }).fill('superadmin@test.com');
  await page.getByLabel(/password/i).fill('TestPass123!');
  await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
  
  // Wait for navigation
  await page.waitForTimeout(5000);
  
  // Check current URL
  const url = page.url();
  console.log(`📍 Current URL after login: ${url}`);
  
  // Try to get user info from localStorage or window object
  const userInfo = await page.evaluate(() => {
    try {
      // Check localStorage
      const keys = Object.keys(localStorage);
      const authData = keys
        .filter(k => k.includes('firebase') || k.includes('user') || k.includes('session'))
        .map(k => ({ key: k, value: localStorage.getItem(k)?.substring(0, 100) }));
      
      return {
        localStorage: authData,
        location: window.location.href
      };
    } catch (e) {
      return { error: String(e) };
    }
  });
  
  console.log('💾 User info:', JSON.stringify(userInfo, null, 2));
  
  // Check if School Management link is visible
  const schoolMgmtVisible = await page.getByRole('link', { name: /school management/i }).isVisible().catch(() => false);
  console.log(`🏫 School Management link visible: ${schoolMgmtVisible}`);
  
  // Try to navigate to school-management
  console.log('🚀 Attempting to navigate to /school-management');
  await page.goto('http://localhost:5173/school-management');
  await page.waitForTimeout(3000);
  
  const finalUrl = page.url();
  console.log(`📍 Final URL: ${finalUrl}`);
  
  // Check page content
  const pageText = await page.textContent('body');
  console.log(`📄 Page text preview: ${pageText?.substring(0, 200)}`);
  
  // Check for School Management heading
  const heading = await page.getByRole('heading', { name: /school management/i }).isVisible().catch(() => false);
  console.log(`✅ School Management heading visible: ${heading}`);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/debug-superadmin-login.png', fullPage: true });
  console.log('📸 Screenshot saved to test-results/debug-superadmin-login.png');
});
