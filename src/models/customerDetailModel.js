const mongoose = require("mongoose");

const customerDetailSchema = mongoose.Schema(
  {
    customer_id: {
      type: Number, 
      unique: true,
      required: true,
    },
    customer_name: {
      type: String,
      required: true,
    },
    customer_contact: {
      type: String,
      required: true,
    },
    customer_waist: {
      type: String,
      required: true,
    },
    customer_bust: {
      type: String,
      required: true,
    },
    customer_upperArm: {
      type: String,
      required: true,
    },
    customer_neckToSleeve: {
      type: String,
      required: true,
    },
    customer_back: {
      type: String,
      required: true,
    },
    customer_neckToShoulder: {
      type: String,
      required: true,
    },
    customer_legLength: {
      type: String,
      required: true,
    },
    customer_upperPocket: {
      type: Boolean,
      required: true,
    },
    customer_dressDesign: {
      type: String,
      required: true,
    },
    customer_neckStyle: {
      type: String,
      required: true,
    },
    customer_orderPrice: {
      type: String,
      required: true,
    },
    customer_orderStatus: {
      type: String,
      required: true,
    },
    customer_paymentStatus: {
      type: String,
      required: true,
    },
    customer_noOfSuits: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CustomerDetail", customerDetailSchema);
