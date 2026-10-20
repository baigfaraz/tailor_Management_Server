// Shop PIN per device (SEC-001).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createRequire } from "node:module";
import { clearDb, startDb, stopDb } from "./helpers/db.js";

const require = createRequire(import.meta.url);
const { createApp } = require("../src/app");

const SECRET = "test-secret-test-secret-test-secret";
const makeApp = (shopPin = "2468", options = {}) =>
  createApp({ shopPin, sessionSecret: SECRET, ...options });

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe("locked device", () => {
  it.each([
    ["get", "/api/customerDetail/somedata"],
    ["get", "/api/customerDetail/1"],
    ["post", "/api/customerDetail"],
    ["put", "/api/customerDetail/orderStatus/1"],
    ["put", "/api/customerDetail/paymentStatus/1"],
    ["delete", "/api/customerDetail/delete/1"],
  ])("%s %s returns 401", async (method, path) => {
    const res = await request(makeApp())[method](path);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "This device is not unlocked." });
  });

  it("reports unlocked: false", async () => {
    const res = await request(makeApp()).get("/api/session");
    expect(res.body).toEqual({ unlocked: false });
  });
});

describe("unlocking", () => {
  it("rejects a wrong PIN", async () => {
    const res = await request(makeApp())
      .post("/api/session")
      .send({ pin: "0000" });
    expect(res.status).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("rejects a missing or non-string PIN", async () => {
    const app = makeApp();
    expect((await request(app).post("/api/session").send({})).status).toBe(401);
    expect(
      (await request(app).post("/api/session").send({ pin: 2468 })).status,
    ).toBe(401);
  });

  it("sets an httpOnly, SameSite=Strict cookie and opens the API", async () => {
    const agent = request.agent(makeApp());
    const res = await agent.post("/api/session").send({ pin: "2468" });

    expect(res.status).toBe(200);
    const cookie = res.headers["set-cookie"][0];
    expect(cookie).toMatch(/^tailor_device=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);

    expect((await agent.get("/api/session")).body).toEqual({ unlocked: true });
    expect((await agent.get("/api/customerDetail/somedata")).status).toBe(200);
  });

  it("forgets the device on DELETE /api/session", async () => {
    const agent = request.agent(makeApp());
    await agent.post("/api/session").send({ pin: "2468" });
    await agent.delete("/api/session");
    expect((await agent.get("/api/customerDetail/somedata")).status).toBe(401);
  });

  it("rejects a forged cookie", async () => {
    const res = await request(makeApp())
      .get("/api/customerDetail/somedata")
      .set("Cookie", "tailor_device=1700000000000.deadbeef");
    expect(res.status).toBe(401);
  });

  it("signs out every device when the PIN changes", async () => {
    const agent = request.agent(makeApp("2468"));
    const res = await agent.post("/api/session").send({ pin: "2468" });
    const cookie = res.headers["set-cookie"][0].split(";")[0];

    const afterChange = await request(makeApp("1357"))
      .get("/api/customerDetail/somedata")
      .set("Cookie", cookie);
    expect(afterChange.status).toBe(401);
  });
});

describe("brute force protection", () => {
  it("locks out after 5 wrong PINs, even for the right PIN", async () => {
    const app = makeApp();
    for (let i = 0; i < 5; i += 1) {
      expect(
        (await request(app).post("/api/session").send({ pin: "0000" })).status,
      ).toBe(401);
    }
    const locked = await request(app)
      .post("/api/session")
      .send({ pin: "2468" });
    expect(locked.status).toBe(429);
  });
});

describe("CORS allowlist", () => {
  it("allows listed origins with credentials", async () => {
    const res = await request(
      makeApp("2468", { corsOrigins: ["http://192.168.1.20:3000"] }),
    )
      .get("/api/session")
      .set("Origin", "http://192.168.1.20:3000");
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://192.168.1.20:3000",
    );
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });
});
