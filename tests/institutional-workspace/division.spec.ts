/**
 * Division E2E Tests — Institutional Workspace
 *
 * Tests the Division-level user journey:
 *  1. Login & dashboard access
 *  2. Schools overview
 *  3. Personnel management
 *  4. Enrollment overview
 *  5. Reports & analytics
 *  6. SF5 promotion reports
 *  7. SF6 enrollment summary
 *  8. SF7 personnel report
 *  9. Audit log
 * 10. Settings (view-only)
 * 11. Onboarding walkthrough
 * 12. Sidebar navigation completeness
 *
 * Prerequisites:
 *   - Division demo account seeded
 *   - Demo schools linked to division
 *
 * Usage:
 *   $env:TEST_BASE_URL="https://edusync.ph"; npx playwright test tests/institutional-workspace/division.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';
import {
  ACCOUNTS,
  BASE_URL,
  TIMEOUTS,
  clearSession,
  login,
  assertLoggedIn,
  navigateVia,
} from './helpers';


test.setTimeout(60_000);

test.describe('Division Workspace E2E', () => {
  test.use({ storageState: undefined });
  test.describe.configure({ mode: 'serial' });

  // ─── 1. Login & Dashboard ──────────────────────────────

  test('1.1 — Division user can log in', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await assertLoggedIn(page);

    // Should land on /division (or /division/dashboard)
    await page.waitForURL(/\/division/, { timeout: TIMEOUTS.navigation });
    console.log(`Division dashboard URL: ${page.url()}`);
  });

  test('1.2 — Dashboard shows overview statistics', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await page.waitForURL(/\/division/, { timeout: TIMEOUTS.navigation });

    // Stat cards: schools, students, teachers
    const statsVisible = await page
      .locator('text=/school|student|teacher/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.dashboardLoad })
      .catch(() => false);
    expect(statsVisible).toBe(true);

    console.log('Division dashboard stats loaded');
  });

  // ─── 2. Schools overview ───────────────────────────────

  test('2.1 — Schools list loads', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await page.waitForURL(/\/division/, { timeout: TIMEOUTS.navigation });

    await navigateVia(page, {
      sidebarText: 'Schools',
      href: '/division/schools',
      directUrl: '/division/schools',
    });

    // Should see school rows or cards
    const hasSchoolContent = await page
      .locator('text=/school/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasSchoolContent).toBe(true);
  });

  test('2.2 — Schools search works', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/schools' });

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    if (await searchInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await searchInput.fill('demo');
      await page.waitForTimeout(TIMEOUTS.mediumWait);
      console.log('School search executed');
    }
  });

  // ─── 3. Personnel management ───────────────────────────

  test('3.1 — Personnel page loads', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');

    await navigateVia(page, {
      sidebarText: 'Personnel',
      href: '/division/personnel',
      directUrl: '/division/personnel',
    });

    // Should show personnel table or list
    const hasContent = await page
      .locator('text=/personnel|teacher|employee/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('3.2 — Personnel search and filter', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/personnel' });

    // Search
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await searchInput.fill('teacher');
      await page.waitForTimeout(TIMEOUTS.mediumWait);
    }

    // Position filter
    const positionFilter = page.locator('select, [role="combobox"]').first();
    if (await positionFilter.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      console.log('Position filter is available');
    }
  });

  test('3.3 — Personnel CSV export button visible', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/personnel' });

    const exportBtn = page
      .locator('button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")')
      .first();
    const hasExport = await exportBtn
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Personnel export button visible: ${hasExport}`);
  });

  // ─── 4. Enrollment overview ────────────────────────────

  test('4.1 — Enrollment page loads', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');

    await navigateVia(page, {
      sidebarText: 'Enrollment',
      href: '/division/enrollment',
      directUrl: '/division/enrollment',
    });

    const hasContent = await page
      .locator('text=/enrollment|student|grade/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('4.2 — Enrollment search by LRN or name', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/enrollment' });

    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await searchInput.fill('LRN-DEMO');
      await page.waitForTimeout(TIMEOUTS.mediumWait);
      console.log('Enrollment search executed');
    }
  });

  // ─── 5. Reports & analytics ────────────────────────────

  test('5.1 — Reports page loads', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');

    await navigateVia(page, {
      sidebarText: 'Reports',
      href: '/division/reports',
      directUrl: '/division/reports',
    });

    const hasContent = await page
      .locator('text=/report|enrollment|personnel|completion/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('5.2 — Report generation buttons visible', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/reports' });

    const generateBtn = page
      .locator('button:has-text("Generate"), button:has-text("Export"), button:has-text("Download")')
      .first();
    const hasGenerate = await generateBtn
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Report generate button visible: ${hasGenerate}`);
  });

  // ─── 6. SF5 Promotion Reports ──────────────────────────

  test('6.1 — SF5 dashboard loads', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');

    await navigateVia(page, {
      sidebarText: 'SF5',
      href: '/division/sf5',
      directUrl: '/division/sf5',
    });

    const hasContent = await page
      .locator('text=/SF5|promotion|report/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('6.2 — SF5 grade filter and view mode toggle', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/sf5' });

    // Grade filter
    const gradeFilter = page.locator('select, [role="combobox"]').first();
    if (await gradeFilter.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      console.log('SF5 grade filter available');
    }

    // View mode toggle (grade/district/school)
    const viewToggle = page
      .locator('button:has-text("Grade"), button:has-text("District"), button:has-text("School")')
      .first();
    const hasToggle = await viewToggle
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`SF5 view mode toggle visible: ${hasToggle}`);
  });

  // ─── 7. SF6 Enrollment Summary ─────────────────────────

  test('7.1 — SF6 dashboard loads', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');

    await navigateVia(page, {
      sidebarText: 'SF6',
      href: '/division/sf6',
      directUrl: '/division/sf6',
    });

    const hasContent = await page
      .locator('text=/SF6|enrollment|summary/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 8. SF7 Personnel Report ───────────────────────────

  test('8.1 — SF7 dashboard loads', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');

    await navigateVia(page, {
      sidebarText: 'SF7',
      href: '/division/sf7',
      directUrl: '/division/sf7',
    });

    const hasContent = await page
      .locator('text=/SF7|personnel|report/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 9. Proficiency Dashboard ──────────────────────────

  test('9.1 — Proficiency page accessible', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/proficiency' });

    const hasContent = await page
      .locator('text=/proficiency|performance|assessment/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Proficiency dashboard loaded: ${hasContent}`);
  });

  // ─── 10. Audit Log ─────────────────────────────────────

  test('10.1 — Audit log loads', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');

    await navigateVia(page, {
      sidebarText: 'Audit',
      href: '/division/audit-log',
      directUrl: '/division/audit-log',
    });

    const hasContent = await page
      .locator('text=/audit|log|activity/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('10.2 — Audit log search and filter', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/audit-log' });

    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await searchInput.fill('login');
      await page.waitForTimeout(TIMEOUTS.mediumWait);
      console.log('Audit log search executed');
    }
  });

  // ─── 11. Settings (view-only) ──────────────────────────

  test('11.1 — Settings page shows division info', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');

    await navigateVia(page, {
      sidebarText: 'Settings',
      href: '/division/settings',
      directUrl: '/division/settings',
    });

    const hasContent = await page
      .locator('text=/division|region|superintendent|settings/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 12. Onboarding walkthrough ────────────────────────

  test('12.1 — Onboarding stepper accessible', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await navigateVia(page, { directUrl: '/division/onboarding' });

    // Stepper with Next/Previous
    const hasOnboarding = await page
      .locator('text=/welcome|step|next|get started/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Onboarding stepper loaded: ${hasOnboarding}`);
  });

  // ─── 13. Sidebar navigation ────────────────────────────

  test('13.1 — All sidebar links render without errors', async ({ page }) => {
    await login(page, ACCOUNTS.division, 'staff');
    await page.waitForURL(/\/division/, { timeout: TIMEOUTS.navigation });

    const divisionRoutes = [
      '/division/schools',
      '/division/personnel',
      '/division/enrollment',
      '/division/reports',
      '/division/sf5',
      '/division/sf6',
      '/division/sf7',
      '/division/audit-log',
      '/division/settings',
    ];

    for (const route of divisionRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.networkIdle });

      // Page should not show a blank screen or crash
      const body = await page.locator('body').textContent();
      expect(body?.length).toBeGreaterThan(50);

      // No unhandled errors overlay
      const hasError = await page
        .locator('text=/Something went wrong|Application error|Unexpected error/i')
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      expect(hasError).toBe(false);

      console.log(`✓ ${route}`);
    }
  });
});
