const asyncHandler = require("express-async-handler");
const CustomerDetail = require("../models/customerDetailModel");

// @desc get customer Detail by id
// @routes GET /api/customerDetail/:customer_id
//@access private
const getDetailById = asyncHandler(async (req, res) => {
  const customer_id = req.params.customer_id;

  const customer = await CustomerDetail.findOne({ customer_id });

  if (!customer) {
    return res.status(404).json({ error: "Customer not found." });
  }

  res.status(200).json(customer);
});

// @desc get customer name , id , contact and orderStatus
// @routes GET /api/customerDetail/somedata
//@access private
const getSomeDetail = asyncHandler(async (req, res) => {
  const customers = await CustomerDetail.find(
    {},
    "customer_id customer_name customer_contact customer_orderStatus customer_paymentStatus",
  );

  res.status(200).json(customers);
});

// @desc set customerDetail
// @routes POST /api/customerDetail
//@access public
const setCustomerDetails = asyncHandler(async (req, res) => {
  // Express 5 leaves req.body undefined when there is no parsable body.
  const body = req.body ?? {};
  if (
    !body.customer_name ||
    !body.customer_contact ||
    !body.customer_waist ||
    !body.customer_bust ||
    !body.customer_upperArm ||
    !body.customer_neckToSleeve ||
    !body.customer_back ||
    !body.customer_neckToShoulder ||
    !body.customer_legLength ||
    !body.customer_dressDesign ||
    !body.customer_neckStyle ||
    !body.customer_orderPrice ||
    !body.customer_orderStatus ||
    !body.customer_paymentStatus ||
    !body.customer_noOfSuits
  ) {
    res.status(400);
    throw new Error("Please add all details. Thankyou!");
  }

  const maxCustomerId = await CustomerDetail.findOne()
    .sort("-customer_id")
    .select("customer_id");
  const newCustomerId = maxCustomerId ? maxCustomerId.customer_id + 1 : 1;

  const customerDetails = await CustomerDetail.create({
    customer_id: newCustomerId,
    customer_name: body.customer_name,
    customer_contact: body.customer_contact,
    customer_waist: body.customer_waist + " Inches",
    customer_bust: body.customer_bust + " Inches",
    customer_upperArm: body.customer_upperArm + " Inches",
    customer_neckToSleeve: body.customer_neckToSleeve + " Inches",
    customer_back: body.customer_back + " Inches",
    customer_neckToShoulder: body.customer_neckToShoulder + " Inches",
    customer_legLength: body.customer_legLength + " Inches",
    customer_upperPocket: body.customer_upperPocket,
    customer_dressDesign: body.customer_dressDesign,
    customer_neckStyle: body.customer_neckStyle,
    customer_orderPrice: body.customer_orderPrice + " Rs",
    customer_orderStatus: body.customer_orderStatus,
    customer_paymentStatus: body.customer_paymentStatus,
    customer_noOfSuits: body.customer_noOfSuits,
  });

  res.status(201).json(customerDetails);
});

// @desc update customer_orderStatus
// @routes PUT /api/customerDetail/orderStatus/:customer_id
//@access private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const customer_id = req.params.customer_id;
  const { customer_orderStatus } = req.body ?? {};

  const updatedCustomer = await CustomerDetail.findOneAndUpdate(
    { customer_id },
    { $set: { customer_orderStatus } },
    { returnDocument: "after" },
  );

  if (!updatedCustomer) {
    return res.status(404).json({ error: "Customer not found." });
  }

  res.status(200).json(updatedCustomer);
});

// @desc update customer_paymentStatus
// @routes PUT /api/customerDetail/paymentStatus/:customer_id
//@access private
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const customer_id = req.params.customer_id;
  const { customer_paymentStatus } = req.body ?? {};

  const updatedCustomer = await CustomerDetail.findOneAndUpdate(
    { customer_id },
    { $set: { customer_paymentStatus } },
    { returnDocument: "after" },
  );

  if (!updatedCustomer) {
    return res.status(404).json({ error: "Customer not found." });
  }

  res.status(200).json(updatedCustomer);
});

// @desc delete customer
// @routes Delete /api/customerDetail/delete/:customer_id
//@access private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer_id = req.params.customer_id;

  const customer = await CustomerDetail.findOne({ customer_id });

  if (!customer) {
    return res.status(404).json({ error: "Customer not found." });
  }
  const deletedCustomer = await CustomerDetail.deleteOne({ customer_id });

  res.status(200).json(deletedCustomer);
});

module.exports = {
  setCustomerDetails,
  getSomeDetail,
  getDetailById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteCustomer,
};
