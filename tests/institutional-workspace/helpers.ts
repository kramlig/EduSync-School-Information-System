/**
 * Institutional Workspace E2E Test Helpers
 *
 * Shared configuration, accounts, and login utilities for all
 * institutional workspace role-based E2E tests.
 */

import { Page, expect } from '@playwright/test';

// ─── Configuration ───────────────────────────────────────

export const BASE_URL = process.env.TEST_BASE_URL || 'https://edusync.ph';

// MSAT Demo Accounts
const MSAT_PASSWORD = 'Msat@2024!';
const DIVISION_PASSWORD = 'division123';

export const ACCOUNTS = {
  division: { email: 'div.admin@mati.deped.gov.ph', password: DIVISION_PASSWORD },
  admin:    { email: 'admin@msat.edu.ph',           password: MSAT_PASSWORD },
  teacher:  { email: 'ml.mutia@deped.gov.ph',       password: MSAT_PASSWORD },
  student:  { email: 'a.dlaquino@msat.gov.ph',      password: MSAT_PASSWORD },
  parent:   { email: 'juan.delacruz@email.com',     password: MSAT_PASSWORD },
} as const;

// ─── Timeouts ────────────────────────────────────────────

export const TIMEOUTS = {
  pageLoad: 15_000,
  navigation: 10_000,
  element: 8_000,
  networkIdle: 15_000,
  dashboardLoad: 10_000,
  shortWait: 500,
  mediumWait: 2_000,
  longWait: 5_000,
} as const;

// ─── Login helpers ───────────────────────────────────────

export type LoginTab = 'staff' | 'student' | 'parent';

/**
 * Clear all session/storage data so tests start fresh.
 */
export async function clearSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Login to the institutional workspace via /admin.
 * Handles tab selection, credential entry, and waiting for post-login navigation.
 */
export async function login(
  page: Page,
  account: { email: string; password: string },
  tab: LoginTab = 'staff',
): Promise<void> {
  // Navigate to login page
  await page.goto(`${BASE_URL}/admin`);
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.networkIdle });

  // Clear stale session data
  await clearSession(page);
  await page.reload();
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.networkIdle });

  // Select the appropriate tab
  const tabLabel = tab === 'staff' ? 'Staff' : tab === 'student' ? 'Student' : 'Parent';
  const tabLocator = page
    .locator(`button:has-text("${tabLabel}"), [role="tab"]:has-text("${tabLabel}")`)
    .first();
  if (await tabLocator.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
    await tabLocator.click();
    await page.waitForTimeout(TIMEOUTS.shortWait);
  }

  // Fill credentials
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await emailInput.fill(account.email);
  await passwordInput.fill(account.password);

  // Submit
  await page.locator('button[type="submit"]').first().click();

  // Wait for post-login navigation — production can be slow
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {});

  // Give the app time to process auth, write session, and redirect
  await page.waitForTimeout(8_000);

  // If still on login page, wait a bit more
  const stillOnLogin = await page
    .locator('input[type="email"]')
    .isVisible()
    .catch(() => false);
  if (stillOnLogin) {
    console.log('⏳ Login still processing, waiting longer...');
    await page.waitForTimeout(5_000);
  }
}

/**
 * Assert that the login form is no longer visible (i.e. the user is authenticated).
 */
export async function assertLoggedIn(page: Page): Promise<void> {
  const emailStillVisible = await page
    .locator('input[type="email"]')
    .isVisible()
    .catch(() => false);
  expect(emailStillVisible).toBe(false);
}

/**
 * Navigate using sidebar link or direct URL fallback.
 */
export async function navigateVia(
  page: Page,
  opts: { sidebarText?: string; href?: string; directUrl: string },
): Promise<void> {
  let navigated = false;

  if (opts.sidebarText) {
    const link = page
      .locator(`a:has-text("${opts.sidebarText}"), button:has-text("${opts.sidebarText}")`)
      .first();
    if (await link.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.networkIdle });
      navigated = true;
    }
  }

  if (!navigated && opts.href) {
    const link = page.locator(`a[href*="${opts.href}"]`).first();
    if (await link.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.networkIdle });
      navigated = true;
    }
  }

  if (!navigated) {
    await page.goto(`${BASE_URL}${opts.directUrl}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.networkIdle });
  }

  // Allow Firestore real-time listeners to populate UI
  await page.waitForTimeout(TIMEOUTS.longWait);
}

/**
 * Check whether a locator matching `text` is visible on the page.
 */
export async function isTextVisible(
  page: Page,
  pattern: string | RegExp,
  timeout = TIMEOUTS.element,
): Promise<boolean> {
  return page
    .locator(typeof pattern === 'string' ? `text=${pattern}` : `text=/${pattern.source}/${pattern.flags}`)
    .first()
    .isVisible({ timeout })
    .catch(() => false);
}
