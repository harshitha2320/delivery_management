const axios = require("axios");

const inventorySchema = require("../models/inventorySchema");
const orderSchema = require("../models/orderSchema");
const ApiError = require("../utils/ApiError");

// Add orders
const createOrder = async (data) => {
  const newOrder = await orderSchema.create(data);
  return { message: "Order created", data: newOrder };
};

const findBestRoute = async () => {
  const orders = await orderSchema.find({});
  const inventories = await inventorySchema.find({});

  if (inventories.length < 2) {
    throw new ApiError(422, "Route calculation requires at least two inventory locations");
  }
  if (orders.length === 0) {
    throw new ApiError(422, "No orders to route");
  }

  const locations = [
    inventories[0].coordinates, // Inventory 1 (start)
    ...orders.map((o) => o.deliveryAddress), // Customer orders
    inventories[1].coordinates, // Inventory 2 (end)
  ];
  const distanceData = await getDistanceMatrix(locations);

  return calculateBestRoute(distanceData);
};

const getDistanceMatrix = async (locations) => {
  const origin = `${locations[0].latitude},${locations[0].longitude}`;
  const destinations = locations
    .slice(1)
    .map((loc) => `${loc.latitude},${loc.longitude}`)
    .join("|");

  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/distancematrix/json",
    {
      params: {
        origins: origin,
        destinations: destinations,
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

  return response.data;
};

const calculateBestRoute = (distanceData) => {
  const numDestinations = distanceData.rows[0].elements.length;
  const visited = new Array(numDestinations).fill(false);
  const route = [0];
  visited[0] = true;

  for (let i = 1; i < numDestinations; i++) {
    let nearestIndex = -1;
    let shortestDistance = Infinity;

    for (let j = 1; j < numDestinations; j++) {
      if (!visited[j] && distanceData.rows[0].elements[j].distance.value < shortestDistance) {
        shortestDistance = distanceData.rows[0].elements[j].distance.value;
        nearestIndex = j;
      }
    }

    visited[nearestIndex] = true;
    route.push(nearestIndex);
  }

  route.push(numDestinations - 1);

  return {
    message: "Optimal route calculated",
    route: route,
    totalDistance: route.reduce(
      (total, index) => total + distanceData.rows[0].elements[index].distance.value,
      0
    ),
  };
};

module.exports = { createOrder, findBestRoute };
