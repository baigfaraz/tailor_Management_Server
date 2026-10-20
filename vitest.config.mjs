import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    // First run downloads the MongoDB binary for mongodb-memory-server.
    hookTimeout: 120000,
    testTimeout: 20000,
    fileParallelism: false,
  },
});
