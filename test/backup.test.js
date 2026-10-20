// Backup and restore round trip (SEC-006).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { clearDb, startDb, stopDb } from "./helpers/db.js";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const {
  backupDatabase,
  restoreDatabase,
  pruneBackups,
} = require("../src/backup/backup");

let root;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  root = fs.mkdtempSync(path.join(os.tmpdir(), "tailor-backup-"));
});

describe("backup and restore", () => {
  it("restores exactly what was backed up, including ids, dates and booleans", async () => {
    const db = mongoose.connection.db;
    const original = [
      {
        customer_id: 1,
        customer_name: "Ali",
        customer_upperPocket: true,
        createdAt: new Date("2026-01-02T03:04:05Z"),
      },
      {
        customer_id: 2,
        customer_name: "Sara",
        customer_upperPocket: false,
        createdAt: new Date("2026-02-03T04:05:06Z"),
      },
    ];
    await db.collection("customerdetails").insertMany(original);
    const before = await db
      .collection("customerdetails")
      .find()
      .sort({ customer_id: 1 })
      .toArray();

    const { dir, manifest } = await backupDatabase(db, root);
    expect(manifest.collections).toEqual({ customerdetails: 2 });

    await db.collection("customerdetails").deleteMany({});
    await db
      .collection("customerdetails")
      .insertOne({ customer_id: 99, customer_name: "Wrong" });

    const restored = await restoreDatabase(db, dir);
    expect(restored).toEqual({ customerdetails: 2 });

    const after = await db
      .collection("customerdetails")
      .find()
      .sort({ customer_id: 1 })
      .toArray();
    expect(after).toEqual(before);
    expect(after[0]._id.equals(before[0]._id)).toBe(true);
    expect(after[0].createdAt).toBeInstanceOf(Date);
  });

  it("keeps only the newest backups", async () => {
    for (const name of [
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]) {
      fs.mkdirSync(path.join(root, name));
    }
    pruneBackups(root, 2);
    expect(fs.readdirSync(root).sort()).toEqual(["2026-01-03", "2026-01-04"]);
  });
});
