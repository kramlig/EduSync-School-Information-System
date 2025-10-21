import { test, expect } from '@playwright/test';

const BASE_URL = 'https://edusync-sis.web.app';

async function loginAsAdmin(page) {
  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@school.edu');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}

test('🔍 Diagnostic: Check announcements data loading', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Firestore') || text.includes('announcement') || text.includes('Announcement')) {
      console.log(`[Browser Console] ${text}`);
    }
  });

  await loginAsAdmin(page);
  console.log('✅ Logged in successfully');

  // Navigate to announcements page
  await page.goto(`${BASE_URL}/announcements`);
  await page.waitForTimeout(5000); // Wait for data to load

  // Check browser console for Firestore logs
  console.log('\n📊 Checking announcements data in UI...');

  // Check if any announcements are visible
  const announcementCards = await page.locator('.bg-white.dark\\:bg-slate-800.rounded-lg.shadow-md.p-4').count();
  console.log(`Found ${announcementCards} announcement cards in UI`);

  // Check if "No announcements" message is shown
  const noAnnouncementsMsg = await page.locator('text=No announcements found').count();
  if (noAnnouncementsMsg > 0) {
    console.log('⚠️ "No announcements found" message is displayed');
  }

  // Try to get text content from first announcement if exists
  if (announcementCards > 0) {
    const firstCard = page.locator('.bg-white.dark\\:bg-slate-800.rounded-lg.shadow-md.p-4').first();
    const title = await firstCard.locator('h3').textContent();
    console.log(`First announcement title: ${title}`);
  }

  // Check React DevTools data by evaluating in page context
  const reactData = await page.evaluate(() => {
    // Try to access schoolData from window (if exposed for debugging)
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      return { hasReactDevTools: true };
    }
    return { hasReactDevTools: false };
  });
  console.log('React DevTools available:', reactData.hasReactDevTools);

  console.log('\n✅ Diagnostic complete - check console logs above');
});
