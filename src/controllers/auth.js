const bcrypt = require("bcryptjs");
const User = require("../models/usersSchema");
const { generateToken } = require("../utils/jwt");

// User Registration
const registerUser = async (data) => {
  try {
    const { email } = data;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { message: "User already exists!" };
    } else {
      const newUser = new User(data);
      await newUser.save();
      return { message: "User registered successfully", data: newUser };
    }
  } catch (err) {
    console.error(err);
    return { message: "Error registering user", error: err.message };
  }
};

// User Login
const userLogin = async (data) => {
  try {
    const { email, password } = data;
    const user = await User.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return { message: "Invalid credentials" };
      const token = generateToken(user);
      return { message: "Login successful", token };
    } else {
      return { message: "User not found" };
    }
  } catch (err) {
    console.error(err);
    return { message: "Error logging in", error: err.message };
  }
};

module.exports = { registerUser, userLogin };
