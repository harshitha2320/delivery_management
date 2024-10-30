const express = require("express");
const app = express();

const usersRoute = require("./routes/users")
const inventoryRoute = require("./routes/inventory")
const authRoute = require("./routes/auth");
const orderRoute = require("./routes/order");
const { authenticate } = require("./middleware/auth");


// Middleware to parse JSON request bodies
app.use(express.json());


// Protected routes
app.use("/users",authenticate,usersRoute ) 
app.use("/inventory",authenticate,inventoryRoute )

app.use("/order",orderRoute )
app.use("/auth",authRoute )

module.exports = app;
