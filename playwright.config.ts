import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3101',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'phone-320', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 700 } } },
    { name: 'phone-390', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: `"${process.execPath}" node_modules/next/dist/bin/next ${process.env.E2E_PRODUCTION === '1' ? 'start' : 'dev'} --port 3101`,
    url: 'http://localhost:3101',
    reuseExistingServer: false,
    env: {
      // SSR prefetches must not use the developer's application database either.
      DATABASE_CONNECTION_STRING: 'mongodb://127.0.0.1:1/cedrus_mobile_layout_test?serverSelectionTimeoutMS=200&connectTimeoutMS=200',
      NEXT_API_KEYS: 'mobile-e2e-fixture',
    },
    timeout: 120_000,
  },
});
