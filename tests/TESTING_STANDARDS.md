# EduSync Testing Standards & Guidelines

## 🎯 Testing Philosophy

> **"If you didn't test it, it doesn't work."**

All features must have automated E2E tests. Manual testing is only for exploratory testing and UX evaluation.

---

## 📋 Pre-Test Checklist (MANDATORY)

Before running ANY test, verify:

### ⚠️ **CRITICAL RULE #1: NEVER TOUCH THE SERVER TERMINAL!** 🚨

**🔴 GOLDEN RULE: Once `npm run dev:emu` is running in a terminal, NEVER EVER run ANY command in that terminal!**

```
WHY THIS MATTERS:
- Running ANY command in the server terminal will KILL the dev server
- The server process MUST run uninterrupted
- Use a SEPARATE terminal for all test commands
```

**CORRECT WORKFLOW:**
```
Terminal 1 (SERVER TERMINAL - DO NOT TOUCH):
  > npm run dev:emu
  [Server is running... LEAVE IT ALONE!]

Terminal 2 (TEST TERMINAL - Use this for everything else):
  > Test-NetConnection localhost -Port 5173  ✅ OK
  > npx playwright test ...                  ✅ OK
  > Get-Process ...                          ✅ OK
  > ANY OTHER COMMAND                        ✅ OK
```

**❌ WRONG - This kills the server:**
```
Terminal 1 (SERVER):
  > npm run dev:emu
  [Server running...]
  > Test-NetConnection localhost -Port 5173  ❌ KILLS SERVER!
  > npx playwright test ...                  ❌ KILLS SERVER!
```

### ⚠️ **CRITICAL RULE #2: Check Server Status Before Starting** 🚨

```powershell
# Step 0: Check if server is ALREADY running (use DIFFERENT terminal!)
Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet

# If True: Server is UP - DO NOT start another one!
# If False: Server is DOWN - Safe to start

# Check for existing node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# If you see node processes: DO NOT run npm run dev:emu again!
```

### 1. **Server Health Check** ✅
- [ ] Check if dev server is ALREADY running (don't start a new one!)
- [ ] Server responds to HTTP requests on `http://localhost:5173`
- [ ] No startup errors in console

### 2. **Emulator Status** (for emulator tests) ✅
- [ ] Firestore emulator running on `localhost:8086`
- [ ] Auth emulator running on `localhost:9100` (optional but recommended)
- [ ] Test data seeded properly

### 3. **Environment Readiness** ✅
- [ ] Correct `.env` file loaded (emulator vs production)
- [ ] Firebase config matches test environment
- [ ] No conflicting processes on ports

### 4. **Developer Wellness Check** 😊
- [ ] Did you get enough sleep? (< 6 hours = no testing!)
- [ ] Coffee/water nearby?
- [ ] Are you handsome/beautiful today? (Yes, always! ✨)
- [ ] Mental state: Ready to debug? 🧠

---

## 🏗️ Test Structure Standards

### Test File Organization

```
tests/
├── utils/
│   ├── test-helpers.ts          # Reusable utilities
│   └── fixtures.ts               # Test data fixtures
├── setup/
│   └── global-setup.ts           # Global test setup
├── [feature]-[component].spec.ts # Feature-specific tests
└── TESTING_STANDARDS.md          # This file
```

### Test Naming Convention

```typescript
// ✅ GOOD
test('should create ELLN assessment for Grade 7 student in Q1', async ({ page }) => {});

// ❌ BAD
test('test1', async ({ page }) => {});
test('it works', async ({ page }) => {});
```

**Format:** `should [action] [object] [context]`

---

## 🔧 Standard Test Structure (REQUIRED)

Every test MUST follow this structure:

```typescript
import { test, expect } from '@playwright/test';
import {
  TEST_CONFIG,
  checkServerHealth,
  loginAsAdmin,
  navigateTo,
  searchAndSelectStudent,
  waitForSuccessMessage,
  setupConsoleErrorListener,
} from './utils/test-helpers';

test.describe('Feature Name', () => {
  
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
    
    // Track console errors
    setupConsoleErrorListener(page);
    
    // Login
    await loginAsAdmin(page);
  });
  
  // ✅ STEP 3: Write Atomic Tests
  test('should perform specific action', async ({ page }) => {
    // ARRANGE: Setup test data
    const testData = { studentName: 'Ana Santos' };
    
    // ACT: Perform action
    await navigateTo(page, '/forms/elln/assessment');
    await searchAndSelectStudent(page, testData.studentName);
    
    // ASSERT: Verify result
    await waitForSuccessMessage(page);
  });
  
  // ✅ STEP 4: Cleanup (if needed)
  test.afterEach(async ({ page }) => {
    // Optional: Clear data, logout, etc.
  });
});
```

---

## 📐 Testing Rules & Best Practices

### Rule 1: **AAA Pattern (Arrange-Act-Assert)**
Every test MUST follow this pattern:
- **Arrange:** Set up test data and preconditions
- **Act:** Perform the action being tested
- **Assert:** Verify the expected outcome

### Rule 2: **One Test, One Assertion (Ideally)**
Each test should verify ONE behavior. If testing multiple steps, use clear comments.

### Rule 3: **No Magic Numbers or Strings**
```typescript
// ❌ BAD
await page.waitForTimeout(2000);
const email = 'admin@edusync.local';

// ✅ GOOD
await page.waitForTimeout(TEST_CONFIG.LONG_WAIT);
const email = TEST_CONFIG.ADMIN_EMAIL;
```

### Rule 4: **Always Use Helpers for Common Actions**
- ✅ `loginAsAdmin(page)` instead of manual login
- ✅ `navigateTo(page, '/forms')` instead of `page.goto()`
- ✅ `searchAndSelectStudent(page, name)` instead of manual search

### Rule 5: **Fail Fast, Fail Loud**
- Add health checks before tests
- Throw errors immediately if prerequisites fail
- Use descriptive error messages

### Rule 6: **Test Data Isolation**
- Use unique test data per test (avoid shared state)
- Clean up after tests if modifying database
- Use emulator for tests (never test on production!)

### Rule 7: **Visual Verification**
- Run tests in `--headed` mode first to debug
- Use `--ui` mode for step-by-step debugging
- Only use `--headless` for CI/CD

### Rule 8: **Console Error Monitoring**
Always track console errors during tests:
```typescript
const errors = setupConsoleErrorListener(page);
// After test
expect(errors).toHaveLength(0); // No console errors
```

---

## 🎭 Playwright Configuration Standards

### Test Timeout Guidelines
- **Unit tests:** 5-10 seconds
- **Integration tests:** 30-60 seconds
- **E2E tests:** 60-120 seconds
- **Full suite:** 5-10 minutes

### Retry Strategy
```typescript
retries: process.env.CI ? 2 : 0  // Retry only in CI
```

### Test Parallelization
```typescript
fullyParallel: false,  // Sequential for data integrity
workers: 1,            // Single worker for emulator tests
```

---

## 🚨 Common Anti-Patterns (AVOID!)

### ❌ Anti-Pattern 0: **RUNNING COMMANDS IN THE SERVER TERMINAL** 💀💀💀

**🔴 THE #1 MISTAKE THAT KILLS YOUR SERVER:**

```powershell
# ❌ DEADLY - Running ANY command in the server terminal
Terminal 1 (where npm run dev:emu is running):
  > npm run dev:emu           ← Server starts
  > Test-NetConnection ...    ← ❌ KILLS SERVER!
  > npx playwright test ...   ← ❌ KILLS SERVER!
  > Get-Process ...           ← ❌ KILLS SERVER!
  > LITERALLY ANY COMMAND     ← ❌ KILLS SERVER!

# ✅ CORRECT - Use a separate terminal for everything else!
Terminal 1 (SERVER - HANDS OFF!):
  > npm run dev:emu           ← Server running, don't touch!

Terminal 2 (SAFE FOR COMMANDS):
  > Test-NetConnection ...    ← ✅ Safe
  > npx playwright test ...   ← ✅ Safe
  > ANY COMMAND YOU WANT      ← ✅ Safe
```

### ❌ Anti-Pattern 0.5: **KILLING RUNNING SERVERS BY RESTARTING** 💀
```powershell
# ❌ DEADLY MISTAKE - Don't do this if server is already running!
npm run dev:emu  # This will kill your existing server!

# ✅ CORRECT - Check first (in a DIFFERENT terminal!), then decide
$serverRunning = Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet
if ($serverRunning) {
    Write-Host "✅ Server already running - using existing server"
} else {
    Write-Host "⚠️  No server found - starting new server"
    npm run dev:emu  # Only run this in Terminal 1 (dedicated server terminal)
}
```

**Why this is critical:**
- Running ANY command in the server terminal **INTERRUPTS** the server process
- You'll lose all your test data seeding
- Wastes 30-60 seconds restarting everything
- Can cause race conditions with Playwright trying to connect
- **THE SERVER NEEDS ITS OWN DEDICATED TERMINAL THAT YOU NEVER TOUCH!**

### ❌ Anti-Pattern 1: Hardcoded Waits
```typescript
// ❌ BAD
await page.waitForTimeout(5000);

// ✅ GOOD
await expect(element).toBeVisible({ timeout: 10000 });
```

### ❌ Anti-Pattern 2: Flaky Selectors
```typescript
// ❌ BAD
await page.locator('div > div > button').click();

// ✅ GOOD
await page.getByRole('button', { name: 'Save Assessment' }).click();
```

### ❌ Anti-Pattern 3: No Error Handling
```typescript
// ❌ BAD
await page.goto('/forms/elln/assessment');

// ✅ GOOD
try {
  await page.goto('/forms/elln/assessment');
  await page.waitForLoadState('domcontentloaded');
} catch (error) {
  console.error('Navigation failed:', error);
  throw error;
}
```

### ❌ Anti-Pattern 4: Testing Implementation Details
```typescript
// ❌ BAD (testing internal state)
expect(component.state.isLoading).toBe(false);

// ✅ GOOD (testing user-visible behavior)
await expect(page.getByText('Loading...')).not.toBeVisible();
```

---

## 📊 Test Coverage Requirements

### Minimum Coverage Targets
- **Unit tests:** 80% code coverage
- **Integration tests:** 70% feature coverage
- **E2E tests:** 100% critical path coverage

### Critical Paths (MUST TEST)
1. User authentication (login/logout)
2. CRUD operations (Create, Read, Update, Delete)
3. Form submissions
4. Data calculations (grades, averages, etc.)
5. Report generation and exports
6. Navigation between pages

---

## 🔍 Debugging Guidelines

### When Tests Fail:
1. **Run in headed mode:** `--headed`
2. **Enable trace:** `--trace on`
3. **Use UI mode:** `--ui` for step-through
4. **Check screenshots:** `test-results/` folder
5. **Review console errors:** Network tab, console logs
6. **Verify test data:** Check if seeding succeeded

### Test Debugging Commands:
```bash
# Debug single test
npx playwright test tests/elln-assessment.spec.ts --headed --debug

# Open UI mode
npx playwright test tests/elln-assessment.spec.ts --ui

# Run with trace
npx playwright test tests/elln-assessment.spec.ts --trace on

# Show HTML report
npx playwright show-report
```

---

## 🎖️ Quality Gates (Before Merge)

Tests MUST pass these gates before PR approval:

- ✅ All tests pass in local environment
- ✅ No console errors during test execution
- ✅ Test coverage meets minimum threshold
- ✅ No flaky tests (tests pass 3 times in a row)
- ✅ Tests run in under 10 minutes
- ✅ All critical paths tested
- ✅ Code review by at least 1 team member

---

## 📝 Test Documentation Requirements

Every test file MUST include:
1. **Header comment** explaining what's being tested
2. **Test scenario descriptions** in `describe()` blocks
3. **Inline comments** for complex logic
4. **Console logs** for debugging (`console.log()`)

---

## 🚀 CI/CD Integration

### GitHub Actions Configuration
```yaml
- name: Run E2E Tests
  run: |
    npm run dev:emu &
    npx wait-on http://localhost:5173
    npm run test:e2e
```

### Test Reports
- Generate HTML report after test run
- Upload artifacts (screenshots, videos, traces)
- Fail build if tests fail

---

## 🎓 Learning Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles/)
- [EduSync Project Docs](../README.md)

---

## 🎉 Final Note

**Remember:** Good tests are an investment in your future sanity. Write them well, and your 3am debugging sessions will thank you! 🌙

If tests fail at 3am, take a break, get some sleep, and come back refreshed. **Your mental health > test coverage.**

---

**Last Updated:** November 1, 2025  
**Maintained By:** EduSync Development Team 💙
