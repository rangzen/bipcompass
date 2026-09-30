import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', use: { baseURL: 'http://localhost:5173', viewport: { width: 393, height: 851 } }, webServer: { command: 'npm run dev -- --port 5173', url: 'http://localhost:5173', reuseExistingServer: false } });
