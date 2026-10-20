// SEC-003 data migration: older records store numbers as text with units
// ("31 Inches", "2500 Rs", "2"). Converts them to numbers. Safe to run twice.
const NUMERIC_FIELDS = [
  "customer_waist",
  "customer_bust",
  "customer_upperArm",
  "customer_neckToSleeve",
  "customer_back",
  "customer_neckToShoulder",
  "customer_legLength",
  "customer_orderPrice",
  "customer_noOfSuits",
];

function toNumber(value) {
  if (typeof value === "number") return value;
  const match = /^\s*(\d+(?:\.\d+)?)/.exec(String(value ?? ""));
  return match ? Number(match[1]) : null;
}

// Returns { changes, problems } for one document without writing anything.
function planDocument(doc) {
  const changes = {};
  const problems = [];
  for (const field of NUMERIC_FIELDS) {
    if (typeof doc[field] === "number") continue;
    const number = toNumber(doc[field]);
    if (number === null)
      problems.push(`${field}: cannot read ${JSON.stringify(doc[field])}`);
    else changes[field] = number;
  }
  return { changes, problems };
}

// Plans (and with write: true applies) the migration for every customer.
async function migrateNumericFields(db, { write = false } = {}) {
  const collection = db.collection("customerdetails");
  const report = { checked: 0, updated: 0, alreadyNumeric: 0, skipped: [] };
  const docs = await collection.find({}).toArray();

  for (const doc of docs) {
    report.checked += 1;
    const { changes, problems } = planDocument(doc);
    if (problems.length) {
      report.skipped.push({ customer_id: doc.customer_id, problems });
      continue;
    }
    if (!Object.keys(changes).length) {
      report.alreadyNumeric += 1;
      continue;
    }
    report.updated += 1;
    if (write) await collection.updateOne({ _id: doc._id }, { $set: changes });
  }
  return report;
}

module.exports = {
  migrateNumericFields,
  planDocument,
  toNumber,
  NUMERIC_FIELDS,
};
