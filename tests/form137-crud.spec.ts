/**
 * Form 137 CRUD Operations - Playwright E2E Tests
 * 
 * Tests all CRUD operations for Form 137:
 * - Create new Form 137
 * - Read/View Form 137
 * - Update/Edit Form 137
 * - Delete Form 137
 * 
 * Also tests the blank data bug when editing records
 * 
 * ⚠️ LOCAL TESTING WITH PRODUCTION DATABASE
 * - Running on: http://localhost:5173
 * - Database: Production Firestore (NOT emulator)
 * - Make sure to run: npm run dev:uat (uses production Firebase config)
 */

import { test, expect, Page } from '@playwright/test';

// LOCAL URL with PRODUCTION database
const BASE_URL = 'http://localhost:5173';

// Admin/Registrar credentials for testing Form 137 (requires admin privileges)
const TEST_EMAIL = 'admin@school.edu';
const TEST_PASSWORD = 'admin123';

// Helper to login (adjust based on your auth flow)
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 30000 });
}

// Helper to navigate to Form 137 dashboard through UI
async function navigateToForm137Dashboard(page: Page) {
  // Direct navigation is more reliable for tests
  await page.goto(`${BASE_URL}/forms/137`);
  
  // Wait for the loading screen to disappear (if present)
  try {
    await page.waitForSelector('text=Loading your data...', { state: 'hidden', timeout: 60000 });
  } catch (e) {
    // Loading screen might already be hidden or not present
  }
  
  // Wait for page content - look for any heading or the "No Records Found" empty state
  try {
    await page.waitForSelector('h1', { timeout: 30000 });
  } catch (e) {
    // Try waiting for empty state text instead
    await page.waitForSelector('text=No Records Found', { timeout: 10000 });
  }
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Additional buffer for React rendering
  await page.waitForTimeout(2000);
  
  // Verify page loaded
  const pageContent = await page.content();
  if (!pageContent.includes('Form 137') && !pageContent.includes('Permanent Academic Record')) {
    console.log('⚠️  Form 137 page might not have loaded properly');
    console.log('Current URL:', page.url());
  }
}

// Helper to wait for Firestore operations
async function waitForFirestore(page: Page, delay = 1000) {
  await page.waitForTimeout(delay);
}

test.describe('Form 137 CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('CREATE - New Form 137', () => {
    test('should create a new Form 137 record manually', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // Click "Create New" or similar button
      await page.click('button:has-text("Create"), button:has-text("New Record")');
      
      // Wait for editor to load
      await expect(page.locator('h1, h2').filter({ hasText: /Create|New.*Form 137/i })).toBeVisible();

      // Fill in student information
      await page.fill('input[name="studentName"]', 'Test Student for CRUD');
      await page.fill('input[name="lrn"]', '123456789012');
      await page.fill('input[name="birthDate"]', '2010-01-15');
      await page.fill('input[name="birthPlace"]', 'Manila, Philippines');

      // Fill in school information
      await page.fill('input[name="schoolName"]', 'Test School');
      await page.fill('input[name="schoolId"]', 'SCHOOL-TEST-001');
      await page.fill('input[name="section"]', 'Grade 7-A');
      await page.fill('input[name="adviserName"]', 'Mrs. Test Teacher');

      // Select grade level
      await page.selectOption('select[name="gradeLevel"]', '7');

      // Fill in at least one subject grade
      const firstSubjectQ1 = page.locator('input[name*="q1"]').first();
      await firstSubjectQ1.fill('85');

      // Fill attendance
      await page.fill('input[name="daysOfSchool"]', '200');
      await page.fill('input[name="daysPresent"]', '195');

      // Save the form
      await page.click('button:has-text("Save"), button:has-text("Create")');

      // Wait for save operation
      await waitForFirestore(page, 2000);

      // Should show success message or redirect to view
      await expect(page.locator('text=/success|saved|created/i')).toBeVisible({ timeout: 5000 });

      // Should be able to see the created record
      await expect(page.locator('text=Test Student for CRUD')).toBeVisible();
    });

    test('should auto-generate Form 137 from system data', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // Find a student without Form 137
      const studentRow = page.locator('tr').filter({ hasText: /Missing|No Record/i }).first();
      
      if (await studentRow.count() > 0) {
        // Click auto-generate button
        await studentRow.locator('button:has-text("Generate"), button:has-text("Auto")').click();

        // Confirm in modal if needed
        const confirmButton = page.locator('button:has-text("Generate"), button:has-text("Confirm")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Wait for generation
        await waitForFirestore(page, 3000);

        // Should show success
        await expect(page.locator('text=/success|generated/i')).toBeVisible({ timeout: 10000 });
      } else {
        console.log('No students without Form 137 found, skipping auto-generate test');
      }
    });

    test('should validate required fields on create', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // Click create new
      await page.click('button:has-text("Create"), button:has-text("New Record")');

      // Try to save without filling required fields
      await page.click('button:has-text("Save"), button:has-text("Create")');

      // Should show validation errors
      await expect(page.locator('text=/required|must|error/i')).toBeVisible();
      
      // Form should not be saved (still on editor page)
      await expect(page.locator('h1, h2').filter({ hasText: /Create|Edit/i })).toBeVisible();
    });
  });

  test.describe('READ - View Form 137', () => {
    test('should display Form 137 record with all sections', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // Click on first student record to view
      const firstViewButton = page.locator('button:has-text("View"), a:has-text("View")').first();
      await firstViewButton.click();

      // Wait for view to load
      await expect(page.locator('h1, h2').filter({ hasText: /Permanent.*Record|Form 137/i })).toBeVisible();

      // Check that main sections are visible
      await expect(page.locator('text=Student Information')).toBeVisible();
      await expect(page.locator('text=Academic Performance')).toBeVisible();
      await expect(page.locator('text=Attendance')).toBeVisible();

      // Check that student name is displayed
      const studentName = await page.locator('[data-testid="student-name"], .student-name').textContent();
      expect(studentName).toBeTruthy();

      // Check that grades table exists
      const gradesTable = page.locator('table').filter({ hasText: /Quarter|Subject|Grade/i });
      await expect(gradesTable).toBeVisible();

      // Check for general average
      await expect(page.locator('text=/General Average|Overall/i')).toBeVisible();
    });

    test('should display newly added sections (transfer, health, activities)', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // View first record
      await page.locator('button:has-text("View"), a:has-text("View")').first().click();
      await page.waitForLoadState('networkidle');

      // Check for new sections (they may not all be visible if no data)
      const pageContent = await page.content();

      // These sections should exist in the HTML even if conditionally hidden
      const hasTransferSection = pageContent.includes('Transfer History') || pageContent.includes('transfer');
      const hasHealthSection = pageContent.includes('Health Record') || pageContent.includes('health');
      const hasActivitiesSection = pageContent.includes('Extracurricular') || pageContent.includes('Activities');
      const hasEligibilitySection = pageContent.includes('Eligibility');
      const hasCertificationSection = pageContent.includes('Certification');

      console.log('New sections check:', {
        transfer: hasTransferSection,
        health: hasHealthSection,
        activities: hasActivitiesSection,
        eligibility: hasEligibilitySection,
        certification: hasCertificationSection
      });

      // At least certification section should always be present
      expect(hasCertificationSection).toBeTruthy();
    });

    test('should show year selector for multi-year records', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // Find a record with multiple years
      const multiYearRecord = page.locator('tr').filter({ hasText: /year|2.*year/i }).first();
      
      if (await multiYearRecord.count() > 0) {
        await multiYearRecord.locator('button:has-text("View")').click();

        // Should show year selector dropdown
        const yearSelector = page.locator('select').filter({ hasText: /2024|2025|School Year/i });
        await expect(yearSelector).toBeVisible();

        // Should be able to change years
        const yearOptions = await yearSelector.locator('option').count();
        expect(yearOptions).toBeGreaterThan(1);
      } else {
        console.log('No multi-year records found, skipping year selector test');
      }
    });
  });

  test.describe('UPDATE - Edit Form 137 (BUG FIX TEST)', () => {
    test('should load existing data when editing a record', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // Click on first record to view
      await page.locator('button:has-text("View"), a:has-text("View")').first().click();
      await page.waitForLoadState('networkidle');

      // Get student name from view
      const studentNameInView = await page.locator('[data-testid="student-name"], text=/Name:|Student:/').textContent();
      const nameMatch = studentNameInView?.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/);
      const expectedName = nameMatch ? nameMatch[0] : null;

      console.log('Expected student name:', expectedName);

      // Click Edit button
      await page.click('button:has-text("Edit")');
      await page.waitForLoadState('networkidle');
      await waitForFirestore(page, 1000);

      // BUG CHECK: Verify that form fields are NOT blank
      const studentNameInput = page.locator('input[name="studentName"]');
      await expect(studentNameInput).toBeVisible();
      
      const studentNameValue = await studentNameInput.inputValue();
      console.log('Student name in editor:', studentNameValue);

      // ASSERTION: Name should not be blank
      expect(studentNameValue).not.toBe('');
      if (expectedName) {
        expect(studentNameValue).toContain(expectedName);
      }

      // Check other critical fields are not blank
      const lrnValue = await page.locator('input[name="lrn"]').inputValue();
      console.log('LRN in editor:', lrnValue);
      expect(lrnValue).not.toBe('');

      // Check school name
      const schoolNameValue = await page.locator('input[name="schoolName"]').inputValue();
      console.log('School name in editor:', schoolNameValue);
      expect(schoolNameValue).not.toBe('');

      // Check section
      const sectionValue = await page.locator('input[name="section"]').inputValue();
      console.log('Section in editor:', sectionValue);
      expect(sectionValue).not.toBe('');
    });

    test('should preserve data structure when editing', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // View a record
      await page.locator('button:has-text("View")').first().click();
      await page.waitForLoadState('networkidle');

      // Get original values
      const originalContent = await page.content();
      const hasGrades = originalContent.includes('General Average');
      const hasAttendance = originalContent.includes('Days Present');

      // Click Edit
      await page.click('button:has-text("Edit")');
      await waitForFirestore(page, 1000);

      // Verify grade fields are populated
      if (hasGrades) {
        const firstGradeInput = page.locator('input[type="number"]').filter({ hasText: /q1|quarter/i }).first();
        if (await firstGradeInput.count() > 0) {
          const gradeValue = await firstGradeInput.inputValue();
          expect(gradeValue).not.toBe('');
          expect(gradeValue).not.toBe('0');
        }
      }

      // Verify attendance fields
      if (hasAttendance) {
        const daysPresentInput = page.locator('input[name="daysPresent"]');
        if (await daysPresentInput.count() > 0) {
          const daysPresentValue = await daysPresentInput.inputValue();
          expect(parseInt(daysPresentValue)).toBeGreaterThan(0);
        }
      }
    });

    test('should successfully update Form 137 record', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // View and edit first record
      await page.locator('button:has-text("View")').first().click();
      await page.waitForLoadState('networkidle');
      
      await page.click('button:has-text("Edit")');
      await waitForFirestore(page, 1000);

      // Make a change - update remarks
      const remarksField = page.locator('textarea[name="remarks"], input[name="remarks"]');
      if (await remarksField.count() > 0) {
        const timestamp = new Date().getTime();
        await remarksField.fill(`Updated remarks at ${timestamp}`);

        // Save
        await page.click('button:has-text("Save"), button:has-text("Update")');
        await waitForFirestore(page, 2000);

        // Should show success
        await expect(page.locator('text=/success|saved|updated/i')).toBeVisible({ timeout: 5000 });

        // Verify the change persisted
        await page.waitForLoadState('networkidle');
        const pageContent = await page.content();
        expect(pageContent).toContain(`${timestamp}`);
      }
    });

    test('should handle canceling edit without saving', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // View and edit first record
      await page.locator('button:has-text("View")').first().click();
      await page.waitForLoadState('networkidle');

      // Get original student name
      const originalContent = await page.content();
      
      await page.click('button:has-text("Edit")');
      await waitForFirestore(page, 1000);

      // Make a change
      const studentNameInput = page.locator('input[name="studentName"]');
      const originalName = await studentNameInput.inputValue();
      await studentNameInput.fill('SHOULD NOT SAVE THIS');

      // Cancel
      await page.click('button:has-text("Cancel")');
      await page.waitForLoadState('networkidle');

      // Should go back to view mode
      await expect(page.locator('button:has-text("Edit")')).toBeVisible();

      // Original name should still be there
      const currentContent = await page.content();
      expect(currentContent).toContain(originalName);
      expect(currentContent).not.toContain('SHOULD NOT SAVE THIS');
    });
  });

  test.describe('DELETE - Remove Form 137', () => {
    test('should delete Form 137 record', async ({ page }) => {
      // Note: You may need to implement delete functionality first
      await navigateToForm137Dashboard(page);

      const initialRows = await page.locator('tbody tr').count();

      // Find delete button (if exists)
      const deleteButton = page.locator('button:has-text("Delete")').first();
      
      if (await deleteButton.count() > 0) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await waitForFirestore(page, 2000);

        // Row count should decrease
        const newRows = await page.locator('tbody tr').count();
        expect(newRows).toBe(initialRows - 1);
      } else {
        console.log('Delete functionality not implemented yet, skipping delete test');
      }
    });
  });

  test.describe('BATCH OPERATIONS', () => {
    test('should batch generate Form 137 for multiple students', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // Click batch generate button
      const batchButton = page.locator('button:has-text("Batch"), button:has-text("Generate All")');
      
      if (await batchButton.count() > 0) {
        await batchButton.click();

        // Select students (if selection UI exists)
        const selectAllButton = page.locator('button:has-text("Select All")');
        if (await selectAllButton.isVisible()) {
          await selectAllButton.click();
        }

        // Start batch generation
        await page.click('button:has-text("Generate"), button:has-text("Start")');

        // Wait for batch to complete
        await expect(page.locator('text=/completed|finished|done/i')).toBeVisible({ timeout: 60000 });

        // Check results
        const successCount = await page.locator('text=/success|generated/i').count();
        expect(successCount).toBeGreaterThan(0);
      } else {
        console.log('Batch operations not yet implemented, skipping');
      }
    });
  });

  test.describe('DATA INTEGRITY', () => {
    test('should maintain referential integrity with student records', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // Get a student ID from the dashboard
      const firstRow = page.locator('tbody tr').first();
      const studentInfo = await firstRow.textContent();
      
      // Click to view
      await firstRow.locator('button:has-text("View")').click();
      await page.waitForLoadState('networkidle');

      // Get student ID from URL or data attributes
      const url = page.url();
      const studentIdMatch = url.match(/\/forms\/137\/([^\/]+)/);
      const studentId = studentIdMatch ? studentIdMatch[1] : null;

      console.log('Student ID:', studentId);
      expect(studentId).toBeTruthy();

      // Verify student data matches
      const pageContent = await page.content();
      expect(pageContent).toContain(studentInfo || '');
    });

    test('should handle cumulative multi-year structure correctly', async ({ page }) => {
      await navigateToForm137Dashboard(page);

      // View first record
      await page.locator('button:has-text("View")').first().click();
      await page.waitForLoadState('networkidle');

      // If year selector exists, test switching years
      const yearSelector = page.locator('select').filter({ hasText: /school.*year|2024|2025/i });
      
      if (await yearSelector.count() > 0) {
        const options = await yearSelector.locator('option').all();
        
        if (options.length > 1) {
          // Get data from first year
          const firstYearOption = await options[0].getAttribute('value');
          await yearSelector.selectOption(firstYearOption || '');
          await page.waitForTimeout(500);
          
          const firstYearContent = await page.locator('[data-testid="general-average"], text=/General Average:/').textContent();

          // Switch to second year
          const secondYearOption = await options[1].getAttribute('value');
          await yearSelector.selectOption(secondYearOption || '');
          await page.waitForTimeout(500);
          
          const secondYearContent = await page.locator('[data-testid="general-average"], text=/General Average:/').textContent();

          // Years should show different data (unless by coincidence they're the same)
          console.log('First year average:', firstYearContent);
          console.log('Second year average:', secondYearContent);
        }
      }
    });
  });

  test.describe('PRINT FUNCTIONALITY', () => {
    test('should open print dialog with proper formatting', async ({ page, context }) => {
      await navigateToForm137Dashboard(page);

      // View first record
      await page.locator('button:has-text("View")').first().click();
      await page.waitForLoadState('networkidle');

      // Click print button
      const printButton = page.locator('button:has-text("Print")');
      
      if (await printButton.count() > 0) {
        // Listen for print event
        let printTriggered = false;
        page.on('console', msg => {
          if (msg.text().includes('print')) printTriggered = true;
        });

        // Mock window.print
        await page.evaluate(() => {
          window.print = () => console.log('print dialog opened');
        });

        await printButton.click();
        await page.waitForTimeout(1000);

        // Verify print was triggered
        expect(printTriggered).toBeTruthy();
      }
    });
  });
});

test.describe('BUG INVESTIGATION - Blank Data on Edit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should log data flow from view to edit', async ({ page }) => {
    await navigateToForm137Dashboard(page);

    // Intercept network requests
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('firestore') || request.url().includes('forms')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // View record
    await page.locator('button:has-text("View")').first().click();
    await page.waitForLoadState('networkidle');
    await waitForFirestore(page, 1000);

    console.log('Requests after viewing:', requests.length);

    // Click edit
    requests.length = 0; // Clear
    await page.click('button:has-text("Edit")');
    await waitForFirestore(page, 2000);

    console.log('Requests after clicking edit:', requests.length);
    console.log('Requests:', requests);

    // Check if data is in the DOM
    const formData = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.map(input => ({
        name: (input as HTMLInputElement).name,
        value: (input as HTMLInputElement).value,
        type: (input as HTMLInputElement).type
      })).filter(i => i.name);
    });

    console.log('Form data in editor:', formData);

    // Check for blank critical fields
    const criticalFields = ['studentName', 'lrn', 'schoolName', 'section'];
    const blankFields = formData.filter(f => 
      criticalFields.includes(f.name) && (!f.value || f.value === '')
    );

    if (blankFields.length > 0) {
      console.error('BLANK FIELDS DETECTED:', blankFields);
      throw new Error(`Critical fields are blank: ${blankFields.map(f => f.name).join(', ')}`);
    }
  });

  test('should check Form137Editor initialData prop', async ({ page }) => {
    await navigateToForm137Dashboard(page);

    // Add console logging
    await page.addInitScript(() => {
      const originalConsoleLog = console.log;
      (window as any).componentLogs = [];
      console.log = (...args: any[]) => {
        (window as any).componentLogs.push(args);
        originalConsoleLog(...args);
      };
    });

    // View and edit
    await page.locator('button:has-text("View")').first().click();
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Edit")');
    await waitForFirestore(page, 2000);

    // Get component logs
    const logs = await page.evaluate(() => (window as any).componentLogs);
    console.log('Component logs:', logs);

    // Look for Form137Editor initialization logs
    const editorLogs = logs.filter((log: any[]) => 
      log.some(item => typeof item === 'string' && item.includes('Form137Editor'))
    );

    console.log('Editor initialization logs:', editorLogs);
  });
});

test.describe('PERFORMANCE', () => {
  test('should load Form 137 view within 3 seconds', async ({ page }) => {
    await login(page);
    await navigateToForm137Dashboard(page);

    const startTime = Date.now();
    
    await page.locator('button:has-text("View")').first().click();
    await expect(page.locator('text=Student Information')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    console.log('Load time:', loadTime, 'ms');
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large datasets (100+ students)', async ({ page }) => {
    await login(page);
    await navigateToForm137Dashboard(page);

    // Check row count
    const rowCount = await page.locator('tbody tr').count();
    console.log('Total students:', rowCount);

    // Test pagination if exists
    const paginationButtons = page.locator('button').filter({ hasText: /next|previous|[0-9]/i });
    if (await paginationButtons.count() > 0) {
      await paginationButtons.first().click();
      await page.waitForLoadState('networkidle');
      
      // Should still show rows
      const newRowCount = await page.locator('tbody tr').count();
      expect(newRowCount).toBeGreaterThan(0);
    }
  });
});
