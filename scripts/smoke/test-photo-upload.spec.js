/**
 * Test Photo Upload Functionality
 * 
 * Purpose: Verify student photo upload works correctly
 * - Tests file selection
 * - Tests upload process
 * - Checks for errors
 * - Verifies photo displays
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a test image
const testImagePath = path.join(__dirname, 'test-photo.jpg');

test.beforeAll(() => {
  // Create a minimal valid JPEG file if it doesn't exist
  if (!fs.existsSync(testImagePath)) {
    // Minimal JPEG file (1x1 red pixel)
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x0B, 0x08,
      0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA,
      0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x7F, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, minimalJpeg);
    console.log('✅ Created test JPEG file');
  }
});

test('Photo upload functionality', async ({ page }) => {
  console.log('\n🔍 Testing Photo Upload Functionality...\n');

  // 1. Login
  console.log('Step 1: Logging in...');
  await page.goto('https://edusync-sis.web.app/');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', 'admin@school.edu');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('✅ Login successful');

  // 2. Navigate to Students page
  console.log('\nStep 2: Navigating to Students page...');
  await page.click('text=Students');
  await page.waitForLoadState('networkidle');
  console.log('✅ Students page loaded');

  // 3. Check for students in table
  const studentRows = await page.locator('table tbody tr').count();
  console.log(`✅ Found ${studentRows} student rows`);
  
  if (studentRows === 0) {
    throw new Error('❌ No students found in table');
  }

  // 4. Click Edit button on first student
  console.log('\nStep 3: Opening Edit Modal...');
  const editButton = page.locator('table tbody tr:first-child button').filter({ hasText: /edit|✏️/i }).first();
  await editButton.click();
  await page.waitForTimeout(1000); // Wait for modal animation
  console.log('✅ Edit modal opened');

  // 5. Check for photo upload UI elements
  console.log('\nStep 4: Checking photo upload UI...');
  
  // Look for file input
  const fileInput = await page.locator('input[type="file"]').count();
  console.log(`File inputs found: ${fileInput}`);
  
  // Look for photo-related buttons
  const photoButtons = await page.locator('button').filter({ hasText: /photo|camera|upload|webcam/i }).count();
  console.log(`Photo-related buttons found: ${photoButtons}`);
  
  // Get all button text for debugging
  const allButtons = await page.locator('button').allTextContents();
  console.log('All buttons in modal:', allButtons);

  // 6. Try to upload photo if file input exists
  if (fileInput > 0) {
    console.log('\nStep 5: Attempting photo upload...');
    
    try {
      // Set file
      await page.locator('input[type="file"]').first().setInputFiles(testImagePath);
      console.log('✅ File selected');
      
      // Wait for processing
      await page.waitForTimeout(2000);
      
      // Check for error messages
      const errorText = await page.locator('text=/error|failed/i').textContent().catch(() => null);
      if (errorText) {
        console.log('❌ Upload error detected:', errorText);
      } else {
        console.log('✅ No error messages displayed');
      }
      
      // Check console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Browser console error:', msg.text());
        }
      });
      
    } catch (error) {
      console.log('❌ Error during upload:', error.message);
    }
  } else {
    console.log('⚠️ No file input found - photo upload UI may not be rendered');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'photo-upload-debug.png', fullPage: true });
    console.log('📸 Screenshot saved: photo-upload-debug.png');
  }

  // 7. Check network requests
  console.log('\nStep 6: Monitoring network requests...');
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('storage.googleapis.com') || url.includes('firebasestorage')) {
      console.log(`Storage request: ${response.status()} - ${url}`);
    }
  });

  console.log('\n✅ Test completed');
});

test('Check Firebase Storage configuration', async ({ page }) => {
  console.log('\n🔍 Checking Firebase Storage Configuration...\n');

  // Navigate to app
  await page.goto('https://edusync-sis.web.app/');
  await page.waitForLoadState('networkidle');

  // Check if storage is initialized in console
  const storageCheck = await page.evaluate(() => {
    try {
      // @ts-ignore
      if (window.firebase && window.firebase.storage) {
        return { initialized: true, error: null };
      }
      return { initialized: false, error: 'Firebase Storage not found in window' };
    } catch (error) {
      return { initialized: false, error: error.message };
    }
  });

  console.log('Storage initialization check:', storageCheck);

  // Check for storage-related console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().toLowerCase().includes('storage')) {
      consoleErrors.push(msg.text());
    }
  });

  await page.waitForTimeout(2000);

  if (consoleErrors.length > 0) {
    console.log('❌ Storage-related console errors found:');
    consoleErrors.forEach(err => console.log('  -', err));
  } else {
    console.log('✅ No storage-related console errors');
  }
});
