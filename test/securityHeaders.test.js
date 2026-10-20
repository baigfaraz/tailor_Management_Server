// Security headers (SEC-004).
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createApp } = require("../src/app");

const app = createApp({
  shopPin: "2468",
  sessionSecret: "test-secret-test-secret-test-secret",
});

describe("security headers", () => {
  it.each(["/api/session", "/api/does-not-exist"])(
    "are set on %s",
    async (path) => {
      const res = await request(app).get(path);
      expect(res.headers["x-powered-by"]).toBeUndefined();
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("DENY");
      expect(res.headers["referrer-policy"]).toBe("no-referrer");
      expect(res.headers["content-security-policy"]).toContain(
        "default-src 'self'",
      );
      expect(res.headers["content-security-policy"]).toContain(
        "frame-ancestors 'none'",
      );
    },
  );
});
