# Form 137 CRUD Testing Guide

## Overview

This document explains the Playwright E2E tests for Form 137 CRUD operations and provides instructions for running and maintaining these tests.

## Test File Location

```
tests/form137-crud.spec.ts
```

## Running the Tests

### Prerequisites

1. Install Playwright:
```powershell
npm install --save-dev @playwright/test
npx playwright install
```

2. Start your development server:
```powershell
npm run dev
```

3. Ensure Firestore emulator is running (if testing locally):
```powershell
npm run emu:up
```

### Run All Form 137 Tests

```powershell
npx playwright test tests/form137-crud.spec.ts
```

### Run Specific Test Suite

```powershell
# Run only CREATE tests
npx playwright test tests/form137-crud.spec.ts -g "CREATE"

# Run only UPDATE tests (includes bug investigation)
npx playwright test tests/form137-crud.spec.ts -g "UPDATE"

# Run only bug investigation tests
npx playwright test tests/form137-crud.spec.ts -g "BUG INVESTIGATION"
```

### Run in UI Mode (Interactive Debugging)

```powershell
npx playwright test tests/form137-crud.spec.ts --ui
```

### Run with Browser Visible

```powershell
npx playwright test tests/form137-crud.spec.ts --headed
```

### Generate Test Report

```powershell
npx playwright test tests/form137-crud.spec.ts --reporter=html
npx playwright show-report
```

## Test Coverage

### 1. CREATE Operations

- ✅ **Manual Creation**: Tests creating a new Form 137 by manually filling all fields
- ✅ **Auto-Generation**: Tests bulk generation from existing student data
- ✅ **Validation**: Tests that required fields are properly validated

### 2. READ Operations

- ✅ **View Form 137**: Tests displaying a Form 137 with all sections
- ✅ **New Sections**: Verifies newly implemented sections (transfer history, health records, activities, eligibility, certification)
- ✅ **Multi-Year Records**: Tests year selector for cumulative records

### 3. UPDATE Operations (Critical Bug Tests)

- ✅ **Load Existing Data**: **PRIMARY BUG TEST** - Verifies that editing loads existing data (not blank)
- ✅ **Data Structure Preservation**: Tests that cumulative structure is maintained when editing
- ✅ **Save Changes**: Tests that updates are persisted to Firestore
- ✅ **Cancel Without Saving**: Tests that cancel doesn't save changes

### 4. DELETE Operations

- ✅ **Delete Record**: Tests deletion (if implemented)

### 5. BATCH Operations

- ✅ **Batch Generation**: Tests generating Form 137 for multiple students

### 6. DATA INTEGRITY

- ✅ **Referential Integrity**: Tests that Form 137 maintains correct student references
- ✅ **Cumulative Structure**: Tests that multi-year schoolYears[] array works correctly

### 7. PRINT Functionality

- ✅ **Print Dialog**: Tests that print dialog opens with proper formatting

### 8. BUG INVESTIGATION Suite

- ✅ **Data Flow Logging**: Logs entire data flow from view → edit to diagnose blank data bug
- ✅ **Component Props Inspection**: Checks what initialData is being passed to Form137Editor

### 9. PERFORMANCE

- ✅ **Load Time**: Tests that Form 137 loads within 3 seconds
- ✅ **Large Datasets**: Tests handling 100+ students with pagination

## Known Issues Being Tested

### Critical Bug: Blank Data on Edit

**Description**: When clicking "Edit" on a Form 137 record, all form fields show blank data even though the record exists in Firestore.

**Root Cause**: Structure mismatch between:
- **Form137Editor** expects: `{ gradeLevel, section, subjects[] }` (flat structure)
- **AcademicHistory** provides: `{ schoolYears: [{ gradeLevel, section, grades[] }] }` (cumulative structure)

**Test Coverage**:
```typescript
test('should load existing data when editing a record', async ({ page }) => {
  // This test WILL FAIL until the bug is fixed
  // It verifies that student name, LRN, school name, and section are NOT blank
})

test('should log data flow from view to edit', async ({ page }) => {
  // Diagnostic test that logs network requests and form data
  // Helps identify exactly where data is being lost
})
```

**Expected Behavior After Fix**:
- Form137Editor should extract `schoolYears[0]` from initialData
- Map cumulative structure to flat structure for editing
- Convert back to cumulative structure on save

## Test Configuration

### Authentication

Tests use a helper function to login:
```typescript
async function login(page: Page) {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="email"]', 'test@school.edu');
  await page.fill('input[name="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}
```

**⚠️ Update credentials** to match your test environment!

### Base URL

Default: `http://localhost:5173`

To change, update in:
- `playwright.config.ts` (if exists)
- Or modify directly in test file

### Firestore Wait Times

```typescript
async function waitForFirestore(page: Page, delay = 1000) {
  await page.waitForTimeout(delay);
}
```

Adjust `delay` if your Firestore operations are slower.

## Debugging Failed Tests

### 1. Check Browser Console

Run tests with `--headed` flag and watch browser console for errors:
```powershell
npx playwright test tests/form137-crud.spec.ts --headed --workers=1
```

### 2. Enable Trace

```powershell
npx playwright test tests/form137-crud.spec.ts --trace on
```

Then view trace:
```powershell
npx playwright show-trace trace.zip
```

### 3. Use Page Screenshots

Add to test:
```typescript
await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
```

### 4. Check Network Requests

The bug investigation tests already log network requests. Review console output:
```typescript
console.log('Requests:', requests);
```

### 5. Inspect Form Data

Tests log form field values:
```typescript
console.log('Form data in editor:', formData);
```

## Updating Tests

### When Adding New Form 137 Fields

1. Update `test('should load existing data when editing a record')`:
   - Add new field names to `criticalFields` array
   - Add assertions for new fields

2. Update `test('should display newly added sections')`:
   - Add checks for new section headers
   - Verify new data is displayed

### When Fixing the Blank Data Bug

1. **After fixing Form137Editor.tsx**, these tests should pass:
   - `should load existing data when editing a record` ✅
   - `should preserve data structure when editing` ✅
   - `should successfully update Form 137 record` ✅

2. **Remove or update bug investigation tests** once confirmed fixed

### When Adding Delete Functionality

Update this test:
```typescript
test('should delete Form 137 record', async ({ page }) => {
  // Currently skipped if delete button doesn't exist
  // Remove skip condition once implemented
})
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Form 137 E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start Firestore Emulator
        run: npm run emu:up
      
      - name: Run Form 137 Tests
        run: npx playwright test tests/form137-crud.spec.ts
      
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Data Requirements

### Minimum Test Data

For tests to run successfully, you need:

1. **At least 2 students** in the system:
   - One WITH Form 137 (for READ/UPDATE/DELETE tests)
   - One WITHOUT Form 137 (for CREATE/GENERATE tests)

2. **At least 1 complete Form 137** with:
   - Student information
   - At least one school year record
   - Grades for at least one subject
   - Attendance data

### Seeding Test Data

```powershell
# Run seed script
npm run emu:seed:small

# Or create test data manually through UI
```

## Best Practices

### 1. Test Isolation

Each test should be independent:
- ✅ Don't rely on data created by previous tests
- ✅ Clean up after tests (delete created records)
- ✅ Use unique identifiers (timestamps) for test data

### 2. Selectors

Prefer stable selectors:
- ✅ `data-testid` attributes (most stable)
- ✅ `name` attributes for form fields
- ✅ Semantic text matching (`hasText`)
- ❌ Avoid CSS classes (can change)
- ❌ Avoid complex XPath

### 3. Waiting

Use explicit waits:
- ✅ `waitForLoadState('networkidle')`
- ✅ `expect().toBeVisible()` (has built-in retry)
- ✅ `waitForTimeout()` as last resort for Firestore
- ❌ Avoid fixed `setTimeout()` without context

### 4. Assertions

Be specific:
- ✅ `expect(value).toBe('exact match')`
- ✅ `expect(value).toContain('partial')`
- ❌ Avoid `expect(value).toBeTruthy()` without context

## Troubleshooting

### "Test timed out"

**Cause**: Network delay, Firestore slow, or element not found

**Solutions**:
1. Increase timeout in test:
   ```typescript
   test('slow test', async ({ page }) => {
     // ...
   }).timeout(60000); // 60 seconds
   ```

2. Check if elements have correct selectors
3. Verify Firestore emulator is running

### "Cannot find button 'Edit'"

**Cause**: Button text doesn't match or element not visible

**Solutions**:
1. Check actual button text in UI
2. Update selector: `button:has-text("Edit"), button:has-text("Modify")`
3. Add wait: `await page.waitForSelector('button:has-text("Edit")')`

### "Blank fields detected"

**Cause**: This is the known bug! See "Known Issues Being Tested" section above

**Solution**: Fix Form137Editor.tsx to handle cumulative structure

### "Authentication failed"

**Cause**: Login credentials incorrect or auth flow changed

**Solutions**:
1. Update credentials in `login()` helper
2. Check if login URL changed
3. Verify email/password fields have correct `name` attributes

## Next Steps

1. **Fix the blank data bug** in Form137Editor.tsx
2. **Re-run UPDATE tests** to verify fix
3. **Add more edge case tests**:
   - Editing multi-year records (select different years)
   - Handling validation errors
   - Testing concurrent edits
4. **Expand test coverage**:
   - Test all new Form 137 sections (transfer history, health, activities)
   - Test QR code generation
   - Test reference number generation

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [VS Code Playwright Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

## Contact

For questions about these tests, contact the development team or check the project README.

---

**Last Updated**: 2024-12-XX  
**Test File Version**: 1.0.0  
**Covers**: Form 137 CRUD operations and blank data bug investigation
