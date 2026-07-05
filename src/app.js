const express = require("express");
const app = express();

const usersRoute = require("./routes/users");
const inventoryRoute = require("./routes/inventory");
const authRoute = require("./routes/auth");
const orderRoute = require("./routes/order");
const { authenticate } = require("./middleware/auth");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Middleware to parse JSON request bodies
app.use(express.json());

// Public routes
app.use("/auth", authRoute);

// Protected routes
app.use("/users", authenticate, usersRoute);
app.use("/inventory", authenticate, inventoryRoute);
app.use("/order", orderRoute);

// 404 for unmatched routes, then central error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
