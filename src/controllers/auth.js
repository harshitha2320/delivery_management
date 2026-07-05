const bcrypt = require("bcryptjs");
const User = require("../models/usersSchema");
const { generateToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");

// User Registration
const registerUser = async (data) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }
  const newUser = new User(data);
  await newUser.save();
  return { message: "User registered successfully", data: newUser };
};

// User Login
const userLogin = async (data) => {
  const { email, password } = data;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }
  const token = generateToken(user);
  return { message: "Login successful", token };
};

module.exports = { registerUser, userLogin };
