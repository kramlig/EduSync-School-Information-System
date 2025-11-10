/**
 * Login Performance Test
 * 
 * Tests the complete login flow from entering credentials to dashboard load
 * 
 * Previous issue: 30+ second delay after clicking Sign In button
 * Root cause: App stayed on /admin route (public route) which triggered full data load
 * 
 * Expected: Login completes in <10 seconds total (auth + data load)
 */

import { test, expect } from '@playwright/test';

test.describe('Login Process Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Start from admin login page
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('domcontentloaded');
  });
  
  test('should complete superadmin login in under 10 seconds', async ({ page }) => {
    console.log('Step 1: Filling login form...');
    
    // Fill in credentials
    await page.getByLabel(/email/i).fill('superadmin@test.com');
    await page.getByLabel(/password/i).fill('TestPass123!');
    
    console.log('Step 2: Clicking Sign In button...');
    const loginStartTime = Date.now();
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    console.log('Step 3: Waiting for redirect away from /admin...');
    // Should redirect to dashboard immediately after login
    await page.waitForURL('http://localhost:5173/', { timeout: 5000 });
    const redirectTime = Date.now() - loginStartTime;
    console.log(`✅ Redirected to dashboard in ${redirectTime}ms`);
    
    console.log('Step 4: Waiting for dashboard to load...');
    // Wait for dashboard elements
    await expect(page.getByText(/school management/i)).toBeVisible({ timeout: 10000 });
    
    const totalLoginTime = Date.now() - loginStartTime;
    console.log(`✅ Total login time: ${totalLoginTime}ms`);
    
    // Performance assertions
    expect(redirectTime).toBeLessThan(3000); // Redirect should be fast
    expect(totalLoginTime).toBeLessThan(10000); // Total under 10 seconds
    
    if (totalLoginTime < 5000) {
      console.log('🚀 EXCELLENT: Login completed in under 5 seconds!');
    } else if (totalLoginTime < 8000) {
      console.log('✅ GOOD: Login completed in under 8 seconds');
    } else {
      console.log('⚠️  ACCEPTABLE: Login completed in under 10 seconds');
    }
  });
  
  test('should not load data while on /admin login page', async ({ page }) => {
    // Monitor console for data loading
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Just sit on login page
    await page.waitForTimeout(3000);
    
    // Check for data loading logs
    const hasDataLoadingLogs = consoleLogs.some(log =>
      log.includes('useSchoolData') || 
      log.includes('Loading your data') ||
      log.includes('Firestore query')
    );
    
    console.log(`Console logs captured: ${consoleLogs.length}`);
    
    // Should NOT load data while sitting on login page
    expect(hasDataLoadingLogs).toBe(false);
    console.log('✅ No data loading on login page');
  });
  
  test('should show loading screen after login (not stuck on login form)', async ({ page }) => {
    // Fill and submit
    await page.getByLabel(/email/i).fill('superadmin@test.com');
    await page.getByLabel(/password/i).fill('TestPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should see loading message (not login form)
    await expect(page.getByText(/loading your data/i)).toBeVisible({ timeout: 3000 });
    
    // URL should have changed from /admin
    await expect(page).not.toHaveURL('http://localhost:5173/admin');
    
    console.log('✅ Properly showing loading screen after login');
    console.log(`Current URL: ${page.url()}`);
  });
  
  test('should handle regular admin login (not superadmin)', async ({ page }) => {
    console.log('Testing regular admin login...');
    
    // Try a regular admin account (from seed data)
    await page.getByLabel(/email/i).fill('admin@school-001.edu');
    await page.getByLabel(/password/i).fill('password123');
    
    const loginStartTime = Date.now();
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect
    await page.waitForURL((url) => url.pathname !== '/admin', { timeout: 5000 });
    
    // Wait for dashboard
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 10000 });
    
    const totalTime = Date.now() - loginStartTime;
    console.log(`✅ Regular admin login completed in ${totalTime}ms`);
    
    expect(totalTime).toBeLessThan(12000); // Regular admin might take slightly longer
  });
  
  test('should navigate from landing page to login and complete login flow', async ({ page }) => {
    console.log('Full flow: Landing → Login → Dashboard');
    
    // Start from landing page
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('Step 1: Click Login link...');
    await page.getByRole('link', { name: /login/i }).first().click();
    await page.waitForURL('http://localhost:5173/admin');
    
    console.log('Step 2: Fill login form...');
    await page.getByLabel(/email/i).fill('superadmin@test.com');
    await page.getByLabel(/password/i).fill('TestPass123!');
    
    console.log('Step 3: Submit login...');
    const loginStartTime = Date.now();
    await page.getByRole('button', { name: /sign in/i }).click();
    
    console.log('Step 4: Wait for dashboard...');
    await page.waitForURL('http://localhost:5173/', { timeout: 5000 });
    await expect(page.getByText(/school management/i)).toBeVisible({ timeout: 10000 });
    
    const totalTime = Date.now() - loginStartTime;
    console.log(`✅ Complete flow finished in ${totalTime}ms`);
    
    expect(totalTime).toBeLessThan(12000);
  });
});
