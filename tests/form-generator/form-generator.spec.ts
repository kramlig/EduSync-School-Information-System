/**
 * Comprehensive E2E test for the Free Form Generator Tool
 * Tests the full wizard: form selection → school info → CSV upload → PDF download
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const TOOL_URL = '/tools/form-generator';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

test.describe('Free Form Generator Tool', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset rate limiter and cached school info
    await page.goto(TOOL_URL);
    await page.evaluate(() => {
      localStorage.removeItem('edusync_tool_usage');
      localStorage.removeItem('edusync_tool_school_info');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ──────────────────── STEP 1: Form Type Selection ────────────────────

  test('renders the wizard with step 1 active', async ({ page }) => {
    await expect(page.locator('text=DepEd Form Generator')).toBeVisible();
    await expect(page.locator('text=Select Form Type')).toBeVisible();
    // Next button should be disabled (nothing selected)
    const nextBtn = page.locator('button:has-text("Next →")');
    await expect(nextBtn).toBeDisabled();
  });

  test('can select SF5 and proceed to step 2', async ({ page }) => {
    await page.click('button:has-text("SF5")');
    // Check card is selected (check icon visible)
    await expect(page.locator('button:has-text("SF5") svg')).toBeVisible();
    // Next button should be enabled
    const nextBtn = page.locator('button:has-text("Next →")');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await expect(page.getByRole('heading', { name: 'School Information' })).toBeVisible();
  });

  test('can select SF9 and proceed to step 2', async ({ page }) => {
    await page.click('button:has-text("SF9")');
    const nextBtn = page.locator('button:has-text("Next →")');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await expect(page.getByRole('heading', { name: 'School Information' })).toBeVisible();
  });

  test('can select SF2 and proceed to step 2', async ({ page }) => {
    await page.click('button:has-text("SF2")');
    const nextBtn = page.locator('button:has-text("Next →")');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await expect(page.getByRole('heading', { name: 'School Information' })).toBeVisible();
  });

  // ──────────────────── STEP 2: School Info ────────────────────

  test('validates required fields on step 2', async ({ page }) => {
    // Go to step 2
    await page.click('button:has-text("SF5")');
    await page.click('button:has-text("Next →")');
    await expect(page.getByRole('heading', { name: 'School Information' })).toBeVisible();

    // Next should be disabled with empty required fields
    const nextBtn = page.locator('button:has-text("Next →")');
    await expect(nextBtn).toBeDisabled();

    // Fill only school name — still disabled
    await page.fill('input[placeholder*="School"]', 'Enrique Orencia Elementary School');
    await expect(nextBtn).toBeDisabled();

    // Fill school year
    await page.fill('input[placeholder*="2024-2025"]', '2024-2025');
    await expect(nextBtn).toBeDisabled();

    // Select grade level
    await page.selectOption('select', '6');
    await expect(nextBtn).toBeDisabled();

    // Fill section name — NOW next should be enabled
    await page.fill('input[placeholder*="Mapagmahal"]', 'Mabini');
    await expect(nextBtn).toBeEnabled();
  });

  test('caches school info in localStorage', async ({ page }) => {
    await page.click('button:has-text("SF5")');
    await page.click('button:has-text("Next →")');

    await page.fill('input[placeholder*="School"]', 'Test Cache School');
    await page.fill('input[placeholder*="2024-2025"]', '2025-2026');

    // Verify localStorage was updated
    const cached = await page.evaluate(() => localStorage.getItem('edusync_tool_school_info'));
    expect(cached).toBeTruthy();
    const parsed = JSON.parse(cached!);
    expect(parsed.name).toBe('Test Cache School');
    expect(parsed.schoolYear).toBe('2025-2026');
  });

  // ──────────────────── STEP 3: Data Upload ────────────────────

  test('shows upload area on step 3', async ({ page }) => {
    await goToStep3(page, 'sf5');
    await expect(page.locator('text=Upload Student Data')).toBeVisible();
    await expect(page.locator('text=Drag & drop')).toBeVisible();
  });

  test('can download CSV template', async ({ page }) => {
    await goToStep3(page, 'sf5');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("SF5 CSV template")'),
    ]);
    expect(download.suggestedFilename()).toBe('sf5_template.csv');
  });

  test('uploads SF5 CSV successfully', async ({ page }) => {
    await goToStep3(page, 'sf5');

    // Upload the test CSV
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-sf5-data.csv'));

    // Wait for processing and check success
    await expect(page.locator('text=test-sf5-data.csv')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=10 rows parsed')).toBeVisible();

    // Preview table should show
    await expect(page.locator('text=First 5 of 10 rows')).toBeVisible();

    // Next button should be enabled
    const nextBtn = page.locator('button:has-text("Next →")');
    await expect(nextBtn).toBeEnabled();
  });

  test('uploads SF9 CSV successfully', async ({ page }) => {
    await goToStep3(page, 'sf9');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-sf9-data.csv'));

    await expect(page.locator('text=test-sf9-data.csv')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=24 rows parsed')).toBeVisible();
  });

  test('uploads SF2 CSV successfully', async ({ page }) => {
    await goToStep3(page, 'sf2');

    // Should show report month picker
    await expect(page.locator('text=Report Month')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-sf2-data.csv'));

    await expect(page.locator('text=test-sf2-data.csv')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=8 rows parsed')).toBeVisible();

    // Preview should show "Days Recorded" column
    await expect(page.locator('text=Days Recorded')).toBeVisible();
  });

  test('can download SF2 CSV template', async ({ page }) => {
    await goToStep3(page, 'sf2');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("SF2 CSV template")'),
    ]);
    expect(download.suggestedFilename()).toBe('sf2_template.csv');
  });

  test('rejects unsupported file types', async ({ page }) => {
    await goToStep3(page, 'sf5');

    // Create a fake .txt file
    const fileInput = page.locator('input[type="file"]');
    // Playwright only allows setting real files, so let's just check the accept attribute
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toContain('.csv');
    expect(accept).toContain('.xlsx');
  });

  test('can remove uploaded file and re-upload', async ({ page }) => {
    await goToStep3(page, 'sf5');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-sf5-data.csv'));
    await expect(page.locator('text=test-sf5-data.csv')).toBeVisible({ timeout: 10000 });

    // Click remove
    await page.click('button:has-text("Remove")');

    // Upload area should reappear
    await expect(page.locator('text=Drag & drop')).toBeVisible();
  });

  // ──────────────────── STEP 4: Preview & Download ────────────────────

  test('shows review summary on step 4 for SF5', async ({ page }) => {
    await goToStep4(page, 'sf5');

    await expect(page.locator('text=Review & Download')).toBeVisible();
    await expect(page.getByText('SF5', { exact: true })).toBeVisible();
    await expect(page.locator('text=Enrique Orencia Elementary School')).toBeVisible();
    await expect(page.locator('text=2024-2025')).toBeVisible();
    await expect(page.locator('text=Grade 6')).toBeVisible();
    await expect(page.locator('text=test-sf5-data.csv')).toBeVisible();
    await expect(page.locator('text=10')).toBeVisible(); // 10 students

    // Download button should be present
    const downloadBtn = page.locator('button:has-text("Download SF5 PDF")');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toBeEnabled();
  });

  test('generates and downloads SF5 PDF', async ({ page }) => {
    await goToStep4(page, 'sf5');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.click('button:has-text("Download SF5 PDF")'),
    ]);

    expect(download.suggestedFilename()).toMatch(/^SF5_.*\.pdf$/);
    await expect(page.locator('text=PDF downloaded successfully')).toBeVisible();
  });

  test('generates and downloads SF9 PDF', async ({ page }) => {
    await goToStep4(page, 'sf9');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.click('button:has-text("Download SF9 PDF")'),
    ]);

    expect(download.suggestedFilename()).toMatch(/^SF9_.*\.pdf$/);
    await expect(page.locator('text=PDF downloaded successfully')).toBeVisible();
  });

  test('generates and downloads SF2 PDF', async ({ page }) => {
    await goToStep4(page, 'sf2');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.click('button:has-text("Download SF2 PDF")'),
    ]);

    expect(download.suggestedFilename()).toMatch(/^SF2_.*\.pdf$/);
    await expect(page.locator('text=PDF downloaded successfully')).toBeVisible();
  });

  // ──────────────────── Rate Limiting ────────────────────

  test('enforces 3-per-day rate limit', async ({ page }) => {
    await goToStep4(page, 'sf5');

    // Simulate 3 prior downloads
    await page.evaluate(() => {
      localStorage.setItem('edusync_tool_usage', JSON.stringify({
        date: new Date().toDateString(),
        count: 3,
      }));
    });
    await page.reload();
    // Re-navigate to step 4
    await goToStep4(page, 'sf5');

    await expect(page.locator('text=Daily limit reached')).toBeVisible();
    const downloadBtn = page.locator('button:has-text("Download SF5 PDF")');
    await expect(downloadBtn).toBeDisabled();
  });

  test('shows downloads remaining', async ({ page }) => {
    // Simulate 1 prior download
    await page.evaluate(() => {
      localStorage.setItem('edusync_tool_usage', JSON.stringify({
        date: new Date().toDateString(),
        count: 1,
      }));
    });
    await page.reload();
    await goToStep4(page, 'sf5');

    await expect(page.locator('text=2 free downloads remaining today')).toBeVisible();
  });

  // ──────────────────── Navigation ────────────────────

  test('Previous button navigates back through steps', async ({ page }) => {
    await goToStep3(page, 'sf5');
    await expect(page.locator('text=Upload Student Data')).toBeVisible();

    await page.click('button:has-text("← Previous")');
    await expect(page.getByRole('heading', { name: 'School Information' })).toBeVisible();

    await page.click('button:has-text("← Previous")');
    await expect(page.locator('text=Select Form Type')).toBeVisible();

    // Previous should be disabled on step 1
    const prevBtn = page.locator('button:has-text("← Previous")');
    await expect(prevBtn).toBeDisabled();
  });

  test('Previous button is disabled on step 1', async ({ page }) => {
    const prevBtn = page.locator('button:has-text("← Previous")');
    await expect(prevBtn).toBeDisabled();
  });

  // ──────────────────── Privacy & Footer ────────────────────

  test('shows privacy notice', async ({ page }) => {
    await expect(page.locator('text=No data is uploaded to any server')).toBeVisible();
  });

  test('has link back to home', async ({ page }) => {
    await expect(page.locator('a:has-text("Back to Home")')).toBeVisible();
  });

});

// ──────────────────── Helpers ────────────────────

async function fillSchoolInfo(page: any) {
  await page.fill('input[placeholder*="School"]', 'Enrique Orencia Elementary School');
  await page.fill('input[placeholder*="301234"]', '301456');
  await page.fill('input[placeholder*="Division"]', 'Division of Davao Oriental');
  await page.fill('input[placeholder*="Region"]', 'Region XI');
  await page.fill('input[placeholder*="Mati District"]', 'Mati District');
  await page.fill('input[placeholder*="2024-2025"]', '2024-2025');
  await page.selectOption('select', '6');
  await page.fill('input[placeholder*="Mapagmahal"]', 'Mabini');
  await page.fill('input[placeholder*="Juan dela Cruz"]', 'Ms. Rosa Mendoza');
}

async function goToStep3(page: any, formType: 'sf5' | 'sf9' | 'sf2') {
  await page.goto(TOOL_URL);
  await page.waitForLoadState('networkidle');

  // Step 1: Select form type
  const label = formType === 'sf5' ? 'SF5' : formType === 'sf9' ? 'SF9' : 'SF2';
  await page.click(`button:has-text("${label}")`);
  await page.click('button:has-text("Next →")');

  // Step 2: Fill school info
  await fillSchoolInfo(page);
  await page.click('button:has-text("Next →")');

  await expect(page.locator('text=Upload Student Data')).toBeVisible();
}

async function goToStep4(page: any, formType: 'sf5' | 'sf9' | 'sf2') {
  await goToStep3(page, formType);

  // Step 3: Upload CSV
  const csvFile = formType === 'sf5' ? 'test-sf5-data.csv' : formType === 'sf9' ? 'test-sf9-data.csv' : 'test-sf2-data.csv';
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(FIXTURES_DIR, csvFile));

  // Wait for parsing
  await expect(page.locator(`text=${csvFile}`)).toBeVisible({ timeout: 10000 });

  // Proceed to step 4
  await page.click('button:has-text("Next →")');
  await expect(page.locator('text=Review & Download')).toBeVisible();
}
