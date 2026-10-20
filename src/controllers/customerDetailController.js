const asyncHandler = require("express-async-handler");
const CustomerDetail = require("../models/customerDetailModel");

// @desc get customer Detail by id
// @routes GET /api/customerDetail/:customer_id
//@access private
const getDetailById = asyncHandler(async (req, res) => {
  try {
    const customer_id = req.params.customer_id;

    const customer = await CustomerDetail.findOne({ customer_id });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    res.status(200).json(customer);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// @desc get customer name , id , contact and orderStatus
// @routes GET /api/customerDetail/somedata
//@access private
const getSomeDetail = asyncHandler(async (req, res) => {
  try {
    const customers = await CustomerDetail.find(
      {},
      "customer_id customer_name customer_contact customer_orderStatus customer_paymentStatus"
    );

    res.status(200).json(customers);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// @desc set customerDetail
// @routes POST /api/customerDetail
//@access public
const setCustomerDetails = asyncHandler(async (req, res) => {
  if (
    !req.body.customer_name ||
    !req.body.customer_contact ||
    !req.body.customer_waist ||
    !req.body.customer_bust ||
    !req.body.customer_upperArm ||
    !req.body.customer_neckToSleeve ||
    !req.body.customer_back ||
    !req.body.customer_neckToShoulder ||
    !req.body.customer_legLength ||
    !req.body.customer_dressDesign ||
    !req.body.customer_neckStyle ||
    !req.body.customer_orderPrice ||
    !req.body.customer_orderStatus ||
    !req.body.customer_paymentStatus ||
    !req.body.customer_noOfSuits
  ) {
    res.status(400);
    throw new Error("Please add all details. Thankyou!");
  }

  try {
    const maxCustomerId = await CustomerDetail.findOne()
      .sort("-customer_id")
      .select("customer_id");
    const newCustomerId = maxCustomerId ? maxCustomerId.customer_id + 1 : 1;

    const customerDetails = await CustomerDetail.create({
      customer_id: newCustomerId,
      customer_name: req.body.customer_name,
      customer_contact: req.body.customer_contact,
      customer_waist: req.body.customer_waist + " Inches",
      customer_bust: req.body.customer_bust + " Inches",
      customer_upperArm: req.body.customer_upperArm + " Inches",
      customer_neckToSleeve: req.body.customer_neckToSleeve + " Inches",
      customer_back: req.body.customer_back + " Inches",
      customer_neckToShoulder: req.body.customer_neckToShoulder + " Inches",
      customer_legLength: req.body.customer_legLength + " Inches",
      customer_upperPocket: req.body.customer_upperPocket,
      customer_dressDesign: req.body.customer_dressDesign,
      customer_neckStyle: req.body.customer_neckStyle,
      customer_orderPrice: req.body.customer_orderPrice + " Rs",
      customer_orderStatus: req.body.customer_orderStatus,
      customer_paymentStatus: req.body.customer_paymentStatus,
      customer_noOfSuits: req.body.customer_noOfSuits,
    });

    res.status(201).json(customerDetails);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// @desc update customer_orderStatus
// @routes PUT /api/customerDetail/orderStatus/:customer_id
//@access private
const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const customer_id = req.params.customer_id;
    const { customer_orderStatus } = req.body;

    const updatedCustomer = await CustomerDetail.findOneAndUpdate(
      { customer_id },
      { $set: { customer_orderStatus } },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    res.status(200).json(updatedCustomer);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// @desc update customer_paymentStatus
// @routes PUT /api/customerDetail/paymentStatus/:customer_id
//@access private
const updatePaymentStatus = asyncHandler(async (req, res) => {
  try {
    const customer_id = req.params.customer_id;
    const { customer_paymentStatus } = req.body;

    const updatedCustomer = await CustomerDetail.findOneAndUpdate(
      { customer_id },
      { $set: { customer_paymentStatus } },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    res.status(200).json(updatedCustomer);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// @desc delete customer
// @routes Delete /api/customerDetail/delete/:customer_id
//@access private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer_id = req.params.customer_id;

  try {
    const customer = await CustomerDetail.findOne({ customer_id });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }
    const deletedCustomer = await CustomerDetail.deleteOne({ customer_id });

    res.status(200).json(deletedCustomer);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

module.exports = {
  setCustomerDetails,
  getSomeDetail,
  getDetailById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteCustomer,
};
