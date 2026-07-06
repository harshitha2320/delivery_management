const { body } = require("express-validator");

const baseUserRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("mobile")
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage("Mobile must be 7-15 digits (optional leading +)"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("coordinates.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a number between -90 and 90"),
  body("coordinates.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a number between -180 and 180"),
];

// Public registration: role is not accepted from the client
const registerRules = [
  ...baseUserRules,
  body("role").not().exists().withMessage("Role cannot be set at registration"),
];

// Admin user creation: role must be driver or admin
const createUserRules = [
  ...baseUserRules,
  body("role")
    .isIn(["driver", "admin"])
    .withMessage("Role must be 'driver' or 'admin'"),
];

const loginRules = [
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { registerRules, createUserRules, loginRules };
