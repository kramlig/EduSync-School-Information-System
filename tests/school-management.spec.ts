import { test, expect } from '@playwright/test';
import {
  TEST_CONFIG,
  checkServerHealth,
  setupConsoleErrorListener,
} from './utils/test-helpers';

/**
 * School Management E2E Tests
 * 
 * Tests the School Management feature for super admins to manage multiple schools.
 * Follows EduSync Testing Standards (tests/TESTING_STANDARDS.md):
 * - Uses semantic selectors (getByRole, getByLabel, getByText)
 * - Implements AAA pattern (Arrange-Act-Assert)
 * - Verifies server health before running tests
 * - Monitors console errors during execution
 * - Uses proper timeouts and waits
 */

// Test users (seeded by emu-seed-and-admin.cjs)
const SUPER_ADMIN = {
  email: 'superadmin@test.com',
  password: 'TestPass123!'
};

const REGULAR_ADMIN = {
  email: 'default-admin@test.com',
  password: 'TestPass123!'
};

const TEST_SCHOOL = {
  name: 'Test Elementary School',
  code: `TES-${Date.now()}`, // Unique code per test run
  address: '123 Test Street, Test City',
  phone: '555-1234',
  email: 'test@school.edu',
  principalName: 'John Doe',
  adminEmail: `admin-test-${Date.now()}@school.edu`, // Unique email per test run
  adminPassword: 'TestPassword123!'
};

/**
 * Helper: Login as specified user
 * Follows standard login flow with proper waits
 */
async function loginAs(page: any, email: string, password: string): Promise<void> {
  console.log(`🔐 Logging in as: ${email}`);
  
  await page.goto('http://localhost:5173/admin');
  await page.waitForLoadState('domcontentloaded');
  
  // Fill login form using semantic selectors
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
  
  // Wait for navigation to complete - super admin redirects to root (/) which shows Dashboard
  await page.waitForURL(/.*\/$/, { timeout: TEST_CONFIG.NAVIGATION_TIMEOUT });
  
  // Verify login succeeded by checking for the greeting heading (h1 contains "Good morning/afternoon/evening, {name}!")
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /good (morning|afternoon|evening)/i }))
    .toBeVisible({ timeout: TEST_CONFIG.NAVIGATION_TIMEOUT });
  
  console.log(`✅ Login successful - Redirected to Dashboard at ${page.url()}`);
}

/**
 * Helper: Navigate to School Management page using client-side navigation
 * Clicking the link avoids full page reload which would reset auth state
 */
async function navigateToSchoolManagement(page: any): Promise<void> {
  console.log('📍 Navigating to School Management (client-side)...');
  
  // Click the School Management link in the sidebar to use React Router navigation
  const schoolMgmtLink = page.getByRole('link', { name: /school management/i });
  await expect(schoolMgmtLink).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
  await schoolMgmtLink.click();
  
  // Wait for the School Management heading to appear
  console.log('⏳ Waiting for School Management page to load (may take 30+ seconds for queries)...');
  
  // Wait for heading with extended timeout - loadSchools() queries all schools with student/teacher counts
  await expect(page.getByRole('heading', { name: /school management/i }))
    .toBeVisible({ timeout: 90000 }); // 90 seconds for slow emulator queries
  
  console.log('✅ Navigation successful - School Management page loaded');
}

test.describe('School Management - View and Navigation', () => {
  // ✅ STEP 1: Verify Prerequisites
  test.beforeAll(async () => {
    const serverUp = await checkServerHealth();
    if (!serverUp) {
      throw new Error('❌ Server is not running! Start with: npm run dev:emu');
    }
    console.log('✅ Server health check passed');
  });

  // ✅ STEP 2: Setup Each Test
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_CONFIG.PAGE_LOAD_TIMEOUT);
    
    // Track console errors AND all console logs (for debugging)
    setupConsoleErrorListener(page);
    page.on('console', msg => {
      if (msg.text().includes('[SchoolManagement]')) {
        console.log(`[BROWSER] ${msg.text()}`);
      }
    });
    
    // ARRANGE: Login and navigate
    await loginAs(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
    await navigateToSchoolManagement(page);
  });

  test('should display all schools with statistics', async ({ page }) => {
    // ARRANGE: Page is already loaded via beforeEach
    console.log('🧪 Testing: Display all schools with statistics');
    
    // ACT & ASSERT: Verify heading
    await expect(page.getByRole('heading', { name: /school management/i })).toBeVisible();
    
    // ASSERT: Verify at least 3 seeded schools are displayed (may have more from previous test runs)
    const viewDetailsButtons = page.getByRole('button', { name: /view details/i });
    const buttonCount = await viewDetailsButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(3);
    
    // ASSERT: Verify specific school appears - use heading role to avoid matching sidebar/header
    await expect(page.getByRole('heading', { name: 'Default School' })).toBeVisible();
    
    // ASSERT: Verify statistics are shown - look for the number and label separately
    await expect(page.locator('text=48').first()).toBeVisible(); // Student count for Default School
    await expect(page.getByText('Students').first()).toBeVisible(); // "Students" label
    await expect(page.locator('text=10').first()).toBeVisible(); // Teacher count
    await expect(page.getByText('Teachers').first()).toBeVisible(); // "Teachers" label
    
    // ASSERT: Verify create button exists
    await expect(page.getByRole('button', { name: /create new school/i })).toBeVisible();
    
    console.log('✅ Test passed: All schools displayed with statistics');
  });

  test('should open and display school details modal', async ({ page }) => {
    // ARRANGE: Page is already loaded via beforeEach
    console.log('🧪 Testing: Open school details modal');
    
    // ACT: Click View Details button
    await page.getByRole('button', { name: /view details/i }).first().click();
    
    // ASSERT: Verify modal content is visible (labels without colons)
    await expect(page.getByText('School Code')).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    await expect(page.getByText('Status').first()).toBeVisible(); // Use .first() - appears in card and modal
    await expect(page.getByText('Address').first()).toBeVisible();
    await expect(page.getByText('Phone').first()).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Principal').first()).toBeVisible();
    await expect(page.getByText('Statistics')).toBeVisible();
    
    // ACT: Close modal
    await page.getByRole('button', { name: /close/i }).click();
    
    // ASSERT: Modal is closed
    await expect(page.getByText(/school code:/i)).not.toBeVisible();
    
    console.log('✅ Test passed: School details modal works correctly');
  });
});

test.describe('School Management - Edit Functionality', () => {
  test.beforeAll(async () => {
    const serverUp = await checkServerHealth();
    if (!serverUp) {
      throw new Error('❌ Server is not running! Start with: npm run dev:emu');
    }
    console.log('✅ Server health check passed');
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_CONFIG.PAGE_LOAD_TIMEOUT);
    setupConsoleErrorListener(page);
    await loginAs(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
    await navigateToSchoolManagement(page);
  });

  test('should open edit modal with pre-populated data', async ({ page }) => {
    // ARRANGE: Page loaded via beforeEach
    console.log('🧪 Testing: Open edit modal with pre-populated data');
    
    // ACT: Click Edit button
    await page.getByRole('button', { name: /^edit$/i }).first().click();
    
    // ASSERT: Modal opened with correct title
    await expect(page.getByRole('heading', { name: /edit school/i }))
      .toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    // ASSERT: Form fields are populated (not empty)
    await expect(page.getByLabel(/school name/i)).not.toBeEmpty();
    await expect(page.getByLabel(/school code/i)).not.toBeEmpty();
    await expect(page.getByLabel(/address/i)).not.toBeEmpty();
    
    // ASSERT: Action buttons exist
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /update school/i })).toBeVisible();
    
    console.log('✅ Test passed: Edit modal opens with pre-populated data');
  });

  test('should successfully update school information', async ({ page }) => {
    // ARRANGE: Test data
    console.log('🧪 Testing: Update school information');
    const updatedAddress = '999 Updated Street, New City';
    const updatedPhone = '555-9999';
    
    // ACT: Open edit modal
    await page.getByRole('button', { name: /^edit$/i }).first().click();
    await expect(page.getByRole('button', { name: /update school/i }))
      .toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    // ACT: Update fields
    await page.getByLabel(/address/i).clear();
    await page.getByLabel(/address/i).fill(updatedAddress);
    await page.getByLabel(/phone/i).clear();
    await page.getByLabel(/phone/i).fill(updatedPhone);
    
    // ACT: Submit update
    await page.getByRole('button', { name: /update school/i }).click();
    
    // ASSERT: Modal closes after successful update
    await expect(page.getByRole('heading', { name: /edit school/i }))
      .not.toBeVisible({ timeout: TEST_CONFIG.NAVIGATION_TIMEOUT });
    
    // ASSERT: Verify update succeeded by checking details
    await page.getByRole('button', { name: /view details/i }).first().click();
    await expect(page.getByText(updatedAddress).first())
      .toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    console.log('✅ Test passed: School information updated successfully');
  });

  test('should validate required fields on update', async ({ page }) => {
    // ARRANGE: Open edit modal
    console.log('🧪 Testing: Required field validation on update');
    
    await page.getByRole('button', { name: /^edit$/i }).first().click();
    await expect(page.getByRole('button', { name: /update school/i }))
      .toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    // ACT: Clear required field (school name)
    await page.getByLabel(/school name/i).clear();
    
    // ACT: Try to submit
    await page.getByRole('button', { name: /update school/i }).click();
    
    // ASSERT: Modal remains open (validation failed)
    await expect(page.getByRole('heading', { name: /edit school/i })).toBeVisible();
    
    console.log('✅ Test passed: Required field validation works');
  });

  test('should cancel edit without saving changes', async ({ page }) => {
    // ARRANGE: Open edit modal
    console.log('🧪 Testing: Cancel edit without saving');
    
    await page.getByRole('button', { name: /^edit$/i }).first().click();
    await expect(page.getByRole('button', { name: /update school/i }))
      .toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    // ACT: Make changes
    await page.getByLabel(/address/i).fill('Changed Address');
    
    // ACT: Cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // ASSERT: Modal closed
    await expect(page.getByRole('heading', { name: /edit school/i })).not.toBeVisible();
    
    // ASSERT: Changes were not saved
    await page.getByRole('button', { name: /view details/i }).first().click();
    await expect(page.getByText('Changed Address'))
      .not.toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    console.log('✅ Test passed: Cancel works without saving changes');
  });
});

test.describe('School Management - Create Functionality', () => {
  test.beforeAll(async () => {
    const serverUp = await checkServerHealth();
    if (!serverUp) {
      throw new Error('❌ Server is not running! Start with: npm run dev:emu');
    }
    console.log('✅ Server health check passed');
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_CONFIG.PAGE_LOAD_TIMEOUT);
    setupConsoleErrorListener(page);
    await loginAs(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
    await navigateToSchoolManagement(page);
  });

  test('should open create school modal', async ({ page }) => {
    // ARRANGE: Page loaded via beforeEach
    console.log('🧪 Testing: Open create school modal');
    
    // ACT: Click Create New School button
    await page.getByRole('button', { name: /create new school/i }).click();
    
    // ASSERT: Modal opened
    await expect(page.getByRole('heading', { name: /create new school/i }))
      .toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    // ASSERT: All form fields exist
    await expect(page.getByLabel(/school name/i)).toBeVisible();
    await expect(page.getByLabel(/school code/i)).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible(); // School email (exact match)
    await expect(page.getByLabel(/admin email/i)).toBeVisible(); // Admin email
    await expect(page.getByLabel(/principal name/i)).toBeVisible();
    await expect(page.getByLabel(/admin password/i)).toBeVisible();
    
    // ASSERT: Action buttons exist
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create school/i })).toBeVisible();
    
    console.log('✅ Test passed: Create school modal opens correctly');
  });

  test('should successfully create a new school', async ({ page }) => {
    // ARRANGE: Test data defined in TEST_SCHOOL constant
    console.log('🧪 Testing: Create a new school');
    
    // ACT: Open create modal
    await page.getByRole('button', { name: /create new school/i }).click();
    await expect(page.getByRole('heading', { name: /create new school/i }))
      .toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    // ACT: Fill form with test data
    await page.getByLabel(/school name/i).fill(TEST_SCHOOL.name);
    await page.getByLabel(/school code/i).fill(TEST_SCHOOL.code);
    await page.getByLabel(/address/i).fill(TEST_SCHOOL.address);
    await page.getByLabel(/phone/i).fill(TEST_SCHOOL.phone);
    await page.getByLabel('Email', { exact: true }).fill(TEST_SCHOOL.email); // School email
    await page.getByLabel(/admin email/i).fill(TEST_SCHOOL.adminEmail); // Admin email  
    await page.getByLabel(/principal name/i).fill(TEST_SCHOOL.principalName);
    await page.getByLabel(/admin password/i).fill(TEST_SCHOOL.adminPassword);
    
    // ACT: Submit
    await page.getByRole('button', { name: /create school/i }).click();
    
    // ASSERT: Modal closes after successful creation
    await expect(page.getByRole('heading', { name: /create new school/i }))
      .not.toBeVisible({ timeout: TEST_CONFIG.NAVIGATION_TIMEOUT });
    
    // ASSERT: New school appears in list
    await expect(page.getByText(TEST_SCHOOL.name).first())
      .toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });

    // Note: Not asserting school count since it can vary between test runs

    console.log('✅ Test passed: New school created successfully');
  });  test('should validate required fields on create', async ({ page }) => {
    // ARRANGE: Open create modal
    console.log('🧪 Testing: Required field validation on create');
    
    await page.getByRole('button', { name: /create new school/i }).click();
    
    // ACT: Try to submit empty form
    await page.getByRole('button', { name: /create school/i }).click();
    
    // ASSERT: Modal remains visible (validation failed)
    await expect(page.getByRole('heading', { name: /create new school/i })).toBeVisible();
    
    console.log('✅ Test passed: Required field validation works on create');
  });
});

test.describe('School Management - Access Control', () => {
  test.beforeAll(async () => {
    const serverUp = await checkServerHealth();
    if (!serverUp) {
      throw new Error('❌ Server is not running! Start with: npm run dev:emu');
    }
    console.log('✅ Server health check passed');
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_CONFIG.PAGE_LOAD_TIMEOUT);
    setupConsoleErrorListener(page);
  });

  test('should not show School Management link to regular admin', async ({ page }) => {
    // ARRANGE & ACT: Login as regular admin
    console.log('🧪 Testing: Access control - regular admin cannot see link');
    await loginAs(page, REGULAR_ADMIN.email, REGULAR_ADMIN.password);
    
    // ASSERT: School Management link should NOT be visible in navigation
    await expect(page.getByRole('link', { name: /school management/i })).not.toBeVisible();
    
    console.log('✅ Test passed: Regular admin cannot see School Management link');
  });

  test('should prevent direct URL access for non-super-admin', async ({ page }) => {
    // ARRANGE: Login as regular admin
    console.log('🧪 Testing: Access control - regular admin cannot access URL directly');
    await loginAs(page, REGULAR_ADMIN.email, REGULAR_ADMIN.password);
    
    // ACT: Try to navigate directly to school-management URL
    await page.goto('http://localhost:5173/admin/school-management');
    
    // ASSERT: Should not see School Management heading (redirected or blocked)
    await expect(page.getByRole('heading', { name: /^school management$/i }))
      .not.toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    console.log('✅ Test passed: Regular admin cannot access School Management directly');
  });
});
