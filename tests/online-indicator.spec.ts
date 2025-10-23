import { test, expect } from '@playwright/test';

test.describe('Online/Offline Indicator', () => {
  test('should detect and display offline status', async ({ page, context }) => {
    // Enable console logging to see our debug messages
    page.on('console', msg => {
      if (msg.text().includes('[Network]') || msg.text().includes('[Header]')) {
        console.log('Browser Console:', msg.text());
      }
    });

    // Go to the app
    await page.goto('/');
    
    // Wait for login screen to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('\n=== TEST START: Online/Offline Indicator ===\n');
    console.log('Step 0: Logging in...');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'admin@school.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for header with online indicator to appear (means login successful)
    await page.waitForSelector('text=/Online|Offline/i', { timeout: 15000 });
    console.log('Logged in successfully!');

    // Step 1: Verify initial online state
    console.log('\nStep 1: Checking initial online state...');
    
    // Look for the WiFi status indicator (it's in a rounded pill with green/amber background)
    // Using title attribute which is set to 'Online' or 'Offline'
    const onlineIndicator = page.locator('[title="Online"], [title="Offline"]').first();
    await expect(onlineIndicator).toBeVisible({ timeout: 10000 });
    
    const initialTitle = await onlineIndicator.getAttribute('title');
    console.log(`Initial indicator title: "${initialTitle}"`);
    expect(initialTitle).toBe('Online');

    // Step 2: Go offline using Playwright's network emulation
    console.log('\nStep 2: Going offline...');
    await context.setOffline(true);
    
    // Wait for polling to detect offline status (polls every 1 second, give it 3 seconds)
    console.log('Waiting 3 seconds for polling to detect offline state...');
    await page.waitForTimeout(3000);

    // Step 3: Check if indicator changed to offline
    console.log('\nStep 3: Checking if indicator changed to offline...');
    const offlineTitle = await onlineIndicator.getAttribute('title');
    console.log(`Indicator title after going offline: "${offlineTitle}"`);
    
    // This should show "Offline" if the polling is working
    expect(offlineTitle).toBe('Offline');

    // Step 4: Go back online
    console.log('\nStep 4: Going back online...');
    await context.setOffline(false);
    
    // Wait for polling to detect online status
    console.log('Waiting 3 seconds for polling to detect online state...');
    await page.waitForTimeout(3000);

    // Step 5: Check if indicator changed back to online
    console.log('\nStep 5: Checking if indicator changed back to online...');
    const backOnlineTitle = await onlineIndicator.getAttribute('title');
    console.log(`Indicator title after going online: "${backOnlineTitle}"`);
    
    expect(backOnlineTitle).toBe('Online');

    console.log('\n=== TEST COMPLETE ===\n');
  });

  test('should show navigator.onLine value in console', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto('/');
    
    // Wait for login screen
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Login
    await page.fill('input[type="email"]', 'admin@school.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for header with online indicator (means login successful)
    await page.waitForSelector('text=/Online|Offline/i', { timeout: 15000 });

    // Evaluate navigator.onLine in the browser context
    const navigatorOnline = await page.evaluate(() => navigator.onLine);
    console.log(`\nnavigator.onLine in browser: ${navigatorOnline}`);

    // Wait a bit to collect logs
    await page.waitForTimeout(2000);

    // Print all network-related logs
    console.log('\n=== Console Logs from Browser ===');
    consoleLogs
      .filter(log => log.includes('[Network]') || log.includes('[Header]'))
      .forEach(log => console.log(log));
    console.log('=================================\n');
  });
});
