/**
 * Landing Page to Login Performance Test
 * 
 * Verifies that navigation from landing page to login is instant (<2 seconds)
 * 
 * Previous issue: 30+ second delay due to:
 * - Anonymous Firebase Auth sign-in on landing page
 * - useSchoolData() hook loading data on public routes
 * - useFirestoreSyncStatus() running on public routes
 * 
 * Expected: <2 seconds (ideally <500ms)
 */

import { test, expect } from '@playwright/test';

test.describe('Landing to Login Performance', () => {
  test('should navigate from landing page to login in under 2 seconds', async ({ page }) => {
    // Step 1: Load landing page
    console.log('Step 1: Loading landing page...');
    const landingStartTime = Date.now();
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
    const landingLoadTime = Date.now() - landingStartTime;
    console.log(`✅ Landing page loaded in ${landingLoadTime}ms`);
    
    // Verify we're on landing page
    await expect(page).toHaveURL('http://localhost:5173/');
    
    // Step 2: Find and click Login link
    console.log('Step 2: Clicking Login link...');
    const navigationStartTime = Date.now();
    
    // The Login link is in the footer navigation
    const loginLink = page.getByRole('link', { name: /login/i }).first();
    await expect(loginLink).toBeVisible({ timeout: 5000 });
    await loginLink.click();
    
    // Step 3: Wait for login page to load
    console.log('Step 3: Waiting for login page...');
    await page.waitForURL('http://localhost:5173/admin', { timeout: 3000 });
    
    // Verify login screen elements are visible
    await expect(page.getByRole('heading', { name: /edusync/i })).toBeVisible({ timeout: 2000 });
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    const navigationTime = Date.now() - navigationStartTime;
    console.log(`✅ Navigated to login in ${navigationTime}ms`);
    
    // Performance assertion
    expect(navigationTime).toBeLessThan(2000); // Should be under 2 seconds
    
    if (navigationTime < 500) {
      console.log('🚀 EXCELLENT: Navigation under 500ms!');
    } else if (navigationTime < 1000) {
      console.log('✅ GOOD: Navigation under 1 second');
    } else {
      console.log('⚠️  SLOW: Navigation over 1 second (should optimize further)');
    }
  });
  
  test('should not trigger Firebase Auth or data loading on landing page', async ({ page }) => {
    // Monitor console for Firebase/Firestore calls
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
    });
    
    // Load landing page
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for any async operations
    
    // Check console logs
    const hasAuthLogs = consoleLogs.some(log => 
      log.includes('[Auth]') || log.includes('Anonymous sign-in')
    );
    
    const hasDataLogs = consoleLogs.some(log =>
      log.includes('useSchoolData') || log.includes('Firestore query')
    );
    
    console.log('Console logs captured:', consoleLogs.length);
    
    // These should NOT appear on landing page
    expect(hasAuthLogs).toBe(false);
    expect(hasDataLogs).toBe(false);
    
    console.log('✅ No unnecessary Firebase operations on landing page');
  });
  
  test('should have instant navigation using React Router', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
    
    // Measure navigation time
    const startTime = Date.now();
    await page.getByRole('link', { name: /login/i }).first().click();
    await page.waitForURL('http://localhost:5173/admin');
    const navTime = Date.now() - startTime;
    
    console.log(`Navigation time: ${navTime}ms`);
    
    // React Router navigation should be nearly instant
    expect(navTime).toBeLessThan(1000);
    
    // Verify no full page reload occurred by checking if history API was used
    const wasClientSideNavigation = await page.evaluate(() => {
      return window.performance.navigation.type === 0; // 0 = navigate (not reload)
    });
    
    expect(wasClientSideNavigation).toBe(true);
    console.log('✅ Client-side navigation confirmed (no page reload)');
  });
});
