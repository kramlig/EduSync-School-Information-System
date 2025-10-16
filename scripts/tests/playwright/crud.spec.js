const { test, expect } = require('@playwright/test');

// These tests assume the app is running (vite preview or hosting) and uses the debug login.
// Set TEST_BASE_URL env to point at the running app, otherwise defaults to vite preview URL.

test('Learning Areas: add persists across reload, then delete', async ({ page }) => {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  // Quick login (debug)
  await page.getByRole('button', { name: /quick login/i }).click();

  // Navigate to Learning Areas
  await page.getByRole('link', { name: /learning areas/i }).click();

  // Add new learning area via modal
  await page.getByRole('button', { name: /add learning area/i }).click();
  await page.getByLabel(/learning area name/i).fill('Test Area E2E');
  await page.getByLabel(/credits/i).fill('2');
  await page.getByRole('button', { name: /^add learning area$/i }).click();

  // Expect it to appear in the table
  await expect(page.getByRole('row', { name: /test area e2e/i })).toBeVisible();

  // Reload and verify persistence
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /learning areas/i }).click();
  await expect(page.getByRole('row', { name: /test area e2e/i })).toBeVisible();

  // Delete the area
  const row = page.getByRole('row', { name: /test area e2e/i });
  await row.getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /^delete learning area$|^delete$/i }).click();

  // Verify removal
  await expect(page.getByRole('row', { name: /test area e2e/i })).toHaveCount(0);

  // Reload and verify it's still gone
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /learning areas/i }).click();
  await expect(page.getByRole('row', { name: /test area e2e/i })).toHaveCount(0);
});

test('Grades: edit Q1 for first student/subject persists across reload', async ({ page }) => {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  // Quick login (debug)
  await page.getByRole('button', { name: /quick login/i }).click();

  // Go to Gradebook
  await page.getByRole('link', { name: /gradebook/i }).click();

  // If section select exists, ensure a value is selected
  const sectionSelect = page.locator('#section-select');
  if (await sectionSelect.count()) {
    const val = await sectionSelect.inputValue();
    if (!val) {
      await sectionSelect.selectOption({ index: 1 }).catch(async () => {
        // fallback to first option if available
        const options = sectionSelect.locator('option');
        const count = await options.count();
        if (count > 1) await sectionSelect.selectOption({ index: 1 });
      });
    }
  }

  // Find first editable grade cell (non-composite) and set a value
  // Heuristic: find first input[type=number] in table body
  const firstCellInput = page.locator('tbody input[type="number"]').first();
  await firstCellInput.fill('77');
  await firstCellInput.blur();

  // Reload and ensure the value remains 77
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /gradebook/i }).click();
  if (await sectionSelect.count()) {
    const val = await sectionSelect.inputValue();
    if (!val) {
      await sectionSelect.selectOption({ index: 1 }).catch(() => {});
    }
  }
  const firstCellInputAfter = page.locator('tbody input[type="number"]').first();
  await expect(firstCellInputAfter).toHaveValue('77');
});
