const asyncHandler = require("express-async-handler");
const CustomerDetail = require("../models/customerDetailModel");
const { FIELD_LABELS, STATUSES } = CustomerDetail;

// Customer numbers are positive integers; anything else is a bad request.
function parseCustomerId(res, value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400);
    throw new Error("Invalid customer number.");
  }
  return id;
}

function requireStatus(res, value, label) {
  if (!STATUSES.includes(value)) {
    res.status(400);
    throw new Error(`${label} must be ${STATUSES.join(" or ")}`);
  }
}

// @desc get customer Detail by id
// @routes GET /api/customerDetail/:customer_id
//@access private
const getDetailById = asyncHandler(async (req, res) => {
  const customer_id = parseCustomerId(res, req.params.customer_id);

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

// Fields a client may set when creating a customer (others are ignored).
const CREATE_FIELDS = Object.keys(FIELD_LABELS);

// @desc set customerDetail
// @routes POST /api/customerDetail
//@access public
const setCustomerDetails = asyncHandler(async (req, res) => {
  // Express 5 leaves req.body undefined when there is no parsable body.
  const body = req.body ?? {};
  const input = {};
  for (const field of CREATE_FIELDS) {
    if (body[field] !== undefined) input[field] = body[field];
  }

  // Validate before taking a customer number; the schema reports every bad field.
  const customer = new CustomerDetail({ ...input, customer_id: 0 });
  await customer.validate();

  const maxCustomerId = await CustomerDetail.findOne()
    .sort("-customer_id")
    .select("customer_id");
  customer.customer_id = maxCustomerId ? maxCustomerId.customer_id + 1 : 1;
  await customer.save();

  res.status(201).json(customer);
});

// @desc update customer_orderStatus
// @routes PUT /api/customerDetail/orderStatus/:customer_id
//@access private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const customer_id = parseCustomerId(res, req.params.customer_id);
  const { customer_orderStatus } = req.body ?? {};
  requireStatus(res, customer_orderStatus, "Order status");

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
  const customer_id = parseCustomerId(res, req.params.customer_id);
  const { customer_paymentStatus } = req.body ?? {};
  requireStatus(res, customer_paymentStatus, "Payment status");

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
  const customer_id = parseCustomerId(res, req.params.customer_id);

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
