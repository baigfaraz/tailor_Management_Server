// In-memory MongoDB for tests. Never connects to Atlas or any real database.
import { createRequire } from "node:module";
import { MongoMemoryServer } from "mongodb-memory-server";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");

let mongod;

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri("tailor-test");
  if (!uri.startsWith("mongodb://127.0.0.1")) {
    throw new Error(`Refusing to run tests against non-local database: ${uri}`);
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

export async function clearDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}
