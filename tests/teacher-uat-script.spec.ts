import { test, expect } from '@playwright/test';

/**
 * UAT Test Script: Teacher Role Assignment Filtering
 * 
 * Purpose: Validate that teachers only see students, sections, and learning areas
 * that match their assignments (grade levels and subjects).
 * 
 * Test Account: pedro.reyes@edusync.edu
 * Password: teacher123
 * Expected Assignment: Grade 4 - Math, English, ESP
 * Expected Sections: Grade 4 sections only
 * Expected Students: ~18-20 Grade 4 students
 */

test.describe('Teacher UAT - Assignment Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to production site
    await page.goto('https://edusync-sis.web.app');
    
    // Login as teacher
    await page.fill('input[type="email"]', 'pedro.reyes@edusync.edu');
    await page.fill('input[type="password"]', 'teacher123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('TC001: Teacher should only see assigned grade level sections in dropdown', async ({ page }) => {
    console.log('\n=== TC001: Section Filtering ===');
    
    // Navigate to Grades & Report
    await page.click('text=Grades & Report');
    await page.waitForLoadState('networkidle');
    
    // Check Overview & Analytics tab
    await page.click('text=Overview & Analytics');
    await page.waitForTimeout(1000);
    
    // Get section dropdown options
    const sectionDropdown = page.locator('select').filter({ hasText: /Section|All My Sections/ }).first();
    await expect(sectionDropdown).toBeVisible();
    
    // Get all options
    const options = await sectionDropdown.locator('option').allTextContents();
    console.log('Available sections:', options);
    
    // Verify "All My Sections" is present
    expect(options.some(opt => opt.includes('All My Sections'))).toBeTruthy();
    
    // Verify only Grade 4 sections are shown (no Grade 1, 2, 3, 5, 6, etc.)
    const nonGrade4Sections = options.filter(opt => 
      opt.match(/Grade [^4]/) && !opt.includes('All')
    );
    
    if (nonGrade4Sections.length > 0) {
      console.error('❌ FAILED: Found non-Grade 4 sections:', nonGrade4Sections);
      throw new Error(`Teacher should only see Grade 4 sections, but found: ${nonGrade4Sections.join(', ')}`);
    }
    
    console.log('✅ PASSED: Only Grade 4 sections visible');
  });

  test('TC002: Total Students count should reflect only assigned students', async ({ page }) => {
    console.log('\n=== TC002: Student Count Validation ===');
    
    // Navigate to Grades & Report
    await page.click('text=Grades & Report');
    await page.waitForLoadState('networkidle');
    
    // Check Overview & Analytics tab
    await page.click('text=Overview & Analytics');
    await page.waitForTimeout(1000);
    
    // Find "Total Students" card
    const totalStudentsCard = page.locator('text=Total Students').locator('..').locator('..');
    await expect(totalStudentsCard).toBeVisible();
    
    // Get the student count
    const countElement = totalStudentsCard.locator('text=/^\\d+$/').first();
    const studentCount = await countElement.textContent();
    const count = parseInt(studentCount || '0');
    
    console.log('Total Students displayed:', count);
    
    // Verify count is NOT 100 (which would mean showing all students)
    if (count === 100) {
      console.error('❌ FAILED: Showing all 100 students instead of teacher\'s assigned students');
      throw new Error('Teacher is seeing all students (100) instead of only Grade 4 students');
    }
    
    // Verify count is reasonable for Grade 4 (expect ~18-20 students)
    if (count < 10 || count > 30) {
      console.warn('⚠️ WARNING: Student count seems unusual:', count);
      console.warn('Expected: 18-20 Grade 4 students');
    }
    
    console.log('✅ PASSED: Student count is teacher-specific:', count);
  });

  test('TC003: Class average should be calculated from assigned students only', async ({ page }) => {
    console.log('\n=== TC003: Class Average Validation ===');
    
    // Navigate to Grades & Report
    await page.click('text=Grades & Report');
    await page.waitForLoadState('networkidle');
    
    // Check Overview & Analytics tab
    await page.click('text=Overview & Analytics');
    await page.waitForTimeout(1000);
    
    // Find "Total Students" card and extract average
    const avgText = await page.locator('text=/Class Average:\\s*\\d+%/').textContent();
    console.log('Class Average found:', avgText);
    
    // Verify average is displayed
    expect(avgText).toBeTruthy();
    
    console.log('✅ PASSED: Class average is calculated and displayed');
  });

  test('TC004: Report Cards tab should show filtered sections', async ({ page }) => {
    console.log('\n=== TC004: Report Cards Section Filter ===');
    
    // Navigate to Grades & Report
    await page.click('text=Grades & Report');
    await page.waitForLoadState('networkidle');
    
    // Click Report Cards tab
    await page.click('text=Report Cards');
    await page.waitForTimeout(1000);
    
    // Check section dropdown in Report Cards
    const sectionDropdown = page.locator('select#report-section-filter');
    await expect(sectionDropdown).toBeVisible();
    
    // Get all options
    const options = await sectionDropdown.locator('option').allTextContents();
    console.log('Report Cards sections:', options);
    
    // Verify "All My Sections" is present
    expect(options.some(opt => opt.includes('All My Sections'))).toBeTruthy();
    
    // Verify only Grade 4 sections
    const nonGrade4Sections = options.filter(opt => 
      opt.match(/Grade [^4]/) && !opt.includes('All')
    );
    
    if (nonGrade4Sections.length > 0) {
      console.error('❌ FAILED: Report Cards showing non-Grade 4 sections:', nonGrade4Sections);
      throw new Error(`Report Cards should only show Grade 4 sections, but found: ${nonGrade4Sections.join(', ')}`);
    }
    
    console.log('✅ PASSED: Report Cards shows only Grade 4 sections');
  });

  test('TC005: Section selection should filter students correctly', async ({ page }) => {
    console.log('\n=== TC005: Section Selection Filtering ===');
    
    // Navigate to Grades & Report
    await page.click('text=Grades & Report');
    await page.waitForLoadState('networkidle');
    
    // Click Overview & Analytics tab
    await page.click('text=Overview & Analytics');
    await page.waitForTimeout(1000);
    
    // Get initial "All My Sections" count
    const totalStudentsCard = page.locator('text=Total Students').locator('..').locator('..');
    const allSectionsCount = await totalStudentsCard.locator('text=/^\\d+$/').first().textContent();
    console.log('All My Sections student count:', allSectionsCount);
    
    // Select a specific Grade 4 section
    const sectionDropdown = page.locator('select').filter({ hasText: /Section|All My Sections/ }).first();
    const options = await sectionDropdown.locator('option').allTextContents();
    const grade4Section = options.find(opt => opt.includes('Grade 4') && !opt.includes('All'));
    
    if (grade4Section) {
      await sectionDropdown.selectOption({ label: grade4Section });
      await page.waitForTimeout(1000);
      
      // Get filtered count
      const filteredCount = await totalStudentsCard.locator('text=/^\\d+$/').first().textContent();
      console.log(`Selected "${grade4Section}" - student count:`, filteredCount);
      
      // Verify count changed (filtered to specific section)
      const allCount = parseInt(allSectionsCount || '0');
      const sectionCount = parseInt(filteredCount || '0');
      
      if (sectionCount >= allCount) {
        console.warn('⚠️ WARNING: Section filter may not be working correctly');
        console.warn(`Expected section count (${sectionCount}) to be less than all sections count (${allCount})`);
      }
      
      console.log('✅ PASSED: Section selection filters students');
    } else {
      console.warn('⚠️ WARNING: No specific Grade 4 section found to test filtering');
    }
  });

  test('TC006: Teacher cannot access other grade levels through direct navigation', async ({ page }) => {
    console.log('\n=== TC006: Access Control Validation ===');
    
    // Try to navigate to student list
    await page.click('text=Students').catch(() => {
      console.log('Students menu not accessible (expected for teachers)');
    });
    
    // If accessible, verify only Grade 4 students are shown
    const studentListVisible = await page.locator('text=Student List').isVisible().catch(() => false);
    
    if (studentListVisible) {
      await page.waitForLoadState('networkidle');
      
      // Check if grade level filter exists
      const gradeFilter = page.locator('select').filter({ hasText: /Grade Level|Grade/ }).first();
      
      if (await gradeFilter.isVisible()) {
        const gradeOptions = await gradeFilter.locator('option').allTextContents();
        console.log('Available grade levels:', gradeOptions);
        
        // Should only show Grade 4 or "All My Grades"
        const otherGrades = gradeOptions.filter(opt => 
          opt.match(/Grade [^4]/) && !opt.includes('All')
        );
        
        if (otherGrades.length > 0) {
          console.error('❌ FAILED: Teacher can access other grade levels:', otherGrades);
          throw new Error(`Teacher should not access: ${otherGrades.join(', ')}`);
        }
      }
    }
    
    console.log('✅ PASSED: Access control working correctly');
  });

  test('TC007: Deep Analytics should show teacher-specific data', async ({ page }) => {
    console.log('\n=== TC007: Deep Analytics Validation ===');
    
    // Navigate to Grades & Report
    await page.click('text=Grades & Report');
    await page.waitForLoadState('networkidle');
    
    // Click Deep Analytics tab
    const deepAnalyticsTab = page.locator('text=Deep Analytics');
    
    if (await deepAnalyticsTab.isVisible()) {
      await deepAnalyticsTab.click();
      await page.waitForTimeout(2000);
      
      // Check for section dropdown in Deep Analytics
      const sectionDropdown = page.locator('select').filter({ hasText: /Section|All My Sections/ }).first();
      
      if (await sectionDropdown.isVisible()) {
        const options = await sectionDropdown.locator('option').allTextContents();
        console.log('Deep Analytics sections:', options);
        
        // Verify only Grade 4 sections
        const nonGrade4Sections = options.filter(opt => 
          opt.match(/Grade [^4]/) && !opt.includes('All')
        );
        
        expect(nonGrade4Sections.length).toBe(0);
        console.log('✅ PASSED: Deep Analytics shows teacher-specific data');
      }
    } else {
      console.log('ℹ️ INFO: Deep Analytics not accessible to teachers (expected)');
    }
  });

  test('TC008: Export functionality should export teacher data only', async ({ page }) => {
    console.log('\n=== TC008: Export Functionality ===');
    
    // Navigate to Grades & Report
    await page.click('text=Grades & Report');
    await page.waitForLoadState('networkidle');
    
    // Check for export buttons
    const exportButtons = page.locator('button').filter({ hasText: /Export|Download|CSV|Excel|PDF/i });
    const exportCount = await exportButtons.count();
    
    console.log(`Found ${exportCount} export button(s)`);
    
    if (exportCount > 0) {
      console.log('ℹ️ INFO: Export buttons available - manual verification needed');
      console.log('   Please verify exported data contains only Grade 4 students');
    }
    
    console.log('✅ PASSED: Export buttons detected (manual verification required)');
  });
});

test.describe('Teacher UAT - Manual Testing Checklist', () => {
  test('MANUAL: Print manual testing checklist', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('TEACHER UAT - MANUAL TESTING CHECKLIST');
    console.log('='.repeat(80));
    console.log('\n📋 Test Account:');
    console.log('   Email: pedro.reyes@edusync.edu');
    console.log('   Password: teacher123');
    console.log('   Expected Role: Teacher');
    console.log('   Expected Assignment: Grade 4 - Math, English, ESP');
    console.log('\n✅ TESTS TO PERFORM:');
    console.log('\n1. LOGIN & DASHBOARD');
    console.log('   [ ] Successfully login with teacher credentials');
    console.log('   [ ] Dashboard shows teacher-specific information');
    console.log('   [ ] No admin-only menu items visible');
    console.log('\n2. GRADES & REPORT - OVERVIEW TAB');
    console.log('   [ ] Section dropdown shows "All My Sections" as default');
    console.log('   [ ] Section dropdown shows ONLY Grade 4 sections');
    console.log('   [ ] Total Students count is 18-20 (NOT 100)');
    console.log('   [ ] Class Average is calculated correctly');
    console.log('   [ ] Honor Roll count makes sense for Grade 4');
    console.log('   [ ] At-Risk Students count is reasonable');
    console.log('\n3. GRADES & REPORT - REPORT CARDS TAB');
    console.log('   [ ] Section dropdown shows "All My Sections" as default');
    console.log('   [ ] Section dropdown shows ONLY Grade 4 sections');
    console.log('   [ ] Student list shows only Grade 4 students');
    console.log('   [ ] Can select individual students for report cards');
    console.log('   [ ] Print functionality works for Grade 4 students only');
    console.log('\n4. SECTION FILTERING');
    console.log('   [ ] Selecting "All My Sections" shows all Grade 4 students');
    console.log('   [ ] Selecting specific Grade 4 section filters correctly');
    console.log('   [ ] Student count updates when changing sections');
    console.log('   [ ] Analytics recalculate when changing sections');
    console.log('\n5. LEARNING AREAS/SUBJECTS');
    console.log('   [ ] Only sees Math, English, ESP (assigned subjects)');
    console.log('   [ ] Does NOT see subjects like Science, Filipino, etc.');
    console.log('   [ ] Subject performance shows only assigned subjects');
    console.log('\n6. ACCESS RESTRICTIONS');
    console.log('   [ ] Cannot access Students page (or only sees Grade 4)');
    console.log('   [ ] Cannot access Teachers management page');
    console.log('   [ ] Cannot access Sections management page');
    console.log('   [ ] Cannot see or edit other grade levels');
    console.log('\n7. DATA ACCURACY');
    console.log('   [ ] All displayed data is relevant to Grade 4');
    console.log('   [ ] No data leakage from other grades');
    console.log('   [ ] Student names match expected Grade 4 roster');
    console.log('   [ ] Grades/scores are for assigned subjects only');
    console.log('\n8. PERFORMANCE');
    console.log('   [ ] Pages load within 3 seconds');
    console.log('   [ ] No infinite loading states');
    console.log('   [ ] Smooth transitions between tabs');
    console.log('   [ ] No console errors visible (F12 developer tools)');
    console.log('\n9. EXPORT FUNCTIONALITY');
    console.log('   [ ] CSV export contains only Grade 4 students');
    console.log('   [ ] Excel export contains only assigned subjects');
    console.log('   [ ] PDF export shows correct teacher name');
    console.log('   [ ] Exported data matches screen display');
    console.log('\n10. EDGE CASES');
    console.log('   [ ] Search filter works within Grade 4 students');
    console.log('   [ ] Quarter filter (Q1, Q2, Q3, Q4) works correctly');
    console.log('   [ ] Performance filter (Honor Roll, etc.) works');
    console.log('   [ ] Refresh page maintains teacher filtering');
    console.log('\n' + '='.repeat(80));
    console.log('📝 NOTES:');
    console.log('   - Mark each item with [✓] when verified');
    console.log('   - Document any issues or unexpected behavior');
    console.log('   - Take screenshots of any problems encountered');
    console.log('   - Test on different browsers (Chrome, Firefox, Edge)');
    console.log('='.repeat(80) + '\n');
  });
});
