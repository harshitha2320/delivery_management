const express = require("express");
const authController = require("../controllers/auth");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { registerRules, loginRules } = require("../validators/authValidators");

const router = express.Router();

// Register new user
router.post(
  "/register",
  registerRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await authController.registerUser(req.body);
    res.status(201).json(data);
  })
);

// User Login
router.post(
  "/login",
  loginRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await authController.userLogin(req.body);
    res.status(200).json(data);
  })
);

module.exports = router;
