const { verifyToken } = require("../utils/jwt");

// Verify JWT
const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const decoded = verifyToken(token);
    // req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = { authenticate };
