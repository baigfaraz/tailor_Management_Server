// Request and error logging (SEC-007).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createLogger } = require("../src/logger");
const { createApp } = require("../src/app");

let dir;
const readLines = () =>
  fs
    .readdirSync(dir)
    .flatMap((name) =>
      fs.readFileSync(path.join(dir, name), "utf8").trim().split("\n"),
    )
    .map((line) => JSON.parse(line));

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "tailor-logs-"));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("logger", () => {
  it("writes one JSON line per request without bodies or secrets", async () => {
    const logger = createLogger({ dir, echo: false });
    const app = createApp({
      shopPin: "2468",
      sessionSecret: "test-secret-test-secret-test-secret",
      logger,
    });

    await request(app).post("/api/session?x=1").send({ pin: "0000" });

    const [line] = readLines();
    expect(line).toMatchObject({
      level: "info",
      event: "request",
      method: "POST",
      path: "/api/session",
      status: 401,
    });
    expect(typeof line.ms).toBe("number");
    expect(JSON.stringify(line)).not.toContain("0000");
  });

  it("writes daily files and removes ones older than the retention", () => {
    for (const day of ["2026-01-01", "2026-01-10", "2026-01-14"]) {
      fs.writeFileSync(path.join(dir, `app-${day}.log`), "{}\n");
    }
    fs.writeFileSync(path.join(dir, "notes.txt"), "keep");

    const logger = createLogger({
      dir,
      retentionDays: 7,
      now: () => new Date("2026-01-15T10:00:00Z"),
      echo: false,
    });
    logger.info("test");

    expect(fs.readdirSync(dir).sort()).toEqual([
      "app-2026-01-10.log",
      "app-2026-01-14.log",
      "app-2026-01-15.log",
      "notes.txt",
    ]);
  });
});
