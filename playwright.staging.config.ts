import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000, // Longer timeout for staging
  expect: { timeout: 10_000 },
  
  // Run tests in parallel
  fullyParallel: false, // Sequential for E2E tests
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 1,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  use: {
    baseURL: 'https://edusync-staging.web.app',
    
    // Timeouts
    actionTimeout: 30_000,
    navigationTimeout: 45_000,
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1920, height: 1080 },
  },
  
  // NO webServer - testing deployed staging site
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Slow down for stability
        launchOptions: {
          slowMo: 100,
        }
      },
    },
  ],
});
