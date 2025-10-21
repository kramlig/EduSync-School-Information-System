import { test } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://edusync-sis.web.app';

async function loginAsAdmin(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(2000);
  
  await page.click('button:has-text("Staff")');
  await page.waitForTimeout(500);
  
  await page.fill('input[type="email"]', 'admin@school.edu');
  await page.fill('input[type="password"]', 'password');
  
  await page.click('button[type="submit"]:has-text("Sign In")');
  await page.waitForTimeout(5000);
  
  console.log('✅ Logged in successfully');
}

test('Diagnostic: Check sections loading in console', async ({ page }) => {
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    // Print in real-time for visibility
    if (text.includes('sections') || text.includes('Firestore') || text.includes('Fetched')) {
      console.log(`[BROWSER CONSOLE] ${text}`);
    }
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR] ${error.message}`);
  });

  await loginAsAdmin(page);
  
  // Go to sections page
  console.log('\n📚 Navigating to sections page...');
  await page.goto(`${BASE_URL}/sections`);
  await page.waitForTimeout(5000);
  
  // Check what sections shows in React DevTools/state
  const sectionsData = await page.evaluate(() => {
    // Try to access React state (this is a hack but useful for debugging)
    const app = document.querySelector('#root');
    return {
      hasSectionsTable: !!document.querySelector('table'),
      tableRowCount: document.querySelectorAll('tbody tr').length,
      hasAddButton: !!document.querySelector('button:has-text("Add Class")'),
    };
  });
  
  console.log('\n📊 Page Analysis:');
  console.log(`  - Has sections table: ${sectionsData.hasSectionsTable}`);
  console.log(`  - Table row count: ${sectionsData.tableRowCount}`);
  console.log(`  - Has Add Class button: ${sectionsData.hasAddButton}`);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/sections-diagnostic.png', fullPage: true });
  
  // Filter and print relevant console logs
  console.log('\n📝 Relevant Console Logs:');
  const relevantLogs = consoleLogs.filter(log => 
    log.toLowerCase().includes('sections') || 
    log.toLowerCase().includes('firestore') ||
    log.toLowerCase().includes('fetch')
  );
  
  if (relevantLogs.length === 0) {
    console.log('  ⚠️ No relevant logs found! This might indicate sections are not being fetched.');
  } else {
    relevantLogs.forEach(log => console.log(`  ${log}`));
  }
});
