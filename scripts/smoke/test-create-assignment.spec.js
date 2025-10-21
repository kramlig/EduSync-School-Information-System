// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://edusync-sis.web.app';

test.describe('Create Assignment Test', () => {
    test('Should create a new assignment successfully', async ({ page }) => {
        // Login
        await page.goto(BASE_URL);
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.fill('input[type="email"]', 'admin@school.edu');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Login")');
        
        // Wait for dashboard to load
        await page.waitForSelector('text=Dashboard', { timeout: 15000 });
        console.log('✅ Logged in successfully');
        
        // Navigate to Assignments page
        await page.click('text=Assignments');
        await page.waitForSelector('h1:has-text("Assignments")', { timeout: 10000 });
        console.log('✅ Navigated to Assignments page');
        
        // Select a class
        const classSelector = page.locator('select').first();
        await classSelector.waitFor({ timeout: 5000 });
        const classOptions = await classSelector.locator('option').evaluateAll(opts => 
            opts.map(o => ({ value: o.value, text: o.textContent })).filter(o => o.value && o.value !== '')
        );
        
        if (classOptions.length === 0) {
            throw new Error('No classes available');
        }
        
        await classSelector.selectOption(classOptions[0].value);
        console.log(`✅ Selected class: ${classOptions[0].text}`);
        
        // Wait a moment for learning areas to load
        await page.waitForTimeout(1000);
        
        // Select a learning area
        const laSelector = page.locator('select').nth(1);
        await laSelector.waitFor({ timeout: 5000 });
        const laOptions = await laSelector.locator('option').evaluateAll(opts => 
            opts.map(o => ({ value: o.value, text: o.textContent })).filter(o => o.value && o.value !== '')
        );
        
        if (laOptions.length === 0) {
            throw new Error('No learning areas available');
        }
        
        await laSelector.selectOption(laOptions[0].value);
        console.log(`✅ Selected learning area: ${laOptions[0].text}`);
        
        // Wait for New button to be enabled
        await page.waitForTimeout(500);
        
        // Click New Assignment button
        const newButton = page.locator('button:has-text("New")');
        await expect(newButton).toBeEnabled({ timeout: 5000 });
        await newButton.click();
        console.log('✅ Clicked New Assignment button');
        
        // Wait for modal to open
        await page.waitForSelector('text=Create Assignment', { timeout: 5000 });
        console.log('✅ Create Assignment modal opened');
        
        // Fill in assignment details
        const timestamp = Date.now();
        const assignmentTitle = `Test Assignment ${timestamp}`;
        await page.fill('input[type="text"]', assignmentTitle);
        await page.fill('textarea', 'This is a test assignment created by automated test');
        await page.fill('input[type="number"]', '100');
        
        // Set due date (7 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        await page.fill('input[type="date"]', dueDateStr);
        
        console.log(`✅ Filled assignment form: ${assignmentTitle}`);
        
        // Listen for console errors
        let hasError = false;
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('❌ Browser console error:', msg.text());
                hasError = true;
            }
        });
        
        // Listen for network failures
        page.on('requestfailed', request => {
            console.error('❌ Request failed:', request.url(), request.failure()?.errorText);
            hasError = true;
        });
        
        // Click Save button
        await page.click('button:has-text("Save")');
        console.log('✅ Clicked Save button');
        
        // Wait for modal to close
        await page.waitForSelector('text=Create Assignment', { state: 'hidden', timeout: 10000 });
        console.log('✅ Modal closed');
        
        // Wait a moment for the assignment to be added
        await page.waitForTimeout(2000);
        
        // Check if assignment appears in the list
        const assignmentInList = await page.locator(`text=${assignmentTitle}`).count();
        
        if (assignmentInList > 0) {
            console.log('✅ Assignment appears in the list');
        } else {
            console.error('❌ Assignment NOT found in the list');
            
            // Take a screenshot for debugging
            await page.screenshot({ path: 'test-results/assignment-not-created.png', fullPage: true });
            
            // Check console for errors
            if (hasError) {
                throw new Error('Assignment creation failed with console/network errors');
            } else {
                throw new Error('Assignment not found in list after creation (no console errors detected)');
            }
        }
        
        expect(assignmentInList).toBeGreaterThan(0);
    });
});
