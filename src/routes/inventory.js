const express = require("express");
const inventoryController = require("../controllers/inventory");

const router = express.Router();

// Adding inventories
router.post("/addInventory", async (req, res, next) => {
  try {
    const data = await inventoryController.addInventory(req.body);
    res.status(200).send(data);
    return next();
  } catch (error) {
    res.status(500).send({ success: false, message: "Something went wrong while adding Inventory details" });
    return next(error);
  }
});

router.put("/updateInventory/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await inventoryController.updateInventory(id, req.body);
    res.status(200).send(data);
    return next();
  } catch (err) {
    res.status(500).send({ succes: false, message: "Something went wrong" });
    return next(err);
  }
});

router.delete("/deleteInventory/:id", async (req, res, next) => {
  try {
    const data = await inventoryController.deleteInventory(req.params.id);
    res.status(200).send({ message: "Data deleted succesfully", data });
    return next();
  } catch (err) {
    res.status(500).send({ message: "Something went wrong" });
    return next(err);
  }
});

module.exports = router;
