const userSchema = require("../models/usersSchema");
const { DateTime } = require("luxon");
const ApiError = require("../utils/ApiError");

// Get all users
const getAllUsers = async () => {
  const allUsers = await userSchema.find({});
  return { message: "All users fetched", data: allUsers };
};

// Updating existing user
const updateUsers = async (id, data) => {
  const user = await userSchema.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "User not found");
  return { message: "Updated successfully", data: user };
};

// Delete existing user
const deleteUser = async (id) => {
  const user = await userSchema.findByIdAndDelete(id);
  if (!user) throw new ApiError(404, "User not found");
  return { message: "Deleted successfully", data: user };
};

// Fetch all users with sorting option
const fetchSortedUsers = async ({ sortOrder }) => {
  const users = await userSchema.aggregate([
    { $sort: { time_of_registration: sortOrder === "desc" ? -1 : 1 } },
  ]);
  return { message: "Users fetched successfully", data: users };
};

// Fetch users registered within a given date range
const fetchUsersByDateRange = async ({ startDateStr, endDateStr }) => {
  const startDate = DateTime.fromFormat(startDateStr || "", "dd/MM/yyyy").startOf("day");
  const endDate = DateTime.fromFormat(endDateStr || "", "dd/MM/yyyy").endOf("day");

  if (!startDate.isValid || !endDate.isValid) {
    throw new ApiError(400, "Dates must be in dd/MM/yyyy format");
  }

  const users = await userSchema.aggregate([
    {
      $match: {
        time_of_registration: { $gte: startDate.toMillis(), $lte: endDate.toMillis() },
      },
    },
    { $sort: { time_of_registration: -1 } },
  ]);

  return { message: "Users fetched successfully", data: users };
};

// Edit own profile
const editProfile = async (userId, data) => {
  const updatedUser = await userSchema.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  });
  if (!updatedUser) throw new ApiError(404, "User not found");
  return { message: "Profile updated successfully", data: updatedUser };
};

module.exports = {
  getAllUsers,
  updateUsers,
  deleteUser,
  fetchSortedUsers,
  fetchUsersByDateRange,
  editProfile,
};
