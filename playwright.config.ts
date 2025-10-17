import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:5173',
  },
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 5173 --strictPort',
    port: 5173,
    timeout: 180_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
