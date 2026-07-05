// Wraps an async route handler and forwards any rejection to next(),
// so Express's error middleware handles it. Avoids try/catch in every route.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
