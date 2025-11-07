import { test, expect, type Page } from '@playwright/test';

/**
 * Custom Claims & Security Rules E2E Tests
 * 
 * Tests that verify:
 * 1. Users can log in successfully
 * 2. Custom claims (roles) are properly set
 * 3. Security rules work correctly based on roles
 * 4. No "Property role is undefined" errors occur
 * 
 * Prerequisites:
 * - Firebase emulators running (npm run dev:emu)
 * - Database seeded with test users
 * - Custom claims set for all users
 */

const ADMIN_CREDENTIALS = {
  email: 'admin@edusync.local',
  password: 'admin123'
};

const PARENT_CREDENTIALS = {
  email: 'juan.garcia@test.com',
  password: 'parent123'
};

/**
 * Helper: Login and wait for navigation
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/');
  
  // Wait for login form
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
}

/**
 * Helper: Check for console errors
 */
function setupConsoleErrorCapture(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known non-critical errors
      if (!text.includes('ResizeObserver') && 
          !text.includes('favicon')) {
        errors.push(text);
      }
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  return errors;
}

test.describe('Custom Claims & Security Rules', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Clear any existing auth state
    await context.clearCookies();
    // Navigate to app to ensure localStorage is accessible
    await page.goto('/');
    try {
      await page.evaluate(() => localStorage.clear());
    } catch (e) {
      // Ignore localStorage errors - context isolation handles this
    }
  });

  test('Admin can log in without role errors', async ({ page }) => {
    const errors = setupConsoleErrorCapture(page);
    
    // Login as admin
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 15000 });
    
    // Check for role-related errors
    const roleErrors = errors.filter(err => 
      err.includes('Property role is undefined') ||
      err.includes('role is undefined')
    );
    
    expect(roleErrors).toHaveLength(0);
    
    // Verify URL changed (successful login)
    const url = page.url();
    expect(url).not.toContain('/login');
    
    console.log('✅ Admin logged in successfully without role errors');
  });

  test('Admin has correct custom claims in token', async ({ page }) => {
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForSelector('text=Dashboard', { timeout: 15000 });
    
    // Check custom claims in token
    const claims = await page.evaluate(async () => {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return null;
      
      const tokenResult = await user.getIdTokenResult();
      return tokenResult.claims;
    });
    
    expect(claims).toBeTruthy();
    expect(claims?.role).toBe('admin');
    expect(claims?.schoolId).toBe('default');
    
    console.log('✅ Admin has correct custom claims:', claims);
  });

  test('Admin can access students list', async ({ page }) => {
    const errors = setupConsoleErrorCapture(page);
    
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    
    // Navigate to students
    await page.click('text=Students');
    await page.waitForLoadState('networkidle');
    
    // Wait for students to load
    await page.waitForSelector('[data-testid="student-list"], .student-card, text=No students found', { 
      timeout: 15000 
    });
    
    // Check for security errors
    const securityErrors = errors.filter(err => 
      err.includes('permission-denied') ||
      err.includes('Property role is undefined') ||
      err.includes('Missing or insufficient permissions')
    );
    
    expect(securityErrors).toHaveLength(0);
    
    console.log('✅ Admin can access students without errors');
  });

  test('Admin can access attendance records', async ({ page }) => {
    const errors = setupConsoleErrorCapture(page);
    
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    
    // Navigate to attendance
    await page.click('text=Attendance');
    await page.waitForLoadState('networkidle');
    
    // Wait for attendance view to load
    await page.waitForSelector('[data-testid="attendance-view"], text=Attendance, text=No records found', { 
      timeout: 15000 
    });
    
    // Check specifically for the attendance records errors
    const attendanceErrors = errors.filter(err => 
      (err.includes('Property role is undefined') && err.includes('L152')) ||
      (err.includes('Property role is undefined') && err.includes('L155')) ||
      (err.includes('false for') && err.includes('L463'))
    );
    
    expect(attendanceErrors).toHaveLength(0);
    
    console.log('✅ Admin can access attendance records without errors');
  });

  test('Admin can access grades', async ({ page }) => {
    const errors = setupConsoleErrorCapture(page);
    
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    
    // Navigate to grades
    await page.click('text=Grades');
    await page.waitForLoadState('networkidle');
    
    // Wait for grades view to load
    await page.waitForSelector('text=Grades, text=Grade, text=No grades found', { 
      timeout: 15000 
    });
    
    // Check for security errors
    const securityErrors = errors.filter(err => 
      err.includes('permission-denied') ||
      err.includes('Property role is undefined')
    );
    
    expect(securityErrors).toHaveLength(0);
    
    console.log('✅ Admin can access grades without errors');
  });

  test('Admin can access teachers list', async ({ page }) => {
    const errors = setupConsoleErrorCapture(page);
    
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    
    // Navigate to teachers
    await page.click('text=Teachers');
    await page.waitForLoadState('networkidle');
    
    // Wait for teachers to load
    await page.waitForSelector('[data-testid="teacher-list"], text=Teacher, text=No teachers found', { 
      timeout: 15000 
    });
    
    // Check for security errors
    const securityErrors = errors.filter(err => 
      err.includes('permission-denied') ||
      err.includes('Property role is undefined')
    );
    
    expect(securityErrors).toHaveLength(0);
    
    console.log('✅ Admin can access teachers without errors');
  });

  test('Parent can log in and access their data', async ({ page }) => {
    const errors = setupConsoleErrorCapture(page);
    
    await login(page, PARENT_CREDENTIALS.email, PARENT_CREDENTIALS.password);
    
    // Wait for parent dashboard/portal
    await page.waitForSelector('text=Parent, text=Student, text=Dashboard', { 
      timeout: 15000 
    });
    
    // Check for role-related errors
    const roleErrors = errors.filter(err => 
      err.includes('Property role is undefined')
    );
    
    expect(roleErrors).toHaveLength(0);
    
    console.log('✅ Parent logged in successfully without role errors');
  });

  test('Parent has correct custom claims in token', async ({ page }) => {
    await login(page, PARENT_CREDENTIALS.email, PARENT_CREDENTIALS.password);
    await page.waitForLoadState('networkidle');
    
    // Check custom claims in token
    const claims = await page.evaluate(async () => {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return null;
      
      const tokenResult = await user.getIdTokenResult();
      return tokenResult.claims;
    });
    
    expect(claims).toBeTruthy();
    expect(claims?.role).toBe('parent');
    
    console.log('✅ Parent has correct custom claims:', claims);
  });

  test('No security rule errors across all main views', async ({ page }) => {
    const allErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      allErrors.push(error.message);
    });
    
    // Login as admin
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForSelector('text=Dashboard', { timeout: 15000 });
    
    // Navigate through all main views
    const views = [
      { name: 'Students', selector: 'text=Students' },
      { name: 'Teachers', selector: 'text=Teachers' },
      { name: 'Grades', selector: 'text=Grades' },
      { name: 'Attendance', selector: 'text=Attendance' },
    ];
    
    for (const view of views) {
      console.log(`Checking ${view.name}...`);
      
      try {
        await page.click(view.selector);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for data to load
      } catch (err) {
        console.warn(`Could not navigate to ${view.name}:`, err);
      }
    }
    
    // Filter for critical security errors
    const securityErrors = allErrors.filter(err => 
      err.includes('Property role is undefined') ||
      err.includes('permission-denied') ||
      err.includes('Missing or insufficient permissions') ||
      (err.includes('false for') && err.includes('@ L'))
    );
    
    if (securityErrors.length > 0) {
      console.error('❌ Security errors found:');
      securityErrors.forEach(err => console.error('  -', err));
    }
    
    expect(securityErrors).toHaveLength(0);
    
    console.log('✅ No security rule errors across all views');
  });

  test('Token refresh maintains claims', async ({ page }) => {
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForSelector('text=Dashboard', { timeout: 15000 });
    
    // Get initial claims
    const initialClaims = await page.evaluate(async () => {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return null;
      const tokenResult = await user.getIdTokenResult();
      return tokenResult.claims;
    });
    
    expect(initialClaims?.role).toBe('admin');
    
    // Force token refresh
    await page.evaluate(async () => {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await user.getIdToken(true); // Force refresh
      }
    });
    
    // Get refreshed claims
    const refreshedClaims = await page.evaluate(async () => {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return null;
      const tokenResult = await user.getIdTokenResult();
      return tokenResult.claims;
    });
    
    expect(refreshedClaims?.role).toBe('admin');
    expect(refreshedClaims?.schoolId).toBe('default');
    
    console.log('✅ Token refresh maintains custom claims');
  });
});

test.describe('Error Recovery', () => {
  
  test('Login shows clear error message on invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[type="email"]');
    
    // Try invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=Invalid, text=error, text=failed', { timeout: 5000 });
    
    console.log('✅ Invalid credentials show proper error message');
  });

  test('Page handles logout correctly', async ({ page }) => {
    // Login first
    await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForSelector('text=Dashboard', { timeout: 15000 });
    
    // Logout
    await page.click('[aria-label="Logout"], button:has-text("Logout"), text=Sign Out');
    
    // Wait for redirect to login
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Verify we're on login page
    const url = page.url();
    expect(url).toContain('login');
    
    console.log('✅ Logout redirects to login page');
  });
});
