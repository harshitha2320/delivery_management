const inventorySchema = require("../model/inventorySchema")

// Create new Inventory
const addInventory = async (data) => {
    try {
        const existInventory = await inventorySchema.findOne({ name: data.name })
        if (existInventory) {
            return { message: "Inventory already exists!" }
        } else {
            const newInventory = await inventorySchema.create(data)

            return { message: "Inventory added ", data: newInventory }
        }

    } catch (err) {
        console.error(err)
        return { message: "Error adding inventory", error: err.message };
    }
}


// Updating existing Inventory
const updateInventory = async (id, data) => {
    try {
        const inventory = await inventorySchema.findByIdAndUpdate(id, data,{ new: true })
        if (inventory) {
            return { message: "Updated succesfully", data: inventory }
        } else {
            return { message: "Inventory not found" }
        }
    }
    catch (err) {
        console.error(err)
        return { message: "Something went wrong!", error: err.message }
    }
}

// Delete exisiting Inventory
const deleteInventory = async (id) => {
    try {
        const inventory = await inventorySchema.findByIdAndDelete(id)
        if (inventory) {
            return { message: "Deleted Successfully", data: inventory }
        } else {
            return { message: "Inventory not found" }
        }
    } catch (err) {
        console.error(err)
        return { message: "Something went wrong", error: err.message }
    }
}

module.exports = { addInventory, updateInventory, deleteInventory }