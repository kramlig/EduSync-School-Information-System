/**
 * EduSync Testing Utilities
 * 
 * Standardized helpers for E2E testing with Playwright
 */

import { Page, expect } from '@playwright/test';

/**
 * Test Configuration & Constants
 */
export const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5173',
  EMULATOR_URL: 'http://localhost:5173',
  FIRESTORE_EMULATOR: 'localhost:8086',
  AUTH_EMULATOR: 'localhost:9100',
  
  // Default credentials
  ADMIN_EMAIL: 'admin@edusync.local',
  ADMIN_PASSWORD: 'admin123',
  
  // Timeouts
  PAGE_LOAD_TIMEOUT: 30000,
  ELEMENT_TIMEOUT: 10000,
  NAVIGATION_TIMEOUT: 15000,
  
  // Waits
  SHORT_WAIT: 500,
  MEDIUM_WAIT: 1000,
  LONG_WAIT: 5000, // Increased for Firestore data loading
} as const;

/**
 * Health Check: Verify server is running
 */
export async function checkServerHealth(baseUrl: string = TEST_CONFIG.BASE_URL): Promise<boolean> {
  try {
    const response = await fetch(baseUrl, { method: 'HEAD' });
    return response.ok || response.status === 304;
  } catch (error) {
    console.error('❌ Server health check failed:', error);
    return false;
  }
}

/**
 * Health Check: Verify Firebase emulators are running
 */
export async function checkEmulatorsHealth(): Promise<{
  firestore: boolean;
  auth: boolean;
}> {
  const firestoreCheck = async () => {
    try {
      const response = await fetch(`http://${TEST_CONFIG.FIRESTORE_EMULATOR}`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const authCheck = async () => {
    try {
      const response = await fetch(`http://${TEST_CONFIG.AUTH_EMULATOR}`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const [firestore, auth] = await Promise.all([firestoreCheck(), authCheck()]);
  
  return { firestore, auth };
}

/**
 * Login Helper: Authenticate with admin credentials
 */
export async function loginAsAdmin(
  page: Page,
  email: string = TEST_CONFIG.ADMIN_EMAIL,
  password: string = TEST_CONFIG.ADMIN_PASSWORD
): Promise<void> {
  console.log('🔐 Logging in as admin...');
  
  await page.goto(TEST_CONFIG.BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(TEST_CONFIG.MEDIUM_WAIT);
  
  // Check if already logged in by looking for dashboard elements
  const isDashboard = await page.locator('text=/dashboard|welcome|overview/i').first().isVisible().catch(() => false);
  
  if (isDashboard) {
    console.log('ℹ️  Already logged in, skipping login step');
    return;
  }
  
  // Navigate to login page if not there
  console.log('⚠️  Not on login page and not logged in - navigating to login');
  await page.goto(`${TEST_CONFIG.BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000); // Wait for Firebase to initialize
  
  // Fill login form with improved selectors
  console.log(`   Email: ${email}`);
  const emailInput = page.locator('input[type="email"], input[placeholder*="mail" i], input[name*="email" i]').first();
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i], input[name*="password" i]').first();
  const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
  
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.waitForTimeout(TEST_CONFIG.SHORT_WAIT);
  
  console.log('   Clicking Sign In button...');
  await signInButton.click();
  
  // Wait for navigation and verify login success
  console.log('   Waiting for authentication...');
  await page.waitForTimeout(5000); // Wait for Firebase auth to complete
  
  // Verify we're no longer on login page
  const stillOnLogin = await emailInput.isVisible().catch(() => false);
  if (stillOnLogin) {
    throw new Error('❌ Login failed - still on login page. Check credentials or Firebase emulator.');
  }
  
  console.log('✅ Logged in successfully');
}

/**
 * Navigate to specific route with verification
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  const url = `${TEST_CONFIG.BASE_URL}${path}`;
  console.log(`📍 Navigating to: ${path}`);
  
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(TEST_CONFIG.SHORT_WAIT);
  
  // Verify URL
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')));
  console.log('✅ Navigation successful');
}

/**
 * Searchable Dropdown Helper: Search and select student
 */
export async function searchAndSelectStudent(
  page: Page,
  studentName: string,
  dropdownSelector?: string
): Promise<void> {
  console.log(`🔍 Searching for student: ${studentName}`);
  
  // Find the search input (use custom selector or default)
  const searchInput = dropdownSelector 
    ? page.locator(dropdownSelector)
    : page.getByPlaceholder(/search student|select student|search/i).first();
  
  await expect(searchInput).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
  
  // Clear and search
  await searchInput.click();
  await searchInput.clear();
  await searchInput.fill(studentName);
  await page.waitForTimeout(TEST_CONFIG.MEDIUM_WAIT);
  
  // Wait for results
  const hasResults = await page.locator('[role="option"], .student-option, .dropdown-item')
    .filter({ hasText: new RegExp(studentName, 'i') })
    .first()
    .isVisible()
    .catch(() => false);
  
  if (!hasResults) {
    throw new Error(`No results found for student: ${studentName}`);
  }
  
  // Select with Enter key
  await searchInput.press('Enter');
  await page.waitForTimeout(TEST_CONFIG.LONG_WAIT);
  
  console.log(`✅ Student selected: ${studentName}`);
}

/**
 * Form Fill Helper: Fill input by label or name
 */
export async function fillFormField(
  page: Page,
  fieldLabel: string,
  value: string | number,
  options?: { isNumber?: boolean; exactMatch?: boolean }
): Promise<void> {
  const valueStr = value.toString();
  
  let input;
  if (options?.exactMatch) {
    input = page.getByLabel(fieldLabel, { exact: true }).first();
  } else {
    input = page.getByLabel(new RegExp(fieldLabel, 'i')).first();
  }
  
  // Fallback to name attribute
  if (!(await input.isVisible().catch(() => false))) {
    const normalizedName = fieldLabel.toLowerCase().replace(/\s+/g, '-');
    input = page.locator(`input[name*="${normalizedName}"]`).first();
  }
  
  await expect(input).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
  await input.fill(valueStr);
  
  // Verify value was set
  const inputValue = await input.inputValue();
  expect(inputValue).toBe(valueStr);
}

/**
 * Verify Text Exists on Page
 */
export async function verifyTextExists(
  page: Page,
  text: string | RegExp,
  options?: { timeout?: number; caseSensitive?: boolean }
): Promise<void> {
  const pattern = typeof text === 'string' 
    ? new RegExp(text, options?.caseSensitive ? '' : 'i')
    : text;
  
  const element = page.locator(`text=${pattern}`).first();
  await expect(element).toBeVisible({ 
    timeout: options?.timeout || TEST_CONFIG.ELEMENT_TIMEOUT 
  });
}

/**
 * Wait for Success Message
 */
export async function waitForSuccessMessage(
  page: Page,
  message?: string | RegExp
): Promise<void> {
  const pattern = message 
    ? (typeof message === 'string' ? new RegExp(message, 'i') : message)
    : /saved successfully|success|created|updated/i;
  
  const successElement = page.locator(`text=${pattern}`).first();
  await expect(successElement).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
  console.log('✅ Success message displayed');
}

/**
 * Screenshot Helper: Capture screenshot with auto-naming
 */
export async function captureScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean }
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot-${name}-${timestamp}.png`;
  
  await page.screenshot({
    path: `test-results/${filename}`,
    fullPage: options?.fullPage || false,
  });
  
  console.log(`📸 Screenshot saved: ${filename}`);
}

/**
 * Console Error Listener: Track console errors during test
 */
export function setupConsoleErrorListener(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.warn('⚠️  Console error:', msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.error('❌ Page error:', error.message);
  });
  
  return errors;
}

/**
 * Clear All Form Inputs
 */
export async function clearAllFormInputs(page: Page): Promise<void> {
  const inputs = await page.locator('input[type="text"], input[type="number"], textarea').all();
  
  for (const input of inputs) {
    if (await input.isVisible().catch(() => false)) {
      await input.clear();
    }
  }
  
  console.log('🧹 All form inputs cleared');
}

/**
 * Select Dropdown Option
 */
export async function selectDropdownOption(
  page: Page,
  selectSelector: string | RegExp,
  optionValue: string
): Promise<void> {
  const select = typeof selectSelector === 'string'
    ? page.locator(selectSelector)
    : page.locator('select').filter({ hasText: selectSelector }).first();
  
  await expect(select).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
  await select.selectOption(optionValue);
  
  console.log(`✅ Selected option: ${optionValue}`);
}

/**
 * Verify Element Count
 */
export async function verifyElementCount(
  page: Page,
  selector: string,
  expectedCount: number,
  options?: { operator?: 'exactly' | 'atLeast' | 'atMost' }
): Promise<void> {
  const elements = page.locator(selector);
  const actualCount = await elements.count();
  
  const operator = options?.operator || 'exactly';
  
  switch (operator) {
    case 'exactly':
      expect(actualCount).toBe(expectedCount);
      break;
    case 'atLeast':
      expect(actualCount).toBeGreaterThanOrEqual(expectedCount);
      break;
    case 'atMost':
      expect(actualCount).toBeLessThanOrEqual(expectedCount);
      break;
  }
  
  console.log(`✅ Element count verified: ${actualCount} ${operator} ${expectedCount}`);
}

/**
 * Keyboard Navigation Helper
 */
export async function navigateWithKeyboard(
  page: Page,
  element: any,
  keys: string[]
): Promise<void> {
  for (const key of keys) {
    await element.press(key);
    await page.waitForTimeout(TEST_CONFIG.SHORT_WAIT);
  }
  
  console.log(`⌨️  Keyboard navigation: ${keys.join(' → ')}`);
}
