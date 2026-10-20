const mongoose = require("mongoose");

// Values the UI offers. Stored values stay "Color"/"Ban"; the screen can
// label them Collar/Band (UX-009) without a data change.
const DRESS_DESIGNS = ["Kurta", "Shalwar"];
const NECK_STYLES = ["Color", "Ban"];
const STATUSES = ["Pending", "Complete"];

// Human-readable names used in validation messages.
const FIELD_LABELS = {
  customer_name: "Name",
  customer_contact: "Contact",
  customer_waist: "Waist",
  customer_bust: "Bust",
  customer_upperArm: "Upper Arm",
  customer_neckToSleeve: "Neck To Sleeve",
  customer_back: "Back",
  customer_neckToShoulder: "Neck To Shoulder",
  customer_legLength: "Leg Length",
  customer_upperPocket: "Upper Pocket",
  customer_dressDesign: "Dress design",
  customer_neckStyle: "Neck design",
  customer_orderPrice: "Price per suit",
  customer_orderStatus: "Order status",
  customer_paymentStatus: "Payment status",
  customer_noOfSuits: "No of suits",
};

const requiredText = (path) => ({
  type: String,
  trim: true,
  required: [true, `${FIELD_LABELS[path]} is required`],
});

// Measurements in inches (SEC-003): numbers, unit shown by the UI.
const measurement = (path) => ({
  type: Number,
  required: [true, `${FIELD_LABELS[path]} is required`],
  min: [0.1, `${FIELD_LABELS[path]} must be more than 0`],
  max: [200, `${FIELD_LABELS[path]} must be 200 inches or less`],
});

const oneOf = (path, values) => ({
  type: String,
  required: [true, `${FIELD_LABELS[path]} is required`],
  enum: {
    values,
    message: `${FIELD_LABELS[path]} must be ${values.join(" or ")}`,
  },
});

const customerDetailSchema = mongoose.Schema(
  {
    customer_id: {
      type: Number,
      unique: true,
      required: true,
    },
    customer_name: requiredText("customer_name"),
    customer_contact: requiredText("customer_contact"),
    customer_waist: measurement("customer_waist"),
    customer_bust: measurement("customer_bust"),
    customer_upperArm: measurement("customer_upperArm"),
    customer_neckToSleeve: measurement("customer_neckToSleeve"),
    customer_back: measurement("customer_back"),
    customer_neckToShoulder: measurement("customer_neckToShoulder"),
    customer_legLength: measurement("customer_legLength"),
    customer_upperPocket: {
      type: Boolean,
      default: false,
    },
    customer_dressDesign: oneOf("customer_dressDesign", DRESS_DESIGNS),
    customer_neckStyle: oneOf("customer_neckStyle", NECK_STYLES),
    // Price per suit in Rs.
    customer_orderPrice: {
      type: Number,
      required: [true, `${FIELD_LABELS.customer_orderPrice} is required`],
      min: [0, `${FIELD_LABELS.customer_orderPrice} cannot be negative`],
    },
    customer_orderStatus: oneOf("customer_orderStatus", STATUSES),
    customer_paymentStatus: oneOf("customer_paymentStatus", STATUSES),
    customer_noOfSuits: {
      type: Number,
      required: [true, `${FIELD_LABELS.customer_noOfSuits} is required`],
      min: [1, `${FIELD_LABELS.customer_noOfSuits} must be at least 1`],
      validate: {
        validator: Number.isInteger,
        message: `${FIELD_LABELS.customer_noOfSuits} must be a whole number`,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CustomerDetail", customerDetailSchema);
module.exports.FIELD_LABELS = FIELD_LABELS;
module.exports.STATUSES = STATUSES;
