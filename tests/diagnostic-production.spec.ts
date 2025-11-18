import { test } from '@playwright/test';

/**
 * DIAGNOSTIC TEST - Check what's on production after superadmin login
 */

test('Diagnose superadmin dashboard after Staff tab', async ({ page }) => {
  await page.goto('https://edusync.ph/admin');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  
  // Check for ALL tabs
  const allButtons = await page.locator('button, [role="tab"]').allTextContents();
  console.log('All buttons/tabs on page:', allButtons);
  
  // Take screenshot BEFORE clicking anything
  await page.screenshot({ path: 'admin-login-page.png', fullPage: true });
  
  // Click Staff tab
  const staffTab = page.locator('button:has-text("Staff"), [role="tab"]:has-text("Staff")').first();
  const isStaffVisible = await staffTab.isVisible().catch(() => false);
  console.log('Staff tab visible:', isStaffVisible);
  
  if (isStaffVisible) {
    await staffTab.click();
    await page.waitForTimeout(1000);
    console.log('Clicked Staff tab');
  }
  
  // Take screenshot AFTER clicking tab
  await page.screenshot({ path: 'admin-after-tab-click.png', fullPage: true });
  
  // Fill login
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();
  
  await emailInput.fill('superadmin-demo@edusync.ph');
  await passwordInput.fill('Demo123!');
  await submitButton.click();
  
  // Wait for navigation
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'superadmin-logged-in.png', fullPage: true });
  
  // Get current URL
  const url = page.url();
  console.log('Current URL after login:', url);
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for text content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text preview (first 800 chars):', bodyText?.substring(0, 800));
  
  // Check for specific elements
  const headings = await page.locator('h1, h2, h3, h4').allTextContents();
  console.log('All headings:', headings);
  
  // Check for navigation/menu items
  const navItems = await page.locator('nav a, [role="navigation"] a').allTextContents();
  console.log('Navigation items:', navItems);
});
