// Quick test to capture screenshot and check form state
import { test } from '@playwright/test';

test('Check login page state', async ({ page }) => {
  // Monitor for dialogs/alerts
  const alerts = [];
  page.on('dialog', async dialog => {
    console.log(`🚨 ALERT: "${dialog.message()}"`);
    alerts.push(dialog.message());
    await dialog.accept();
  });
  
  await page.goto('https://edusync.ph/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'login-page-state.png', fullPage: true });
  
  // Check form elements
  const form = await page.$('form');
  const emailInput = await page.$('input[type="email"]');
  const passwordInput = await page.$('input[type="password"]');
  const submitButton = await page.$('button[type="submit"]');
  
  console.log('Form exists:', !!form);
  console.log('Email input exists:', !!emailInput);
  console.log('Password input exists:', !!passwordInput);
  console.log('Submit button exists:', !!submitButton);
  
  if (submitButton) {
    const isDisabled = await submitButton.isDisabled();
    const buttonText = await submitButton.textContent();
    console.log('Button disabled:', isDisabled);
    console.log('Button text:', buttonText);
  }
  
  // Fill form
  await page.fill('input[type="email"]', 'admin@school.edu');
  await page.fill('input[type="password"]', 'password');
  
  // Take screenshot after filling
  await page.screenshot({ path: 'login-page-filled.png', fullPage: true });
  
  // Try clicking
  console.log('About to click submit button...');
  await page.click('button[type="submit"]');
  
  // Wait for green banner (logged in state)
  console.log('Waiting for logged-in state...');
  await page.waitForTimeout(5000);
  
  // Check if green banner exists
  const greenBanner = await page.locator('div').filter({ hasText: /✅ LOGGED IN/ }).first();
  const hasBanner = await greenBanner.count() > 0;
  console.log('Green banner exists:', hasBanner);
  
  // Check for dashboard elements
  const sidebar = await page.$('nav, aside, [role="navigation"]');
  const header = await page.$('header');
  console.log('Sidebar exists:', !!sidebar);
  console.log('Header exists:', !!header);
  
  // Take screenshot after click
  await page.screenshot({ path: 'login-page-after-click.png', fullPage: true });
  
  console.log('Final URL:', page.url());
  console.log('Alerts captured:', alerts.length);
  if (alerts.length > 0) {
    console.log('Alert messages:', alerts);
  }
});
