import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: {baseURL: "http://127.0.0.1:5173"},
  projects: [
    {name: "chromium", use: {...devices["Desktop Chrome"]}},
    {name: "firefox", use: {...devices["Desktop Firefox"]}},
  ],
  webServer: {command: "npm run dev", port: 5173},
});
