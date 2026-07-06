const express = require("express");
const authController = require("../controllers/auth");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const {
  registerRules,
  createUserRules,
  loginRules,
} = require("../validators/authValidators");

const router = express.Router();

// Public: register (always a customer account)
router.post(
  "/register",
  registerRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await authController.registerUser(req.body);
    res.status(201).json(data);
  }),
);

// Admin only: create driver/admin accounts
router.post(
  "/users",
  authenticate,
  authorize("admin"),
  createUserRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await authController.createUserWithRole(req.body);
    res.status(201).json(data);
  }),
);

// Public: login
router.post(
  "/login",
  loginRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await authController.userLogin(req.body);
    res.status(200).json(data);
  }),
);

module.exports = router;
