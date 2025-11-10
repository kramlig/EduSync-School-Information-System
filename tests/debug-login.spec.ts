/**
 * Debug Login Test
 * Simple test to diagnose why login is failing
 */

import { test, expect } from '@playwright/test';

test('Debug: Can we load the login page and login?', async ({ page }) => {
  console.log('Step 1: Navigate to login page');
  await page.goto('http://localhost:5173/admin');
  
  console.log('Step 2: Wait for email input');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  console.log('Step 3: Take screenshot of login page');
  await page.screenshot({ path: 'login-page.png' });
  
  console.log('Step 4: Fill in credentials');
  await page.fill('input[type="email"]', 'admin-school1@test.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  
  console.log('Step 5: Take screenshot before clicking login');
  await page.screenshot({ path: 'before-login.png' });
  
  console.log('Step 6: Click login button');
  await page.click('button[type="submit"]');
  
  console.log('Step 7: Wait a bit and take screenshot');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'after-login-3s.png' });
  
  console.log('Step 8: Check current URL');
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  console.log('Step 9: Check for error messages');
  const errorText = await page.textContent('body');
  console.log('Page contains "error"?', errorText?.toLowerCase().includes('error'));
  
  console.log('Step 10: Look for dashboard elements');
  const hasSidebar = await page.locator('nav').count() > 0;
  const hasHeader = await page.locator('header').count() > 0;
  console.log('Has sidebar:', hasSidebar);
  console.log('Has header:', hasHeader);
  
  console.log('Step 11: Check localStorage');
  const session = await page.evaluate(() => localStorage.getItem('edusync_session'));
  console.log('Session in localStorage:', session ? 'EXISTS' : 'NONE');
  
  console.log('Step 12: Take final screenshot');
  await page.screenshot({ path: 'final-state.png' });
  
  // Don't assert anything, just gather info
  console.log('Test complete - check screenshots and console output');
});
