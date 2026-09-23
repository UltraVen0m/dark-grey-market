import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ include: /.*\\.[jt]sx?$/ })],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    exclude: ["tests/smoke/**", "node_modules/**", "dist/**", ".next/**"]
  }
});
