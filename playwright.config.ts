import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5174',
  },
  webServer: {
    command: 'npm run dev',
    port: 5174,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI, // Only start new server if not in CI and no existing server
    stdout: 'pipe', // Capture output
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
