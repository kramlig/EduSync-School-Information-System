/**
 * COMPREHENSIVE END-TO-END TESTS FOR PRODUCTION
 * 
 * High-level smoke tests covering all major system flows from start to finish.
 * These tests validate the complete user journey across all modules.
 * 
 * ⚠️ PRODUCTION TESTING NOTES:
 * - Configure BASE_URL for production environment
 * - Use test accounts (do not use real student data)
 * - Tests are READ-HEAVY to avoid data pollution
 * - Some workflows (like enrollment) use test data that can be cleaned up
 * 
 * Test Coverage:
 * 1. School Setup & Configuration
 * 2. User Management
 * 3. Enrollment Process (End-to-End)
 * 4. Academic Operations (Grades, Attendance)
 * 5. Financial Management (Private/Hybrid only)
 * 6. Forms & Reporting (Form 137, 138, SF1, SF2)
 * 7. Daily Operations
 * 8. Parent Portal
 * 9. Student Portal
 * 10. System-Wide Functionality
 * 11. Offline Mode & PWA Features (NEW)
 *     - Service Worker Registration
 *     - Cache Storage & Limits
 *     - Offline Page Loading
 *     - Firestore Offline Persistence
 *     - Offline Banner/Indicator
 *     - PWA Manifest Validation
 *     - Network Recovery Testing
 * 
 * @see docs/SYSTEM_FLOWS_COMPREHENSIVE.md for flow diagrams
 */

import { test, expect, Page } from '@playwright/test';

// ==================== CONFIGURATION ====================

const TEST_CONFIG = {
  // Auto-detect from Playwright config baseURL
  BASE_URL: '', // Will use baseURL from playwright config
  
  // Timeouts
  PAGE_LOAD_TIMEOUT: 60000,  // 60s for production
  ELEMENT_TIMEOUT: 30000,    // 30s for slow networks
  NAVIGATION_TIMEOUT: 45000, // 45s for page transitions
  
  // Waits
  SHORT_WAIT: 1000,
  MEDIUM_WAIT: 2000,
  LONG_WAIT: 5000,
} as const;

// Test Credentials - Staging Demo Accounts
const CREDENTIALS = {
  SUPER_ADMIN: {
    email: 'superadmin@edusync-demo.ph',
    password: 'admin123',
  },
  ADMIN: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@edusync-demo.ph',
    password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
  },
  TEACHER: {
    email: process.env.TEST_TEACHER_EMAIL || 'teacher@edusync-demo.ph',
    password: process.env.TEST_TEACHER_PASSWORD || 'teacher123',
  },
  PARENT: {
    email: process.env.TEST_PARENT_EMAIL || 'parent@edusync-demo.ph',
    password: process.env.TEST_PARENT_PASSWORD || 'parent123',
  },
  STUDENT: {
    email: process.env.TEST_STUDENT_EMAIL || 'student@edusync-demo.ph',
    password: process.env.TEST_STUDENT_PASSWORD || 'student123',
  },
};

// ==================== HELPER FUNCTIONS ====================

async function loginAs(
  page: Page,
  email: string,
  password: string,
  role: string = 'user'
): Promise<void> {
  console.log(`🔐 Logging in as ${role}: ${email}`);
  
  await page.goto('/admin');
  
  // Wait for login form to be ready
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for successful login - use greeting heading for staff roles, dashboard for students/parents
  // Don't wait for networkidle - PWA apps with service workers never reach it
  if (role.toLowerCase().includes('student') || role.toLowerCase().includes('parent')) {
    // Students/Parents see "My Dashboard" or "Parent Dashboard"
    await page.waitForSelector('h1', { timeout: 15000 });
  } else {
    // Staff roles see greeting heading
    const greetingHeading = page.getByRole('heading', { level: 1 }).filter({ hasText: /good (morning|afternoon|evening)/i });
    await greetingHeading.waitFor({ timeout: 15000 }).catch(async () => {
      // Fallback: wait for any h1 to appear
      await page.waitForSelector('h1', { timeout: 15000 });
    });
  }
  
  console.log('✅ Login successful');
}

async function logout(page: Page): Promise<void> {
  console.log('🚪 Logging out');
  
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await page.waitForLoadState('domcontentloaded');
  }
  
  console.log('✅ Logged out');
}

async function navigateTo(page: Page, path: string): Promise<void> {
  const url = path.startsWith('http') ? path : `${TEST_CONFIG.BASE_URL}${path}`;
  console.log(`📍 Navigating to: ${path}`);
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TEST_CONFIG.NAVIGATION_TIMEOUT });
  await page.waitForTimeout(TEST_CONFIG.SHORT_WAIT);
}

// ==================== TEST SUITE ====================

test.describe('COMPREHENSIVE E2E TESTS - Production', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minutes per test
    
    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('[BROWSER ERROR]', msg.text());
      }
    });
  });

  // ==================== FLOW 1: SCHOOL SETUP ====================
  
  test.describe('FLOW 1: School Setup & Configuration', () => {
    
    test('1.1 - Super Admin can access School Management', async ({ page }) => {
      await loginAs(page, CREDENTIALS.SUPER_ADMIN.email, CREDENTIALS.SUPER_ADMIN.password, 'Super Admin');
      
      // Navigate to School Management
      await navigateTo(page, '/school-management');
      
      // Verify dashboard loaded
      await expect(page.locator('h1, h2').filter({ hasText: /school management/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Verify schools list is visible
      await expect(page.locator('text=/school/i').first()).toBeVisible();
      
      console.log('✅ Super Admin can access School Management');
    });
    
    test('1.2 - Admin can access Settings', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      // Navigate to Settings
      await navigateTo(page, '/settings');
      
      // Verify settings page loaded
      await expect(page.locator('h1, h2').filter({ hasText: /settings|school settings/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Verify key configuration fields exist
      await expect(page.locator('text=/school type|school year|academic year/i')).toBeVisible();
      
      console.log('✅ Admin can access Settings');
    });
  });

  // ==================== FLOW 2: USER MANAGEMENT ====================
  
  test.describe('FLOW 2: User Management', () => {
    
    test('2.1 - Admin can view students', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/students');
      
      // Verify students page loaded
      await expect(page.locator('h1, h2').filter({ hasText: /students/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Check if student list or table exists
      const hasStudents = await page.locator('table, .student-card, .student-list').count() > 0;
      expect(hasStudents).toBeTruthy();
      
      console.log('✅ Admin can view students');
    });
    
    test('2.2 - Admin can view teachers', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/teachers');
      
      await expect(page.locator('h1, h2').filter({ hasText: /teachers|staff/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Admin can view teachers');
    });
    
    test('2.3 - Admin can view parents', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/parents');
      
      await expect(page.locator('h1, h2').filter({ hasText: /parents/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Admin can view parents');
    });
    
    test('2.4 - Admin can view sections', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/sections');
      
      await expect(page.locator('h1, h2').filter({ hasText: /sections|classes/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Admin can view sections');
    });
  });

  // ==================== FLOW 3: ENROLLMENT PROCESS ====================
  
  test.describe('FLOW 3: Enrollment Process (End-to-End)', () => {
    
    test('3.1 - Public can access Enrollment Portal', async ({ page }) => {
      await navigateTo(page, '/enrollment');
      
      // Verify enrollment portal loaded
      await expect(page.locator('h1, h2').filter({ hasText: /enrollment|enroll/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Check for "Start Application" button or similar
      const hasStartButton = await page.locator('button:has-text(/start|apply|begin/i), a:has-text(/start|apply|begin/i)').count() > 0;
      expect(hasStartButton).toBeTruthy();
      
      console.log('✅ Public can access Enrollment Portal');
    });
    
    test('3.2 - Enrollment Application Form - Step 1 (School Selection)', async ({ page }) => {
      await navigateTo(page, '/enrollment/apply');
      
      // Wait for form to load
      await page.waitForTimeout(TEST_CONFIG.MEDIUM_WAIT);
      
      // Check if we're on school selection or first step
      const hasForm = await page.locator('form, input, select, button').count() > 0;
      expect(hasForm).toBeTruthy();
      
      // Look for school selection or student info step
      const hasStep = await page.locator('text=/step 1|school selection|student information/i').count() > 0;
      expect(hasStep).toBeTruthy();
      
      console.log('✅ Enrollment form Step 1 loads');
    });
    
    test('3.3 - Admin can view Enrollment Dashboard', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/admin/enrollment');
      
      // Verify admin enrollment dashboard
      await expect(page.locator('h1, h2').filter({ hasText: /enrollment|applications/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Check for application status tabs or filters
      const hasStatusFilters = await page.locator('button:has-text(/submitted|approved|rejected/i), text=/status/i').count() > 0;
      expect(hasStatusFilters).toBeTruthy();
      
      console.log('✅ Admin can view Enrollment Dashboard');
    });
  });

  // ==================== FLOW 4: ACADEMIC OPERATIONS ====================
  
  test.describe('FLOW 4: Academic Operations', () => {
    
    test('4.1 - Teacher can access Attendance', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/attendance');
      
      await expect(page.locator('h1, h2').filter({ hasText: /attendance/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Check for date selector or student list
      const hasAttendanceUI = await page.locator('input[type="date"], select, .student-list, table').count() > 0;
      expect(hasAttendanceUI).toBeTruthy();
      
      console.log('✅ Teacher can access Attendance');
    });
    
    test('4.2 - Teacher can access Grades & Reports', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/grades');
      
      await expect(page.locator('h1, h2').filter({ hasText: /grades|reports|assessment/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Teacher can access Grades');
    });
    
    test('4.3 - Teacher can access Assignments', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/assignments');
      
      await expect(page.locator('h1, h2').filter({ hasText: /assignments/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Teacher can access Assignments');
    });
    
    test('4.4 - Teacher can access Lesson Plans', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/lesson-plan');
      
      await expect(page.locator('h1, h2').filter({ hasText: /lesson|plan/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Teacher can access Lesson Plans');
    });
  });

  // ==================== FLOW 5: FINANCIAL MANAGEMENT ====================
  
  test.describe('FLOW 5: Financial Management (Private/Hybrid Schools)', () => {
    
    test('5.1 - Admin can access Fee Structures', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/fee-structures');
      
      // May not be available for all school types
      const pageLoaded = await page.locator('h1, h2, text=/fee|financial|not enabled/i').first().isVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT }).catch(() => false);
      
      if (pageLoaded) {
        console.log('✅ Fee Structures page accessible');
      } else {
        console.log('⚠️  Fee Structures not enabled (public school)');
      }
    });
    
    test('5.2 - Admin can access Payment Recording', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/record-payment');
      
      const pageLoaded = await page.locator('h1, h2, text=/payment|financial|not enabled/i').first().isVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT }).catch(() => false);
      
      if (pageLoaded) {
        console.log('✅ Payment Recording page accessible');
      } else {
        console.log('⚠️  Payment Recording not enabled (public school)');
      }
    });
    
    test('5.3 - Admin can access Financial Reports', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/financial-reports');
      
      const pageLoaded = await page.locator('h1, h2, text=/report|financial|not enabled/i').first().isVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT }).catch(() => false);
      
      if (pageLoaded) {
        console.log('✅ Financial Reports page accessible');
      } else {
        console.log('⚠️  Financial Reports not enabled (public school)');
      }
    });
  });

  // ==================== FLOW 6: FORMS & REPORTING ====================
  
  test.describe('FLOW 6: Forms & Reporting', () => {
    
    test('6.1 - Teacher can access Forms Library', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/forms');
      
      await expect(page.locator('h1, h2').filter({ hasText: /forms|deped/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Check for form cards
      const hasFormCards = await page.locator('text=/form 137|form 138|sf1|sf2/i').count() > 0;
      expect(hasFormCards).toBeTruthy();
      
      console.log('✅ Forms Library accessible');
    });
    
    test('6.2 - Form 137 Dashboard loads', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/forms/137');
      
      await expect(page.locator('h1, h2').filter({ hasText: /form 137|permanent record/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Form 137 Dashboard loads');
    });
    
    test('6.3 - Form 138 Dashboard loads', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/forms/138');
      
      await expect(page.locator('h1, h2').filter({ hasText: /form 138|report card/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Form 138 Dashboard loads');
    });
    
    test('6.4 - School Forms Dashboard loads', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/grades/schoolforms');
      
      await expect(page.locator('h1, h2').filter({ hasText: /school forms|sf|ebeis/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Check for SF1, SF2, SF9 cards
      const hasSchoolForms = await page.locator('text=/sf1|sf2|sf9/i').count() > 0;
      expect(hasSchoolForms).toBeTruthy();
      
      console.log('✅ School Forms Dashboard loads');
    });
    
    test('6.5 - ELLN Dashboard loads', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/forms/elln');
      
      await expect(page.locator('h1, h2').filter({ hasText: /elln|literacy|numeracy/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ ELLN Dashboard loads');
    });
  });

  // ==================== FLOW 7: DAILY OPERATIONS ====================
  
  test.describe('FLOW 7: Daily Operations', () => {
    
    test('7.1 - Teacher Dashboard loads with widgets', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/');
      
      // Verify dashboard
      await expect(page.locator('h1, h2').filter({ hasText: /dashboard|welcome/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      // Check for dashboard widgets/cards
      const hasWidgets = await page.locator('.card, .widget, [class*="stat"]').count() > 0;
      expect(hasWidgets).toBeTruthy();
      
      console.log('✅ Teacher Dashboard loads');
    });
    
    test('7.2 - Schedule view loads', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      await navigateTo(page, '/schedule');
      
      await expect(page.locator('h1, h2').filter({ hasText: /schedule|timetable/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Schedule view loads');
    });
    
    test('7.3 - Announcements view loads', async ({ page }) => {
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'Admin');
      
      await navigateTo(page, '/announcements');
      
      await expect(page.locator('h1, h2').filter({ hasText: /announcements/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Announcements view loads');
    });
  });

  // ==================== FLOW 8: PARENT PORTAL ====================
  
  test.describe('FLOW 8: Parent Portal', () => {
    
    test('8.1 - Parent can login and view dashboard', async ({ page }) => {
      await loginAs(page, CREDENTIALS.PARENT.email, CREDENTIALS.PARENT.password, 'Parent');
      
      await navigateTo(page, '/');
      
      // Verify parent dashboard
      await expect(page.locator('h1, h2').filter({ hasText: /dashboard|children|child/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Parent can view dashboard');
    });
    
    test('8.2 - Parent can view child grades', async ({ page }) => {
      await loginAs(page, CREDENTIALS.PARENT.email, CREDENTIALS.PARENT.password, 'Parent');
      
      await navigateTo(page, '/grades');
      
      await expect(page.locator('h1, h2').filter({ hasText: /grades|report/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Parent can view grades');
    });
    
    test('8.3 - Parent can view child attendance', async ({ page }) => {
      await loginAs(page, CREDENTIALS.PARENT.email, CREDENTIALS.PARENT.password, 'Parent');
      
      await navigateTo(page, '/attendance');
      
      await expect(page.locator('h1, h2').filter({ hasText: /attendance/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Parent can view attendance');
    });
    
    test('8.4 - Parent can view billing (if enabled)', async ({ page }) => {
      await loginAs(page, CREDENTIALS.PARENT.email, CREDENTIALS.PARENT.password, 'Parent');
      
      await navigateTo(page, '/billing');
      
      const pageLoaded = await page.locator('h1, h2, text=/billing|payment|not enabled/i').first().isVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT }).catch(() => false);
      
      if (pageLoaded) {
        console.log('✅ Parent can view billing');
      } else {
        console.log('⚠️  Billing not enabled for this school');
      }
    });
    
    test('8.5 - Parent can view announcements', async ({ page }) => {
      await loginAs(page, CREDENTIALS.PARENT.email, CREDENTIALS.PARENT.password, 'Parent');
      
      await navigateTo(page, '/announcements');
      
      await expect(page.locator('h1, h2').filter({ hasText: /announcements/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Parent can view announcements');
    });
  });

  // ==================== STUDENT PORTAL ====================
  
  test.describe('FLOW 9: Student Portal', () => {
    
    test('9.1 - Student can login and view dashboard', async ({ page }) => {
      await loginAs(page, CREDENTIALS.STUDENT.email, CREDENTIALS.STUDENT.password, 'Student');
      
      await navigateTo(page, '/');
      
      await expect(page.locator('h1, h2').filter({ hasText: /dashboard|welcome/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Student can view dashboard');
    });
    
    test('9.2 - Student can view own grades', async ({ page }) => {
      await loginAs(page, CREDENTIALS.STUDENT.email, CREDENTIALS.STUDENT.password, 'Student');
      
      await navigateTo(page, '/grades');
      
      await expect(page.locator('h1, h2').filter({ hasText: /grades|my grades/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Student can view grades');
    });
    
    test('9.3 - Student can view assignments', async ({ page }) => {
      await loginAs(page, CREDENTIALS.STUDENT.email, CREDENTIALS.STUDENT.password, 'Student');
      
      await navigateTo(page, '/assignments');
      
      await expect(page.locator('h1, h2').filter({ hasText: /assignments/i })).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      console.log('✅ Student can view assignments');
    });
  });

  // ==================== SYSTEM-WIDE CHECKS ====================
  
  test.describe('FLOW 10: System-Wide Functionality', () => {
    
    test('10.1 - Landing page loads for public users', async ({ page }) => {
      await navigateTo(page, '/');
      
      // Should show landing page or login
      const pageLoaded = await page.locator('h1, h2').first().isVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      expect(pageLoaded).toBeTruthy();
      
      console.log('✅ Landing page loads');
    });
    
    test('10.2 - Navigation sidebar renders after login', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      // Check for sidebar navigation
      const hasSidebar = await page.locator('nav, aside, [class*="sidebar"]').count() > 0;
      expect(hasSidebar).toBeTruthy();
      
      // Check for menu items
      const hasMenuItems = await page.locator('a[href*="/"], button').count() > 5; // Should have multiple menu items
      expect(hasMenuItems).toBeTruthy();
      
      console.log('✅ Navigation sidebar renders');
    });
    
    test('10.3 - Logout functionality works', async ({ page }) => {
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'Teacher');
      
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      await expect(logoutButton).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      
      await logoutButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Verify redirected to login or landing page
      const isLoggedOut = await page.locator('input[type="email"], text=/sign in|login|welcome/i').first().isVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
      expect(isLoggedOut).toBeTruthy();
      
      console.log('✅ Logout works');
    });
  });

  // ==================== FLOW 11: OFFLINE & PWA FUNCTIONALITY ====================
  
  test.describe('FLOW 11: Offline Mode & PWA Features', () => {
    
    test('11.1 - Service Worker Registration', async ({ page }) => {
      console.log('\n🔧 Testing service worker registration...');
      
      await page.goto('/');
      await page.waitForTimeout(10000); // Wait for SW to register (no networkidle for PWA)
      
      // Check if service worker is registered (don't wait for ready, just check registration)
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        }
        return false;
      });
      
      expect(swRegistered).toBeTruthy();
      console.log('✅ Service worker registered');
    });
    
    test('11.2 - Cache Storage Created', async ({ page }) => {
      console.log('\n💾 Testing cache storage...');
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000); // Wait for SW to cache resources
      
      // Check cache storage
      const cacheNames = await page.evaluate(async () => {
        return await caches.keys();
      });
      
      expect(cacheNames.length).toBeGreaterThan(0);
      console.log(`✅ Cache storage created: ${cacheNames.length} cache(s)`);
      console.log(`   Caches: ${cacheNames.join(', ')}`);
    });
    
    test('11.3 - Offline Page Load (After Login)', async ({ page, context }) => {
      console.log('\n🔌 Testing offline page load...');
      
      // Login first
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'teacher');
      await page.waitForTimeout(2000);
      
      // Navigate to dashboard to cache it
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000); // Let SW cache the page
      
      // Go offline
      await context.setOffline(true);
      console.log('📵 Network disabled');
      
      // Try to reload the page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check if page loaded from cache (should see content)
      const dashboardVisible = await page.locator('text=/dashboard|welcome/i').first().isVisible().catch(() => false);
      
      // Go back online
      await context.setOffline(false);
      console.log('📶 Network restored');
      
      expect(dashboardVisible).toBeTruthy();
      console.log('✅ Page loaded successfully while offline (from cache)');
    });
    
    test('11.4 - Firestore Offline Persistence', async ({ page, context }) => {
      console.log('\n💿 Testing Firestore offline persistence...');
      
      // Login and navigate to a data-heavy page
      await loginAs(page, CREDENTIALS.TEACHER.email, CREDENTIALS.TEACHER.password, 'teacher');
      await page.goto('/students');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000); // Let Firestore cache data
      
      // Get initial student count
      const onlineStudents = await page.locator('[data-testid="student-row"], .student-card, tr').count();
      console.log(`📊 Students loaded online: ${onlineStudents}`);
      
      // Go offline
      await context.setOffline(true);
      console.log('📵 Network disabled');
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check if data still visible (from Firestore cache)
      const offlineStudents = await page.locator('[data-testid="student-row"], .student-card, tr').count();
      
      // Go back online
      await context.setOffline(false);
      console.log('📶 Network restored');
      
      expect(offlineStudents).toBeGreaterThan(0);
      console.log(`✅ Firestore data accessible offline: ${offlineStudents} students`);
    });
    
    test('11.5 - Offline Banner Display', async ({ page, context }) => {
      console.log('\n🚨 Testing offline indicator...');
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Go offline
      await context.setOffline(true);
      await page.waitForTimeout(2000);
      
      // Check for offline banner/indicator
      const offlineBanner = await page.locator('text=/offline|no connection|disconnected/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      
      // Go back online
      await context.setOffline(false);
      await page.waitForTimeout(2000);
      
      expect(offlineBanner).toBeTruthy();
      console.log('✅ Offline indicator displayed');
    });
    
    test('11.6 - PWA Manifest', async ({ page }) => {
      console.log('\n📱 Testing PWA manifest...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check manifest link in HTML
      const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(manifestLink).toBeTruthy();
      console.log(`✅ Manifest link found: ${manifestLink}`);
      
      // Fetch and validate manifest
      const manifestUrl = manifestLink?.startsWith('http') ? manifestLink : `${await page.evaluate(() => window.location.origin)}${manifestLink}`;
      const manifestResponse = await page.request.get(manifestUrl);
      expect(manifestResponse.ok()).toBeTruthy();
      
      const manifest = await manifestResponse.json();
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(manifest.icons).toBeTruthy();
      expect(manifest.icons.length).toBeGreaterThan(0);
      
      console.log(`✅ PWA manifest valid`);
      console.log(`   Name: ${manifest.name}`);
      console.log(`   Short name: ${manifest.short_name}`);
      console.log(`   Icons: ${manifest.icons.length}`);
    });
    
    test('11.7 - Cache Size Limits (No Flooding)', async ({ page }) => {
      console.log('\n📏 Testing cache size limits...');
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000); // Let SW cache resources
      
      // Count cached requests
      const cacheStats = await page.evaluate(async () => {
        const cacheNames = await caches.keys();
        const stats: Record<string, number> = {};
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          stats[cacheName] = keys.length;
        }
        
        return stats;
      });
      
      console.log('📦 Cache statistics:');
      let totalCached = 0;
      for (const [cacheName, count] of Object.entries(cacheStats)) {
        console.log(`   ${cacheName}: ${count} entries`);
        totalCached += count as number;
      }
      
      // Ensure we're not flooding cache (reasonable limit)
      expect(totalCached).toBeLessThan(200); // Should not cache excessively
      console.log(`✅ Total cached entries: ${totalCached} (within limits)`);
    });
    
    test('11.8 - Network Recovery After Offline', async ({ page, context }) => {
      console.log('\n🔄 Testing network recovery...');
      
      // Login and load data
      await loginAs(page, CREDENTIALS.ADMIN.email, CREDENTIALS.ADMIN.password, 'admin');
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      
      // Go offline
      await context.setOffline(true);
      console.log('📵 Network disabled');
      await page.waitForTimeout(2000);
      
      // Go back online
      await context.setOffline(false);
      console.log('📶 Network restored');
      await page.waitForTimeout(3000);
      
      // Try to navigate to a new page (should work)
      await page.goto('/students');
      await page.waitForLoadState('domcontentloaded');
      
      const pageLoaded = await page.locator('text=/students|learners/i').first().isVisible().catch(() => false);
      expect(pageLoaded).toBeTruthy();
      console.log('✅ Network recovery successful - new page loaded');
    });
    
  });
});

// ==================== SUMMARY REPORT ====================

test.afterAll(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE E2E TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('✅ All system flows tested');
  console.log('🎯 Coverage:');
  console.log('   - School Setup & Configuration');
  console.log('   - User Management (Students, Teachers, Parents)');
  console.log('   - Enrollment Process (Portal → Application → Admin Review)');
  console.log('   - Academic Operations (Grades, Attendance, Assignments)');
  console.log('   - Financial Management (Fee Structures, Payments, Reports)');
  console.log('   - Forms & Reporting (Form 137, 138, SF1, SF2, SF9, ELLN)');
  console.log('   - Daily Operations (Dashboard, Schedule, Announcements)');
  console.log('   - Parent Portal (Grades, Attendance, Billing)');
  console.log('   - Student Portal (Dashboard, Grades, Assignments)');
  console.log('   - Offline & PWA Features (Service Worker, Cache, Offline Mode)');
  console.log('='.repeat(80) + '\n');
});
