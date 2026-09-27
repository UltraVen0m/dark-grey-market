import { defineConfig } from "@playwright/test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must be set before running browser tests.");
}

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: false,
  webServer: [{ command: "node scripts/test-email-inbox.mjs", url: "http://127.0.0.1:3101", reuseExistingServer: false }, {
    command: "npm run db:test:reset && npm run db:migrate && npm run db:seed && npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET: "test-only-better-auth-secret-must-be-at-least-32-characters",
      BETTER_AUTH_URL: "http://127.0.0.1:3000",
      BETTER_AUTH_DISABLE_RATE_LIMIT: "true",
      RESEND_API_KEY: "test-only-key",
      TRADE_EMAIL_FROM: "trades@example.test",
      RESEND_API_URL: "http://127.0.0.1:3101/emails",
      CRON_SECRET: "test-only-cron-secret"
    }
  }],
  use: { baseURL: "http://127.0.0.1:3000" }
});
