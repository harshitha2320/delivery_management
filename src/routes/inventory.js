const express = require("express");
const inventoryController = require("../controllers/inventory");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { addInventoryRules, idParamRule } = require("../validators/inventoryValidators");

const router = express.Router();

// Add inventory
router.post(
  "/addInventory",
  addInventoryRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await inventoryController.addInventory(req.body);
    res.status(201).json(data);
  })
);

// Update inventory by id
router.put(
  "/updateInventory/:id",
  idParamRule,
  validate,
  asyncHandler(async (req, res) => {
    const data = await inventoryController.updateInventory(req.params.id, req.body);
    res.status(200).json(data);
  })
);

// Delete inventory by id
router.delete(
  "/deleteInventory/:id",
  idParamRule,
  validate,
  asyncHandler(async (req, res) => {
    const data = await inventoryController.deleteInventory(req.params.id);
    res.status(200).json(data);
  })
);

module.exports = router;
