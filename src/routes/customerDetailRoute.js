const express = require("express");
const router = express.Router();
const {
  setCustomerDetails, getSomeDetail , getDetailById , updateOrderStatus, updatePaymentStatus ,deleteCustomer
} = require("../controllers/customerDetailController");

router.post("/", setCustomerDetails);
router.get("/somedata" , getSomeDetail);
router.get("/:customer_id" , getDetailById);
router.put("/orderStatus/:customer_id" , updateOrderStatus);
router.put("/paymentStatus/:customer_id" , updatePaymentStatus);
router.delete("/delete/:customer_id" , deleteCustomer);

module.exports = router;
