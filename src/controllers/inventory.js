const inventorySchema = require("../models/inventorySchema");
const ApiError = require("../utils/ApiError");

// Create new Inventory
const addInventory = async (data) => {
  const existInventory = await inventorySchema.findOne({ name: data.name });
  if (existInventory) {
    throw new ApiError(409, "An inventory with this name already exists");
  }
  const newInventory = await inventorySchema.create(data);
  return { message: "Inventory added", data: newInventory };
};

// Update existing Inventory
const updateInventory = async (id, data) => {
  const inventory = await inventorySchema.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!inventory) throw new ApiError(404, "Inventory not found");
  return { message: "Updated successfully", data: inventory };
};

// Delete existing Inventory
const deleteInventory = async (id) => {
  const inventory = await inventorySchema.findByIdAndDelete(id);
  if (!inventory) throw new ApiError(404, "Inventory not found");
  return { message: "Deleted successfully", data: inventory };
};

module.exports = { addInventory, updateInventory, deleteInventory };
