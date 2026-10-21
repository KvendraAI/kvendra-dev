// Playwright config for the site checks (tests/site-checks.spec.mjs). By default it serves the
// built dist/ with `astro preview`; set KVD_BASE_URL to check a live site instead.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.KVD_PREVIEW_PORT || 4398);
const LIVE = process.env.KVD_BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: LIVE || `http://127.0.0.1:${PORT}`,
    ...devices['Desktop Chrome'],
  },
  webServer: LIVE
    ? undefined
    : {
        command: `npx astro preview --host 127.0.0.1 --port ${PORT}`,
        url: `http://127.0.0.1:${PORT}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
