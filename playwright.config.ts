import {defineConfig, devices} from "@playwright/test";

const port=Number(process.env['OBSERVATORY_TEST_PORT']??5173);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid isolated test port');
export default defineConfig({
  testDir: "tests/e2e",
  use: {baseURL: `http://127.0.0.1:${port}`},
  projects: [
    {name: "chromium", use: {...devices["Desktop Chrome"]}},
    {name: "firefox", use: {...devices["Desktop Firefox"]}},
  ],
  webServer: {command: `npm run build && npm exec vite preview -- --host 127.0.0.1 --port ${port} --strictPort`, port},
});
