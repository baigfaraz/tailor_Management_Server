// Characterization tests for /api/customerDetail (Phase 2 safety net, TEST-001).
// They record CURRENT behavior. Tests marked "current bug" document behavior that a
// later backlog item changes; update them in that item's commit.
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import request from "supertest";
import { createRequire } from "node:module";
import { clearDb, startDb, stopDb } from "./helpers/db.js";
import { customerInput } from "./helpers/fixtures.js";

const require = createRequire(import.meta.url);
const { createApp } = require("../src/app");
const app = createApp({
  shopPin: "2468",
  sessionSecret: "test-secret-test-secret-test-secret",
});

const API = "/api/customerDetail";

let agent;

beforeAll(async () => {
  await startDb();
  agent = request.agent(app);
  await agent.post("/api/session").send({ pin: "2468" }).expect(200);
});
afterAll(stopDb);
beforeEach(clearDb);

async function createCustomer(overrides) {
  const res = await agent.post(API).send(customerInput(overrides));
  expect(res.status).toBe(201);
  return res.body;
}

describe("POST /api/customerDetail", () => {
  it("creates a customer with sequential customer_id and numeric fields (SEC-003)", async () => {
    const first = await createCustomer();
    const second = await createCustomer({ customer_name: "Sara Khan" });

    expect(first.customer_id).toBe(1);
    expect(second.customer_id).toBe(2);
    expect(first.customer_waist).toBe(32);
    expect(first.customer_legLength).toBe(40);
    expect(first.customer_orderPrice).toBe(2500);
    expect(first.customer_noOfSuits).toBe(2);
    expect(first.customer_upperPocket).toBe(true);
  });

  it("rejects a request with missing fields with 400", async () => {
    const res = await agent.post(API).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^Please check: Name, Contact, Waist/);
    expect(Object.keys(res.body.fields)).toHaveLength(15);
    expect(res.body.fields.customer_waist).toBe("Waist is required");
  });

  it("rejects a request without a JSON body with 400", async () => {
    const res = await agent
      .post(API)
      .set("Content-Type", "text/plain")
      .send("hello");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^Please check:/);
  });

  it("rejects a measurement of 0 (SEC-003)", async () => {
    const res = await agent
      .post(API)
      .send(customerInput({ customer_waist: 0 }));
    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({
      customer_waist: "Waist must be more than 0",
    });
  });

  it("defaults a missing customer_upperPocket to false (SEC-003)", async () => {
    const input = customerInput();
    delete input.customer_upperPocket;
    const res = await agent.post(API).send(input);
    expect(res.status).toBe(201);
    expect(res.body.customer_upperPocket).toBe(false);
  });

  it.each([
    [{ customer_waist: "abc" }, "customer_waist", "Waist must be a number"],
    [
      { customer_waist: "32 Inches" },
      "customer_waist",
      "Waist must be a number",
    ],
    [
      { customer_noOfSuits: 1.5 },
      "customer_noOfSuits",
      "No of suits must be a whole number",
    ],
    [
      { customer_orderPrice: -1 },
      "customer_orderPrice",
      "Price per suit cannot be negative",
    ],
    [
      { customer_dressDesign: "Coat" },
      "customer_dressDesign",
      "Dress design must be Kurta or Shalwar",
    ],
    [
      { customer_orderStatus: "Done" },
      "customer_orderStatus",
      "Order status must be Pending or Complete",
    ],
    [{ customer_name: "   " }, "customer_name", "Name is required"],
  ])(
    "rejects invalid input %j (SEC-003)",
    async (overrides, field, message) => {
      const res = await agent.post(API).send(customerInput(overrides));
      expect(res.status).toBe(400);
      expect(res.body.fields).toEqual({ [field]: message });
      expect((await agent.get(`${API}/somedata`)).body).toHaveLength(0);
    },
  );

  it("gives unique, sequential numbers to simultaneous saves (ARCH-007)", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        agent.post(API).send(customerInput({ customer_name: `Customer ${i}` })),
      ),
    );
    expect(results.map((r) => r.status)).toEqual(Array(10).fill(201));
    const ids = results.map((r) => r.body.customer_id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("continues after the highest existing number (ARCH-007)", async () => {
    const CustomerDetail = require("../src/models/customerDetailModel");
    await CustomerDetail.collection.insertOne({ customer_id: 41 });
    const res = await agent.post(API).send(customerInput());
    expect(res.body.customer_id).toBe(42);
  });

  it("never reuses the number of a deleted customer (ARCH-007)", async () => {
    await createCustomer();
    const second = await createCustomer();
    await agent.delete(`${API}/delete/${second.customer_id}`);
    const third = await createCustomer();
    expect(third.customer_id).toBe(3);
  });

  it("ignores a client-supplied customer_id", async () => {
    const res = await agent.post(API).send(customerInput({ customer_id: 999 }));
    expect(res.status).toBe(201);
    expect(res.body.customer_id).toBe(1);
  });
});

describe("PUT status without a JSON body", () => {
  it("returns 400 instead of crashing", async () => {
    await createCustomer();
    const res = await agent
      .put(`${API}/orderStatus/1`)
      .set("Content-Type", "text/plain")
      .send("x");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Order status must be Pending or Complete",
    });
  });
});

describe("GET /api/customerDetail/somedata", () => {
  it("returns the list projection only", async () => {
    await createCustomer();
    const res = await agent.get(`${API}/somedata`);

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
    const res = await agent.get(`${API}/somedata`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/customerDetail/:customer_id", () => {
  it("returns the full customer", async () => {
    await createCustomer();
    const res = await agent.get(`${API}/1`);
    expect(res.status).toBe(200);
    expect(res.body.customer_name).toBe("Ali Raza");
    expect(res.body.customer_bust).toBe(38);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await agent.get(`${API}/999`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Customer not found." });
  });

  it.each(["abc", "0", "-1", "1.5"])(
    "rejects customer number %s with 400 (SEC-003)",
    async (id) => {
      const res = await agent.get(`${API}/${id}`);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid customer number." });
    },
  );
});

describe.each([
  ["orderStatus", "customer_orderStatus"],
  ["paymentStatus", "customer_paymentStatus"],
])("PUT /api/customerDetail/%s/:customer_id", (path, field) => {
  it("updates the status", async () => {
    await createCustomer();
    const res = await agent
      .put(`${API}/${path}/1`)
      .send({ [field]: "Complete" });

    expect(res.status).toBe(200);
    expect(res.body[field]).toBe("Complete");
    const stored = await agent.get(`${API}/1`);
    expect(stored.body[field]).toBe("Complete");
  });

  it("returns 404 for an unknown id", async () => {
    const res = await agent
      .put(`${API}/${path}/999`)
      .send({ [field]: "Complete" });
    expect(res.status).toBe(404);
  });

  it("rejects an unknown status (SEC-003)", async () => {
    await createCustomer();
    const res = await agent
      .put(`${API}/${path}/1`)
      .send({ [field]: "anything" });
    expect(res.status).toBe(400);
    expect((await agent.get(`${API}/1`)).body[field]).toBe("Pending");
  });
});

describe("DELETE /api/customerDetail/delete/:customer_id", () => {
  it("deletes the customer", async () => {
    await createCustomer();
    const res = await agent.delete(`${API}/delete/1`);

    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(1);
    expect((await agent.get(`${API}/1`)).status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await agent.delete(`${API}/delete/999`);
    expect(res.status).toBe(404);
  });
});

describe("cross-origin access (SEC-001)", () => {
  it("does not allow other origins by default", async () => {
    const res = await agent
      .get(`${API}/somedata`)
      .set("Origin", "http://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("API errors (SEC-002)", () => {
  it("answers unexpected failures with a generic 500 and no internals", async () => {
    const CustomerDetail = require("../src/models/customerDetailModel");
    const spy = vi
      .spyOn(CustomerDetail, "find")
      .mockRejectedValueOnce(
        new Error("database exploded at /secret/path.js:1"),
      );

    const res = await agent.get(`${API}/somedata`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "An error occurred while processing your request.",
    });
    expect(res.text).not.toMatch(/secret|\.js:/);
    spy.mockRestore();
  });

  it("answers unknown API paths with JSON 404", async () => {
    const res = await agent.get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found." });
  });
});
