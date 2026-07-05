const express = require("express");
const orderController = require("../controllers/order");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Create order
router.post(
  "/createOrder",
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
