// Serving the built frontend from the API origin (ARCH-001).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createApp: createAppWithOptions } = require("../src/app");

const createApp = (options = {}) =>
  createAppWithOptions({
    shopPin: "2468",
    sessionSecret: "test-secret-test-secret-test-secret",
    ...options,
  });

let dist;

beforeAll(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "tailor-web-"));
  fs.writeFileSync(path.join(dist, "index.html"), "<html>tailor app</html>");
  fs.mkdirSync(path.join(dist, "static"));
  fs.writeFileSync(path.join(dist, "static", "app.js"), "console.log(1)");
});

afterAll(() => fs.rmSync(dist, { recursive: true, force: true }));

describe("with webDist", () => {
  it("serves index.html at /", async () => {
    const res = await request(createApp({ webDist: dist })).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("tailor app");
  });

  it("serves static assets", async () => {
    const res = await request(createApp({ webDist: dist })).get(
      "/static/app.js",
    );
    expect(res.status).toBe(200);
    expect(res.text).toContain("console.log");
  });

  it("returns index.html for client-side routes", async () => {
    const res = await request(createApp({ webDist: dist })).get(
      "/Home/AllCustomer",
    );
    expect(res.status).toBe(200);
    expect(res.text).toContain("tailor app");
  });

  it("does not answer unknown API paths with index.html", async () => {
    const res = await request(createApp({ webDist: dist })).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.text).not.toContain("tailor app");
  });
});

describe("compression", () => {
  it("compresses the web app's assets when the browser accepts gzip", async () => {
    fs.writeFileSync(path.join(dist, "static", "big.js"), "x".repeat(20000));
    const res = await request(createApp({ webDist: dist }))
      .get("/static/big.js")
      .set("Accept-Encoding", "gzip");
    expect(res.headers["content-encoding"]).toBe("gzip");
  });
});

describe("without webDist", () => {
  it("does not serve a frontend", async () => {
    const res = await request(createApp()).get("/");
    expect(res.status).toBe(404);
  });
});
