// Start-up environment validation.
import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { readEnv } = require("../src/config/env");

const valid = {
  MONGODB_URI: "mongodb://127.0.0.1/test",
  SHOP_PIN: "2468",
  SESSION_SECRET: "x".repeat(32),
};

describe("readEnv", () => {
  it("returns parsed config", () => {
    const config = readEnv({
      ...valid,
      PORT: "5001",
      CORS_ORIGINS: "http://a, http://b",
    });
    expect(config).toMatchObject({
      port: 5001,
      shopPin: "2468",
      corsOrigins: ["http://a", "http://b"],
    });
  });

  it("defaults port to 5000 and CORS to none", () => {
    expect(readEnv(valid)).toMatchObject({ port: 5000, corsOrigins: [] });
  });

  it("lists every missing or invalid variable", () => {
    expect(() => readEnv({ SHOP_PIN: "12" })).toThrow(
      /MONGODB_URI is missing[\s\S]*SHOP_PIN must be 4 to 8 digits[\s\S]*SESSION_SECRET/,
    );
  });
});
