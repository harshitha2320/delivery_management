const express = require("express");
const orderController = require("../controllers/order");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authorize } = require("../middleware/auth");
const {
  createOrderRules,
  idParamRule,
  assignRules,
} = require("../validators/orderValidators");

const router = express.Router();

// Customer: create an order (identity from JWT)
router.post(
  "/createOrder",
  authorize("customer", "admin"),
  createOrderRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await orderController.createOrder(req.body, req.userId);
    res.status(201).json(data);
  })
);

// Customer: own orders; admin: all orders
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await orderController.getOrders(req.userId, req.userRole);
    res.status(200).json(data);
  })
);

// Admin: assign a driver to a pending order
router.patch(
  "/:id/assign",
  authorize("admin"),
  assignRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await orderController.assignDriver(req.params.id, req.body.driverId);
    res.status(200).json(data);
  })
);

// Driver: mark an in-progress order delivered
router.patch(
  "/:id/deliver",
  authorize("driver"),
  idParamRule,
  validate,
  asyncHandler(async (req, res) => {
    const data = await orderController.markDelivered(req.params.id, req.userId);
    res.status(200).json(data);
  })
);

// Customer: cancel own pending order
router.patch(
  "/:id/cancel",
  authorize("customer"),
  idParamRule,
  validate,
  asyncHandler(async (req, res) => {
    const data = await orderController.cancelOrder(req.params.id, req.userId);
    res.status(200).json(data);
  })
);

// Admin: optimised delivery route across active orders
router.get(
  "/best-route",
  authorize("admin", "driver"),
  asyncHandler(async (req, res) => {
    const data = await orderController.findBestRoute();
    res.status(200).json(data);
  })
);

module.exports = router;
