const ApiError = require("../utils/ApiError");

// Catch-all for requests that matched no route
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler: every error in the app ends up here.
// Must have 4 args so Express recognises it as error middleware.
const errorHandler = (err, req, res, next) => {
  // Errors we threw on purpose
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }

  // Mongoose: schema validation failed (missing/invalid fields)
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: "Validation failed", details });
  }

  // Mongoose: malformed ObjectId in a URL param
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  // MongoDB: unique index violated (duplicate email/mobile etc.)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res
      .status(409)
      .json({
        success: false,
        message: `A record with this ${field} already exists`,
      });
  }

  // Anything unexpected: log it server-side, hide details from the client
  console.error(err);
  return res
    .status(500)
    .json({ success: false, message: "Internal server error" });
};

module.exports = { errorHandler, notFound };
