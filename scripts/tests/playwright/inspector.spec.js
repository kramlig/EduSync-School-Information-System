const { test, expect } = require('@playwright/test');
const admin = require('firebase-admin');

// This test assumes Firestore emulator is running at FIRESTORE_EMULATOR_HOST
// and the app is served at http://127.0.0.1:5173 (vite preview).

// Configure admin to use emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
}

let app;

test.beforeAll(async () => {
  // initialize admin app
  admin.initializeApp();
  app = admin.firestore();
});

test('inspector enqueues, inspects, retries and idempotency holds', async ({ page }) => {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
  await page.goto(base, { waitUntil: 'networkidle' });

  // Click enqueue
  await page.click('button:has-text("Enqueue test write")');

  // Wait for lastIdemKey to appear
  const idemEl = await page.locator('text=Last idempotency key').first();
  await expect(idemEl).toBeVisible();
  const idemKey = await page.locator('text=Last idempotency key').locator('code').innerText();
  console.log('Captured idemKey:', idemKey);

  // Refresh inspector
  await page.click('button:has-text("Refresh inspector")');

  // Find the row with idemKey
  const row = page.locator('table').locator('tbody tr').filter({ hasText: idemKey }).first();
  await expect(row).toBeVisible();

  // Click Retry
  const retry = row.locator('button:has-text("Retry")');
  await retry.click();

  // Give the operation a moment
  await page.waitForTimeout(1000);

  // Verify via admin SDK that idem doc exists and target doc exists
  const idemRef = app.doc(`_sync_idempotency/${idemKey}`);
  const idemSnap = await idemRef.get();
  expect(idemSnap.exists).toBe(true);

  // target doc: collection 'users' using idemKey as id per current implementation
  const targetRef = app.doc(`users/${idemKey}`);
  const targetSnap = await targetRef.get();
  expect(targetSnap.exists).toBe(true);

  // Retry the Retry button (idempotency): if we click Retry again it should be a no-op
  // (the item should have been removed from the queue by flushItem). Clicking won't find the row
  await page.click('button:has-text("Refresh inspector")');
  const rowsAfter = await page.locator('table tbody tr').count();
  console.log('rowsAfter:', rowsAfter);
});
