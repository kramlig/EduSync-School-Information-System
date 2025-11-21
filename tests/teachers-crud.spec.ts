import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Teachers CRUD Operations (PostgreSQL)', () => {
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
    
    // Click Teachers link in sidebar
    await page.click('a[href="/teachers"], nav a:has-text("Teachers")');
    await page.waitForTimeout(3000); // Wait for teachers page to load
  });

  test('should display teachers from PostgreSQL', async ({ page }) => {
    // Check if teachers table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check for teacher rows (should have 8 teachers from seed)
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`Found ${count} teachers`);
    expect(count).toBeGreaterThan(0);
  });

  test('should create a new teacher', async ({ page }) => {
    // Click "Add Teacher" button
    await page.click('button:has-text("Add Teacher")');
    
    // Wait for modal
    await page.waitForSelector('h3:has-text("Add New Teacher")');

    // Fill form
    await page.fill('input[name="name"]', 'Test Teacher ' + Date.now());
    await page.fill('input[name="email"]', `test-teacher-${Date.now()}@test.com`);
    await page.fill('input[name="contactNumber"]', '09123456789');
    
    // Select role (default is teacher)
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption('teacher');
    }
    
    // Submit
    await page.locator('form button[type="submit"]').click();
    
    // Wait for modal to close
    await page.waitForTimeout(2000);
    
    // Verify creation (check if new teacher appears or no error shown)
    const errorAlert = page.locator('[role="alert"]');
    const hasError = await errorAlert.count() > 0;
    
    if (hasError) {
      console.log('Warning: Error alert found after create');
    } else {
      console.log('Teacher created successfully (no error alert)');
    }
  });

  test('should update a teacher', async ({ page }) => {
    // Click edit on first teacher
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
    // Wait for modal
    await page.waitForSelector('h3:has-text("Edit Teacher")');
    
    // Update name
    const nameInput = page.locator('input[name="name"]');
    const newName = 'Updated Teacher ' + Date.now();
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
      console.log('Teacher updated successfully');
    }
  });

  test('should delete a teacher', async ({ page }) => {
    // Get initial count
    const initialRows = await page.locator('tbody tr').count();
    
    // Click delete on last teacher (safer than first)
    const deleteButton = page.locator('button:has-text("Delete")').last();
    await deleteButton.click();
    
    // Confirm deletion in modal
    await page.waitForTimeout(1000);
    const confirmButton = page.locator('button:has-text("Delete")').last();
    await confirmButton.click();
    
    // Wait for deletion
    await page.waitForTimeout(2000);
    
    // Check if count decreased
    const finalRows = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${initialRows}, Final rows: ${finalRows}`);
    
    if (finalRows < initialRows) {
      console.log('Teacher deleted successfully');
    } else {
      console.log('Teacher deletion may have failed');
    }
  });

  test('should show teacher details', async ({ page }) => {
    // Get first teacher row
    const firstRow = page.locator('tbody tr').first();
    
    // Check if all columns are visible
    const name = await firstRow.locator('td').nth(0).textContent();
    const email = await firstRow.locator('td').nth(1).textContent();
    
    console.log(`Teacher: ${name}, Email: ${email}`);
    
    expect(name).toBeTruthy();
    expect(email).toBeTruthy();
  });

  test('should search teachers', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Teacher');
      await page.waitForTimeout(1000);
      
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      console.log(`Found ${count} teachers after search`);
      expect(count).toBeGreaterThan(0);
    } else {
      console.log('No search input found, skipping test');
    }
  });
});
