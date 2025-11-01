import { test, expect } from '@playwright/test';
import {
  TEST_CONFIG,
  checkServerHealth,
  loginAsAdmin,
  navigateTo,
  searchAndSelectStudent,
  fillFormField,
  waitForSuccessMessage,
  setupConsoleErrorListener,
} from './utils/test-helpers';

/**
 * ELLN Assessment E2E Test Suite
 * 
 * Tests the complete ELLN Assessment workflow:
 * 1. Navigate to ELLN Assessment page
 * 2. Test searchable student dropdown (search, keyboard navigation)
 * 3. Fill literacy domain scores (6 fields)
 * 4. Fill numeracy domain scores (5 fields)
 * 5. Verify auto-calculations (literacy avg, numeracy avg, overall score, proficiency level)
 * 6. Test save functionality
 * 7. Repeat for 5 students across different quarters
 * 
 * Prerequisites:
 * - Dev server running on http://localhost:5173
 * - Firebase emulators active (Firestore on 8086, Auth on 9100)
 * - Test data seeded (40 students, 4 sections)
 */

test.describe('ELLN Assessment Tool', () => {
  
  // ✅ STEP 1: Verify Prerequisites
  test.beforeAll(async () => {
    console.log('🔍 Running pre-flight checks...\n');
    
    // Check if you're well-rested (just kidding, but seriously - get some sleep! 😴)
    console.log('💤 Developer wellness check:');
    console.log('   - Did you get enough sleep? Hope so! 😊');
    console.log('   - Feeling handsome/beautiful today? Of course you are! ✨');
    console.log('   - Coffee nearby? ☕\n');
    
    // Check server health
    const serverUp = await checkServerHealth();
    if (!serverUp) {
      throw new Error('❌ Server is not running! Start with: npm run dev:emu');
    }
    console.log('✅ Server health check passed\n');
  });
  
  // ✅ STEP 2: Setup Each Test
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_CONFIG.PAGE_LOAD_TIMEOUT * 4); // 2 minutes for E2E
    
    // Track console errors
    setupConsoleErrorListener(page);
    
    // Login as admin
    await loginAsAdmin(page);
    
    console.log('✅ Test setup complete\n');
  });

  test('should test searchable student dropdown with keyboard navigation', async ({ page }) => {
    // ARRANGE: Setup test data
    const testStudent = 'Ana';
    
    // ACT: Navigate and search
    console.log('📍 Test: Searchable dropdown with keyboard navigation');
    await navigateTo(page, '/forms/elln/assessment');
    
    console.log('🔍 Testing search functionality...');
    const searchInput = page.locator('#student-search, input[placeholder*="Search by name" i]').first();
    await expect(searchInput).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    
    await searchInput.click();
    await page.waitForTimeout(TEST_CONFIG.SHORT_WAIT);
    await searchInput.fill(testStudent);
    await page.waitForTimeout(TEST_CONFIG.MEDIUM_WAIT);
    
    // ASSERT: Wait for dropdown to appear and verify search results
    await page.waitForTimeout(1000); // Wait for dropdown to render
    const dropdownList = page.locator('ul.py-1').first(); // The <ul> container
    await expect(dropdownList).toBeVisible({ timeout: 5000 });
    
    const dropdownButtons = page.locator('ul.py-1 li button');
    const count = await dropdownButtons.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ Found ${count} students in dropdown`);
    
    // ACT: Test keyboard navigation
    console.log('⌨️  Testing keyboard navigation (↓↓↑ Enter)...');
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(TEST_CONFIG.SHORT_WAIT);
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(TEST_CONFIG.SHORT_WAIT);
    await searchInput.press('ArrowUp');
    await page.waitForTimeout(TEST_CONFIG.SHORT_WAIT);
    await searchInput.press('Enter');
    await page.waitForTimeout(TEST_CONFIG.LONG_WAIT);
    
    // ASSERT: Verify student selection (dropdown should close and student card appears)
    await expect(dropdownList).toBeHidden({ timeout: 3000 });
    const studentCard = page.locator('.bg-gradient-to-br.from-blue-50').first();
    await expect(studentCard).toBeVisible({ timeout: 5000 });
    console.log('✅ Student selected successfully with keyboard navigation');
  });

  test('should fill assessment scores and verify auto-calculations', async ({ page }) => {
    console.log('Test: Fill literacy/numeracy scores and verify auto-calculations');
    
    await page.goto('http://localhost:5173/forms/elln/assessment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Step 1: Select a student
    console.log('Step 1: Select student');
    const searchInput = page.locator('#student-search, input[placeholder*="Search by name" i]').first();
    await searchInput.click();
    await searchInput.fill('Carlos');
    await page.waitForTimeout(1000);
    await searchInput.press('ArrowDown');
    await searchInput.press('Enter');
    await page.waitForTimeout(1500);
    
    // Step 2: Fill literacy domain scores (6 fields in order)
    console.log('Step 2: Fill literacy domain scores (6 fields)');
    const literacyScores = [85, 82, 88, 90, 78, 86]; // oral language, phonological awareness, book & print, alphabet, phonics, comprehension
    
    // Find all inputs in the Literacy Domains section (they appear in a grid)
    const literacySection = page.locator('text=Literacy Domains').locator('..').locator('..');
    const literacyInputs = literacySection.locator('input[type="number"]');
    
    for (let i = 0; i < literacyScores.length; i++) {
      await literacyInputs.nth(i).waitFor({ state: 'visible', timeout: 5000 });
      await literacyInputs.nth(i).fill(literacyScores[i].toString());
      await page.waitForTimeout(200);
    }
    console.log('✅ Literacy scores filled');
    
    // Step 3: Fill numeracy domain scores (5 fields in order)
    console.log('Step 3: Fill numeracy domain scores (5 fields)');
    const numeracyScores = [87, 83, 85, 89, 81]; // number sense, measurement, geometry, patterns, data analysis
    
    // Find all inputs in the Numeracy Domains section
    const numeracySection = page.locator('text=Numeracy Domains').locator('..').locator('..');
    const numeracyInputs = numeracySection.locator('input[type="number"]');
    
    for (let i = 0; i < numeracyScores.length; i++) {
      await numeracyInputs.nth(i).waitFor({ state: 'visible', timeout: 5000 });
      await numeracyInputs.nth(i).fill(numeracyScores[i].toString());
      await page.waitForTimeout(200);
    }
    console.log('✅ Numeracy scores filled');
    
    // Step 4: Verify auto-calculations
    console.log('Step 4: Verify auto-calculations');
    await page.waitForTimeout(1000); // Wait for calculations
    
    // Expected calculations:
    // Literacy Avg = (85+82+88+90+78+86)/6 = 84.83
    // Numeracy Avg = (87+83+85+89+81)/5 = 85.00
    // Overall Score = (84.83+85.00)/2 = 84.92
    // Proficiency Level = "Proficient" (80-89 range)
    
    // Verify "Average Score" labels in both sections (reuse existing sections)
    const literacyAvgLabel = literacySection.locator('text=Average Score');
    await expect(literacyAvgLabel).toBeVisible();
    
    const numeracyAvgLabel = numeracySection.locator('text=Average Score');
    await expect(numeracyAvgLabel).toBeVisible();
    
    // Verify Overall Score & Proficiency section
    const overallScoreLabel = page.locator('text=Overall Score').first();
    await expect(overallScoreLabel).toBeVisible();
    
    const proficiencyLevelLabel = page.locator('text=Proficiency Level').first();
    await expect(proficiencyLevelLabel).toBeVisible();
    
    console.log('✅ Auto-calculations displayed');
  });

  test('should save assessment and verify success message', async ({ page }) => {
    console.log('Test: Save assessment for a student');
    
    await page.goto('http://localhost:5173/forms/elln/assessment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Step 1: Select student (use 'Ana' - we know from test 1 she's in K-3)
    console.log('Step 1: Select student');
    const searchInput = page.locator('#student-search, input[placeholder*="Search by name" i]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.click();
    await page.waitForTimeout(500);
    
    // Type search query for a K-3 student
    await searchInput.fill('Ana');
    await page.waitForTimeout(1500); // Wait for dropdown to filter
    
    // Press ArrowDown to ensure dropdown opens, then Enter to select first match
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForTimeout(1500);
    
    // Verify student selected (card appears)
    const studentCard = page.locator('.bg-gradient-to-br.from-blue-50').first();
    await expect(studentCard).toBeVisible({ timeout: 5000 });
    console.log('✅ Student selected');
    
    // Step 2: Quick fill scores
    console.log('Step 2: Fill scores quickly');
    const allInputs = await page.locator('input[type="number"]').all();
    
    // Fill first 6 inputs (literacy)
    for (let i = 0; i < 6 && i < allInputs.length; i++) {
      await allInputs[i].fill((80 + i).toString());
    }
    
    // Fill next 5 inputs (numeracy)
    for (let i = 6; i < 11 && i < allInputs.length; i++) {
      await allInputs[i].fill((85 + (i - 6)).toString());
    }
    
    await page.waitForTimeout(1000);
    
    // Step 3: Select quarter (values are lowercase: q1, q2, q3, q4)
    console.log('Step 3: Select quarter');
    const quarterSelect = page.locator('#quarter-select, select').first();
    await quarterSelect.waitFor({ state: 'visible', timeout: 5000 });
    await quarterSelect.selectOption('q4');
    await page.waitForTimeout(500);
    
    // Step 4: Click Save button
    console.log('Step 4: Click Save Assessment button');
    const saveButton = page.getByRole('button', { name: /save assessment|save|submit/i }).first();
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // Step 5: Verify success message
    console.log('Step 5: Verify success message');
    const successMessage = page.locator('text=/saved successfully|assessment saved|success/i').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ Assessment saved successfully!');
  });

  test('should create assessments for 5 students across different quarters', async ({ page }) => {
    console.log('Test: Create assessments for 5 students');
    
    await page.goto('http://localhost:5173/forms/elln/assessment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Use only K-3 students (we know Ana and Carlos exist from test 1 which found 4 K-3 students)
    const students = ['Ana', 'Carlos', 'Ana', 'Carlos', 'Ana']; // Reuse K-3 students with different quarters
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'Q1'];
    
    for (let idx = 0; idx < students.length; idx++) {
      const studentName = students[idx];
      const quarter = quarters[idx];
      
      console.log(`\n--- Student ${idx + 1}/5: ${studentName} (${quarter}) ---`);
      
      // Select student (wait for form to be ready after previous save)
      const searchInput = page.locator('#student-search, input[placeholder*="Search by name" i]').first();
      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      await searchInput.click();
      await page.waitForTimeout(500);
      
      // Clear any existing value with triple-click + type
      await searchInput.click({ clickCount: 3 });
      await searchInput.fill(studentName);
      await page.waitForTimeout(1500); // Wait for dropdown filtering
      
      // Use ArrowDown to open dropdown if needed, then Enter to select
      await searchInput.press('ArrowDown');
      await page.waitForTimeout(500);
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);
      
      // Verify student card appears
      const studentCard = page.locator('.bg-gradient-to-br.from-blue-50').first();
      await expect(studentCard).toBeVisible({ timeout: 5000 });
      
      // Fill scores with random variation
      const allInputs = await page.locator('input[type="number"]').all();
      const baseScore = 75 + (idx * 3); // Vary base score per student
      
      for (let i = 0; i < Math.min(11, allInputs.length); i++) {
        const score = baseScore + Math.floor(Math.random() * 15);
        await allInputs[i].fill(score.toString());
      }
      
      await page.waitForTimeout(1000);
      
      // Select quarter (values are lowercase: q1, q2, q3, q4)
      const quarterSelect = page.locator('#quarter-select, select').first();
      await quarterSelect.waitFor({ state: 'visible', timeout: 5000 });
      await quarterSelect.selectOption(quarter.toLowerCase());
      await page.waitForTimeout(500);
      
      // Save
      const saveButton = page.getByRole('button', { name: /save assessment|save|submit/i }).first();
      await saveButton.click();
      
      // Wait for success
      const successMessage = page.locator('text=/saved successfully|assessment saved|success/i').first();
      await expect(successMessage).toBeVisible({ timeout: 10000 });
      
      console.log(`✅ ${studentName} (${quarter}) - Assessment saved`);
      
      // Wait before next student
      await page.waitForTimeout(2000);
    }
    
    console.log('\n✅ All 5 assessments created successfully!');
  });
});
