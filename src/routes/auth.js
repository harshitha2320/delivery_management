const express = require('express');
const authMiddleware = require("../middleware/auth")

const router = express.Router();


// Register new user
router.post('/register', async (req, res,next) => {
    try {
        const data = await authMiddleware.registerUser(req.body);
        res.status(200).send(data);
        return next();
    } catch (error) {
        res.status(500).send({ success: false, message: 'Something went wrong!' });
        return next(error);
    }
});

// User Login
router.post('/login', async (req, res,next) => {
    try {
        const data = await authMiddleware.userLogin(req.body);
        res.status(200).send(data);
        return next();
    } catch (error) {
        res.status(500).send({ success: false, message: 'Something went wrong!' });
        return next(error);
    }
});



module.exports = router;