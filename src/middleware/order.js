const axios = require('axios');

const inventorySchema = require("../model/inventorySchema")
const orderSchema = require("../model/orderSchema")
require('dotenv').config();

// Add orders
const createOrder = async (data) => {
    try {
        const newUser = await orderSchema.create(data)
        return { message: "Order Created ", data: newUser }


    } catch (err) {
        console.error(err)
        return { message: "Error adding orders", error: err.message };
    }
}

const findBestRoute = async()=> {
    // Fetch orders and inventory coordinates
    const orders = await orderSchema.find({})
    const inventories = await inventorySchema.find({})

    const locations = [
        inventories[0].coordinates,  // Inventory 1
        ...orders.map(o => o.deliveryAddress), // Customer Orders
        inventories[1].coordinates   // Inventory 2
    ];
    const distanceData = await getDistanceMatrix(locations);

    const bestRoute = calculateBestRoute(distanceData);

    return bestRoute;
}

const getDistanceMatrix = async (locations) => {
    // Inventory 1 is the only origin
    const origin = `${locations[0].latitude},${locations[0].longitude}`;
    
    // Destinations include all orders and Inventory 2
    const destinations = locations.slice(1).map(loc => `${loc.latitude},${loc.longitude}`).join('|');

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: origin,
                destinations: destinations,
                key: process.env.GOOGLE_API_KEY
            }
        });
        
        if (response.data.status !== "OK") {
            throw new Error(`API Error: ${response.data.error_message || 'Unknown error'}`);
        }

        return response.data;
    } catch (err) {
        console.error(`Error fetching distances: ${err.message}`);
        throw err;
    }
};


const calculateBestRoute = (distanceData) => {
    const numDestinations = distanceData.rows[0].elements.length; 
    const visited = new Array(numDestinations).fill(false);
    const route = [0]; // Start at the first destination (Inventory 1)
    visited[0] = true; // Mark as visited

    let currentIndex = 0; 

    // While there are unvisited destinations
    for (let i = 1; i < numDestinations; i++) {
        let nearestIndex = -1;
        let shortestDistance = Infinity;

        // Find the nearest unvisited destination
        for (let j = 1; j < numDestinations; j++) {
            if (!visited[j] && distanceData.rows[0].elements[j].distance.value < shortestDistance) {
                shortestDistance = distanceData.rows[0].elements[j].distance.value;
                nearestIndex = j;
            }
        }

        // Mark the nearest destination as visited and add it to the route
        visited[nearestIndex] = true;
        route.push(nearestIndex);
        currentIndex = nearestIndex;
    }

    // Go to Inventory 2 (if it's the last index)
    route.push(numDestinations - 1); 

    return {
        message: "Optimal route calculated",
        route: route,
        totalDistance: route.reduce((total, index) => total + distanceData.rows[0].elements[index].distance.value, 0)
    };
};

module.exports ={createOrder,findBestRoute}