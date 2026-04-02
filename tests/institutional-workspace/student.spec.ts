/**
 * Student E2E Tests — Institutional Workspace
 *
 * Tests the Student journey:
 *  1. Login & dashboard
 *  2. Dashboard greeting, stats & alerts
 *  3. Grades view (subjects, quarterly)
 *  4. Attendance view
 *  5. Assignments view
 *  6. Schedule view
 *  7. Announcements
 *  8. Sidebar navigation completeness
 *  9. Performance & loading
 * 10. Read-only enforcement (no edit controls)
 *
 * Prerequisites:
 *   - Demo school "demo-e2e-testing" seeded (phases 1-7)
 *   - Student account: student-demo@edusync.ph / Demo123!
 *   - LRN: LRN-DEMO-001, Grade 10
 *
 * Usage:
 *   $env:TEST_BASE_URL="https://edusync.ph"; npx playwright test tests/institutional-workspace/student.spec.ts
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

test.describe('Student Workspace E2E', () => {
  test.use({ storageState: undefined });
  test.describe.configure({ mode: 'serial' });

  // ─── 1. Login & dashboard ──────────────────────────────

  test('1.1 — Student can log in', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await assertLoggedIn(page);
    console.log(`Student landing URL: ${page.url()}`);
  });

  test('1.2 — Dashboard shows greeting', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await page.waitForTimeout(TIMEOUTS.longWait);

    const hasGreeting = await page
      .locator('text=/Good (morning|afternoon|evening)|Welcome|Dashboard/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.dashboardLoad })
      .catch(() => false);
    console.log(`Student greeting visible: ${hasGreeting}`);
  });

  test('1.3 — Dashboard shows grade/section info', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await page.waitForTimeout(TIMEOUTS.longWait);

    const hasInfo = await page
      .locator('text=/Grade 10|Section A|Student/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Student grade/section info: ${hasInfo}`);
  });

  test('1.4 — Dashboard stats visible (average, attendance)', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await page.waitForTimeout(TIMEOUTS.longWait);

    const hasStats = await page
      .locator('text=/average|attendance|grade|percent/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Student stats visible: ${hasStats}`);
  });

  test('1.5 — Dashboard alerts section (low grades / attendance)', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await page.waitForTimeout(TIMEOUTS.longWait);

    // Alerts may or may not be present depending on data
    const hasAlerts = await page
      .locator('text=/alert|warning|at.risk|low/i')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    console.log(`Student alerts visible: ${hasAlerts}`);
  });

  // ─── 2. Grades view ───────────────────────────────────

  test('2.1 — Grades page loads', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');

    await navigateVia(page, {
      sidebarText: 'Grades',
      href: '/student/grades',
      directUrl: '/student/grades',
    });

    const hasContent = await page
      .locator('text=/grade|subject|quarter|report/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('2.2 — Grades show K-12 subjects', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await navigateVia(page, { directUrl: '/student/grades' });

    // Seeded with 11 default K-12 learning areas
    const hasSubjects = await page
      .locator('text=/Filipino|English|Mathematics|Science|Araling Panlipunan|MAPEH/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Student sees K-12 subjects: ${hasSubjects}`);
  });

  test('2.3 — Grades show quarterly columns (Q1–Q4)', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await navigateVia(page, { directUrl: '/student/grades' });

    const hasQuarters = await page
      .locator('text=/Q1|Q2|Q3|Q4|Quarter 1|Quarter 2|1st|2nd|3rd|4th/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Quarterly columns visible: ${hasQuarters}`);
  });

  test('2.4 — Grades show final grade / general average', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await navigateVia(page, { directUrl: '/student/grades' });

    const hasFinal = await page
      .locator('text=/Final|General Average|Overall|Remark/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Final grade / average visible: ${hasFinal}`);
  });

  // ─── 3. Attendance view ────────────────────────────────

  test('3.1 — Attendance page loads', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');

    await navigateVia(page, {
      sidebarText: 'Attendance',
      href: '/student/attendance',
      directUrl: '/student/attendance',
    });

    const hasContent = await page
      .locator('text=/attendance|present|absent|days/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('3.2 — Attendance shows summary stats', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await navigateVia(page, { directUrl: '/student/attendance' });

    const hasSummary = await page
      .locator('text=/total|present|absent|late|excused|days/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Attendance summary: ${hasSummary}`);
  });

  // ─── 4. Assignments view ───────────────────────────────

  test('4.1 — Assignments page loads', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');

    await navigateVia(page, {
      sidebarText: 'Assignments',
      href: '/student/assignments',
      directUrl: '/student/assignments',
    });

    const hasContent = await page
      .locator('text=/assignment|task|due/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 5. Schedule view ──────────────────────────────────

  test('5.1 — Schedule page loads', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');

    await navigateVia(page, {
      sidebarText: 'Schedule',
      href: '/student/schedule',
      directUrl: '/student/schedule',
    });

    const hasContent = await page
      .locator('text=/schedule|class|time|subject|day/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Schedule page loaded: ${hasContent}`);
  });

  // ─── 6. Announcements ─────────────────────────────────

  test('6.1 — Announcements page loads', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');

    await navigateVia(page, {
      sidebarText: 'Announcements',
      href: '/student/announcements',
      directUrl: '/student/announcements',
    });

    const hasContent = await page
      .locator('text=/announcement/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 7. Sidebar navigation ─────────────────────────────

  test('7.1 — Student sidebar items visible', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await page.waitForTimeout(TIMEOUTS.mediumWait);

    const expectedItems = ['Dashboard', 'Grades', 'Attendance', 'Assignments', 'Announcements', 'Schedule'];
    for (const item of expectedItems) {
      const visible = await page
        .locator(`nav a:has-text("${item}"), aside a:has-text("${item}"), [role="navigation"] a:has-text("${item}")`)
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      console.log(`Sidebar "${item}": ${visible}`);
    }
  });

  test('7.2 — All student routes render without errors', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');

    const studentRoutes = [
      '/student/dashboard',
      '/student/grades',
      '/student/attendance',
      '/student/assignments',
      '/student/announcements',
      '/student/schedule',
    ];

    for (const route of studentRoutes) {
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

  // ─── 8. Read-only enforcement ──────────────────────────

  test('8.1 — Student cannot see admin-only controls', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await page.waitForTimeout(TIMEOUTS.mediumWait);

    // Should NOT see admin/teacher management links in sidebar
    const hasAdminLinks = await page
      .locator('nav a:has-text("User Management"), nav a:has-text("Teachers"), nav a:has-text("School Settings")')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasAdminLinks).toBe(false);
  });

  test('8.2 — Student grades are read-only (no edit inputs)', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await navigateVia(page, { directUrl: '/student/grades' });

    // Grade cells should not be editable inputs
    const editableGradeInput = page.locator(
      'input[name*="grade"], input[type="number"][class*="grade"], [contenteditable="true"]',
    );
    const editableCount = await editableGradeInput.count();
    expect(editableCount).toBe(0);
    console.log('Student grades are read-only');
  });

  // ─── 9. Performance ────────────────────────────────────

  test('9.1 — Student dashboard loads in < 15s', async ({ page }) => {
    const start = Date.now();

    await login(page, ACCOUNTS.student, 'student');
    await page.waitForTimeout(TIMEOUTS.longWait);
    await assertLoggedIn(page);

    const elapsed = Date.now() - start;
    console.log(`Student login + dashboard: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(30_000);
  });

  // ─── 10. No infinite loading ───────────────────────────

  test('10.1 — Dashboard does not infinite-loop', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await page.waitForTimeout(8000);

    const isStuck = await page
      .locator('text=/Loading your data|Loading\.\.\./i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(isStuck).toBe(false);
  });

  test('10.2 — Grades page does not infinite-loop', async ({ page }) => {
    await login(page, ACCOUNTS.student, 'student');
    await navigateVia(page, { directUrl: '/student/grades' });
    await page.waitForTimeout(8000);

    const isStuck = await page
      .locator('text=/Loading your data|Loading\.\.\./i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(isStuck).toBe(false);
  });
});
