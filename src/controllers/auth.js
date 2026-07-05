const bcrypt = require("bcryptjs");
const User = require("../models/usersSchema");
const { generateToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");

// User Registration (public): always creates a customer.
// Driver/admin accounts are created by an admin (or the seed script) -
// letting the public choose their own role would be privilege escalation.
const registerUser = async (data) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const newUser = new User({ ...data, role: "customer" });
  await newUser.save();

  const userSafe = newUser.toObject();
  delete userSafe.password;

  return { message: "User registered successfully", data: userSafe };
};

// Admin-only: create a user with an explicit role (driver or admin)
const createUserWithRole = async (data) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const newUser = new User(data);
  await newUser.save();

  const userSafe = newUser.toObject();
  delete userSafe.password;

  return { message: `${data.role} account created`, data: userSafe };
};

// User Login
const userLogin = async (data) => {
  const { email, password } = data;
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }
  const token = generateToken(user);
  return { message: "Login successful", token, role: user.role };
};

module.exports = { registerUser, createUserWithRole, userLogin };
