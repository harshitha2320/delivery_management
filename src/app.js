const express = require("express");
const swaggerUi = require("swagger-ui-express");
const app = express();

const usersRoute = require("./routes/users");
const inventoryRoute = require("./routes/inventory");
const authRoute = require("./routes/auth");
const orderRoute = require("./routes/order");
const { authenticate, authorize } = require("./middleware/auth");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const swaggerSpec = require("./docs/swagger");

// Middleware to parse JSON request bodies
app.use(express.json());

// Interactive API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root: point visitors at the docs
app.get("/", (req, res) => {
  res.json({
    name: "Delivery Management API",
    docs: "/api-docs",
  });
});

// Public + mixed routes
app.use("/auth", authRoute);

// Protected routes
app.use("/users", authenticate, authorize("admin"), usersRoute);
app.use("/inventory", authenticate, authorize("admin"), inventoryRoute);
app.use("/order", authenticate, orderRoute);

// 404 for unmatched routes, then central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
