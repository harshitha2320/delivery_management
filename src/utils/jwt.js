const jwt = require("jsonwebtoken");

// Token payload carries identity AND role, so authorization
// decisions need no extra database lookup per request.
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { generateToken, verifyToken };
