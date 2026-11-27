import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./stories/tests",
  workers: 1,
  use: { browserName: "chromium", viewport: { width: 900, height: 700 }, reducedMotion: "reduce" },
});
