const express = require("express");
const orderController = require("../controllers/order");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { createOrderRules } = require("../validators/orderValidators");

const router = express.Router();

// Create order
router.post(
  "/createOrder",
  createOrderRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await orderController.createOrder(req.body);
    res.status(201).json(data);
  })
);

// Best route calculation
router.get(
  "/best-route",
  asyncHandler(async (req, res) => {
    const data = await orderController.findBestRoute();
    res.status(200).json(data);
  })
);

module.exports = router;
