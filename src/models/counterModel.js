const mongoose = require("mongoose");

// Named sequences (ARCH-007). { _id: "customer_id", seq: <last number given> }
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true },
  },
  { versionKey: false },
);

const Counter = mongoose.model("Counter", counterSchema);

// Atomically returns the next number. `floor` is the highest number already in
// use, so a database created before the counter existed continues after it.
async function nextSequence(name, floor = 0) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    [
      {
        $set: {
          seq: { $add: [{ $max: [{ $ifNull: ["$seq", 0] }, floor] }, 1] },
        },
      },
    ],
    { upsert: true, returnDocument: "after", updatePipeline: true },
  );
  return counter.seq;
}

module.exports = { Counter, nextSequence };
