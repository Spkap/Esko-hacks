import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'live-error.spec.ts',
  workers: 1,
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3001' },
  webServer: {
    command: 'pnpm exec next dev --hostname 127.0.0.1 --port 3001',
    url: 'http://127.0.0.1:3001',
    env: { NEXT_PUBLIC_DATA_MODE: 'live' },
    timeout: 120000,
  },
});
