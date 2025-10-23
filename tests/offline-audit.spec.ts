import { test, expect } from '@playwright/test';

/**
 * OFFLINE MODE COMPREHENSIVE AUDIT
 * 
 * Tests all major pages, collections, and modules in offline mode
 * to identify white screens, errors, and broken functionality.
 */

test.describe('Offline Mode - Comprehensive Audit', () => {
  
  // Helper function to login
  async function login(page: any) {
    await page.goto('/');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@school.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    // Wait for header with online indicator (means login successful)
    await page.waitForSelector('[title="Online"], [title="Offline"]', { timeout: 15000 });
  }

  test('Audit 1: Dashboard - Should load offline', async ({ page, context }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    await login(page);
    
    console.log('\n=== AUDIT 1: Dashboard ===');
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    // Check if dashboard is visible
    const dashboardHeading = page.locator('h1:has-text("Dashboard")');
    const isVisible = await dashboardHeading.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✅ Dashboard loads in offline mode');
    } else {
      console.log('❌ Dashboard NOT visible - WHITE SCREEN DETECTED');
      
      // Check for error messages
      const errorText = await page.textContent('body').catch(() => '');
      console.log('Page content:', errorText ? errorText.substring(0, 200) : 'No content');
    }
    
    expect(isVisible).toBe(true);
  });

  test('Audit 2: Students Page - Should load offline', async ({ page, context }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('❌ Browser Error:', msg.text());
      }
    });

    await login(page);
    
    console.log('\n=== AUDIT 2: Students Page ===');
    
    // Navigate to Students while online
    await page.click('a[href="/students"]');
    await page.waitForTimeout(1000);
    
    // Go offline
    console.log('Going offline...');
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    // Try to interact with students page
    const studentsHeading = page.locator('h1:has-text("Students"), h2:has-text("Students")');
    const isVisible = await studentsHeading.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✅ Students page visible in offline mode');
      
      // Check if student list renders
      const studentCards = await page.locator('[class*="student"], [class*="Student"]').count();
      console.log(`📊 Student cards found: ${studentCards}`);
      
    } else {
      console.log('❌ Students page NOT visible - WHITE SCREEN DETECTED');
      
      // Screenshot for debugging
      await page.screenshot({ path: 'test-results/offline-students-error.png' });
    }
    
    // Log all errors
    if (errors.length > 0) {
      console.log('\n❌ Errors detected:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    expect(isVisible).toBe(true);
  });

  test('Audit 3: Teachers Page - Should load offline', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 3: Teachers Page ===');
    
    // Navigate to Teachers
    await page.click('a[href="/teachers"]');
    await page.waitForTimeout(1000);
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    const teachersHeading = page.locator('h1:has-text("Teachers"), h2:has-text("Teachers")');
    const isVisible = await teachersHeading.isVisible().catch(() => false);
    
    console.log(isVisible ? '✅ Teachers page loads' : '❌ Teachers page WHITE SCREEN');
    expect(isVisible).toBe(true);
  });

  test('Audit 4: Grades/Gradebook - Should load offline', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 4: Grades/Gradebook ===');
    
    // Try multiple possible routes for grades
    const gradeRoutes = ['/gradebook', '/grades', '/assessment'];
    let navigated = false;
    
    for (const route of gradeRoutes) {
      try {
        const linkExists = await page.locator(`a[href="${route}"]`).count();
        if (linkExists > 0) {
          await page.click(`a[href="${route}"]`);
          navigated = true;
          console.log(`✅ Navigated via ${route}`);
          break;
        }
      } catch (e) {
        console.log(`⚠️ Route ${route} not found`);
      }
    }
    
    if (!navigated) {
      console.log('⚠️ No grades link found, checking content directly');
    }
    
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    // Check if grades view is visible (broader search)
    const gradesContent = page.locator('text=/Grade|Assessment|Subject|Report/i').first();
    const isVisible = await gradesContent.isVisible().catch(() => false);
    
    console.log(isVisible ? '✅ Grades page loads' : '❌ Grades page WHITE SCREEN');
    
    // Don't fail the test if we couldn't navigate - just log it
    if (!navigated) {
      console.log('ℹ️ Test skipped - grades link not found in sidebar');
    } else {
      expect(isVisible).toBe(true);
    }
  });

  test('Audit 5: Attendance - Should load offline', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 5: Attendance Page ===');
    
    await page.click('a[href="/attendance"]');
    await page.waitForTimeout(1000);
    
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    const attendanceHeading = page.locator('h1:has-text("Attendance"), h2:has-text("Attendance")');
    const isVisible = await attendanceHeading.isVisible().catch(() => false);
    
    console.log(isVisible ? '✅ Attendance page loads' : '❌ Attendance page WHITE SCREEN');
    expect(isVisible).toBe(true);
  });

  test('Audit 6: Announcements - Should load offline', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 6: Announcements ===');
    
    await page.click('a[href="/announcements"]');
    await page.waitForTimeout(1000);
    
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    const announcementsHeading = page.locator('h1:has-text("Announcements"), h2:has-text("Announcements")');
    const isVisible = await announcementsHeading.isVisible().catch(() => false);
    
    console.log(isVisible ? '✅ Announcements page loads' : '❌ Announcements WHITE SCREEN');
    expect(isVisible).toBe(true);
  });

  test('Audit 7: Assignments - Should load offline', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 7: Assignments ===');
    
    await page.click('a[href="/assignments"]');
    await page.waitForTimeout(1000);
    
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    // Look for h1 specifically (main page heading)
    const assignmentsHeading = page.locator('main h1:has-text("Assignments")').first();
    const isVisible = await assignmentsHeading.isVisible().catch(() => false);
    
    console.log(isVisible ? '✅ Assignments page loads' : '❌ Assignments WHITE SCREEN');
    expect(isVisible).toBe(true);
  });

  test('Audit 8: Sections - Should load offline', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 8: Sections ===');
    
    await page.click('a[href="/sections"]');
    await page.waitForTimeout(1000);
    
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    const sectionsHeading = page.locator('h1:has-text("Sections"), h2:has-text("Sections")');
    const isVisible = await sectionsHeading.isVisible().catch(() => false);
    
    console.log(isVisible ? '✅ Sections page loads' : '❌ Sections WHITE SCREEN');
    expect(isVisible).toBe(true);
  });

  test('Audit 9: Settings - Should load offline', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 9: Settings ===');
    
    await page.click('a[href="/settings"]');
    await page.waitForTimeout(1000);
    
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    const settingsHeading = page.locator('h1:has-text("Settings"), h2:has-text("Settings")');
    const isVisible = await settingsHeading.isVisible().catch(() => false);
    
    console.log(isVisible ? '✅ Settings page loads' : '❌ Settings WHITE SCREEN');
    expect(isVisible).toBe(true);
  });

  test('Audit 10: Navigation Between Pages Offline', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 10: Navigation Between Pages ===');
    
    // Pre-load all pages online first to cache data
    const routes = [
      { name: 'Dashboard', href: '/' },
      { name: 'Students', href: '/students' },
      { name: 'Teachers', href: '/teachers' },
      { name: 'Announcements', href: '/announcements' },
    ];
    
    console.log('📦 Pre-loading pages to cache data...');
    for (const route of routes) {
      await page.click(`a[href="${route.href}"]`);
      await page.waitForTimeout(1500);
      console.log(`✅ Cached: ${route.name}`);
    }
    
    // Now go offline and test navigation
    console.log('\n📴 Going offline...');
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    // Navigate back to dashboard first
    await page.click('a[href="/"]');
    await page.waitForTimeout(1000);
    
    // Test offline navigation
    for (const route of routes) {
      if (route.href === '/') continue; // Skip dashboard, already there
      
      console.log(`\nNavigating to ${route.name} (offline)...`);
      
      await page.click(`a[href="${route.href}"]`);
      await page.waitForTimeout(2000);
      
      // Check URL changed
      const url = page.url();
      const urlMatches = url.includes(route.href);
      
      if (urlMatches) {
        console.log(`✅ ${route.name} - URL navigation successful (${url})`);
      } else {
        console.log(`❌ ${route.name} - URL didn't change (${url})`);
      }
      
      expect(urlMatches).toBe(true);
    }
  });

  test('Audit 11: Console Errors - Scan for Firestore Errors', async ({ page, context }) => {
    const firestoreErrors: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (text.includes('Firestore') || text.includes('firebase')) {
          firestoreErrors.push(text);
        } else if (text.includes('network') || text.includes('fetch')) {
          networkErrors.push(text);
        }
      }
    });

    await login(page);
    
    console.log('\n=== AUDIT 11: Error Scanning ===');
    
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Navigate to Students (where you saw white screen)
    await page.click('a[href="/students"]');
    await page.waitForTimeout(3000);
    
    console.log('\n📋 Firestore Errors:', firestoreErrors.length);
    firestoreErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err.substring(0, 100)}...`));
    
    console.log('\n📋 Network Errors:', networkErrors.length);
    networkErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err.substring(0, 100)}...`));
    
    // Check if page is functional despite errors
    const isPageVisible = await page.locator('h1, h2').first().isVisible().catch(() => false);
    console.log('\nPage visible despite errors:', isPageVisible ? '✅ YES' : '❌ NO');
  });

  test('Audit 12: Data Loading - Check if cached data appears', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 12: Cached Data Loading ===');
    
    // While online, check student count
    await page.click('a[href="/students"]');
    await page.waitForTimeout(2000);
    
    const onlineStudentCount = await page.locator('[class*="student"], tr').count();
    console.log(`📊 Students visible ONLINE: ${onlineStudentCount}`);
    
    // Go offline WITHOUT reloading (to test if cached data shows)
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    // Check if students still visible (from cache)
    const offlineStudentCount = await page.locator('[class*="student"], tr').count();
    console.log(`📊 Students visible OFFLINE (no reload): ${offlineStudentCount}`);
    
    if (offlineStudentCount === 0 && onlineStudentCount > 0) {
      console.log('❌ ISSUE: Data not persisting offline!');
      
      // Check if it's a rendering issue or data issue
      const bodyHtml = await page.content();
      const hasStudentData = bodyHtml.includes('student') || bodyHtml.includes('Student');
      console.log('HTML contains student references:', hasStudentData);
      
    } else if (offlineStudentCount > 0) {
      console.log('✅ Cached data is loading offline');
    }
    
    // Expect data to remain visible
    expect(offlineStudentCount).toBeGreaterThan(0);
  });

  test('Audit 13: Firestore Persistence - Check if enabled', async ({ page }) => {
    await page.goto('/');
    
    console.log('\n=== AUDIT 13: Firestore Persistence Check ===');
    
    // Check if Firestore persistence is enabled
    const persistenceStatus = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Check IndexedDB for Firestore data
        const request = indexedDB.open('firestore/edusync-sis/default');
        
        request.onsuccess = () => {
          const db = request.result;
          const stores = Array.from(db.objectStoreNames);
          resolve({
            exists: true,
            stores: stores,
            count: stores.length
          });
        };
        
        request.onerror = () => {
          resolve({ exists: false, error: 'Cannot access IndexedDB' });
        };
      });
    });
    
    console.log('Firestore IndexedDB:', JSON.stringify(persistenceStatus, null, 2));
    
    if ((persistenceStatus as any).exists) {
      console.log('✅ Firestore persistence appears to be enabled');
      console.log(`📊 Object stores: ${(persistenceStatus as any).stores.join(', ')}`);
    } else {
      console.log('❌ Firestore persistence NOT detected');
      console.log('⚠️  This could cause white screens offline!');
    }
  });

  test('Audit 14: React Suspense Fallbacks - Check for loading states', async ({ page, context }) => {
    await login(page);
    
    console.log('\n=== AUDIT 14: React Suspense & Loading States ===');
    
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Navigate and check for loading indicators
    await page.click('a[href="/students"]');
    
    // Look for loading spinner or fallback
    const hasSpinner = await page.locator('[class*="spinner"], [class*="loading"]').isVisible().catch(() => false);
    const hasLoader = await page.locator('text=/Loading|loading/i').isVisible().catch(() => false);
    
    console.log('Loading spinner visible:', hasSpinner ? '✅' : '❌');
    console.log('Loading text visible:', hasLoader ? '✅' : '❌');
    
    if (!hasSpinner && !hasLoader) {
      console.log('⚠️  No loading state detected - might cause white screen');
    }
    
    // Wait for content to appear
    await page.waitForTimeout(3000);
    
    const contentVisible = await page.locator('h1, h2, table, [role="main"]').first().isVisible().catch(() => false);
    console.log('Content eventually loads:', contentVisible ? '✅' : '❌');
  });
});
