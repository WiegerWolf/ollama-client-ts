import { defineConfig, devices } from '@playwright/test'
import path from 'path'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),
  /* Run tests in files in parallel - disabled for database consistency */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI and limit workers for database consistency */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Set test environment variables */
    extraHTTPHeaders: {
      'x-test-mode': 'true',
      'x-msw-enabled': 'true'
    },
    
    /* Increase timeout for authentication flows */
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    /* Ignore HTTPS errors and enable service workers for MSW */
    ignoreHTTPSErrors: true,
    serviceWorkers: 'allow'
  },

  /* Configure projects for major browsers - focus on Chromium for stability */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Additional browser context options for testing */
        contextOptions: {
          /* Ignore HTTPS errors in test environment */
          ignoreHTTPSErrors: true,
        }
      },
    },

    // Disable other browsers for now to focus on fixing core issues
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: `file:${path.resolve(process.cwd(), 'test.db')}`,
      AUTH_SECRET: 'test-secret-key-for-e2e-tests-very-long-and-secure',
      NEXTAUTH_SECRET: 'test-secret-key-for-e2e-tests-very-long-and-secure',
      NEXTAUTH_URL: 'http://localhost:3000',
      NODE_ENV: 'test',
      TEST_MODE: 'true',
      NEXTAUTH_DEBUG: 'false'
    },
    /* Add stdout/stderr handling for better debugging */
    stdout: 'pipe',
    stderr: 'pipe'
  },
  
  /* Test output directory */
  outputDir: 'test-results/',
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10000
  },
  
  /* Global timeout for each test */
  timeout: 60000
})