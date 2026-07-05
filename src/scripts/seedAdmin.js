/**
 * Creates the first admin account. Run once:
 *   node scripts/seedAdmin.js
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from .env.
 * (Public registration only creates customers, so the first
 * admin has to come from outside the API - this script.)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/usersSchema");

const run = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
  } else {
    await User.create({
      name: "Admin",
      email,
      password,
      mobile: "0000000000",
      role: "admin",
      coordinates: { latitude: 0, longitude: 0 },
    });
    console.log("Admin created:", email);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
