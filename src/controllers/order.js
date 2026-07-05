const axios = require("axios");

const inventorySchema = require("../models/inventorySchema");
const orderSchema = require("../models/orderSchema");
const ApiError = require("../utils/ApiError");
const { optimizeRoute } = require("../services/routeOptimizer");

// Add orders
const createOrder = async (data) => {
  const newOrder = await orderSchema.create(data);
  return { message: "Order created", data: newOrder };
};

/**
 * Delivery route: start at inventory 1, visit every pending order,
 * end at inventory 2. Uses the full NxN Distance Matrix, then
 * nearest-neighbour + 2-opt (services/routeOptimizer).
 */
const findBestRoute = async () => {
  const orders = await orderSchema.find({});
  const inventories = await inventorySchema.find({});

  if (inventories.length < 2) {
    throw new ApiError(422, "Route calculation requires at least two inventory locations");
  }
  if (orders.length === 0) {
    throw new ApiError(422, "No orders to route");
  }

  // Location list: [start depot, ...order stops, end depot]
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

/**
 * Fetch the full NxN distance matrix: every location as both origin and
 * destination. Note the Distance Matrix API bills per element (N*N), and
 * caps elements per request - fine for demo-scale order counts; batching
 * would be needed at scale.
 */
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

  // rows[i].elements[j] = journey from location i to location j
  return response.data.rows.map((row, i) =>
    row.elements.map((el, j) => {
      if (el.status !== "OK") {
        throw new ApiError(502, `No route between stop ${i} and stop ${j} (${el.status})`);
      }
      return el.distance.value; // metres
    })
  );
};

module.exports = { createOrder, findBestRoute };
