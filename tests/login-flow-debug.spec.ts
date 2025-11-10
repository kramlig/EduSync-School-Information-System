/**
 * Comprehensive Login Flow Debug Test
 * 
 * Tests the complete login flow step-by-step to identify where the delay occurs
 */

import { test, expect } from '@playwright/test';

test.describe('Login Flow - Comprehensive Debug', () => {
  test('should trace complete login flow with timing', async ({ page }) => {
    const timings: { step: string; time: number }[] = [];
    const startTime = Date.now();
    
    const logStep = (step: string) => {
      const elapsed = Date.now() - startTime;
      timings.push({ step, time: elapsed });
      console.log(`[${elapsed}ms] ${step}`);
    };
    
    // Monitor console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[App]') || text.includes('[Auth]')) {
        console.log(`  CONSOLE: ${text}`);
      }
    });
    
    // Monitor network requests
    const networkRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('firestore') || url.includes('firebase')) {
        networkRequests.push(url);
        console.log(`  NETWORK: ${request.method()} ${url}`);
      }
    });
    
    // Step 1: Navigate to login page
    logStep('Step 1: Navigating to /admin...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('domcontentloaded');
    logStep('Step 1: Page loaded');
    
    // Verify login screen
    await expect(page.getByRole('heading', { name: /edusync/i })).toBeVisible();
    logStep('Step 1: Login screen visible');
    
    // Step 2: Fill in credentials
    logStep('Step 2: Filling in credentials...');
    await page.fill('input[type="email"]', 'superadmin@test.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    logStep('Step 2: Credentials filled');
    
    // Step 3: Click sign in
    logStep('Step 3: Clicking Sign In button...');
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await signInButton.click();
    logStep('Step 3: Sign In clicked');
    
    // Step 4: Wait for URL change
    logStep('Step 4: Waiting for navigation...');
    const urlBefore = page.url();
    console.log(`  Current URL: ${urlBefore}`);
    
    // Wait for navigation with timeout
    try {
      await page.waitForURL(url => url.toString() !== urlBefore, { timeout: 5000 });
      logStep('Step 4: URL changed');
      console.log(`  New URL: ${page.url()}`);
    } catch (e) {
      logStep('Step 4: URL did NOT change in 5 seconds!');
      console.log(`  Still on: ${page.url()}`);
    }
    
    // Step 5: Wait for dashboard elements
    logStep('Step 5: Waiting for dashboard elements...');
    try {
      // Check if we see dashboard or login screen
      const isDashboard = await page.getByText(/dashboard/i).first().isVisible({ timeout: 2000 }).catch(() => false);
      const isLoginScreen = await page.getByRole('button', { name: /sign in/i }).isVisible({ timeout: 1000 }).catch(() => false);
      
      if (isDashboard) {
        logStep('Step 5: ✅ Dashboard visible!');
      } else if (isLoginScreen) {
        logStep('Step 5: ❌ Still on login screen!');
      } else {
        logStep('Step 5: ⚠️  Unknown state - taking screenshot...');
      }
    } catch (e) {
      logStep('Step 5: ⚠️  Timeout waiting for UI');
    }
    
    // Step 6: Take screenshot
    await page.screenshot({ path: 'test-results/login-flow-debug.png', fullPage: true });
    logStep('Step 6: Screenshot saved');
    
    // Print summary
    console.log('\n=== TIMING SUMMARY ===');
    timings.forEach(({ step, time }) => {
      console.log(`${time}ms - ${step}`);
    });
    
    console.log('\n=== CONSOLE LOGS CAPTURED ===');
    console.log(`Total: ${consoleLogs.length} logs`);
    
    console.log('\n=== NETWORK REQUESTS ===');
    console.log(`Total Firebase requests: ${networkRequests.length}`);
    
    console.log('\n=== FINAL STATE ===');
    console.log(`URL: ${page.url()}`);
    console.log(`Total time: ${Date.now() - startTime}ms`);
    
    // Assertions
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total login flow time: ${totalTime}ms`);
    
    if (totalTime > 5000) {
      console.log('❌ SLOW: Login took over 5 seconds!');
    } else if (totalTime > 2000) {
      console.log('⚠️  ACCEPTABLE: Login took 2-5 seconds');
    } else {
      console.log('✅ FAST: Login under 2 seconds!');
    }
    
    // Final URL check
    const finalUrl = page.url();
    console.log(`\nFinal URL: ${finalUrl}`);
    
    if (finalUrl === 'http://localhost:5173/admin') {
      console.log('❌ PROBLEM: Still on /admin page after login!');
      throw new Error('Login failed - still on /admin page');
    } else if (finalUrl === 'http://localhost:5173/') {
      console.log('✅ SUCCESS: Redirected to dashboard');
    } else {
      console.log(`⚠️  UNEXPECTED: Redirected to ${finalUrl}`);
    }
  });
  
  test('should check data loading after login', async ({ page }) => {
    console.log('\n=== DATA LOADING TEST ===\n');
    
    let dataLoadingStarted = false;
    let dataLoadingFinished = false;
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Loading your data')) {
        dataLoadingStarted = true;
        console.log('📦 Data loading started');
      }
      if (text.includes('Session exists - rendering Router')) {
        dataLoadingFinished = true;
        console.log('✅ Data loading finished');
      }
    });
    
    // Login
    await page.goto('http://localhost:5173/admin');
    await page.fill('input[type="email"]', 'superadmin@test.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    console.log(`\nData loading started: ${dataLoadingStarted}`);
    console.log(`Data loading finished: ${dataLoadingFinished}`);
    
    if (dataLoadingStarted && !dataLoadingFinished) {
      console.log('❌ PROBLEM: Data loading started but never finished!');
    }
  });
});
