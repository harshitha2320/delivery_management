const express = require("express");
const authController = require("../controllers/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Register new user
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = await authController.registerUser(req.body);
    res.status(201).json(data);
  })
);

// User Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = await authController.userLogin(req.body);
    res.status(200).json(data);
  })
);

module.exports = router;
