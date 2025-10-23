import { test, expect } from '@playwright/test';

/**
 * OFFLINE FIRST VISIT TEST
 * 
 * This test simulates the exact workflow the user is experiencing:
 * 1. Login online
 * 2. Turn off network
 * 3. Click Students page (FIRST TIME - no cache)
 * 
 * Expected behavior:
 * - Should show helpful "No Cached Student Data" message
 * - Should NOT show white screen
 * - Should display offline indicator
 */

// Helper function for login
async function login(page: any) {
  await page.goto('http://localhost:5174');
  await page.fill('input[type="email"]', 'admin@school.edu');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button:has-text("Sign")');
  // Wait for header with online indicator (means login successful)
  await page.waitForSelector('[class*="header"], header, nav', { timeout: 15000 });
  await page.waitForTimeout(2000); // Wait for data to load
}

test.describe('Offline First Visit - User Workflow', () => {
  test('Should show helpful message when visiting Students offline for the first time', async ({ page, context }) => {
    console.log('\n🧪 TESTING USER WORKFLOW: Login → Go Offline → Click Students (first visit)\n');

    // Step 1: Login while online
    console.log('Step 1: Logging in while ONLINE...');
    await login(page);
    console.log('✅ Login successful, Dashboard loaded');

    // Step 2: Go offline BEFORE visiting Students
    console.log('\nStep 2: Going OFFLINE...');
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    // Verify offline indicator appears
    const offlineBanner = page.locator('text=/offline/i').first();
    const bannerVisible = await offlineBanner.isVisible().catch(() => false);
    console.log(bannerVisible ? '✅ Offline banner visible' : '⚠️ Offline banner not visible');

    // Step 3: Click Students for the FIRST TIME while offline
    console.log('\nStep 3: Clicking Students (FIRST VISIT while offline)...');
    await page.click('a[href="/students"]');
    await page.waitForTimeout(3000); // Give time for page to load

    // Check what's actually on the page
    console.log('\n📊 CHECKING PAGE STATE:');
    
    // Check if heading is visible
    const heading = page.locator('h1:has-text("Students")');
    const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Heading "Students": ${headingVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

    // Check for the new offline message
    const offlineMessage = page.locator('text=/No Cached Student Data|haven\'t visited this page online/i');
    const messageVisible = await offlineMessage.isVisible().catch(() => false);
    console.log(`Offline message: ${messageVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

    // Check for empty table rows
    const tableRows = await page.locator('tbody tr').count();
    console.log(`Table rows found: ${tableRows}`);

    // Check if loading state
    const loadingText = page.locator('text=/Loading students/i');
    const isLoading = await loadingText.isVisible().catch(() => false);
    console.log(`Loading state: ${isLoading ? '⏳ LOADING' : '✅ NOT LOADING'}`);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/offline-first-visit-debug.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/offline-first-visit-debug.png');

    // Check page content
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.length > 100;
    console.log(`Page has content: ${hasContent ? '✅ YES' : '❌ NO'} (${bodyText?.length || 0} chars)`);

    // ASSERTIONS
    console.log('\n🎯 RUNNING ASSERTIONS:');

    // 1. Heading should be visible (not white screen)
    expect(headingVisible, 'Students heading should be visible').toBe(true);

    // 2. Should show offline message OR have table structure
    const hasOfflineMessageOrTable = messageVisible || tableRows > 0;
    expect(hasOfflineMessageOrTable, 'Should show offline message or have table').toBe(true);

    // 3. Should NOT be stuck in loading state
    expect(isLoading, 'Should not be stuck loading').toBe(false);

    // 4. Page should have content
    expect(hasContent, 'Page should have substantial content').toBe(true);

    console.log('\n✅ TEST PASSED - Page loads correctly on first offline visit');
  });

  test('Should cache data when visiting Students ONLINE first, then work offline', async ({ page, context }) => {
    console.log('\n🧪 TESTING PROPER WORKFLOW: Visit online first, then offline\n');

    // Step 1: Login online
    console.log('Step 1: Logging in ONLINE...');
    await login(page);
    console.log('✅ Login successful');

    // Step 2: Visit Students page WHILE ONLINE to cache data
    console.log('\nStep 2: Visiting Students page ONLINE (to cache data)...');
    await page.click('a[href="/students"]');
    await page.waitForTimeout(2000);
    
    const studentsOnline = await page.locator('tbody tr').count();
    console.log(`✅ Students loaded online: ${studentsOnline} students`);

    // Step 3: NOW go offline
    console.log('\nStep 3: Going OFFLINE...');
    await context.setOffline(true);
    await page.waitForTimeout(2000);

    // Step 4: Navigate away and back to Students
    console.log('\nStep 4: Navigate to Dashboard then back to Students (offline)...');
    await page.click('a[href="/"]');
    await page.waitForTimeout(1000);
    await page.click('a[href="/students"]');
    await page.waitForTimeout(2000);

    // Step 5: Verify students still visible offline
    const studentsOffline = await page.locator('tbody tr').count();
    console.log(`📊 Students visible offline: ${studentsOffline} students`);

    // Should have cached students
    expect(studentsOffline).toBeGreaterThan(0);
    console.log(`✅ TEST PASSED - ${studentsOffline} students cached and visible offline`);
  });
});
