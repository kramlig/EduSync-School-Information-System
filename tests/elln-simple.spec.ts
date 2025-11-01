import { test, expect } from '@playwright/test';

/**
 * SIMPLE ELLN Assessment Test
 * 
 * This is a simplified version to debug and verify the basic flow works.
 */

test.describe('ELLN Assessment - Simple Test', () => {
  
  test('should login and navigate to ELLN assessment page', async ({ page }) => {
    test.setTimeout(60000); // 1 minute
    
    console.log('\n🚀 Starting simple ELLN test\n');
    
    // Step 1: Go directly to login page
    console.log('Step 1: Navigate to login page');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Give Firebase time to initialize
    console.log('✅ Page loaded');
    
    // Debug: Log what's on the page
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);
    
    // Step 2: Wait for login form to appear
    console.log('\nStep 2: Waiting for login form...');
    
    // Try multiple selectors
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail" i], input[name*="email" i]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✅ Email input found');
    
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Password input found');
    
    // Step 3: Fill credentials
    console.log('\nStep 3: Filling credentials');
    await emailInput.fill('admin@edusync.local');
    await passwordInput.fill('admin123');
    console.log('   ✓ Credentials filled');
    
    // Step 4: Click sign in
    console.log('\nStep 4: Click Sign In button');
    const signInButton = page.getByRole('button', { name: /sign in/i }).first();
    await signInButton.click();
    console.log('   ✓ Sign in clicked');
    
    // Step 5: Wait for auth to complete
    console.log('\nStep 5: Waiting for authentication...');
    await page.waitForTimeout(5000); // Give Firebase auth time to complete
    
    // Check if we're still on login page
    const stillOnLogin = await emailInput.isVisible().catch(() => false);
    if (stillOnLogin) {
      console.error('❌ Still on login page - auth failed');
      await page.screenshot({ path: 'test-results/auth-failed.png', fullPage: true });
      throw new Error('Authentication failed - still showing login form');
    }
    console.log('✅ Login successful - login form disappeared');
    
    // Take screenshot of successful login
    await page.screenshot({ path: 'test-results/login-success.png', fullPage: true });
    console.log('   📸 Screenshot saved to test-results/login-success.png')
    
    // Step 4: Navigate to ELLN Assessment
    console.log('\nStep 4: Navigate to ELLN Assessment page');
    await page.goto('http://localhost:5173/forms/elln/assessment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Verify we're NOT on login page (authentication check)
    const onLoginPage = await page.getByPlaceholder(/email/i).first().isVisible({ timeout: 2000 }).catch(() => false);
    if (onLoginPage) {
      await page.screenshot({ path: 'test-results/stuck-on-login.png', fullPage: true });
      console.error('❌ Still on login page - authentication failed');
      throw new Error('Still on login page - authentication failed');
    }
    
    expect(page.url()).toContain('/forms/elln/assessment');
    console.log('✅ On ELLN Assessment page');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/elln-assessment-page.png', fullPage: true });
    console.log('   📸 Screenshot saved to test-results/elln-assessment-page.png');
    
    // Step 5: Look for student search dropdown (better selector)
    console.log('\nStep 5: Verify student search dropdown exists');
    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="Select" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Student search dropdown found!')
    
    console.log('\n🎉 TEST PASSED - All steps completed successfully!\n');
  });
});
