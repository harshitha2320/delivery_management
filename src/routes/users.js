const express = require("express");
const userController = require("../controllers/users");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Get all users
router.get(
  "/getAllUser",
  asyncHandler(async (req, res) => {
    const data = await userController.getAllUsers();
    res.status(200).json(data);
  })
);

// Update a user by id
router.put(
  "/updateUser/:id",
  asyncHandler(async (req, res) => {
    const data = await userController.updateUsers(req.params.id, req.body);
    res.status(200).json(data);
  })
);

// Delete a user by id
router.delete(
  "/deleteUser/:id",
  asyncHandler(async (req, res) => {
    const data = await userController.deleteUser(req.params.id);
    res.status(200).json(data);
  })
);

// Sorted users: /users/fetchSortedUsers?sortOrder=desc
router.get(
  "/fetchSortedUsers",
  asyncHandler(async (req, res) => {
    const data = await userController.fetchSortedUsers({ sortOrder: req.query.sortOrder });
    res.status(200).json(data);
  })
);

// Users within date range: /users/fetchUsersByDateRange?startDateStr=01/01/2026&endDateStr=31/01/2026
router.get(
  "/fetchUsersByDateRange",
  asyncHandler(async (req, res) => {
    const data = await userController.fetchUsersByDateRange({
      startDateStr: req.query.startDateStr,
      endDateStr: req.query.endDateStr,
    });
    res.status(200).json(data);
  })
);

// Edit own profile (userId comes from the JWT via authenticate middleware)
router.put(
  "/edit-profile",
  asyncHandler(async (req, res) => {
    const data = await userController.editProfile(req.userId, req.body);
    res.status(200).json(data);
  })
);

module.exports = router;
