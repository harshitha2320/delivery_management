const express = require('express');
const userMiddleware = require("../middleware/users")

const router = express.Router();


// Adding users
router.post('/addUser', async (req, res, next) => {
    try {
        const data = await userMiddleware.addUsers(req.body);
        res.status(200).send(data);
        return next();
    } catch (error) {
        res.status(500).send({ success: false, message: 'Something went wrong while adding user details' });
        return next(error);
    }
});

router.get('/getAllUser', async (req, res, next) => {
    try {
        const data = await userMiddleware.getAllUsers()
        res.status(200).send(data)
        return next();
    }
    catch (error) {
        res.status(500).send({ succes: false, message: "Something went wrong!" })
        return next(error)
    }
})

router.put("/updateUser/:id", async (req, res, next) => {
    try {
        const id = req.params.id
        const data = await userMiddleware.updateUsers(id, req.body)
        res.status(200).send(data)
        return next()
    } catch (err) {
        res.status(500).send({ succes: false, message: "Something went wrong" })
        return next(err)
    }
})

router.delete("/deleteUser/:id",async(req,res,next)=>{
    try{
        const data = await userMiddleware.deleteUser(req.params.id)
        res.status(200).send({message:"Data deleted succesfully",data})
        return next();
    }catch(err){
        res.status(500).send({message:"Something went wrong"})
        return next(err)
    }
})


//  Sort users
router.get("/fetchSortedUsers",async(req,res,next)=>{
    try{
        const data = await userMiddleware.fetchSortedUsers(req.body)
        res.status(200).send({message:"Users sorted by Registration Time",data})
        return next();
    }catch(err){
        res.status(500).send({message:"Something went wrong"})
        return next(err)
    }
})

// Fetch users withinn date range
router.get("/fetchUsersByDateRange",async(req,res,next)=>{
    try{
        const data = await userMiddleware.fetchUsersByDateRange(req.body)
        res.status(200).send({message:"Data fetched succesfully",data})
        return next();
    }catch(err){
        res.status(500).send({message:"Something went wrong"})
        return next(err)
    }
})

// User profile edit
router.put('/edit-profile', async (req, res) => {
    try {
        const data = await userMiddleware.editProfile(req.userId, req.body);
        res.status(200).send(data);
    } catch (error) {
        res.status(500).send({ success: false, message: 'Something went wrong!', error: error.message });
    }
});

module.exports = router;