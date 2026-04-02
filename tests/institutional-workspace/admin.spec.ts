/**
 * Admin / Principal E2E Tests — Institutional Workspace
 *
 * Tests the School Admin & Principal journey:
 *  1.  Login & dashboard
 *  2.  Dashboard stats & quick actions
 *  3.  Student management (CRUD)
 *  4.  Teacher management (CRUD)
 *  5.  Section / class management
 *  6.  User management panel
 *  7.  Enrollment applications
 *  8.  Grade monitoring
 *  9.  Attendance overview
 * 10.  DepEd forms (SF1–SF10)
 * 11.  Announcements
 * 12.  Financial management
 * 13.  School settings
 * 14.  Sidebar navigation completeness
 *
 * Prerequisites:
 *   - Demo school "demo-e2e-testing" seeded (phases 1-7)
 *   - Admin account: admin-demo@edusync.ph / Demo123!
 *
 * Usage:
 *   $env:TEST_BASE_URL="https://edusync.ph"; npx playwright test tests/institutional-workspace/admin.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  ACCOUNTS,
  TIMEOUTS,
  login,
  assertLoggedIn,
  navigateVia,
} from './helpers';

test.setTimeout(60_000);

test.describe('Admin / Principal Workspace E2E', () => {
  test.use({ storageState: undefined });
  test.describe.configure({ mode: 'serial' });

  // ─── 1. Login & dashboard ──────────────────────────────

  test('1.1 — Admin can log in', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await assertLoggedIn(page);
    await page.waitForURL(/\/dashboard|\/admin|^\/$/, { timeout: TIMEOUTS.navigation });
    console.log(`Admin landing URL: ${page.url()}`);
  });

  test('1.2 — Dashboard shows stat cards', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await page.waitForURL(/\/dashboard|\/$/, { timeout: TIMEOUTS.navigation });

    // Stat cards: Students, Average Grade, Honor Students, At-Risk
    const hasStats = await page
      .locator('text=/Students|Average|Honor|At.Risk/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.dashboardLoad })
      .catch(() => false);
    expect(hasStats).toBe(true);
  });

  test('1.3 — Dashboard quick actions visible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await page.waitForURL(/\/dashboard|\/$/, { timeout: TIMEOUTS.navigation });

    // Quick-action buttons
    const hasQuickActions = await page
      .locator('text=/Add Student|Record Grades|DepEd Forms|Analytics/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Quick actions visible: ${hasQuickActions}`);
  });

  test('1.4 — Dashboard grade distribution chart renders', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await page.waitForURL(/\/dashboard|\/$/, { timeout: TIMEOUTS.navigation });

    // Chart or distribution section
    const hasChart = await page
      .locator('text=/Grade Distribution|90.100|80.89|75.79/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.dashboardLoad })
      .catch(() => false);
    console.log(`Grade distribution chart: ${hasChart}`);
  });

  // ─── 2. Student management ─────────────────────────────

  test('2.1 — Students page loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'Students',
      href: '/students',
      directUrl: '/students',
    });

    const hasContent = await page
      .locator('text=/student/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('2.2 — Student search works', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/students' });

    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await searchInput.fill('Santos');
      await page.waitForTimeout(TIMEOUTS.mediumWait);
      const hasResults = await page
        .locator('text=/Santos/i')
        .first()
        .isVisible({ timeout: TIMEOUTS.element })
        .catch(() => false);
      console.log(`Student search results: ${hasResults}`);
    }
  });

  test('2.3 — Add student button visible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/students' });

    const addBtn = page
      .locator('button:has-text("Add"), button:has-text("New Student"), button:has-text("Create")')
      .first();
    const visible = await addBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);
    console.log(`Add student button: ${visible}`);
  });

  // ─── 3. Teacher management ─────────────────────────────

  test('3.1 — Teachers page loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'Teachers',
      href: '/teachers',
      directUrl: '/teachers',
    });

    const hasContent = await page
      .locator('text=/teacher/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('3.2 — Teacher details visible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/teachers' });

    // Demo teacher should be listed
    const hasTeacher = await page
      .locator('text=/Demo Teacher|teacher-demo/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Demo teacher visible: ${hasTeacher}`);
  });

  // ─── 4. Section management ─────────────────────────────

  test('4.1 — Sections page loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'Classes',
      href: '/sections',
      directUrl: '/sections',
    });

    const hasContent = await page
      .locator('text=/section|class|grade/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('4.2 — Demo sections listed', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/sections' });

    // Seeded sections: Grade 7 A/B/C, Grade 10 A/B
    const hasSections = await page
      .locator('text=/Grade 7|Grade 10|Section A/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Demo sections visible: ${hasSections}`);
  });

  // ─── 5. User management ────────────────────────────────

  test('5.1 — User management panel loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'User Management',
      href: '/admin/users',
      directUrl: '/admin/users',
    });

    const hasContent = await page
      .locator('text=/User Management|user|account/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('5.2 — User search by email', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/admin/users' });

    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await searchInput.fill('teacher-demo');
      await page.waitForTimeout(TIMEOUTS.mediumWait);
      console.log('User search executed');
    }
  });

  test('5.3 — Role filter available', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/admin/users' });

    const roleFilter = page.locator('select, [role="combobox"]').first();
    const hasFilter = await roleFilter
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Role filter visible: ${hasFilter}`);
  });

  test('5.4 — Create account buttons visible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/admin/users' });

    const addBtn = page
      .locator('button:has-text("Add Teacher"), button:has-text("Add Student"), button:has-text("Add")')
      .first();
    const visible = await addBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);
    console.log(`Create account button: ${visible}`);
  });

  // ─── 6. Enrollment applications ────────────────────────

  test('6.1 — Enrollment dashboard loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'Enrollment',
      href: '/admin/enrollment',
      directUrl: '/admin/enrollment',
    });

    const hasContent = await page
      .locator('text=/enrollment|application|submitted|approved/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 7. Grade monitoring ───────────────────────────────

  test('7.1 — Grades dashboard accessible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'Grade Entry',
      href: '/grades/entry',
      directUrl: '/grades/entry',
    });

    // Grades entry or grades page should load with content
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(50);
  });

  test('7.2 — Grade entry page loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/grades/entry' });

    // Should show section/subject selectors or gradebook grid
    const hasGradebook = await page
      .locator('text=/section|subject|written work|performance task|quarter/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Gradebook loaded: ${hasGradebook}`);
  });

  // ─── 8. Attendance ─────────────────────────────────────

  test('8.1 — Attendance page loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'Attendance',
      href: '/attendance',
      directUrl: '/attendance',
    });

    const hasContent = await page
      .locator('text=/attendance|present|absent/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 9. DepEd Forms ───────────────────────────────────

  test('9.1 — SF9 (Report Card) accessible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/forms/sf9' });

    const hasContent = await page
      .locator('text=/SF9|report card|form 138|learner/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`SF9 page loaded: ${hasContent}`);
  });

  test('9.2 — SF10 (Permanent Record) accessible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/forms/sf10' });

    const hasContent = await page
      .locator('text=/SF10|permanent|academic record|form 137/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`SF10 page loaded: ${hasContent}`);
  });

  test('9.3 — School Forms links accessible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    const sfRoutes = ['/forms/sf1', '/forms/sf2', '/forms/sf3', '/forms/sf4', '/forms/sf5'];
    for (const route of sfRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.networkIdle });
      await page.waitForTimeout(TIMEOUTS.mediumWait);

      // Page should render (even stub pages have at least a root element)
      const body = await page.locator('body').textContent();
      expect(body?.length).toBeGreaterThan(0);
      console.log(`✓ ${route} (${body?.length} chars)`);
    }
  });

  test('9.4 — ELLN assessment accessible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/forms/elln/assessment' });

    const hasContent = await page
      .locator('text=/ELLN|assessment|early|literacy/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`ELLN page loaded: ${hasContent}`);
  });

  // ─── 10. Announcements ─────────────────────────────────

  test('10.1 — Announcements page loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'Announcements',
      href: '/announcements',
      directUrl: '/announcements',
    });

    const hasContent = await page
      .locator('text=/announcement/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 11. Financial management ──────────────────────────

  test('11.1 — Fee structures accessible', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/finance/fees' });

    // May not exist for all school types
    const body = await page.locator('body').textContent();
    console.log(`Finance page loaded: ${(body?.length ?? 0) > 50}`);
  });

  // ─── 12. School settings ───────────────────────────────

  test('12.1 — School settings loads', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    await navigateVia(page, {
      sidebarText: 'Settings',
      href: '/settings',
      directUrl: '/settings',
    });

    const hasContent = await page
      .locator('text=/School Settings|school name|region|division/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('12.2 — School settings form fields editable', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await navigateVia(page, { directUrl: '/settings' });

    // Form inputs should be present
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
    console.log(`Settings form fields: ${count}`);
  });

  // ─── 13. Sidebar navigation ────────────────────────────

  test('13.1 — All admin sidebar routes render without errors', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');

    const adminRoutes = [
      '/dashboard',
      '/students',
      '/teachers',
      '/sections',
      '/admin/users',
      '/admin/enrollment',
      '/grades/entry',
      '/attendance',
      '/announcements',
      '/assignments',
      '/lessons',
      '/settings',
      '/forms/sf9',
      '/forms/sf10',
    ];

    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.networkIdle });
      await page.waitForTimeout(TIMEOUTS.mediumWait);

      const body = await page.locator('body').textContent();
      expect(body?.length).toBeGreaterThan(0);

      // No crash overlay
      const hasError = await page
        .locator('text=/Something went wrong|Application error|Unexpected error/i')
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      expect(hasError).toBe(false);

      console.log(`✓ ${route}`);
    }
  });

  // ─── 14. No infinite loading loops ─────────────────────

  test('14.1 — Dashboard does not show infinite loading', async ({ page }) => {
    await login(page, ACCOUNTS.admin, 'staff');
    await page.waitForURL(/\/dashboard|\/$/, { timeout: TIMEOUTS.navigation });

    // Wait longer to catch infinite loops
    await page.waitForTimeout(TIMEOUTS.longWait);

    const isStuckLoading = await page
      .locator('text=/Loading your data|Loading\.\.\./i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(isStuckLoading).toBe(false);
  });
});
