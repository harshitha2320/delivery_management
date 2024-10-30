const express = require('express');
const oredrMiddleware = require("../middleware/order")

const router = express.Router();


// Adding orders
router.post('/createOrder', async (req, res, next) => {
    try {
        const data = await oredrMiddleware.createOrder(req.body);
        res.status(200).send(data);
        return next();
    } catch (error) {
        res.status(500).send({ success: false, message: 'Something went wrong!s' });
        return next(error);
    }
});

// Best route calculation
router.get('/best-route', async (req, res) => {
    try {
        const bestRoute = await oredrMiddleware.findBestRoute();
        res.status(200).send(bestRoute);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error finding the best route', error: error.message });
    }
});


module.exports = router;