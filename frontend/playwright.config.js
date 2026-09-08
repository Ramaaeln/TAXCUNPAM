import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173", reuseExistingServer: false,
    env: { VITE_BASE_URL: "/api" },
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-iphone", use: { ...devices["iPhone 13"] } },
    { name: "chromium-android", use: { ...devices["Pixel 7"] } },
    { name: "webkit-tablet", use: { ...devices["iPad (gen 7)"] } },
  ],
});
