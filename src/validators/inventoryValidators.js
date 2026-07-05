const { body, param } = require("express-validator");

const addInventoryRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be a positive integer"),
  body("coordinates.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a number between -90 and 90"),
  body("coordinates.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a number between -180 and 180"),
];

const idParamRule = [param("id").isMongoId().withMessage("Invalid id in URL")];

module.exports = { addInventoryRules, idParamRule };
