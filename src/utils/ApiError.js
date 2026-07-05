// Operational error with an HTTP status code attached.
// Throw this from controllers; the errorHandler middleware formats the response.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
