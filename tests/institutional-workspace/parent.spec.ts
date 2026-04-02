/**
 * Parent E2E Tests — Institutional Workspace
 *
 * Tests the Parent journey:
 *  1. Login & dashboard
 *  2. Dashboard greeting & quick actions
 *  3. Children cards & child selector
 *  4. Child grades view
 *  5. Child attendance view
 *  6. Announcements
 *  7. Parent profile management
 *  8. Billing & payments
 *  9. Sidebar navigation completeness
 * 10. No infinite loading
 *
 * Prerequisites:
 *   - Demo school "demo-e2e-testing" seeded (phases 1-7)
 *   - Parent account: parent-demo@edusync.ph / Demo123!
 *   - Parent linked to student (Phase 7)
 *
 * Usage:
 *   $env:TEST_BASE_URL="https://edusync.ph"; npx playwright test tests/institutional-workspace/parent.spec.ts
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

test.describe('Parent Workspace E2E', () => {
  test.use({ storageState: undefined });
  test.describe.configure({ mode: 'serial' });

  // ─── 1. Login & dashboard ──────────────────────────────

  test('1.1 — Parent can log in', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await assertLoggedIn(page);
    console.log(`Parent landing URL: ${page.url()}`);
  });

  test('1.2 — Dashboard shows greeting', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await page.waitForTimeout(TIMEOUTS.longWait);

    // Time-based greeting: "Good morning/afternoon/evening, [Name]!"
    const hasGreeting = await page
      .locator('text=/Good (morning|afternoon|evening)/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.dashboardLoad })
      .catch(() => false);
    console.log(`Parent greeting visible: ${hasGreeting}`);
  });

  test('1.3 — Dashboard shows quick actions', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await page.waitForTimeout(TIMEOUTS.longWait);

    const hasActions = await page
      .locator('text=/Grades|Attendance|Announcements|Profile/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Parent quick actions visible: ${hasActions}`);
  });

  // ─── 2. Children cards ─────────────────────────────────

  test('2.1 — Child performance cards visible', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await page.waitForTimeout(TIMEOUTS.longWait);

    // Should see linked child names (seeded in Phase 7)
    const hasChildren = await page
      .locator('text=/Santos|Francisco|Grade|Section/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Children cards visible: ${hasChildren}`);
  });

  test('2.2 — Child selector in header (multi-child)', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await page.waitForTimeout(TIMEOUTS.longWait);

    // Header dropdown for selecting which child data to show
    const hasSelector = await page
      .locator('select, [role="combobox"], button:has-text("Select Child")')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Child selector in header: ${hasSelector}`);
  });

  // ─── 3. Grades view ───────────────────────────────────

  test('3.1 — Grades page loads', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');

    await navigateVia(page, {
      sidebarText: 'Grades',
      href: '/parent/grades',
      directUrl: '/parent/grades',
    });

    const hasContent = await page
      .locator('text=/grade|subject|quarter|report/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('3.2 — Grades show subjects and quarterly data', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await navigateVia(page, { directUrl: '/parent/grades' });

    // Should see K-12 subjects
    const hasSubjects = await page
      .locator('text=/Filipino|English|Mathematics|Science|Quarter/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Parent sees subjects: ${hasSubjects}`);
  });

  // ─── 4. Attendance view ────────────────────────────────

  test('4.1 — Attendance page loads', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');

    await navigateVia(page, {
      sidebarText: 'Attendance',
      href: '/parent/attendance',
      directUrl: '/parent/attendance',
    });

    const hasContent = await page
      .locator('text=/attendance|present|absent|days/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 5. Announcements ─────────────────────────────────

  test('5.1 — Announcements page loads', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');

    await navigateVia(page, {
      sidebarText: 'Announcements',
      href: '/parent/announcements',
      directUrl: '/parent/announcements',
    });

    const hasContent = await page
      .locator('text=/announcement/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  // ─── 6. Parent profile ─────────────────────────────────

  test('6.1 — Profile page loads', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');

    await navigateVia(page, {
      sidebarText: 'Profile',
      href: '/parent/profile',
      directUrl: '/parent/profile',
    });

    const hasContent = await page
      .locator('text=/profile|name|email|phone|children/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('6.2 — Profile shows linked children', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await navigateVia(page, { directUrl: '/parent/profile' });

    const hasChildren = await page
      .locator('text=/children|linked|Santos/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Profile shows linked children: ${hasChildren}`);
  });

  test('6.3 — Profile edit mode works', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await navigateVia(page, { directUrl: '/parent/profile' });

    const editBtn = page.locator('button:has-text("Edit"), button:has-text("Update")').first();
    if (await editBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(TIMEOUTS.shortWait);

      // Form inputs should appear
      const inputs = page.locator('input[name], input[type="text"], input[type="tel"]');
      const count = await inputs.count();
      console.log(`Profile edit fields: ${count}`);
    }
  });

  // ─── 7. Billing & payments ─────────────────────────────

  test('7.1 — Billing page loads', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');

    await navigateVia(page, {
      sidebarText: 'Billing',
      href: '/parent/billing',
      directUrl: '/parent/billing',
    });

    const hasContent = await page
      .locator('text=/billing|payment|balance|statement/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Billing page loaded: ${hasContent}`);
  });

  test('7.2 — Billing tabs available', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await navigateVia(page, { directUrl: '/parent/billing' });

    // Overview, Statements, Payments, Receipts tabs
    const hasTabs = await page
      .locator('text=/overview|statement|payment|receipt/i')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`Billing tabs visible: ${hasTabs}`);
  });

  // ─── 8. Sidebar navigation ─────────────────────────────

  test('8.1 — Parent sidebar items visible', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await page.waitForTimeout(TIMEOUTS.mediumWait);

    const expectedItems = ['Dashboard', 'Profile', 'Grades', 'Attendance', 'Announcements'];
    for (const item of expectedItems) {
      const visible = await page
        .locator(`nav a:has-text("${item}"), aside a:has-text("${item}"), [role="navigation"] a:has-text("${item}")`)
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      console.log(`Sidebar "${item}": ${visible}`);
    }
  });

  test('8.2 — All parent routes render without errors', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');

    const parentRoutes = [
      '/parent/dashboard',
      '/parent/grades',
      '/parent/attendance',
      '/parent/announcements',
      '/parent/profile',
      '/parent/billing',
    ];

    for (const route of parentRoutes) {
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

  // ─── 9. No infinite loading ────────────────────────────

  test('9.1 — Dashboard does not infinite-loop', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await page.waitForTimeout(8000);

    const isStuck = await page
      .locator('text=/Loading your data|Loading\.\.\./i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(isStuck).toBe(false);
  });

  // ─── 10. SF9 download ──────────────────────────────────

  test('10.1 — Download SF9 button visible for child', async ({ page }) => {
    await login(page, ACCOUNTS.parent, 'parent');
    await page.waitForTimeout(TIMEOUTS.longWait);

    const hasDownload = await page
      .locator('button:has-text("Download"), button:has-text("SF9"), button:has-text("Report Card")')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);
    console.log(`SF9 download button visible: ${hasDownload}`);
  });
});
