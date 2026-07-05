const axios = require("axios");

const inventorySchema = require("../models/inventorySchema");
const orderSchema = require("../models/orderSchema");
const User = require("../models/usersSchema");
const ApiError = require("../utils/ApiError");
const { optimizeRoute } = require("../services/routeOptimizer");

/**
 * Order lifecycle:
 *   pending --(admin assigns driver)--> in progress --(driver)--> delivered
 *   pending --(owning customer)--> canceled
 */

// Create order. Identity comes from the JWT, never the body -
// otherwise anyone could create orders as someone else.
const createOrder = async (data, userId) => {
  const newOrder = await orderSchema.create({ ...data, userId });
  return { message: "Order created", data: newOrder };
};

// Admin assigns a driver to a pending order
const assignDriver = async (orderId, driverId) => {
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== "driver") {
    throw new ApiError(422, "assignedDriver must reference a user with the driver role");
  }

  const order = await orderSchema.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.orderStatus !== "pending") {
    throw new ApiError(409, `Cannot assign a driver to a ${order.orderStatus} order`);
  }

  order.assignedDriver = driverId;
  order.orderStatus = "in progress";
  await order.save();

  return { message: "Driver assigned", data: order };
};

// Assigned driver marks the order delivered
const markDelivered = async (orderId, callerUserId) => {
  const order = await orderSchema.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (!order.assignedDriver || order.assignedDriver.toString() !== callerUserId) {
    throw new ApiError(403, "Only the assigned driver can update this order");
  }
  if (order.orderStatus !== "in progress") {
    throw new ApiError(409, `Cannot deliver a ${order.orderStatus} order`);
  }

  order.orderStatus = "delivered";
  await order.save();

  return { message: "Order delivered", data: order };
};

// Owning customer cancels a pending order
const cancelOrder = async (orderId, callerUserId) => {
  const order = await orderSchema.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.userId.toString() !== callerUserId) {
    throw new ApiError(403, "You can only cancel your own orders");
  }
  if (order.orderStatus !== "pending") {
    throw new ApiError(409, `Cannot cancel a ${order.orderStatus} order`);
  }

  order.orderStatus = "canceled";
  await order.save();

  return { message: "Order canceled", data: order };
};

// Customer sees own orders; admin sees all
const getOrders = async (callerUserId, callerRole) => {
  const filter = callerRole === "admin" ? {} : { userId: callerUserId };
  const orders = await orderSchema.find(filter);
  return { message: "Orders fetched", data: orders };
};

/**
 * Delivery route across all pending/in-progress orders:
 * start at inventory 1, visit every stop, end at inventory 2.
 * Full NxN Distance Matrix, then NN + 2-opt (services/routeOptimizer).
 */
const findBestRoute = async () => {
  const orders = await orderSchema.find({
    orderStatus: { $in: ["pending", "in progress"] },
  });
  const inventories = await inventorySchema.find({});

  if (inventories.length < 2) {
    throw new ApiError(422, "Route calculation requires at least two inventory locations");
  }
  if (orders.length === 0) {
    throw new ApiError(422, "No active orders to route");
  }

  const stops = [
    { label: `Inventory: ${inventories[0].name}`, ...toLatLng(inventories[0].coordinates) },
    ...orders.map((o) => ({
      label: `Order ${o._id}`,
      orderId: o._id,
      ...toLatLng(o.deliveryAddress),
    })),
    { label: `Inventory: ${inventories[1].name}`, ...toLatLng(inventories[1].coordinates) },
  ];

  const matrix = await getFullDistanceMatrix(stops);
  const result = optimizeRoute(matrix);

  return {
    message: "Optimal route calculated",
    stops: result.optimizedRoute.map((index, position) => ({
      position: position + 1,
      ...stops[index],
    })),
    distances: {
      nearestNeighborMeters: result.nnDistance,
      optimizedMeters: result.optimizedDistance,
      optimizedKm: Math.round((result.optimizedDistance / 1000) * 100) / 100,
      improvementPct: result.improvementPct,
    },
  };
};

const toLatLng = (c) => ({ latitude: c.latitude, longitude: c.longitude });

const getFullDistanceMatrix = async (stops) => {
  const coordString = stops.map((s) => `${s.latitude},${s.longitude}`).join("|");

  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/distancematrix/json",
    {
      params: {
        origins: coordString,
        destinations: coordString,
        key: process.env.GOOGLE_API_KEY,
      },
    }
  );

  if (response.data.status !== "OK") {
    throw new ApiError(
      502,
      `Distance Matrix API error: ${response.data.error_message || "Unknown error"}`
    );
  }

  return response.data.rows.map((row, i) =>
    row.elements.map((el, j) => {
      if (el.status !== "OK") {
        throw new ApiError(502, `No route between stop ${i} and stop ${j} (${el.status})`);
      }
      return el.distance.value;
    })
  );
};

module.exports = {
  createOrder,
  assignDriver,
  markDelivered,
  cancelOrder,
  getOrders,
  findBestRoute,
};
