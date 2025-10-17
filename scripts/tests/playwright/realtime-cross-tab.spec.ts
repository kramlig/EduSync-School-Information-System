import { test, expect } from '@playwright/test';

// Smoke test: verifies that editing a grade in one tab is reflected in another tab in near real-time.
// Assumptions:
// - App is running at TEST_BASE_URL or http://127.0.0.1:5173
// - Quick Login button exists to bypass auth
// - Gradebook view renders a table with input[type=number] cells

test('Grades propagate across tabs via Firestore realtime', async ({ browser }) => {
  const context = await browser.newContext();
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  // Open both pages to the app
  await pageA.goto('/', { waitUntil: 'domcontentloaded' });
  await pageB.goto('/', { waitUntil: 'domcontentloaded' });

  // Quick login on both
  await pageA.getByRole('button', { name: /quick login/i }).click();
  await pageB.getByRole('button', { name: /quick login/i }).click();

  // Navigate both to Gradebook (avoid matching Core Values Gradebook)
  await pageA.getByRole('link', { name: /^Gradebook$/ }).click();
  await pageB.getByRole('link', { name: /^Gradebook$/ }).click();

  // If section selector exists, select first option in both
  const sectionSelectA = pageA.locator('#section-select');
  if (await sectionSelectA.count()) {
    const val = await sectionSelectA.inputValue();
    if (!val) await sectionSelectA.selectOption({ index: 1 }).catch(() => {});
  }
  const sectionSelectB = pageB.locator('#section-select');
  if (await sectionSelectB.count()) {
    const val = await sectionSelectB.inputValue();
    if (!val) await sectionSelectB.selectOption({ index: 1 }).catch(() => {});
  }

  // Choose the first grade cell in A, set a random value
  const firstCellA = pageA.locator('tbody input[type="number"]').first();
  await firstCellA.waitFor({ state: 'visible' });
  const newValue = String(70 + Math.floor(Math.random() * 20));
  await firstCellA.fill(newValue);
  await firstCellA.blur();

  // Expect page B to eventually reflect the same value in the corresponding first cell.
  const firstCellB = pageB.locator('tbody input[type="number"]').first();
  await expect(firstCellB).toHaveValue(newValue, { timeout: 15000 });
});
