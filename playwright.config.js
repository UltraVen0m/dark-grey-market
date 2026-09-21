import { defineConfig } from "@playwright/test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must be set before running browser tests.");
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  webServer: {
    command: "npm run db:test:reset && npm run db:migrate && npm run db:seed && npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    env: { DATABASE_URL: testDatabaseUrl }
  },
  use: { baseURL: "http://127.0.0.1:3000" }
});
