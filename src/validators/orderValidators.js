const { body } = require("express-validator");

const createOrderRules = [
  body("userId").isMongoId().withMessage("userId must be a valid id"),
  body("products")
    .isArray({ min: 1 })
    .withMessage("products must be a non-empty array"),
  body("products.*.productId")
    .isMongoId()
    .withMessage("Each product needs a valid productId"),
  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Each product quantity must be a positive integer"),
  body("deliveryAddress.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a number between -90 and 90"),
  body("deliveryAddress.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a number between -180 and 180"),
];

module.exports = { createOrderRules };
