// Export and import every collection as Extended JSON (SEC-006). Works with the
// free Atlas tier (no cloud backups) and needs no extra tools.
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");

const { EJSON } = mongoose.mongo.BSON;

function timestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function backupDatabase(
  db,
  backupRoot,
  { keep = 30, now = new Date() } = {},
) {
  const target = path.join(backupRoot, timestamp(now));
  fs.mkdirSync(target, { recursive: true });

  const manifest = {
    createdAt: now.toISOString(),
    database: db.databaseName,
    collections: {},
  };
  const collections = await db
    .listCollections({}, { nameOnly: true })
    .toArray();
  for (const { name } of collections) {
    if (name.startsWith("system.")) continue;
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(
      path.join(target, `${name}.json`),
      EJSON.stringify(docs, null, 2, { relaxed: false }),
    );
    manifest.collections[name] = docs.length;
  }
  fs.writeFileSync(
    path.join(target, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  pruneBackups(backupRoot, keep);
  return { dir: target, manifest };
}

function pruneBackups(backupRoot, keep) {
  const dirs = fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const old of dirs.slice(0, Math.max(0, dirs.length - keep))) {
    fs.rmSync(path.join(backupRoot, old), { recursive: true, force: true });
  }
}

// Replaces each collection in the backup with the backup's documents.
async function restoreDatabase(db, backupDir) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(backupDir, "manifest.json"), "utf8"),
  );
  const restored = {};
  for (const name of Object.keys(manifest.collections)) {
    const docs = EJSON.parse(
      fs.readFileSync(path.join(backupDir, `${name}.json`), "utf8"),
      {
        relaxed: false,
      },
    );
    const collection = db.collection(name);
    await collection.deleteMany({});
    if (docs.length) await collection.insertMany(docs);
    restored[name] = docs.length;
  }
  return restored;
}

module.exports = { backupDatabase, restoreDatabase, pruneBackups };
