// Usage: npm run restore -- <backup-folder> --yes [--uri <mongodb-uri>]
// Replaces the collections in the target database with the backup's contents.
// Target defaults to MONGODB_URI. Without --yes it only prints what it would do.
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const { restoreDatabase } = require("../src/backup/backup");

async function main() {
  let backupDir;
  let uri = process.env.MONGODB_URI;
  let confirmed = false;
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--yes") confirmed = true;
    else if (args[i] === "--uri") uri = args[++i];
    else backupDir = args[i];
  }

  if (!backupDir)
    throw new Error(
      "Give the backup folder, e.g. backups/2026-10-20T21-00-00-000Z",
    );
  const dir = path.resolve(backupDir);
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath))
    throw new Error(`No manifest.json in ${dir}`);
  if (!uri) throw new Error("No target: set MONGODB_URI or pass --uri");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const host = uri.replace(/\/\/[^@]*@/, "//***@");
  console.log(`Backup from ${manifest.createdAt} (${manifest.database})`);
  for (const [name, count] of Object.entries(manifest.collections)) {
    console.log(`  ${name}: ${count} documents`);
  }
  if (!confirmed) {
    console.log(`\nDry run. This would REPLACE these collections in ${host}.`);
    console.log("Run again with --yes to restore.");
    return;
  }

  await mongoose.connect(uri);
  const restored = await restoreDatabase(mongoose.connection.db, dir);
  console.log(`Restored into ${host}:`, restored);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`Restore failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
