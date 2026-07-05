const { body, param } = require("express-validator");

// userId comes from the JWT, not the body - reject attempts to set it
const createOrderRules = [
  body("userId").not().exists().withMessage("userId is taken from your login token"),
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

const idParamRule = [param("id").isMongoId().withMessage("Invalid id in URL")];

const assignRules = [
  ...idParamRule,
  body("driverId").isMongoId().withMessage("driverId must be a valid id"),
];

module.exports = { createOrderRules, idParamRule, assignRules };
