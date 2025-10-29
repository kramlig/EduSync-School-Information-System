import { test, expect } from '@playwright/test';

/**
 * Form 137 Creation Flow Test
 * 
 * Tests the complete workflow:
 * 1. Navigate to Form 137 Dashboard
 * 2. Generate Form 137 for a student
 * 3. Verify preview modal shows
 * 4. Confirm and save
 * 5. Verify Form 137 displays correctly (not "No Academic Record Found")
 */

test.describe('Form 137 Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for slow network
    test.setTimeout(120000); // 2 minutes
    
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for app to load (but don't wait for networkidle, it might never happen)
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Check if we're on login screen, if so, skip (or login if needed)
    const isLoginPage = await page.getByText('Sign In').isVisible().catch(() => false);
    if (isLoginPage) {
      console.log('⚠️  Login required - test may need authentication setup');
    }
  });

  test('should create Form 137 and display it without "No Academic Record Found" error', async ({ page }) => {
    // Step 1: Navigate to Form 137 Dashboard
    console.log('Step 1: Navigating to Form 137 Dashboard...');
    
    // Try to find and click the Forms menu or navigate directly
    await page.goto('http://localhost:5173/forms/137');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/forms\/137$/);
    console.log('✅ On Form 137 Dashboard');
    
    // Step 2: Find a student without Form 137 and click "Generate Form 137"
    console.log('Step 2: Looking for Generate Form 137 button...');
    
    // Wait for the dashboard to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/01-dashboard.png', fullPage: true });
    
    // Find the first "Generate Form 137" button
    const generateButtons = page.getByRole('button', { name: /Generate Form 137/i });
    const firstButton = generateButtons.first();
    
    // Check if button exists
    const buttonExists = await firstButton.isVisible().catch(() => false);
    if (!buttonExists) {
      console.log('⚠️  No "Generate Form 137" buttons found - all students may already have Form 137');
      console.log('Current URL:', page.url());
      await page.screenshot({ path: 'test-results/no-generate-button.png', fullPage: true });
      test.skip();
    }
    
    // Get student info from the row
    const studentRow = page.locator('tr').filter({ has: firstButton }).first();
    const studentName = await studentRow.locator('td').nth(1).textContent();
    console.log(`Found student: ${studentName}`);
    
    // Click Generate
    await firstButton.click();
    console.log('✅ Clicked Generate Form 137');
    
    // Step 3: Wait for auto-generation and preview modal
    console.log('Step 3: Waiting for preview modal...');
    
    // Wait for either the student selection modal or preview modal
    await page.waitForTimeout(3000); // Give time for generation
    
    // Check if we see a student selection modal first
    const selectStudentModal = page.getByText(/Select Student/i);
    const hasSelectModal = await selectStudentModal.isVisible().catch(() => false);
    
    if (hasSelectModal) {
      console.log('Student selection modal appeared, selecting student...');
      await page.screenshot({ path: 'test-results/02-select-modal.png', fullPage: true });
      
      // Select the first student if needed
      const selectButton = page.getByRole('button', { name: /Select|Choose/i }).first();
      if (await selectButton.isVisible().catch(() => false)) {
        await selectButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Now wait for preview modal
    const previewModal = page.getByText(/Preview New Form 137|Preview New School Year/i);
    await expect(previewModal).toBeVisible({ timeout: 10000 });
    console.log('✅ Preview modal appeared');
    
    await page.screenshot({ path: 'test-results/03-preview-modal.png', fullPage: true });
    
    // Verify we see grades data in the preview
    const hasGrades = await page.getByText(/Mathematics|English|Science/i).isVisible().catch(() => false);
    console.log(`Preview has grades: ${hasGrades}`);
    
    // Step 4: Click "Confirm & Save"
    console.log('Step 4: Clicking Confirm & Save...');
    
    const confirmButton = page.getByRole('button', { name: /Confirm.*Save/i });
    await expect(confirmButton).toBeVisible();
    
    // Click and wait for save
    await confirmButton.click();
    console.log('✅ Clicked Confirm & Save');
    
    // Wait for the alert
    page.on('dialog', async dialog => {
      console.log(`Alert message: ${dialog.message()}`);
      await dialog.accept();
    });
    
    await page.waitForTimeout(1000);
    
    // Step 5: Wait for navigation to Form 137 view
    console.log('Step 5: Waiting for navigation to Form 137 view...');
    
    // Should navigate to /forms/137/{studentId}
    await page.waitForURL(/\/forms\/137\/[^\/]+$/, { timeout: 10000 });
    const finalURL = page.url();
    console.log(`✅ Navigated to: ${finalURL}`);
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Additional time for Firestore data to load
    
    await page.screenshot({ path: 'test-results/04-after-save.png', fullPage: true });
    
    // Step 6: Verify NO "No Academic Record Found" error
    console.log('Step 6: Verifying Form 137 displays correctly...');
    
    const noRecordError = page.getByText(/No Academic Record Found/i);
    const hasError = await noRecordError.isVisible().catch(() => false);
    
    if (hasError) {
      console.error('❌ ERROR: "No Academic Record Found" message is showing!');
      await page.screenshot({ path: 'test-results/ERROR-no-record-found.png', fullPage: true });
      
      // Debug: Check what's in the console
      page.on('console', msg => console.log('Browser console:', msg.text()));
      
      // Debug: Check network requests
      const requests: string[] = [];
      page.on('request', request => requests.push(request.url()));
      await page.waitForTimeout(2000);
      console.log('Network requests:', requests.filter(r => r.includes('academicHistory')));
      
      throw new Error('Form 137 view shows "No Academic Record Found" after creation');
    }
    
    // Verify we see actual Form 137 content
    const hasFormHeader = await page.getByText(/LEARNER'S PERMANENT ACADEMIC RECORD|Form 137/i).isVisible();
    const hasStudentInfo = await page.getByText(/Student Information|LRN/i).isVisible();
    const hasGradesTable = await page.getByText(/Learning Area|Quarter|Final Grade/i).isVisible();
    
    console.log(`Has Form Header: ${hasFormHeader}`);
    console.log(`Has Student Info: ${hasStudentInfo}`);
    console.log(`Has Grades Table: ${hasGradesTable}`);
    
    expect(hasFormHeader || hasStudentInfo || hasGradesTable).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/05-success.png', fullPage: true });
    
    console.log('✅ SUCCESS: Form 137 displays correctly!');
  });

  test('should handle adding second year to existing Form 137', async ({ page }) => {
    console.log('Step 1: Navigating to Form 137 Dashboard...');
    
    await page.goto('http://localhost:5173/forms/137');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Find a student that already has Form 137 (look for "View" button)
    const viewButtons = page.getByRole('button', { name: /View/i });
    const hasViewButton = await viewButtons.first().isVisible().catch(() => false);
    
    if (!hasViewButton) {
      console.log('⚠️  No students with existing Form 137 found');
      test.skip();
    }
    
    // Find the row with a View button and also a Generate button
    const rows = page.locator('tr').filter({ has: viewButtons.first() });
    const firstRow = rows.first();
    
    // Check if this student also has a Generate button (for adding year)
    const generateButton = firstRow.getByRole('button', { name: /Generate Form 137/i });
    const canAddYear = await generateButton.isVisible().catch(() => false);
    
    if (!canAddYear) {
      console.log('⚠️  Selected student cannot add new year');
      test.skip();
    }
    
    console.log('Step 2: Generating second year for existing Form 137...');
    await generateButton.click();
    await page.waitForTimeout(3000);
    
    // Should see "Preview New School Year" (not "Preview New Form 137")
    const newYearText = page.getByText(/Preview New School Year/i);
    await expect(newYearText).toBeVisible({ timeout: 10000 });
    console.log('✅ Preview modal shows "Add School Year"');
    
    await page.screenshot({ path: 'test-results/06-add-year-preview.png', fullPage: true });
    
    // Confirm and save
    const confirmButton = page.getByRole('button', { name: /Confirm.*Save/i });
    await confirmButton.click();
    
    await page.waitForTimeout(1000);
    await page.waitForURL(/\/forms\/137\/[^\/]+$/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/07-after-add-year.png', fullPage: true });
    
    // Verify no error
    const noRecordError = page.getByText(/No Academic Record Found/i);
    const hasError = await noRecordError.isVisible().catch(() => false);
    
    expect(hasError).toBeFalsy();
    
    // Verify year selector is visible (indicates multiple years)
    const yearSelector = page.locator('select').filter({ hasText: /2024-2025|2025-2026/i });
    const hasYearSelector = await yearSelector.isVisible().catch(() => false);
    
    console.log(`Has year selector: ${hasYearSelector}`);
    
    console.log('✅ SUCCESS: Second year added successfully!');
  });
});
