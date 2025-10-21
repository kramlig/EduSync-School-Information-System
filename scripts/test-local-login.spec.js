/**
 * Test login against LOCAL production build
 * This will help us determine if the issue is production-specific or code-related
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test('Test local production build login', async ({ page }) => {
  console.log('\n🧪 Testing LOCAL production build...\n');
  
  // Enable console monitoring
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') console.log(`   ❌ Console Error: ${text}`);
    else if (type === 'warning') console.log(`   ⚠️  Console Warning: ${text}`);
    else if (text.includes('[App]') || text.includes('[LoginScreen]')) {
      console.log(`   📝 ${text}`);
    }
  });
  
  // Go to page
  console.log('1️⃣ Loading page...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'local-test-1-initial.png', fullPage: true });
  console.log('   📸 Screenshot: local-test-1-initial.png');
  
  // Wait a bit for data to load
  console.log('2️⃣ Waiting for data to load...');
  await page.waitForTimeout(5000);
  
  // Take screenshot after data loads
  await page.screenshot({ path: 'local-test-2-loaded.png', fullPage: true });
  console.log('   📸 Screenshot: local-test-2-loaded.png');
  
  // Check what's visible on screen
  const pageText = await page.textContent('body');
  console.log('3️⃣ Checking visible text...');
  if (pageText.includes('LOGIN SCREEN')) {
    console.log('   ✅ Login screen is visible');
  } else if (pageText.includes('LOGGED IN')) {
    console.log('   ✅ Already logged in');
  } else if (pageText.includes('LOADING')) {
    console.log('   ⚠️  Still loading...');
  }
  
  // Try to fill and submit form
  console.log('4️⃣ Attempting login...');
  
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('   ✅ Email input found');
    await page.fill('input[type="email"]', 'admin@school.edu');
    await page.fill('input[type="password"]', 'password');
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'local-test-3-filled.png', fullPage: true });
    console.log('   📸 Screenshot: local-test-3-filled.png');
    
    console.log('   🖱️  Clicking submit button...');
    
    // Try clicking and see if alert appears
    page.once('dialog', async dialog => {
      console.log(`   🚨 ALERT APPEARED: "${dialog.message()}"`);
      await dialog.accept();
    });
    
    await page.click('button[type="submit"]');
    
    // Wait a moment
    await page.waitForTimeout(2000);
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'local-test-4-after-click.png', fullPage: true });
    console.log('   📸 Screenshot: local-test-4-after-click.png');
    
    // Check URL
    const currentURL = page.url();
    console.log(`   🌐 Current URL: ${currentURL}`);
    
    if (currentURL.includes('localhost:3000') && !currentURL.includes('#')) {
      console.log('   ⚠️  URL unchanged - login might have failed');
    } else {
      console.log('   ✅ URL changed - login might have succeeded');
    }
    
  } else {
    console.log('   ❌ Email input not found');
  }
  
  console.log('\n✅ Test complete - check screenshots!\n');
});
