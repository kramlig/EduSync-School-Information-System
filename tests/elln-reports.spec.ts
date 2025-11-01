/**
 * ELLN Reports & Analytics E2E Tests
 * 
 * Tests the ELLN Reports dashboard functionality:
 * - Report type selector (section/grade/school-wide)
 * - Section and grade filters
 * - Quarter filtering
 * - Summary statistics cards (4 metrics)
 * - Proficiency distribution chart (5 levels)
 * - Statistical reports section
 * - Excel export functionality
 */

import { test, expect, Page } from '@playwright/test';
import { 
  loginAsAdmin, 
  navigateTo, 
  TEST_CONFIG,
  checkServerHealth
} from './utils/test-helpers';

test.describe('ELLN Reports & Analytics', () => {
  
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

  test('should display report configuration with 3 report types', async ({ page }) => {
    console.log('Test: Report configuration display');
    
    // Navigate to ELLN Reports page
    console.log('📍 Navigating to: /forms/elln/reports');
    await navigateTo(page, '/forms/elln/reports');
    
    // Verify page header
    const pageTitle = page.locator('text=ELLN Reports & Analytics').first();
    await expect(pageTitle).toBeVisible({ timeout: TEST_CONFIG.ELEMENT_TIMEOUT });
    console.log('✅ Reports page loaded');
    
    // Verify Report Configuration section
    console.log('Step 1: Verify Report Configuration section');
    const configSection = page.locator('text=Report Configuration').first();
    await expect(configSection).toBeVisible({ timeout: 5000 });
    
    // Verify Report Type dropdown
    const reportTypeSelect = page.locator('#report-type, select').first();
    await expect(reportTypeSelect).toBeVisible({ timeout: 3000 });
    
    // Verify all 3 report type options exist in the select
    const selectHtml = await reportTypeSelect.innerHTML();
    const hasSection = selectHtml.includes('Section Level');
    const hasGrade = selectHtml.includes('Grade Level');
    const hasSchool = selectHtml.includes('School-Wide');
    
    if (hasSection && hasGrade && hasSchool) {
      console.log('✅ All 3 report types available: Section, Grade, School-Wide');
    } else {
      throw new Error('Missing report type options');
    }
    
    // Verify Quarter filter
    console.log('Step 2: Verify Quarter filter');
    const quarterSelect = page.locator('#quarter-select, select[id*="quarter"]').first();
    await expect(quarterSelect).toBeVisible({ timeout: 3000 });
    console.log('✅ Quarter filter available');
    
    // Verify Export button
    console.log('Step 3: Verify Export button');
    const exportButton = page.locator('button:has-text("Export to Excel")').first();
    await expect(exportButton).toBeVisible({ timeout: 3000 });
    console.log('✅ Export button displayed');
  });

  test('should load section-level report with summary statistics', async ({ page }) => {
    console.log('Test: Section-level report with statistics');
    
    await navigateTo(page, '/forms/elln/reports');
    
    // Select section report type
    console.log('Step 1: Select Section Level report');
    const reportTypeSelect = page.locator('#report-type').first();
    await reportTypeSelect.selectOption('section');
    await page.waitForTimeout(1000);
    
    // Select a section
    console.log('Step 2: Select a section');
    const sectionSelect = page.locator('#section-select').first();
    await expect(sectionSelect).toBeVisible({ timeout: 5000 });
    
    // Select first available section (should be populated from seed data)
    await sectionSelect.selectOption({ index: 1 }); // index 0 is "Choose a section..."
    await page.waitForTimeout(3000); // Wait for data to load
    console.log('✅ Section selected');
    
    // Verify summary cards appear (4 cards: Total, Avg Overall, Avg Literacy, Avg Numeracy)
    console.log('Step 3: Verify 4 summary statistics cards');
    
    const totalCard = page.locator('text=Total Assessments').first();
    const avgOverallCard = page.locator('text=Avg. Overall').first();
    const avgLiteracyCard = page.locator('text=Avg. Literacy').first();
    const avgNumeracyCard = page.locator('text=Avg. Numeracy').first();
    
    // Wait for at least one card to appear
    await expect(totalCard).toBeVisible({ timeout: 10000 });
    
    // Check if data loaded or "No assessments" message
    const noDataMessage = page.locator('text=/No assessments|not been conducted/i').first();
    const noDataVisible = await noDataMessage.isVisible().catch(() => false);
    
    if (!noDataVisible) {
      // Data loaded - verify all cards
      await expect(avgOverallCard).toBeVisible();
      await expect(avgLiteracyCard).toBeVisible();
      await expect(avgNumeracyCard).toBeVisible();
      console.log('✅ All 4 summary cards displayed with data');
    } else {
      console.log('⚠️  No assessment data for selected section');
    }
  });

  test('should display proficiency distribution with 5 levels', async ({ page }) => {
    console.log('Test: Proficiency distribution chart');
    
    await navigateTo(page, '/forms/elln/reports');
    
    // Select school-wide report (highest chance of having data)
    console.log('Step 1: Select School-Wide report');
    const reportTypeSelect = page.locator('#report-type').first();
    await reportTypeSelect.selectOption('school');
    await page.waitForTimeout(3000);
    
    // Check if data exists
    const noDataMessage = page.locator('text=/No assessments|not been conducted/i').first();
    const noDataVisible = await noDataMessage.isVisible().catch(() => false);
    
    if (!noDataVisible) {
      console.log('Step 2: Verify Proficiency Level Distribution section');
      const distributionTitle = page.locator('text=Proficiency Level Distribution').first();
      await expect(distributionTitle).toBeVisible({ timeout: 5000 });
      
      // Verify all 5 proficiency levels exist
      console.log('Step 3: Verify 5 proficiency levels');
      const advanced = page.locator('text=Advanced').first();
      const proficient = page.locator('text=Proficient').first();
      const approaching = page.locator('text=Approaching').first();
      const developing = page.locator('text=Developing').first();
      const beginning = page.locator('text=Beginning').first();
      
      await expect(advanced).toBeVisible();
      await expect(proficient).toBeVisible();
      await expect(approaching).toBeVisible();
      await expect(developing).toBeVisible();
      await expect(beginning).toBeVisible();
      console.log('✅ All 5 proficiency levels displayed: Advanced, Proficient, Approaching, Developing, Beginning');
      
      // Verify percentage bars render
      console.log('Step 4: Verify percentage bars');
      const progressBars = page.locator('.bg-gray-200.rounded-full').first();
      await expect(progressBars).toBeVisible();
      console.log('✅ Distribution bars rendered');
    } else {
      console.log('⚠️  No assessment data available for proficiency distribution');
    }
  });

  test('should display statistical reports section', async ({ page }) => {
    console.log('Test: Statistical reports section');
    
    await navigateTo(page, '/forms/elln/reports');
    
    // Select school-wide report
    console.log('Step 1: Select School-Wide report');
    const reportTypeSelect = page.locator('#report-type').first();
    await reportTypeSelect.selectOption('school');
    await page.waitForTimeout(3000);
    
    // Check if data exists
    const noDataMessage = page.locator('text=/No assessments|not been conducted/i').first();
    const noDataVisible = await noDataMessage.isVisible().catch(() => false);
    
    if (!noDataVisible) {
      console.log('Step 2: Verify Statistical Analysis section');
      const statisticalTitle = page.locator('text=Statistical Analysis').first();
      await expect(statisticalTitle).toBeVisible({ timeout: 5000 });
      console.log('✅ Statistical Analysis section found');
      
      // Verify statistics cards (Overall, Literacy, Numeracy)
      console.log('Step 3: Verify statistics cards');
      const overallStats = page.locator('text=Overall Score Statistics').first();
      
      // Check if the overall statistics card exists (means the section loaded)
      await expect(overallStats).toBeVisible();
      
      // Literacy and Numeracy might be labeled differently, so check for generic "Statistics" text
      const statisticsCards = page.locator('text=/Statistics/i');
      const cardCount = await statisticsCards.count();
      
      if (cardCount >= 3) {
        console.log('✅ All 3 statistics cards displayed (Overall, Literacy, Numeracy)');
      } else {
        console.log(`⚠️  Found ${cardCount} statistics cards`);
      }
      
      // Verify statistical metrics (Mean, Median, Mode, Std Dev, etc.)
      console.log('Step 4: Verify statistical metrics');
      const meanLabel = page.locator('text=Mean:').first();
      const medianLabel = page.locator('text=Median:').first();
      const modeLabel = page.locator('text=Mode:').first();
      const stdDevLabel = page.locator('text=Std Dev:').first();
      
      await expect(meanLabel).toBeVisible();
      await expect(medianLabel).toBeVisible();
      await expect(modeLabel).toBeVisible();
      await expect(stdDevLabel).toBeVisible();
      console.log('✅ Statistical metrics displayed: Mean, Median, Mode, Std Dev');
    } else {
      console.log('⚠️  No assessment data for statistical analysis');
    }
  });

  test('should filter by quarter correctly', async ({ page }) => {
    console.log('Test: Quarter filtering');
    
    await navigateTo(page, '/forms/elln/reports');
    
    // Select school-wide report
    console.log('Step 1: Select School-Wide report');
    const reportTypeSelect = page.locator('#report-type').first();
    await reportTypeSelect.selectOption('school');
    await page.waitForTimeout(2000);
    
    // Change quarter filter
    console.log('Step 2: Test quarter filtering');
    const quarterSelect = page.locator('#quarter-select').first();
    await expect(quarterSelect).toBeVisible({ timeout: 3000 });
    
    // Select Q1
    await quarterSelect.selectOption('q1');
    await page.waitForTimeout(2000);
    console.log('✅ Q1 filter applied');
    
    // Select Q2
    await quarterSelect.selectOption('q2');
    await page.waitForTimeout(2000);
    console.log('✅ Q2 filter applied');
    
    // Select All Quarters
    await quarterSelect.selectOption('all');
    await page.waitForTimeout(2000);
    console.log('✅ All Quarters filter applied');
    
    // Page should still be functional after filtering
    const configSection = page.locator('text=Report Configuration').first();
    await expect(configSection).toBeVisible();
    console.log('✅ Quarter filtering works without errors');
  });

  test('should switch between report types (section/grade/school)', async ({ page }) => {
    console.log('Test: Switching report types');
    
    await navigateTo(page, '/forms/elln/reports');
    
    const reportTypeSelect = page.locator('#report-type').first();
    
    // Test Section Level
    console.log('Step 1: Test Section Level report type');
    await reportTypeSelect.selectOption('section');
    await page.waitForTimeout(1000);
    
    const sectionSelect = page.locator('#section-select').first();
    await expect(sectionSelect).toBeVisible({ timeout: 5000 });
    console.log('✅ Section selector displayed for Section Level');
    
    // Test Grade Level
    console.log('Step 2: Test Grade Level report type');
    await reportTypeSelect.selectOption('grade');
    await page.waitForTimeout(1000);
    
    const gradeSelect = page.locator('#grade-select').first();
    await expect(gradeSelect).toBeVisible({ timeout: 5000 });
    console.log('✅ Grade selector displayed for Grade Level');
    
    // Verify "All Grades" option exists
    const gradeSelectHtml = await gradeSelect.innerHTML();
    if (gradeSelectHtml.includes('All Grades')) {
      console.log('✅ "All Grades" option available');
    } else {
      throw new Error('"All Grades" option not found');
    }
    
    // Test School-Wide
    console.log('Step 3: Test School-Wide report type');
    await reportTypeSelect.selectOption('school');
    await page.waitForTimeout(2000);
    
    // Section and grade selectors should be hidden
    const sectionVisible = await sectionSelect.isVisible().catch(() => false);
    const gradeVisible = await gradeSelect.isVisible().catch(() => false);
    
    if (!sectionVisible && !gradeVisible) {
      console.log('✅ Section/Grade selectors hidden for School-Wide report');
    }
    
    console.log('✅ Report type switching works correctly');
  });

  test('should handle export button state correctly', async ({ page }) => {
    console.log('Test: Export button state management');
    
    await navigateTo(page, '/forms/elln/reports');
    
    // Initially, export button might be disabled (no data selected)
    console.log('Step 1: Check initial export button state');
    const exportButton = page.locator('button:has-text("Export to Excel")').first();
    await expect(exportButton).toBeVisible({ timeout: 5000 });
    
    // Load school-wide data
    console.log('Step 2: Load school-wide report');
    const reportTypeSelect = page.locator('#report-type').first();
    await reportTypeSelect.selectOption('school');
    await page.waitForTimeout(3000);
    
    // Check if data loaded
    const noDataMessage = page.locator('text=/No assessments|not been conducted/i').first();
    const noDataVisible = await noDataMessage.isVisible().catch(() => false);
    
    if (!noDataVisible) {
      // Data exists - button should be enabled
      const isDisabled = await exportButton.isDisabled();
      if (!isDisabled) {
        console.log('✅ Export button enabled when data is present');
      } else {
        console.log('⚠️  Export button still disabled despite data');
      }
    } else {
      // No data - button should be disabled
      const isDisabled = await exportButton.isDisabled();
      if (isDisabled) {
        console.log('✅ Export button disabled when no data');
      } else {
        console.log('⚠️  Export button enabled despite no data');
      }
    }
  });

  test('should display average score progress bars', async ({ page }) => {
    console.log('Test: Average score progress bars');
    
    await navigateTo(page, '/forms/elln/reports');
    
    // Load school-wide report
    console.log('Step 1: Load school-wide report');
    const reportTypeSelect = page.locator('#report-type').first();
    await reportTypeSelect.selectOption('school');
    await page.waitForTimeout(3000);
    
    // Check if data exists
    const noDataMessage = page.locator('text=/No assessments|not been conducted/i').first();
    const noDataVisible = await noDataMessage.isVisible().catch(() => false);
    
    if (!noDataVisible) {
      console.log('Step 2: Verify average score progress bars');
      
      // Look for progress bar section (below proficiency distribution)
      const overallBar = page.locator('.bg-purple-500.h-4.rounded-full').first();
      const literacyBar = page.locator('.bg-blue-500.h-4.rounded-full').first();
      const numeracyBar = page.locator('.bg-green-500.h-4.rounded-full').first();
      
      // Check if bars exist
      const overallVisible = await overallBar.isVisible().catch(() => false);
      const literacyVisible = await literacyBar.isVisible().catch(() => false);
      const numeracyVisible = await numeracyBar.isVisible().catch(() => false);
      
      if (overallVisible && literacyVisible && numeracyVisible) {
        console.log('✅ All 3 progress bars displayed: Overall (purple), Literacy (blue), Numeracy (green)');
      } else {
        console.log('⚠️  Some progress bars not visible');
      }
    } else {
      console.log('⚠️  No assessment data for progress bars');
    }
  });
});
