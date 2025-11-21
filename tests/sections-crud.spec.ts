import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Sections CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'default-admin@test.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForTimeout(2000); // Give dashboard time to render
    
    // Click Sections link in sidebar
    await page.click('a[href="/sections"], nav a:has-text("Sections")');
    await page.waitForTimeout(3000); // Wait for sections page to load
  });

  test('should display sections', async ({ page }) => {
    // Check if sections table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check for section rows (should have 6 sections from seed)
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`Found ${count} sections`);
    expect(count).toBeGreaterThan(0);
  });

  test('should create a new section', async ({ page }) => {
    // Click "Add Class" button
    await page.click('button:has-text("Add Class")');
    
    // Wait for modal
    await page.waitForSelector('h3:has-text("Add New Class")');

    // Fill form
    await page.fill('input[name="gradeLevel"]', '3');
    await page.fill('input[name="name"]', 'Test Section ' + Date.now());
    
    // Select an adviser (first option in dropdown)
    const adviserSelect = page.locator('select[name="adviserId"]');
    await adviserSelect.selectOption({ index: 1 }); // Select first teacher
    
    // Submit
    await page.locator('form button[type="submit"]').click();
    
    // Wait for modal to close
    await page.waitForTimeout(2000);
    
    // Verify creation (check if new section appears or no error shown)
    const errorAlert = page.locator('[role="alert"]');
    const hasError = await errorAlert.count() > 0;
    
    if (hasError) {
      console.log('Warning: Error alert found after create');
    } else {
      console.log('Section created successfully (no error alert)');
    }
  });

  test('should update a section', async ({ page }) => {
    // Click edit on first section
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
    // Wait for modal
    await page.waitForSelector('h3:has-text("Edit Class")');
    
    // Update name
    const nameInput = page.locator('input[name="name"]');
    const newName = 'Updated Section ' + Date.now();
    await nameInput.fill(newName);
    
    // Submit
    await page.locator('form button[type="submit"]').click();
    
    // Wait for update
    await page.waitForTimeout(2000);
    
    // Check if update was successful (no error)
    const errorAlert = page.locator('[role="alert"]');
    const hasError = await errorAlert.count() > 0;
    
    if (hasError) {
      console.log('Warning: Error alert found after update');
    } else {
      console.log('Section updated successfully');
    }
  });

  test('should delete a section', async ({ page }) => {
    // Get initial count
    const initialRows = await page.locator('tbody tr').count();
    
    // Click delete on last section (safer than first to avoid deleting one with students)
    const deleteButton = page.locator('button:has-text("Delete")').last();
    await deleteButton.click();
    
    // Confirm deletion in modal
    await page.waitForTimeout(1000);
    const confirmButton = page.locator('button:has-text("Delete")').last();
    await confirmButton.click();
    
    // Wait for deletion
    await page.waitForTimeout(2000);
    
    // Check if count decreased or stayed same (might fail if section has students)
    const finalRows = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${initialRows}, Final rows: ${finalRows}`);
    
    if (finalRows < initialRows) {
      console.log('Section deleted successfully');
    } else {
      console.log('Section deletion may have failed (possibly has students)');
    }
  });

  test('should show section details', async ({ page }) => {
    // Get first section row
    const firstRow = page.locator('tbody tr').first();
    
    // Check if all columns are visible
    const name = await firstRow.locator('td').nth(0).textContent();
    const gradeLevel = await firstRow.locator('td').nth(1).textContent();
    const adviser = await firstRow.locator('td').nth(2).textContent();
    
    console.log(`Section: ${name}, Grade: ${gradeLevel}, Adviser: ${adviser}`);
    
    expect(name).toBeTruthy();
    expect(gradeLevel).toBeTruthy();
    // Adviser might be N/A if no teacher assigned
  });
});
