const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;


//Generate new token for logedIn users
const generateToken = (user) => {
  return jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
};

//Verify the token
const verifyToken = (token) => jwt.verify(token, SECRET_KEY);

module.exports = { generateToken, verifyToken };
