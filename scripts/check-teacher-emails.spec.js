/**
 * Check what emails are actually in the teachers collection
 */

import { test } from '@playwright/test';

test('Check teacher emails in database', async ({ page }) => {
  await page.goto('https://edusync-sis.web.app/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  
  // Wait for data to load
  await page.waitForTimeout(6000);
  
  // Execute code in browser context to check teachers
  const teacherEmails = await page.evaluate(() => {
    // Access window to see if teachers are stored there
    const teachers = window.teachers || [];
    return teachers.slice(0, 10).map(t => t.email);
  });
  
  console.log('\n📧 First 10 teacher emails in memory:');
  teacherEmails.forEach((email, idx) => {
    console.log(`   ${idx + 1}. ${email}`);
  });
  
  // Also check localStorage
  const storedData = await page.evaluate(() => {
    return localStorage.getItem('edusync_session');
  });
  
  console.log('\n💾 Stored session:', storedData || 'None');
});
