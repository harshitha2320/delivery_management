const { body, query, param } = require("express-validator");

const idParamRule = [param("id").isMongoId().withMessage("Invalid id in URL")];

const sortRule = [
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be 'asc' or 'desc'"),
];

const dateRangeRules = [
  query("startDateStr")
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("startDateStr must be dd/MM/yyyy"),
  query("endDateStr")
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("endDateStr must be dd/MM/yyyy"),
];

// Profile edits: only allow safe fields; block email/password changes here
const editProfileRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("mobile")
    .optional()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage("Mobile must be 7-15 digits"),
  body("coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  body("coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  body("email").not().exists().withMessage("Email cannot be changed here"),
  body("password")
    .not()
    .exists()
    .withMessage("Password cannot be changed here"),
];

module.exports = { idParamRule, sortRule, dateRangeRules, editProfileRules };
