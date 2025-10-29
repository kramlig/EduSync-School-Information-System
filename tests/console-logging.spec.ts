import { test, expect, Page } from '@playwright/test';

/**
 * CONSOLE LOGGING PERFORMANCE TEST
 * 
 * This test monitors console output to detect infinite logging issues
 * that can cause performance degradation and browser lag.
 * 
 * Test Objectives:
 * 1. Monitor console messages for excessive logging
 * 2. Detect infinite subscription loops
 * 3. Verify performance characteristics
 * 4. Validate logging controls (ENABLE_CACHE_LOGS)
 */

interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
}

test.describe('Console Logging Performance Tests', () => {
  let consoleLogs: ConsoleMessage[] = [];
  
  test.beforeEach(async ({ page }) => {
    // Clear console logs for each test
    consoleLogs = [];
    
    // Capture all console messages
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
    
    // Navigate to login screen first
    await page.goto('http://localhost:5175/');
    
    // Wait for initial page load
    await page.waitForLoadState('networkidle');
  });

  test('should not have infinite console logging on login screen', async ({ page }) => {
    // Wait for 5 seconds and monitor console activity
    const startTime = Date.now();
    await page.waitForTimeout(5000);
    const endTime = Date.now();
    
    // Filter logs from our monitoring period
    const monitoringLogs = consoleLogs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
    
    // Check for excessive logging patterns
    const schoolDataLogs = monitoringLogs.filter(log => 
      log.text.includes('[useSchoolData]') || 
      log.text.includes('📦') || 
      log.text.includes('📡')
    );
    
    console.log(`\n=== CONSOLE MONITORING RESULTS ===`);
    console.log(`Total logs in 5s: ${monitoringLogs.length}`);
    console.log(`useSchoolData logs: ${schoolDataLogs.length}`);
    
    // Print first 10 useSchoolData logs for analysis
    if (schoolDataLogs.length > 0) {
      console.log(`\nFirst 10 useSchoolData logs:`);
      schoolDataLogs.slice(0, 10).forEach((log, idx) => {
        console.log(`${idx + 1}. [${log.type}] ${log.text}`);
      });
    }
    
    // ASSERTION: Should not have excessive useSchoolData logging on login screen
    // Login screen should have collectionsToFetch=[] which should skip subscriptions
    expect(schoolDataLogs.length).toBeLessThan(5); // Allow some initial setup logs but not infinite
    
    // Check for specific infinite loop indicators
    const subscriptionSetupLogs = schoolDataLogs.filter(log => 
      log.text.includes('📡 Setting up subscriptions')
    );
    expect(subscriptionSetupLogs.length).toBeLessThanOrEqual(1); // Should only setup once
  });

  test('should have controlled logging after successful login', async ({ page }) => {
    // Perform login
    await page.fill('input[type="email"]', 'admin@edusync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Clear logs accumulated during login
    const loginCompleteTime = Date.now();
    
    // Monitor for 10 seconds after successful login
    await page.waitForTimeout(10000);
    const monitorEndTime = Date.now();
    
    // Filter logs from post-login monitoring period
    const postLoginLogs = consoleLogs.filter(log => 
      log.timestamp >= loginCompleteTime && log.timestamp <= monitorEndTime
    );
    
    // Analyze useSchoolData activity
    const schoolDataLogs = postLoginLogs.filter(log => 
      log.text.includes('[useSchoolData]') || 
      log.text.includes('📦') || 
      log.text.includes('📡')
    );
    
    console.log(`\n=== POST-LOGIN MONITORING RESULTS ===`);
    console.log(`Total logs in 10s: ${postLoginLogs.length}`);
    console.log(`useSchoolData logs: ${schoolDataLogs.length}`);
    
    // Check for repetitive patterns (sign of infinite loops)
    const uniqueMessages = new Set(schoolDataLogs.map(log => log.text));
    const repetitionRatio = schoolDataLogs.length / uniqueMessages.size;
    
    console.log(`Unique messages: ${uniqueMessages.size}`);
    console.log(`Repetition ratio: ${repetitionRatio.toFixed(2)}`);
    
    if (schoolDataLogs.length > 0) {
      console.log(`\nSample logs:`);
      schoolDataLogs.slice(0, 15).forEach((log, idx) => {
        console.log(`${idx + 1}. [${log.type}] ${log.text}`);
      });
    }
    
    // ASSERTIONS: After login, expect some initial subscription activity but not infinite
    expect(schoolDataLogs.length).toBeLessThan(50); // Reasonable limit for 10 seconds
    expect(repetitionRatio).toBeLessThan(10); // Should not have excessive repetition
    
    // Check for subscription cleanup indicators
    const cleanupLogs = schoolDataLogs.filter(log => 
      log.text.includes('🧹 Cleaning up subscriptions')
    );
    expect(cleanupLogs.length).toBeLessThan(3); // Should not be constantly cleaning up
  });

  test('should respect ENABLE_CACHE_LOGS flag', async ({ page }) => {
    // Login and navigate to dashboard
    await page.fill('input[type="email"]', 'admin@edusync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(5000);
    
    // Check for cache-related logs (should be disabled)
    const cacheLogs = consoleLogs.filter(log => 
      log.text.includes('📦') && log.text.includes('CACHE') ||
      log.text.includes('📡') && log.text.includes('SERVER')
    );
    
    console.log(`\n=== CACHE LOGGING TEST ===`);
    console.log(`Cache-related logs found: ${cacheLogs.length}`);
    
    if (cacheLogs.length > 0) {
      console.log(`Sample cache logs:`);
      cacheLogs.slice(0, 5).forEach((log, idx) => {
        console.log(`${idx + 1}. ${log.text}`);
      });
    }
    
    // ASSERTION: If ENABLE_CACHE_LOGS is false, should have minimal cache logging
    expect(cacheLogs.length).toBeLessThan(10); // Allow some, but not excessive
  });

  test('should not have performance-degrading log frequency', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'admin@edusync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Grades & Reports to trigger more subscriptions
    await page.click('text=Grades & Reports');
    await page.waitForLoadState('networkidle');
    
    // Clear logs and start fresh monitoring
    const testStartTime = Date.now();
    consoleLogs = [];
    
    // Monitor for 15 seconds
    await page.waitForTimeout(15000);
    const testEndTime = Date.now();
    
    // Calculate logging frequency
    const totalLogs = consoleLogs.length;
    const logsPerSecond = totalLogs / 15;
    
    console.log(`\n=== PERFORMANCE LOGGING TEST ===`);
    console.log(`Total logs in 15s: ${totalLogs}`);
    console.log(`Logs per second: ${logsPerSecond.toFixed(2)}`);
    
    // Check for high-frequency logging patterns
    const highFrequencyThreshold = 5; // logs per second
    
    // ASSERTION: Should not exceed performance-degrading log frequency
    expect(logsPerSecond).toBeLessThan(highFrequencyThreshold);
    
    // Additional check: No single message type should dominate
    const messageTypes = new Map<string, number>();
    consoleLogs.forEach(log => {
      const messageKey = log.text.substring(0, 50); // First 50 chars as key
      messageTypes.set(messageKey, (messageTypes.get(messageKey) || 0) + 1);
    });
    
    const mostFrequentMessage = Math.max(...messageTypes.values());
    const dominanceRatio = mostFrequentMessage / totalLogs;
    
    console.log(`Most frequent message appears: ${mostFrequentMessage} times`);
    console.log(`Dominance ratio: ${(dominanceRatio * 100).toFixed(1)}%`);
    
    // No single message should dominate more than 30% of logs (sign of infinite loop)
    expect(dominanceRatio).toBeLessThan(0.3);
  });

  test('should navigate between pages without logging explosion', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@edusync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Clear initial logs
    consoleLogs = [];
    const navigationStartTime = Date.now();
    
    // Perform navigation sequence
    await page.click('text=Grades & Reports');
    await page.waitForTimeout(2000);
    
    await page.click('text=Students');
    await page.waitForTimeout(2000);
    
    await page.click('text=Dashboard');
    await page.waitForTimeout(2000);
    
    await page.click('text=Grades & Reports');
    await page.waitForTimeout(2000);
    
    const navigationEndTime = Date.now();
    
    // Analyze logs during navigation
    const navigationLogs = consoleLogs.filter(log => 
      log.timestamp >= navigationStartTime && log.timestamp <= navigationEndTime
    );
    
    const schoolDataLogs = navigationLogs.filter(log => 
      log.text.includes('[useSchoolData]')
    );
    
    console.log(`\n=== NAVIGATION LOGGING TEST ===`);
    console.log(`Navigation duration: ${((navigationEndTime - navigationStartTime) / 1000).toFixed(1)}s`);
    console.log(`Total logs during navigation: ${navigationLogs.length}`);
    console.log(`useSchoolData logs: ${schoolDataLogs.length}`);
    
    // ASSERTION: Navigation should not cause explosive logging
    expect(schoolDataLogs.length).toBeLessThan(30); // Reasonable for 4 navigation actions
    
    // Check for cleanup during navigation
    const cleanupLogs = schoolDataLogs.filter(log => 
      log.text.includes('🧹 Cleaning up subscriptions')
    );
    
    // Should have some cleanup but not excessive
    expect(cleanupLogs.length).toBeGreaterThan(0);
    expect(cleanupLogs.length).toBeLessThan(10);
  });
});