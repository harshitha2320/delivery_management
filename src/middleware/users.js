const userSchema = require("../model/usersSchema")
const { DateTime } = require('luxon');

// Add new users
const addUsers = async (data) => {
    try {
        const existUser = await userSchema.findOne({ name: data.name })
        if (existUser) {
            return { message: "User already exists!" }
        } else {
            const newUser = await userSchema.create(data)

            return { message: "User added ", data: newUser }
        }

    } catch (err) {
        console.error(err)
        return { message: "Error adding user", error: err.message };
    }
}

// Get all users
const getAllUsers = async () => {
    try {
        const allUsers = await userSchema.find({})
        return { message: "All users fetched", data: allUsers }
    } catch (err) {
        console.error(err)
        return { message: "Something went wrong!", error: err.message }
    }
}

// Updating existing user
const updateUsers = async (id, data) => {
    try {
        const user = await userSchema.findByIdAndUpdate(id, data, { new: true })
        if (user) {
            return { message: "Updated succesfully", data: user }
        } else {
            return { message: "User not found" }
        }
    }
    catch (err) {
        console.error(err)
        return { message: "Something went wrong!", error: err.message }
    }
}

// Delete exisiting user
const deleteUser = async (id) => {
    try {
        const user = await userSchema.findByIdAndDelete(id)
        if (user) {
            return { message: "Deleted Successfully", data: user }
        } else {
            return { message: "User not found" }
        }
    } catch (err) {
        console.error(err)
        return { message: "Something went wrong", error: err.message }
    }
}



// Fetch all users with sorting option
const fetchSortedUsers = async ({sortOrder}) => {
    try {
      const users = await userSchema.aggregate([
        { $sort: { time_of_registration: sortOrder === 'desc' ? -1 : 1 } }
      ]);
      return { message: "Users fetched successfully", data: users };
    } catch (err) {
      console.error(err);
      return { message: "Error fetching users", error: err.message };
    }
  };
  

// Fetch Users Registered Within a Given Date
const fetchUsersByDateRange = async ({startDateStr, endDateStr}) => {
    try {
        // Parse input dates to Luxon DateTime objects
        const startDate = DateTime.fromFormat(startDateStr, 'dd/MM/yyyy').startOf('day');
        const endDate = DateTime.fromFormat(endDateStr, 'dd/MM/yyyy').endOf('day');

        // Convert to epoch milliseconds for query
        const startEpoch = startDate.toMillis();
        const endEpoch = endDate.toMillis();

        const users = await userSchema.aggregate([
            {
              $match: {
                time_of_registration: { $gte: startEpoch, $lte: endEpoch }
              }
            },
            {
              $sort: { time_of_registration: -1 } 
            }
          ]);

        return { message: "Users fetched successfully", data: users };
    } catch (err) {
        console.error(err);
        return { message: "Error fetching users", error: err.message };
    }
};

// Edit User Profile 
const editProfile = async (userId, data) => { // Change to accept userId as separate argument
    try {
        const updatedUser = await userSchema.findByIdAndUpdate(
            userId, 
            data, 
            { new: true, runValidators: true }
        );

        if (updatedUser) {
            return { message: "Profile updated successfully", data: updatedUser };
        } else {
            return { message: "User not found", data: null };
        }
    } catch (err) {
        console.error(err);
        return { message: "Error updating profile", error: err.message };
    }
};



module.exports = { addUsers, getAllUsers, updateUsers, deleteUser, fetchSortedUsers, fetchUsersByDateRange,editProfile }