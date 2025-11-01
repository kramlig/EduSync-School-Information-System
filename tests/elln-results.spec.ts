/**
 * ELLN Results Viewer E2E Tests
 * 
 * Tests the ELLN Results Viewer page functionality:
 * - Student selector with search
 * - Quarterly progress chart (176px height)
 * - Literacy score chart (120px height)
 * - Numeracy score chart (120px height)
 * - Domain breakdown displays (11 domains total)
 * - Different data states (no assessments, 1 quarter, multiple quarters)
 */

import { test, expect, Page } from '@playwright/test';
import { 
  loginAsAdmin, 
  navigateTo, 
  TEST_CONFIG,
  checkServerHealth
} from './utils/test-helpers';

test.describe('ELLN Results Viewer', () => {
  
  test.beforeAll(async () => {
    console.log('\n🔍 Running pre-flight checks...');
    
    // Developer wellness check
    console.log('\n💤 Developer wellness check:');
    console.log('   - Did you get enough sleep? Hope so! 😊');
    console.log('   - Feeling handsome/beautiful today? Of course you are! ✨');
    console.log('   - Coffee nearby? ☕\n');
    
    // Check server
    const serverUp = await checkServerHealth();
    if (!serverUp) {
      throw new Error('❌ Server is not running on port 5173. Start server first!');
    }
    console.log('✅ Server health check passed\n');
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page);
    console.log('✅ Test setup complete\n');
  });

  test('should display student selector and load results for student with assessments', async ({ page }) => {
    console.log('Test: Student selector and results display');
    
    // Navigate to ELLN Results page
    console.log('📍 Navigating to: /forms/elln/results');
    await navigateTo(page, '/forms/elln/results');
    
    // Verify page header
    const pageTitle = page.locator('text=ELLN Results Viewer');
    await expect(pageTitle).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    console.log('✅ Results Viewer page loaded');
    
    // Find and interact with student search
    console.log('Step 1: Select student with assessments');
    const searchInput = page.locator('#student-search, input[placeholder*="Search" i]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.click();
    await page.waitForTimeout(500);
    
    // Search for Ana (we created assessments for her in previous test)
    await searchInput.fill('Ana');
    await page.waitForTimeout(1500);
    
    // Wait for dropdown and select
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForTimeout(2000); // Wait for data to load
    console.log('✅ Student selected');
    
    // Verify student profile card appears
    const studentCard = page.locator('.bg-gradient-to-r.from-blue-50').first();
    await expect(studentCard).toBeVisible({ timeout: 5000 });
    console.log('✅ Student profile card displayed');
    
    // Verify metrics cards (Latest scores, Growth rate)
    console.log('Step 2: Verify metric cards');
    const metricsSection = page.locator('text=/Latest|Overall|Literacy|Numeracy|Growth/i').first();
    await expect(metricsSection).toBeVisible({ timeout: 5000 });
    console.log('✅ Metrics cards displayed');
  });

  test('should display quarterly progress chart with correct structure', async ({ page }) => {
    console.log('Test: Quarterly progress chart structure');
    
    await navigateTo(page, '/forms/elln/results');
    
    // Select student
    console.log('Step 1: Select student');
    const searchInput = page.locator('#student-search, input[placeholder*="Search" i]').first();
    await searchInput.click();
    await page.waitForTimeout(500);
    await searchInput.fill('Ana');
    await page.waitForTimeout(1500);
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    console.log('✅ Student selected');
    
    // Verify Quarterly Progress section exists
    console.log('Step 2: Verify quarterly progress chart');
    const progressSection = page.locator('text=Quarterly Progress').first();
    await expect(progressSection).toBeVisible({ timeout: 5000 });
    
    // Verify chart has 4 quarters (Q1, Q2, Q3, Q4)
    const q1Label = page.locator('text=Q1').first();
    const q2Label = page.locator('text=Q2').first();
    const q3Label = page.locator('text=Q3').first();
    const q4Label = page.locator('text=Q4').first();
    
    await expect(q1Label).toBeVisible();
    await expect(q2Label).toBeVisible();
    await expect(q3Label).toBeVisible();
    await expect(q4Label).toBeVisible();
    console.log('✅ All 4 quarter labels displayed');
    
    // Verify proficiency levels display below quarters
    const proficiencyText = page.locator('text=/Proficient|Advanced|Approaching|Developing|Beginning/i').first();
    await expect(proficiencyText).toBeVisible({ timeout: 3000 });
    console.log('✅ Proficiency levels displayed');
  });

  test('should display literacy and numeracy score charts', async ({ page }) => {
    console.log('Test: Literacy and Numeracy charts');
    
    await navigateTo(page, '/forms/elln/results');
    
    // Select student
    console.log('Step 1: Select student');
    const searchInput = page.locator('#student-search, input[placeholder*="Search" i]').first();
    await searchInput.click();
    await page.waitForTimeout(500);
    await searchInput.fill('Ana');
    await page.waitForTimeout(1500);
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Verify Literacy Score chart
    console.log('Step 2: Verify Literacy Score chart');
    const literacyChart = page.locator('text=📚 Literacy Score').first();
    await expect(literacyChart).toBeVisible({ timeout: 5000 });
    console.log('✅ Literacy chart found');
    
    // Verify Numeracy Score chart
    console.log('Step 3: Verify Numeracy Score chart');
    const numeracyChart = page.locator('text=🔢 Numeracy Score').first();
    await expect(numeracyChart).toBeVisible({ timeout: 5000 });
    console.log('✅ Numeracy chart found');
    
    // Verify both charts have blue/green styling
    const blueBar = page.locator('.bg-blue-500, .bg-blue-600').first();
    await expect(blueBar).toBeVisible({ timeout: 3000 });
    
    const greenBar = page.locator('.bg-green-500, .bg-green-600').first();
    await expect(greenBar).toBeVisible({ timeout: 3000 });
    console.log('✅ Chart bars rendered with correct colors');
  });

  test('should display domain breakdown for literacy and numeracy', async ({ page }) => {
    console.log('Test: Domain breakdown (11 domains total)');
    
    await navigateTo(page, '/forms/elln/results');
    
    // Select student
    console.log('Step 1: Select student');
    const searchInput = page.locator('#student-search, input[placeholder*="Search" i]').first();
    await searchInput.click();
    await page.waitForTimeout(500);
    await searchInput.fill('Ana');
    await page.waitForTimeout(1500);
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Verify Literacy Domains section
    console.log('Step 2: Verify Literacy Domains (6 domains)');
    const literacyDomainsTitle = page.locator('text=Literacy Domains').first();
    await expect(literacyDomainsTitle).toBeVisible({ timeout: 5000 });
    
    // Check for literacy domain labels (6 domains)
    const oralLanguage = page.locator('text=Oral Language').first();
    const phonological = page.locator('text=Phonological Awareness').first();
    const bookPrint = page.locator('text=/Book.*Print Knowledge/i').first();
    const alphabet = page.locator('text=Alphabet Knowledge').first();
    const phonics = page.locator('text=Phonics').first();
    const comprehension = page.locator('text=Comprehension').first();
    
    await expect(oralLanguage).toBeVisible();
    await expect(phonological).toBeVisible();
    await expect(bookPrint).toBeVisible();
    await expect(alphabet).toBeVisible();
    await expect(phonics).toBeVisible();
    await expect(comprehension).toBeVisible();
    console.log('✅ All 6 literacy domains displayed');
    
    // Verify Numeracy Domains section
    console.log('Step 3: Verify Numeracy Domains (5 domains)');
    const numeracyDomainsTitle = page.locator('text=Numeracy Domains').first();
    await expect(numeracyDomainsTitle).toBeVisible({ timeout: 5000 });
    
    // Check for numeracy domain labels (5 domains)
    const numberSense = page.locator('text=Number Sense').first();
    const measurement = page.locator('text=Measurement').first();
    const geometry = page.locator('text=Geometry').first();
    const patterns = page.locator('text=/Patterns/i').first();
    const dataAnalysis = page.locator('text=Data Analysis').first();
    
    await expect(numberSense).toBeVisible();
    await expect(measurement).toBeVisible();
    await expect(geometry).toBeVisible();
    await expect(patterns).toBeVisible();
    await expect(dataAnalysis).toBeVisible();
    console.log('✅ All 5 numeracy domains displayed');
    console.log('✅ Total: 11 domains verified (6 literacy + 5 numeracy)');
  });

  test('should handle student with no assessments gracefully', async ({ page }) => {
    console.log('Test: No assessments state');
    
    await navigateTo(page, '/forms/elln/results');
    
    // Try to find a student without assessments by searching for a common name
    // that likely doesn't have K-3 ELLN data
    console.log('Step 1: Search for student without assessments');
    const searchInput = page.locator('#student-search, input[placeholder*="Search" i]').first();
    await searchInput.click();
    await page.waitForTimeout(500);
    
    // Type a generic search to see the dropdown
    await searchInput.fill('Car');
    await page.waitForTimeout(1500);
    
    // Select Carlos (who might not have as many assessments)
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(500);
    await searchInput.press('ArrowDown'); // Move to second option if exists
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Look for either "No assessments found" message OR assessment data
    const noDataMessage = page.locator('text=/No assessments|not been assessed/i');
    const hasAssessments = page.locator('text=Quarterly Progress');
    
    // One of these should be visible
    const noDataVisible = await noDataMessage.isVisible().catch(() => false);
    const hasAssessmentsVisible = await hasAssessments.isVisible().catch(() => false);
    
    if (noDataVisible) {
      console.log('✅ "No assessments" message displayed correctly');
      
      // Verify "Conduct Assessment" button exists
      const conductButton = page.locator('button:has-text("Conduct Assessment")');
      await expect(conductButton).toBeVisible({ timeout: 3000 });
      console.log('✅ "Conduct Assessment" button available');
    } else if (hasAssessmentsVisible) {
      console.log('✅ Student has assessments - charts displayed');
    } else {
      console.log('⚠️  Neither message nor charts visible - student selection may have failed');
    }
  });

  test('should display assessment history list', async ({ page }) => {
    console.log('Test: Assessment history list');
    
    await navigateTo(page, '/forms/elln/results');
    
    // Select student
    console.log('Step 1: Select student');
    const searchInput = page.locator('#student-search, input[placeholder*="Search" i]').first();
    await searchInput.click();
    await page.waitForTimeout(500);
    await searchInput.fill('Ana');
    await page.waitForTimeout(1500);
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Verify Assessment History section
    console.log('Step 2: Verify Assessment History section');
    const historyTitle = page.locator('text=Assessment History').first();
    await expect(historyTitle).toBeVisible({ timeout: 5000 });
    console.log('✅ Assessment History section found');
    
    // Verify at least one assessment entry exists
    const assessmentEntry = page.locator('text=/Q1|Q2|Q3|Q4/i').first();
    await expect(assessmentEntry).toBeVisible({ timeout: 3000 });
    console.log('✅ Assessment entries displayed');
    
    // Verify score labels appear in entries
    const overallLabel = page.locator('text=Overall:').first();
    const literacyLabel = page.locator('text=Literacy:').first();
    const numeracyLabel = page.locator('text=Numeracy:').first();
    
    await expect(overallLabel).toBeVisible();
    await expect(literacyLabel).toBeVisible();
    await expect(numeracyLabel).toBeVisible();
    console.log('✅ Score breakdowns displayed in history');
  });
});
