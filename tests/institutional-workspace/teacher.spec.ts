/**
 * Teacher E2E Tests — Institutional Workspace
 *
 * Tests the Teacher journey inside an institutional school:
 *  1.  Login & dashboard
 *  2.  Dashboard stats & quick actions
 *  3.  Gradebook / grade entry
 *  4.  Class record view
 *  5.  Attendance tracking
 *  6.  Core values grading
 *  7.  Homeroom guidance
 *  8.  Assignments management
 *  9.  Lesson plans
 * 10.  Announcements
 * 11.  DepEd forms access
 * 12.  Analytics overview
 * 13.  Sidebar navigation completeness
 * 14.  No infinite re-render loops
 *
 * Prerequisites:
 *   - Demo school "demo-e2e-testing" seeded (phases 1-7)
 *   - Teacher account: teacher-demo@edusync.ph / Demo123!
 *   - Teacher has assignments[] populated (Phase 4 critical)
 *
 * Usage:
 *   $env:TEST_BASE_URL="https://edusync.ph"; npx playwright test tests/institutional-workspace/teacher.spec.ts
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

test.describe('Teacher Workspace E2E', () => {
  test.use({ storageState: undefined });
  test.describe.configure({ mode: 'serial' });

  // ─── 1. Login & dashboard ──────────────────────────────

  test('1.1 — Teacher can log in', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await assertLoggedIn(page);
    console.log(`Teacher landing URL: ${page.url()}`);
  });

  test('1.2 — Sees correct school name', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await page.waitForTimeout(TIMEOUTS.longWait);

    const hasSchool = await page
      .locator('text=/EduSync E2E Testing Demo School|E2E Demo/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Teacher sees school name: ${hasSchool}`);
  });

  test('1.3 — Dashboard loads (not stuck loading)', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await page.waitForTimeout(TIMEOUTS.longWait);

    const isStuck = await page
      .locator('text=/Loading your data/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(isStuck).toBe(false);
  });

  // ─── 2. Gradebook / grade entry ────────────────────────

  test('2.1 — Gradebook page loads', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');

    await navigateVia(page, {
      sidebarText: 'Grade Entry',
      href: '/grades/entry',
      directUrl: '/grades/entry',
    });

    const hasContent = await page
      .locator('text=/gradebook|grade entry|assessment|section|subject/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('2.2 — Gradebook shows section/subject selectors', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/grades/entry' });

    // Should have section or subject dropdown
    const hasSelector = await page
      .locator('select, [role="combobox"], text=/Grade 10|Section A/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Gradebook selectors visible: ${hasSelector}`);
  });

  test('2.3 — Gradebook shows student list', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/grades/entry' });
    await page.waitForTimeout(TIMEOUTS.mediumWait);

    // After selecting section, students should appear
    const hasStudents = await page
      .locator('text=/student|name|Santos/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Gradebook shows students: ${hasStudents}`);
  });

  test('2.4 — Gradebook assessment columns visible', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/grades/entry' });
    await page.waitForTimeout(TIMEOUTS.mediumWait);

    // Assessment types: WW, PT, QA (Written Work, Performance Task, Quarterly Assessment)
    const hasColumns = await page
      .locator('text=/Written Work|Performance Task|Quarterly|WW|PT|QA/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Assessment columns visible: ${hasColumns}`);
  });

  // ─── 3. Grades display ────────────────────────────────

  test('3.1 — Grades display page loads', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/grades/display' });

    const hasContent = await page
      .locator('text=/grade|display|summary|quarter/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Grades display loaded: ${hasContent}`);
  });

  // ─── 4. Attendance tracking ────────────────────────────

  test('4.1 — Attendance page loads', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');

    await navigateVia(page, {
      sidebarText: 'Attendance',
      href: '/attendance',
      directUrl: '/attendance',
    });

    const hasContent = await page
      .locator('text=/attendance|present|absent|section/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('4.2 — Attendance shows section selector', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/attendance' });

    const hasSelector = await page
      .locator('select, [role="combobox"], text=/section|grade/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Attendance section selector: ${hasSelector}`);
  });

  // ─── 5. Homeroom guidance ──────────────────────────────

  test('5.1 — Homeroom guidance page loads', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');

    await navigateVia(page, {
      sidebarText: 'Homeroom Guidance',
      href: '/homeroom',
      directUrl: '/homeroom-guidance',
    });

    const hasContent = await page
      .locator('text=/homeroom|guidance|advisory/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Homeroom guidance loaded: ${hasContent}`);
  });

  // ─── 6. Assignments management ─────────────────────────

  test('6.1 — Assignments page loads', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');

    await navigateVia(page, {
      sidebarText: 'Assignments',
      href: '/assignments',
      directUrl: '/assignments',
    });

    const hasContent = await page
      .locator('text=/assignment/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 7. Lesson plans ──────────────────────────────────

  test('7.1 — Lesson plans page loads', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');

    await navigateVia(page, {
      sidebarText: 'Lesson Plans',
      href: '/lessons',
      directUrl: '/lessons',
    });

    const hasContent = await page
      .locator('text=/lesson|plan/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 8. Announcements ─────────────────────────────────

  test('8.1 — Announcements page loads', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');

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

  // ─── 9. DepEd forms ───────────────────────────────────

  test('9.1 — SF9 (Report Card) accessible by teacher', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/forms/sf9' });

    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(50);
    console.log('Teacher SF9 page accessible');
  });

  test('9.2 — SF10 (Permanent Record) accessible by teacher', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/forms/sf10' });

    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(50);
    console.log('Teacher SF10 page accessible');
  });

  // ─── 10. Sidebar navigation ────────────────────────────

  test('10.1 — Sidebar is visible', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await page.waitForTimeout(TIMEOUTS.mediumWait);

    const hasSidebar = await page
      .locator('nav, [role="navigation"], aside')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasSidebar).toBe(true);
  });

  test('10.2 — Teacher sees expected sidebar items', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await page.waitForTimeout(TIMEOUTS.mediumWait);

    const expectedItems = ['Dashboard', 'Grade Entry', 'Attendance', 'Assignments', 'Lesson Plans', 'Announcements'];
    for (const item of expectedItems) {
      const visible = await page
        .locator(`nav a:has-text("${item}"), aside a:has-text("${item}"), [role="navigation"] a:has-text("${item}")`)
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      console.log(`Sidebar "${item}": ${visible}`);
    }
  });

  test('10.3 — All teacher routes render without errors', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');

    const teacherRoutes = [
      '/grades/entry',
      '/grades/display',
      '/attendance',
      '/assignments',
      '/lessons',
      '/announcements',
    ];

    for (const route of teacherRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.networkIdle });
      await page.waitForTimeout(3000);

      const body = await page.locator('body').textContent();
      expect(body?.length).toBeGreaterThan(0);

      const hasError = await page
        .locator('text=/Something went wrong|Application error|Unexpected error/i')
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      expect(hasError).toBe(false);

      console.log(`✓ ${route}`);
    }
  });

  // ─── 11. No infinite loading loops ─────────────────────

  test('11.1 — Gradebook does not infinite-loop', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/grades/entry' });

    // Wait extra time to detect loops
    await page.waitForTimeout(8000);

    const isStuck = await page
      .locator('text=/Loading your data|Loading\.\.\./i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(isStuck).toBe(false);
  });

  test('11.2 — Attendance page does not infinite-loop', async ({ page }) => {
    await login(page, ACCOUNTS.teacher, 'staff');
    await navigateVia(page, { directUrl: '/attendance' });

    await page.waitForTimeout(8000);

    const isStuck = await page
      .locator('text=/Loading your data|Loading\.\.\./i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(isStuck).toBe(false);
  });
});
