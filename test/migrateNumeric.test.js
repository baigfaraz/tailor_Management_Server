// SEC-003 data migration.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { clearDb, startDb, stopDb } from "./helpers/db.js";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const {
  migrateNumericFields,
  toNumber,
} = require("../src/migrations/numericFields");

const legacy = (id, overrides = {}) => ({
  customer_id: id,
  customer_name: `Customer ${id}`,
  customer_waist: "31 Inches",
  customer_bust: "38 Inches",
  customer_upperArm: "12 Inches",
  customer_neckToSleeve: "30.5 Inches",
  customer_back: "16 Inches",
  customer_neckToShoulder: "7 Inches",
  customer_legLength: "40 Inches",
  customer_orderPrice: "2500 Rs",
  customer_noOfSuits: "2",
  ...overrides,
});

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe("toNumber", () => {
  it.each([
    ["31 Inches", 31],
    ["30.5 Inches", 30.5],
    ["2500 Rs", 2500],
    ["2", 2],
    [7, 7],
    ["abc", null],
    ["", null],
  ])("%j -> %j", (input, expected) => {
    expect(toNumber(input)).toBe(expected);
  });
});

describe("migrateNumericFields", () => {
  it("dry run reports without writing", async () => {
    const collection = mongoose.connection.db.collection("customerdetails");
    await collection.insertOne(legacy(1));

    const report = await migrateNumericFields(mongoose.connection.db);

    expect(report).toMatchObject({ checked: 1, updated: 1, alreadyNumeric: 0 });
    expect((await collection.findOne({ customer_id: 1 })).customer_waist).toBe(
      "31 Inches",
    );
  });

  it("converts text values to numbers and leaves other fields alone", async () => {
    const collection = mongoose.connection.db.collection("customerdetails");
    await collection.insertOne(legacy(1));

    await migrateNumericFields(mongoose.connection.db, { write: true });

    const doc = await collection.findOne({ customer_id: 1 });
    expect(doc).toMatchObject({
      customer_name: "Customer 1",
      customer_waist: 31,
      customer_neckToSleeve: 30.5,
      customer_orderPrice: 2500,
      customer_noOfSuits: 2,
    });
  });

  it("is safe to run twice and skips unreadable records", async () => {
    const collection = mongoose.connection.db.collection("customerdetails");
    await collection.insertMany([
      legacy(1),
      legacy(2, { customer_bust: "unknown" }),
    ]);

    await migrateNumericFields(mongoose.connection.db, { write: true });
    const second = await migrateNumericFields(mongoose.connection.db, {
      write: true,
    });

    expect(second).toMatchObject({ checked: 2, updated: 0, alreadyNumeric: 1 });
    expect(second.skipped).toEqual([
      { customer_id: 2, problems: ['customer_bust: cannot read "unknown"'] },
    ]);
    expect((await collection.findOne({ customer_id: 2 })).customer_waist).toBe(
      "31 Inches",
    );
  });
});
