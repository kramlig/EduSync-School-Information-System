import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Emulator Testing
 * 
 * This config assumes Firebase emulators are already running via:
 * npm run dev:emu (in a separate terminal)
 * 
 * The emulator setup provides:
 * - Firestore on port 8086
 * - Auth on port 9100
 * - Vite dev server on http://127.0.0.1:5173
 */

export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // 2 minutes for E2E tests
  expect: { timeout: 10_000 },
  
  fullyParallel: false, // Run tests sequentially to avoid data conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid race conditions with emulator data
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  // Don't start a webServer - assume dev:emu is already running
  // If you want Playwright to start it automatically, uncomment below:
  /*
  webServer: {
    command: 'npm run dev:emu',
    url: 'http://localhost:5173',
    timeout: 180_000, // 3 minutes for emulator + seeding
    reuseExistingServer: true, // Use existing server if available
    stdout: 'pipe',
    stderr: 'pipe',
  },
  */

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Emulator-specific settings
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
  ],
});
