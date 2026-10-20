// Characterization tests for /api/customerDetail (Phase 2 safety net, TEST-001).
// They record CURRENT behavior. Tests marked "current bug" document behavior that a
// later backlog item changes; update them in that item's commit.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createRequire } from "node:module";
import { clearDb, startDb, stopDb } from "./helpers/db.js";
import { customerInput } from "./helpers/fixtures.js";

const require = createRequire(import.meta.url);
const app = require("../src/app");

const API = "/api/customerDetail";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

async function createCustomer(overrides) {
  const res = await request(app).post(API).send(customerInput(overrides));
  expect(res.status).toBe(201);
  return res.body;
}

describe("POST /api/customerDetail", () => {
  it("creates a customer with sequential customer_id and unit suffixes", async () => {
    const first = await createCustomer();
    const second = await createCustomer({ customer_name: "Sara Khan" });

    expect(first.customer_id).toBe(1);
    expect(second.customer_id).toBe(2);
    expect(first.customer_waist).toBe("32 Inches");
    expect(first.customer_legLength).toBe("40 Inches");
    expect(first.customer_orderPrice).toBe("2500 Rs");
    expect(first.customer_noOfSuits).toBe("2");
    expect(first.customer_upperPocket).toBe(true);
  });

  it("rejects a request with missing fields with 400", async () => {
    const res = await request(app).post(API).send({});
    expect(res.status).toBe(400);
    // current bug (SEC-002): body is Express's HTML error page, not JSON
    expect(res.text).toContain("Please add all details");
  });

  it("current bug (SEC-003): numeric 0 is treated as missing", async () => {
    const res = await request(app)
      .post(API)
      .send(customerInput({ customer_waist: 0 }));
    expect(res.status).toBe(400);
  });

  it("current bug (SEC-003): missing customer_upperPocket gives 500, not 400", async () => {
    const input = customerInput();
    delete input.customer_upperPocket;
    const res = await request(app).post(API).send(input);
    expect(res.status).toBe(500);
  });
});

describe("GET /api/customerDetail/somedata", () => {
  it("returns the list projection only", async () => {
    await createCustomer();
    const res = await request(app).get(`${API}/somedata`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(Object.keys(res.body[0]).sort()).toEqual(
      [
        "_id",
        "customer_contact",
        "customer_id",
        "customer_name",
        "customer_orderStatus",
        "customer_paymentStatus",
      ].sort(),
    );
  });

  it("returns an empty array when there are no customers", async () => {
    const res = await request(app).get(`${API}/somedata`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/customerDetail/:customer_id", () => {
  it("returns the full customer", async () => {
    await createCustomer();
    const res = await request(app).get(`${API}/1`);
    expect(res.status).toBe(200);
    expect(res.body.customer_name).toBe("Ali Raza");
    expect(res.body.customer_bust).toBe("38 Inches");
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get(`${API}/999`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Customer not found." });
  });

  it("current bug (SEC-003): non-numeric id gives 500", async () => {
    const res = await request(app).get(`${API}/abc`);
    expect(res.status).toBe(500);
  });
});

describe.each([
  ["orderStatus", "customer_orderStatus"],
  ["paymentStatus", "customer_paymentStatus"],
])("PUT /api/customerDetail/%s/:customer_id", (path, field) => {
  it("updates the status", async () => {
    await createCustomer();
    const res = await request(app)
      .put(`${API}/${path}/1`)
      .send({ [field]: "Complete" });

    expect(res.status).toBe(200);
    expect(res.body[field]).toBe("Complete");
    const stored = await request(app).get(`${API}/1`);
    expect(stored.body[field]).toBe("Complete");
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app)
      .put(`${API}/${path}/999`)
      .send({ [field]: "Complete" });
    expect(res.status).toBe(404);
  });

  it("current bug (SEC-003): accepts any status string", async () => {
    await createCustomer();
    const res = await request(app)
      .put(`${API}/${path}/1`)
      .send({ [field]: "anything" });
    expect(res.status).toBe(200);
    expect(res.body[field]).toBe("anything");
  });
});

describe("DELETE /api/customerDetail/delete/:customer_id", () => {
  it("deletes the customer", async () => {
    await createCustomer();
    const res = await request(app).delete(`${API}/delete/1`);

    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(1);
    expect((await request(app).get(`${API}/1`)).status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).delete(`${API}/delete/999`);
    expect(res.status).toBe(404);
  });
});

describe("cross-origin access", () => {
  it("current behavior (SEC-001): allows every origin", async () => {
    const res = await request(app)
      .get(`${API}/somedata`)
      .set("Origin", "http://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });
});
