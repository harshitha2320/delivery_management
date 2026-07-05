const { verifyToken } = require("../utils/jwt");

// Verify JWT; attach the caller's id and role to the request.
const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Restrict a route to specific roles. Use after authenticate:
//   router.patch("/:id/assign", authorize("admin"), ...)
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action" });
    }
    next();
  };

module.exports = { authenticate, authorize };
