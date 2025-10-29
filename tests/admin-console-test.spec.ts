import { test, expect } from '@playwright/test';

/**
 * SIMPLIFIED CONSOLE LOGGING TEST FOR ADMIN ACCOUNT
 * 
 * This test specifically monitors infinite logging issues with admin login
 * to help identify and validate fixes for performance problems.
 */

test.describe('Admin Console Logging Performance', () => {
  
  test('should monitor admin login console behavior', async ({ page }) => {
    // Capture console messages
    const consoleLogs: { type: string, text: string, timestamp: number }[] = [];
    
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
    
    // Navigate to app
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== LOGIN SCREEN LOGS ===');
    const loginLogs = consoleLogs.filter(log => 
      log.text.includes('[useSchoolData]') || 
      log.text.includes('📦') || 
      log.text.includes('📡')
    );
    
    console.log(`Login screen useSchoolData logs: ${loginLogs.length}`);
    if (loginLogs.length > 0) {
      console.log('First 5 login logs:');
      loginLogs.slice(0, 5).forEach((log, idx) => {
        console.log(`${idx + 1}. ${log.text}`);
      });
    }
    
    // Clear logs and perform admin login
    consoleLogs.length = 0;
    const loginStartTime = Date.now();
    
    // Admin login
    await page.fill('input[type="email"]', 'admin@edusync.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(3000); // Wait 3 seconds to monitor logging
    
    const postLoginLogs = consoleLogs.filter(log => 
      log.timestamp >= loginStartTime &&
      (log.text.includes('[useSchoolData]') || 
       log.text.includes('📦') || 
       log.text.includes('📡'))
    );
    
    console.log('\n=== ADMIN LOGIN LOGS ===');
    console.log(`Post-login useSchoolData logs: ${postLoginLogs.length}`);
    console.log('Sample post-login logs:');
    postLoginLogs.slice(0, 10).forEach((log, idx) => {
      console.log(`${idx + 1}. ${log.text}`);
    });
    
    // Clear logs and navigate to Grades & Reports
    consoleLogs.length = 0;
    const navStartTime = Date.now();
    
    await page.click('text=Grades & Reports');
    await page.waitForTimeout(3000); // Monitor for 3 seconds
    
    const navigationLogs = consoleLogs.filter(log => 
      log.timestamp >= navStartTime &&
      (log.text.includes('[useSchoolData]') || 
       log.text.includes('📦') || 
       log.text.includes('📡'))
    );
    
    console.log('\n=== NAVIGATION LOGS ===');
    console.log(`Navigation useSchoolData logs: ${navigationLogs.length}`);
    console.log('Sample navigation logs:');
    navigationLogs.slice(0, 10).forEach((log, idx) => {
      console.log(`${idx + 1}. ${log.text}`);
    });
    
    // Check for infinite patterns
    const uniqueMessages = new Set(navigationLogs.map(log => log.text));
    const repetitionRatio = navigationLogs.length / (uniqueMessages.size || 1);
    
    console.log(`\n=== ANALYSIS ===`);
    console.log(`Total navigation logs: ${navigationLogs.length}`);
    console.log(`Unique messages: ${uniqueMessages.size}`);
    console.log(`Repetition ratio: ${repetitionRatio.toFixed(2)}`);
    
    // Basic validation - should not have excessive logging
    expect(navigationLogs.length).toBeLessThan(50); // Reasonable limit for 3 seconds
    expect(repetitionRatio).toBeLessThan(5); // Should not be highly repetitive
  });

});