// Usage: npm run backup
// Writes a backup of the database in MONGODB_URI to BACKUP_DIR (default ./backups),
// keeping the newest BACKUP_KEEP (default 30). Point BACKUP_DIR at a second disk,
// USB stick or synced cloud folder so a lost PC does not lose the data.
require("dotenv").config({ quiet: true });
const path = require("node:path");
const mongoose = require("mongoose");
const { backupDatabase } = require("../src/backup/backup");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing");
  const backupRoot = path.resolve(process.env.BACKUP_DIR || "backups");
  const keep = Number(process.env.BACKUP_KEEP || 30);

  await mongoose.connect(process.env.MONGODB_URI);
  const { dir, manifest } = await backupDatabase(
    mongoose.connection.db,
    backupRoot,
    { keep },
  );
  console.log(`Backup written to ${dir}`);
  for (const [name, count] of Object.entries(manifest.collections)) {
    console.log(`  ${name}: ${count} documents`);
  }
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`Backup failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
