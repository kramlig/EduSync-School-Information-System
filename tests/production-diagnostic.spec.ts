import { test, expect } from '@playwright/test';

/**
 * DIAGNOSTIC: Check pedro.reyes production data
 */

test.describe('Production Data Diagnostic for pedro.reyes', () => {
  test('Check what sections and students pedro.reyes has access to', async ({ page }) => {
    console.log('\n=== PRODUCTION DATA DIAGNOSTIC ===\n');
    
    // Capture all console logs
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log(`CONSOLE: ${text}`);
    });
    
    // Login to PRODUCTION
    await page.goto('https://edusync-sis.web.app');
    await page.fill('input[type="email"]', 'pedro.reyes@edusync.edu');
    await page.fill('input[type="password"]', 'teacher123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 30000 });
    
    // Check dashboard stats
    console.log('\n--- DASHBOARD STATS ---');
    const totalStudentsEl = page.locator('text=Total Students').locator('..').locator('..');
    const totalStudents = await totalStudentsEl.locator('text=/^\\d+$/').first().textContent();
    console.log(`Total Students on Dashboard: ${totalStudents}`);
    
    // Navigate to Students page
    await page.click('text=Students');
    await page.waitForTimeout(2000);
    
    // Check Students page stats
    console.log('\n--- STUDENTS PAGE STATS ---');
    const stats = {
      total: await page.locator('text=TOTAL STUDENTS').locator('..').locator('text=/^\\d+$/').first().textContent().catch(() => '0'),
      active: await page.locator('text=ACTIVE').locator('..').locator('text=/^\\d+$/').first().textContent().catch(() => '0'),
      newMonth: await page.locator('text=NEW THIS MONTH').locator('..').locator('text=/^\\d+$/').first().textContent().catch(() => '0'),
      showing: await page.locator('text=SHOWING').locator('..').locator('text=/^\\d+$/').first().textContent().catch(() => '0'),
    };
    console.log('Statistics:', stats);
    
    // Check grade filter options
    const gradeSelect = page.locator('select').filter({ hasText: /Grade Level|All Grades/i }).first();
    const gradeOptions = await gradeSelect.locator('option').allTextContents().catch(() => []);
    console.log('Grade Level options:', gradeOptions);
    
    // Check if any students are in the table
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`Table rows: ${tableRows}`);
    
    // Check for empty state
    const hasEmptyState = await page.locator('text=/No Students Found|No students/i').isVisible().catch(() => false);
    console.log(`Empty state shown: ${hasEmptyState}`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/production-pedro-reyes-students.png', fullPage: true });
    
    // Parse console logs for relevant data
    console.log('\n--- RELEVANT CONSOLE LOGS ---');
    const relevantLogs = logs.filter(log => 
      log.includes('authorizedSection') ||
      log.includes('visibleStudents') ||
      log.includes('students') ||
      log.includes('section') ||
      log.includes('Loading check')
    );
    relevantLogs.forEach(log => console.log(log));
    
    console.log('\n=== DIAGNOSIS ===');
    if (stats.total === '0') {
      console.error('❌ CONFIRMED: Pedro Reyes sees 0 students');
      console.error('Possible causes:');
      console.error('  1. No students enrolled in Grade 4 sections');
      console.error('  2. Teacher not assigned to any sections with students');
      console.error('  3. Section assignments missing in production database');
      console.error('\nNEXT STEP: Check Firestore production database:');
      console.error('  - Check "sections" collection for Grade 4');
      console.error('  - Check "students" collection for sectionId matching Grade 4');
      console.error('  - Check "teachers" collection for pedro.reyes assignments');
    } else {
      console.log(`✅ Teacher sees ${stats.total} students`);
    }
  });
});
