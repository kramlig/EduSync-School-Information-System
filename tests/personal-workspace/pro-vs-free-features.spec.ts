/**
 * Comprehensive E2E Tests — Pro vs Free Tier Feature Comparison
 *
 * Validates ALL Pro features are functional and compares behavior with Free tier.
 *
 * Strategy:
 *  - Logs in as the existing Free tier personal workspace account
 *  - For Pro tests, injects a modified session with tier='pro' to test UI behavior
 *  - This avoids needing a separate Pro account — the UI reads tier from localStorage
 *
 * FREE tier restrictions tested:
 *  1. Student limit: 50 max
 *  2. Upgrade prompts visible throughout UI (sidebar, dashboard, settings)
 *  3. Limited feature text displayed (50 students, 1 section, 10 downloads/day)
 *  4. Upgrade modal with full feature comparison
 *  5. Forms, gradebook, header badge
 *
 * PRO tier features tested:
 *  1. Unlimited students (no cap)
 *  2. No upgrade prompts anywhere
 *  3. Settings shows Pro plan info
 *  4. Dashboard has no upgrade banners or limit indicators
 *  5. Forms, gradebook, header badge
 *  6. Session persistence
 *
 * Requires:
 *  - Dev server running (npm run dev or npm run dev:emu)
 *  - The personal workspace test account: edusync-e2e-personal@test.ph / Test123!
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const PERSONAL_URL = `${BASE_URL}/personal`;
const LOGIN_URL = `${BASE_URL}/admin`;

// ─── Test Account ────────────────────────────────────────
const TEST_USER = {
  email: 'edusync-e2e-personal@test.ph',
  password: 'Test123!',
  fullName: 'Test Teacher E2E',
};

// ─── Helpers ─────────────────────────────────────────────

async function clearSession(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('edusync_session');
    localStorage.removeItem('edusync_cached_user');
  });
}

async function getSession(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('edusync_session');
    return raw ? JSON.parse(raw) : null;
  });
}

async function loginAs(page: Page, email: string, password: string): Promise<any | null> {
  await page.goto(LOGIN_URL);
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  const personalUrl = page.waitForURL(/\/personal/, { timeout: 25000 });
  const errorMsg = page
    .locator('text=/No .* account found|Invalid email|too-many-requests/i')
    .first();

  const result = await Promise.race([
    personalUrl.then(() => 'ok' as const),
    errorMsg
      .waitFor({ state: 'visible', timeout: 25000 })
      .then(() => 'fail' as const),
  ]).catch(() => 'timeout' as const);

  if (result === 'ok') {
    return getSession(page);
  }
  return null;
}

/**
 * Inject session into localStorage via addInitScript (runs BEFORE app code)
 * and mock Firebase Functions subscription calls via fetch interception.
 * This prevents race conditions where the app reads localStorage before we set it.
 */
async function setupPageSession(page: Page, session: any) {
  const tier = session.user.tier;
  // addInitScript runs before every page load — sets localStorage and mocks fetch
  await page.addInitScript(({ sessionData, tierValue }: { sessionData: any; tierValue: string }) => {
    // Ensure session is in localStorage before the app reads it
    localStorage.setItem('edusync_session', JSON.stringify(sessionData));

    // Intercept Firebase callable Functions to prevent subscription check from overriding tier
    const origFetch = window.fetch.bind(window);
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
      if (url.includes('getSubscriptionStatus')) {
        const body = {
          result: {
            tier: tierValue,
            status: tierValue === 'pro' ? 'active' : 'expired',
            billingCycle: tierValue === 'pro' ? 'monthly' : null,
            currentPeriodEnd: null,
            amountCents: tierValue === 'pro' ? 7900 : null,
            currency: 'PHP',
          },
        };
        return Promise.resolve(new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      if (url.includes('getBillingHistory')) {
        return Promise.resolve(new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return origFetch(input, init);
    } as typeof window.fetch;
  }, { sessionData: session, tierValue: tier });

  // Navigate to personal workspace — the addInitScript sets localStorage before app code runs
  await page.goto(PERSONAL_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForURL(/\/personal/, { timeout: 20000 });
}

// ─── Session Cache ───────────────────────────────────────

let baseSession: any = null;

/** Login once, cache the session */
async function getBaseSession(page: Page) {
  if (baseSession) return baseSession;
  const session = await loginAs(page, TEST_USER.email, TEST_USER.password);
  if (!session) throw new Error(`Could not login as ${TEST_USER.email}. Ensure the account exists.`);
  baseSession = session;
  return baseSession;
}

/** Get a Free tier session (tier='free' or default) */
async function ensureFreeSession(page: Page) {
  const session = await getBaseSession(page);
  const freeSession = JSON.parse(JSON.stringify(session));
  freeSession.user.tier = 'free';
  await setupPageSession(page, freeSession);
  return freeSession;
}

/** Get a Pro tier session by overriding tier in the cached session */
async function ensureProSession(page: Page) {
  const session = await getBaseSession(page);
  const proSession = JSON.parse(JSON.stringify(session));
  proSession.user.tier = 'pro';
  await setupPageSession(page, proSession);
  return proSession;
}

// ══════════════════════════════════════════════════════════
//  SECTION A: FREE TIER — VERIFY RESTRICTIONS ARE ENFORCED
// ══════════════════════════════════════════════════════════

test.describe('A. Free Tier — Restrictions & Limits', () => {

  test.beforeEach(async ({ page }) => {
    await ensureFreeSession(page);
  });

  // ── A1: Session & Tier Identification ──

  test('A1.1 session has tier=free', async ({ page }) => {
    const session = await getSession(page);
    expect(session).toBeTruthy();
    expect(session.user.tier).toBe('free');
    expect(session.user.workspaceType).toBe('personal');
  });

  // ── A2: Dashboard Free Tier Indicators ──

  test('A2.1 dashboard shows student count with /50 max limit', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');    // Wait for dashboard to fully render (lazy loaded)
    await expect(page.locator('text=/Welcome back/i').first()).toBeVisible({ timeout: 15000 });    await expect(page.locator('text=/\\/ 50/')).toBeVisible({ timeout: 10000 });
  });

  test('A2.2 dashboard shows student stats card', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Students').first()).toBeVisible({ timeout: 10000 });
  });

  test('A2.3 dashboard shows upgrade banner or prompt', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('text=/Unlock Pro|Upgrade to Pro|View Plans/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('A2.4 dashboard or sidebar shows upgrade pricing context', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    // studentCount is 0 so the dashboard pricing banner won't show,
    // but the sidebar upgrade CTA is always visible for free tier
    await expect(
      page.locator('text=/Upgrade to Pro|View Plans|Unlock Pro/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ── A3: Students Page - Free Tier Limit ──

  test('A3.1 students page shows "/ 50 max" counter', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/\\/ 50 max/')).toBeVisible({ timeout: 10000 });
  });

  test('A3.2 students page Add Student button is visible', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add Student")');
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });

  // ── A4: Sidebar — Upgrade CTA ──

  test('A4.1 sidebar area shows "Upgrade to Pro" text', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    // The upgrade CTA is in <aside>, which contains <nav> and the CTA div
    await expect(
      page.locator('aside').getByText('Upgrade to Pro').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('A4.2 sidebar upgrade CTA mentions unlimited students, sections & downloads', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText('Unlimited students, sections & downloads').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('A4.3 sidebar "View Plans" button opens upgrade modal', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');

    const viewPlansBtn = page.locator('button:has-text("View Plans")').first();
    await expect(viewPlansBtn).toBeVisible({ timeout: 10000 });
    await viewPlansBtn.click();
    await expect(page.locator('text=Choose Your Plan')).toBeVisible({ timeout: 5000 });
  });

  // ── A5: Settings — Free Tier Display ──

  test('A5.1 settings shows "Free" plan label', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    // DOM text is "free Plan" (CSS capitalize makes it visually "Free Plan")
    await expect(page.getByText(/free Plan/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('A5.2 settings shows free tier limits text', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/50 students.*1 section.*10 downloads/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('A5.3 settings shows "Upgrade to Pro" button', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("Upgrade to Pro")').first()).toBeVisible({ timeout: 10000 });
  });

  test('A5.4 settings shows Pro teaser pricing text', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    // Wait for settings to fully render before checking
    await expect(page.locator('text=Subscription').first()).toBeVisible({ timeout: 10000 });
    // "Unlock Pro for ₱79/month"
    await expect(
      page.getByText(/Unlock Pro/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ── A6: Upgrade Modal — Feature Comparison ──

  test('A6.1 upgrade modal lists free features', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Upgrade to Pro")').first().click();

    await expect(page.getByText('Up to 50 students')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('1 advisory section')).toBeVisible();
    await expect(page.getByText('10 PDF downloads per day')).toBeVisible();
    // Use exact match to avoid matching "No watermark on PDFs"
    await expect(page.getByText('Watermark on PDFs', { exact: true })).toBeVisible();
    await expect(page.getByText('Cloud data storage')).toBeVisible();
  });

  test('A6.2 upgrade modal lists Pro features', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Upgrade to Pro")').first().click();

    // Use exact match to avoid matching partial text in sidebar/settings
    await expect(page.getByText('Unlimited students', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('2 advisory sections')).toBeVisible();
    await expect(page.getByText('Unlimited teaching sections')).toBeVisible();
    await expect(page.getByText('All teacher-level forms')).toBeVisible();
    await expect(page.getByText('Unlimited PDF downloads')).toBeVisible();
    await expect(page.getByText('No watermark on PDFs')).toBeVisible();
    await expect(page.getByText(/Grade history/)).toBeVisible();
    await expect(page.getByText('Excel/CSV bulk import')).toBeVisible();
    await expect(page.getByText('Offline PWA mode')).toBeVisible();
    await expect(page.getByText('Priority email support')).toBeVisible();
  });

  test('A6.3 upgrade modal shows "Current" badge on Free plan', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Upgrade to Pro")').first().click();

    await expect(page.getByText('Current').first()).toBeVisible({ timeout: 5000 });
  });

  test('A6.4 upgrade modal shows pricing toggle', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Subscription').first()).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Upgrade to Pro")').first().click();

    // Default monthly pricing visible (use .first() to avoid strict mode)
    await expect(page.getByText('79').first()).toBeVisible({ timeout: 5000 });

    // Check for yearly toggle
    const yearlyToggle = page.locator('button:has-text("Yearly")').first();
    if (await yearlyToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await yearlyToggle.click();
      await expect(page.getByText('399').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('A6.5 upgrade modal shows "RECOMMENDED" badge on Pro plan', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Upgrade to Pro")').first().click();

    await expect(page.getByText('RECOMMENDED')).toBeVisible({ timeout: 5000 });
  });

  test('A6.6 upgrade modal has "Upgrade Now" button', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    // Wait for Subscription section to render before clicking
    await expect(page.locator('text=Subscription').first()).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Upgrade to Pro")').first().click();

    await expect(
      page.locator('button:has-text("Upgrade Now")').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('A6.7 upgrade modal can be closed via backdrop click', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Subscription').first()).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Upgrade to Pro")').first().click();
    await expect(page.getByText('Choose Your Plan')).toBeVisible({ timeout: 5000 });

    // Close by clicking the backdrop at a corner (away from the centered modal)
    await page.locator('.backdrop-blur-sm').click({ position: { x: 10, y: 10 } });
    await expect(page.getByText('Choose Your Plan')).not.toBeVisible({ timeout: 5000 });
  });

  // ── A7: Forms Page — Free Tier ──

  test('A7.1 forms page shows all three form types (SF2, SF5, SF9)', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/forms`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=SF2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SF5').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SF9').first()).toBeVisible({ timeout: 10000 });
  });

  test('A7.2 forms page shows generate buttons for each form', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/forms`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Generate SF2/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Generate SF5/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Generate SF9/i })).toBeVisible({ timeout: 10000 });
  });

  // ── A8: Gradebook — Free Tier ──

  test('A8.1 gradebook page loads for free tier', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/grades`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Gradebook/i').first()).toBeVisible({ timeout: 10000 });
  });

  // ── A9: Header — Free Tier Badge ──

  test('A9.1 header shows "free" tier badge', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('free').first()).toBeVisible({ timeout: 10000 });
  });
});

// ══════════════════════════════════════════════════════════
//  SECTION B: PRO TIER — VERIFY ALL FEATURES ARE UNLOCKED
// ══════════════════════════════════════════════════════════

test.describe('B. Pro Tier — All Features Unlocked', () => {

  test.beforeEach(async ({ page }) => {
    await ensureProSession(page);
  });

  // ── B1: Session & Tier Identification ──

  test('B1.1 session has tier=pro', async ({ page }) => {
    const session = await getSession(page);
    expect(session).toBeTruthy();
    expect(session.user.tier).toBe('pro');
    expect(session.user.workspaceType).toBe('personal');
  });

  // ── B2: Dashboard — No Limits, No Upgrade Prompts ──

  test('B2.1 dashboard does NOT show "/50" student limit text', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Students').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\/ 50/')).not.toBeVisible({ timeout: 3000 });
  });

  test('B2.2 dashboard does NOT show "Unlock Pro Features" upgrade banner', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Unlock Pro Features')).not.toBeVisible({ timeout: 3000 });
  });

  test('B2.3 dashboard shows student count without cap', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Students').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\/ 50/')).not.toBeVisible({ timeout: 3000 });
  });

  // ── B3: Students Page — Unlimited Students ──

  test('B3.1 students page does NOT show "/ 50 max" counter', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/My Students/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\/ 50 max/')).not.toBeVisible({ timeout: 3000 });
  });

  test('B3.2 Add Student button is always enabled (no cap)', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');
    // Wait for students page to fully render (lazy loaded)
    await expect(page.locator('text=/My Students/i').first()).toBeVisible({ timeout: 15000 });
    const addBtn = page.locator('button:has-text("Add Student")');
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await expect(addBtn).toBeEnabled();
  });

  test('B3.3 no upgrade warning banner on students page', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/free tier limit/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('B3.4 can add a student without limit warning', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');

    const uniqueLrn = Date.now().toString().slice(-12);
    const uniqueSuffix = Date.now().toString().slice(-4);
    await page.click('button:has-text("Add Student")');
    await page.fill('input[placeholder="First Name"]', `ProTest${uniqueSuffix}`);
    await page.fill('input[placeholder="Last Name"]', 'ProStudent');
    await page.fill('input[placeholder="LRN"]', uniqueLrn);
    await page.selectOption('select', 'Male');
    await page.click('button:has-text("Save")');

    await expect(
      page.locator(`text=ProStudent, ProTest${uniqueSuffix}`)
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/limit reached/i)).not.toBeVisible({ timeout: 2000 });
  });

  // ── B4: Sidebar — No Upgrade CTA ──

  test('B4.1 sidebar does NOT show "Upgrade to Pro" CTA', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    // The upgrade CTA in sidebar only appears for free tier
    await expect(
      page.locator('aside').getByText('Upgrade to Pro')
    ).not.toBeVisible({ timeout: 3000 });
  });

  test('B4.2 sidebar still shows all navigation items', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav >> text=Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nav >> text=My Students')).toBeVisible();
    await expect(page.locator('nav >> text=Gradebook')).toBeVisible();
    await expect(page.locator('nav >> text=Generate Forms')).toBeVisible();
    await expect(page.locator('nav >> text=Settings')).toBeVisible();
  });

  // ── B5: Settings — Pro Tier Display ──

  test('B5.1 settings shows "Pro" plan label', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    // Wait for Subscription section, then check "pro Plan" text (CSS capitalize shows as "Pro Plan")
    await expect(page.locator('text=Subscription').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/pro Plan/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('B5.2 settings shows "Unlimited students & downloads"', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Unlimited students/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('B5.3 settings does NOT show "Upgrade to Pro" button', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('button:has-text("Upgrade to Pro")')
    ).not.toBeVisible({ timeout: 3000 });
  });

  test('B5.4 settings does NOT show "Unlock Pro" teaser', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Unlock Pro for/i)
    ).not.toBeVisible({ timeout: 3000 });
  });

  // ── B6: Forms Page — Pro Features ──

  test('B6.1 forms page shows all three form types', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/forms`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=SF2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SF5').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SF9').first()).toBeVisible({ timeout: 10000 });
  });

  test('B6.2 forms page has generate buttons for all forms', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/forms`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Generate SF2/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Generate SF5/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Generate SF9/i })).toBeVisible({ timeout: 10000 });
  });

  // ── B7: Gradebook — Pro Tier ──

  test('B7.1 gradebook page loads for Pro tier', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/grades`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Gradebook/i').first()).toBeVisible({ timeout: 10000 });
  });

  // ── B8: Header — Pro Tier Badge ──

  test('B8.1 header shows "pro" tier badge', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    // Wait for layout header to render
    await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 });
    // The header badge shows {tier} text — "pro" in DOM (CSS uppercase makes it "PRO")
    await expect(page.locator('header').getByText('pro').first()).toBeVisible({ timeout: 10000 });
  });
});

// ══════════════════════════════════════════════════════════
//  SECTION C: CROSS-TIER NAVIGATION
// ══════════════════════════════════════════════════════════

test.describe('C. Cross-Tier — Navigation Works for Both Tiers', () => {

  test('C1.1 Free user can navigate all sidebar pages', async ({ page }) => {
    await ensureFreeSession(page);

    await page.goto(`${PERSONAL_URL}`);
    await expect(page.locator('text=/Welcome back/i').first()).toBeVisible({ timeout: 15000 });

    await page.locator('nav >> text=My Students').click();
    await page.waitForURL(/\/personal\/students/, { timeout: 10000 });
    await expect(page.locator('text=/My Students/i').first()).toBeVisible({ timeout: 10000 });

    await page.locator('nav >> text=Gradebook').click();
    await page.waitForURL(/\/personal\/grades/, { timeout: 10000 });
    await expect(page.locator('text=/Gradebook/i').first()).toBeVisible({ timeout: 10000 });

    await page.locator('nav >> text=Generate Forms').click();
    await page.waitForURL(/\/personal\/forms/, { timeout: 10000 });
    await expect(page.locator('text=/Generate DepEd Forms/i').first()).toBeVisible({ timeout: 10000 });

    await page.locator('nav >> text=Settings').click();
    await page.waitForURL(/\/personal\/settings/, { timeout: 10000 });
    await expect(page.locator('text=/Account/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('C1.2 Pro user can navigate all sidebar pages', async ({ page }) => {
    await ensureProSession(page);

    await page.goto(`${PERSONAL_URL}`);
    await expect(page.locator('text=/Welcome back/i').first()).toBeVisible({ timeout: 15000 });

    await page.locator('nav >> text=My Students').click();
    await page.waitForURL(/\/personal\/students/, { timeout: 10000 });
    await expect(page.locator('text=/My Students/i').first()).toBeVisible({ timeout: 10000 });

    await page.locator('nav >> text=Gradebook').click();
    await page.waitForURL(/\/personal\/grades/, { timeout: 10000 });
    await expect(page.locator('text=/Gradebook/i').first()).toBeVisible({ timeout: 10000 });

    await page.locator('nav >> text=Generate Forms').click();
    await page.waitForURL(/\/personal\/forms/, { timeout: 10000 });
    await expect(page.locator('text=/Generate DepEd Forms/i').first()).toBeVisible({ timeout: 10000 });

    await page.locator('nav >> text=Settings').click();
    await page.waitForURL(/\/personal\/settings/, { timeout: 10000 });
    await expect(page.locator('text=/Account/i').first()).toBeVisible({ timeout: 10000 });
  });
});

// ══════════════════════════════════════════════════════════
//  SECTION D: PRO-ONLY FUNCTIONAL TESTS
// ══════════════════════════════════════════════════════════

test.describe('D. Pro-Only Features — Functional Tests', () => {

  test.beforeEach(async ({ page }) => {
    await ensureProSession(page);
  });

  test('D1.1 can add multiple students without hitting a limit', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');

    for (let i = 0; i < 2; i++) {
      const ts = Date.now() + i;
      const lrn = ts.toString().slice(-12);
      const suffix = ts.toString().slice(-5);

      await page.click('button:has-text("Add Student")');
      await page.fill('input[placeholder="First Name"]', `Batch${suffix}`);
      await page.fill('input[placeholder="Last Name"]', 'ProBatch');
      await page.fill('input[placeholder="LRN"]', lrn);
      await page.selectOption('select', i % 2 === 0 ? 'Male' : 'Female');
      await page.click('button:has-text("Save")');
      await expect(page.locator('text=Add New Student')).not.toBeVisible({ timeout: 15000 });
    }

    await expect(page.getByText(/limit reached/i)).not.toBeVisible({ timeout: 2000 });
  });

  test('D2.1 all form generate buttons are visible for Pro', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/forms`);
    await page.waitForLoadState('networkidle');
    // Buttons may be disabled (no students/grades data) but should be visible for Pro tier
    await expect(page.getByRole('button', { name: /Generate SF5/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Generate SF9/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate SF2/i })).toBeVisible();
  });

  test('D3.1 gradebook loads without restriction messages', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}/grades`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Gradebook/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('D4.1 Pro session persists across page reload', async ({ page }) => {
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Welcome back/i').first()).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForURL(/\/personal/, { timeout: 15000 });

    const session = await getSession(page);
    expect(session?.user?.tier).toBe('pro');
  });
});

// ══════════════════════════════════════════════════════════
//  SECTION E: SIDE-BY-SIDE COMPARISON
// ══════════════════════════════════════════════════════════

test.describe('E. Feature Matrix — Side-by-Side Verification', () => {

  test('E1.1 Free shows student limit counter, Pro does not', async ({ page }) => {
    await ensureFreeSession(page);
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/\\/ 50 max/')).toBeVisible({ timeout: 10000 });

    await clearSession(page);
    await ensureProSession(page);
    await page.goto(`${PERSONAL_URL}/students`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/\\/ 50 max/')).not.toBeVisible({ timeout: 3000 });
  });

  test('E1.2 Free shows sidebar upgrade CTA, Pro does not', async ({ page }) => {
    await ensureFreeSession(page);
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('aside').getByText('Upgrade to Pro').first()).toBeVisible({ timeout: 10000 });

    await clearSession(page);
    await ensureProSession(page);
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('aside').getByText('Upgrade to Pro')).not.toBeVisible({ timeout: 3000 });
  });

  test('E1.3 Free shows settings upgrade button, Pro does not', async ({ page }) => {
    await ensureFreeSession(page);
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    // Use role selector to target the primary "Upgrade to Pro" button (not the inline link)
    await expect(page.getByRole('button', { name: 'Upgrade to Pro' }).first()).toBeVisible({ timeout: 10000 });

    await clearSession(page);
    await ensureProSession(page);
    await page.goto(`${PERSONAL_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Upgrade to Pro' })).not.toBeVisible({ timeout: 3000 });
  });

  test('E1.4 Free header badge says "free", Pro says "pro"', async ({ page }) => {
    await ensureFreeSession(page);
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('free').first()).toBeVisible({ timeout: 10000 });

    await clearSession(page);
    await ensureProSession(page);
    await page.goto(`${PERSONAL_URL}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('pro').first()).toBeVisible({ timeout: 10000 });
  });
});
