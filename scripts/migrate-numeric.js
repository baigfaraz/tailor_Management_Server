// Usage: npm run migrate:numeric            (dry run: shows what would change)
//        npm run migrate:numeric -- --yes   (backs up first, then writes)
// Converts text measurements/price/suits ("31 Inches") to numbers (SEC-003).
require("dotenv").config({ quiet: true });
const path = require("node:path");
const mongoose = require("mongoose");
const { backupDatabase } = require("../src/backup/backup");
const { migrateNumericFields } = require("../src/migrations/numericFields");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing");
  const write = process.argv.includes("--yes");

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const plan = await migrateNumericFields(db, { write: false });
  console.log(`Database: ${db.databaseName}`);
  console.log(
    `Checked ${plan.checked}: ${plan.updated} to convert, ${plan.alreadyNumeric} already numeric, ${plan.skipped.length} skipped`,
  );
  for (const skipped of plan.skipped) {
    console.log(
      `  customer ${skipped.customer_id}: ${skipped.problems.join("; ")}`,
    );
  }

  if (!write) {
    console.log("\nDry run. Run again with --yes to back up and convert.");
  } else if (plan.updated) {
    const backupRoot = path.resolve(process.env.BACKUP_DIR || "backups");
    const { dir } = await backupDatabase(db, backupRoot);
    console.log(`Backup written to ${dir}`);
    const result = await migrateNumericFields(db, { write: true });
    console.log(`Converted ${result.updated} customers.`);
  } else {
    console.log("Nothing to convert.");
  }
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`Migration failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
