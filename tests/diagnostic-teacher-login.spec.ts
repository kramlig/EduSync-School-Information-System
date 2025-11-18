import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://edusync.ph';
const TEACHER_EMAIL = 'teacher-demo@edusync.ph';
const PASSWORD = 'Demo123!';

test.describe('Teacher Login Diagnostic', () => {
  test('Check teacher page after login', async ({ page }) => {
    // Navigate to login
    await page.goto(BASE_URL);
    
    // Click Login button if on landing page
    const loginButton = page.locator('a[href*="login"], button:has-text("Login")').first();
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('📍 On landing page, clicking Login button');
      await loginButton.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    
    // Fill in credentials
    console.log('📝 Filling in credentials');
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    await emailInput.fill(TEACHER_EMAIL);
    await passwordInput.fill(PASSWORD);
    await submitButton.click();
    
    // Wait for navigation
    console.log('⏳ Waiting for navigation...');
    await page.waitForTimeout(5000);
    
    // Where are we?
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/teacher-after-login.png', fullPage: true });
    console.log('📸 Screenshot saved to test-results/teacher-after-login.png');
    
    // Get all visible text
    const bodyText = await page.locator('body').textContent();
    console.log(`\n📄 Visible text on page (first 500 chars):`);
    console.log(bodyText?.substring(0, 500));
    
    // Check for loading spinner
    const hasLoadingSpinner = await page.locator('text=/Loading your data|Loading\\.\\.\\./', {hasText: /Loading/i}).isVisible().catch(() => false);
    console.log(`\n🔄 Has "Loading" text: ${hasLoadingSpinner}`);
    
    // Check for navigation menu
    const navLinks = await page.locator('nav a, header a').allTextContents();
    console.log(`\n🧭 Navigation links found:`);
    navLinks.forEach(link => console.log(`   - ${link}`));
    
    // Check for error messages
    const hasError = await page.locator('text=/Error|Failed|not found/i').isVisible().catch(() => false);
    console.log(`\n❌ Has error message: ${hasError}`);
    
    // Check if logged in (no email input visible)
    const isLoggedIn = !await page.locator('input[type="email"]').isVisible().catch(() => false);
    console.log(`\n✅ Appears logged in: ${isLoggedIn}`);
    
    // List all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log(`\n🔘 Buttons on page:`);
    buttons.forEach(btn => {
      if (btn.trim()) console.log(`   - ${btn.trim()}`);
    });
  });
});
