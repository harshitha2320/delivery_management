/**
 * OpenAPI 3.0 specification for the Delivery Management API.
 * Served by swagger-ui-express at /api-docs.
 * Kept as a single spec object (rather than JSDoc comments scattered
 * across routes) so the whole API contract is reviewable in one file.
 */

const coordinates = {
  type: "object",
  required: ["latitude", "longitude"],
  properties: {
    latitude: { type: "number", minimum: -90, maximum: 90, example: 53.4239 },
    longitude: { type: "number", minimum: -180, maximum: 180, example: -7.9407 },
  },
};

const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
    details: { type: "array", items: { type: "object" }, nullable: true },
  },
};

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Delivery Management API",
    version: "1.0.0",
    description:
      "REST API for delivery management: JWT auth with customer/driver/admin roles, " +
      "order lifecycle (pending → in progress → delivered / canceled), inventory management, " +
      "and delivery route optimisation using the Google Distance Matrix API with " +
      "nearest-neighbour construction + 2-opt refinement.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local development" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste the token from POST /auth/login",
      },
    },
    schemas: {
      Coordinates: coordinates,
      Error: errorResponse,
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string", example: "Ada Lovelace" },
          email: { type: "string", example: "ada@example.com" },
          mobile: { type: "string", example: "0891234567" },
          role: { type: "string", enum: ["customer", "driver", "admin"] },
          coordinates: { $ref: "#/components/schemas/Coordinates" },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          assignedDriver: { type: "string", nullable: true },
          orderStatus: {
            type: "string",
            enum: ["pending", "in progress", "delivered", "canceled"],
          },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
              },
            },
          },
          deliveryAddress: { $ref: "#/components/schemas/Coordinates" },
        },
      },
      Inventory: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string", example: "Depot North" },
          capacity: { type: "integer", example: 500 },
          coordinates: { $ref: "#/components/schemas/Coordinates" },
        },
      },
      RouteResult: {
        type: "object",
        properties: {
          message: { type: "string" },
          stops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                position: { type: "integer", example: 1 },
                label: { type: "string", example: "Order 66f1a2..." },
                orderId: { type: "string", nullable: true },
                latitude: { type: "number" },
                longitude: { type: "number" },
              },
            },
          },
          distances: {
            type: "object",
            properties: {
              nearestNeighborMeters: { type: "integer", example: 19771 },
              optimizedMeters: { type: "integer", example: 18569 },
              optimizedKm: { type: "number", example: 18.57 },
              improvementPct: { type: "number", example: 6.08 },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new customer account",
        description: "Public. Always creates a customer; the role field is rejected.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "mobile", "password", "coordinates"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  mobile: { type: "string" },
                  password: { type: "string", minLength: 8 },
                  coordinates: { $ref: "#/components/schemas/Coordinates" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Registered" },
          400: { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Email already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive a JWT",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Token returned" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/users": {
      post: {
        tags: ["Auth"],
        summary: "Create a driver or admin account (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "mobile", "password", "coordinates", "role"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  mobile: { type: "string" },
                  password: { type: "string", minLength: 8 },
                  role: { type: "string", enum: ["driver", "admin"] },
                  coordinates: { $ref: "#/components/schemas/Coordinates" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Account created" },
          403: { description: "Not an admin" },
          409: { description: "Email already exists" },
        },
      },
    },
    "/order/createOrder": {
      post: {
        tags: ["Orders"],
        summary: "Create an order (customer)",
        description: "The order owner is taken from the JWT; a userId in the body is rejected.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["products", "deliveryAddress"],
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["productId", "quantity"],
                      properties: {
                        productId: { type: "string" },
                        quantity: { type: "integer", minimum: 1 },
                      },
                    },
                  },
                  deliveryAddress: { $ref: "#/components/schemas/Coordinates" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Order created", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
          400: { description: "Validation failed" },
        },
      },
    },
    "/order": {
      get: {
        tags: ["Orders"],
        summary: "List orders (own orders; admin sees all)",
        responses: { 200: { description: "Orders", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } } },
      },
    },
    "/order/{id}/assign": {
      patch: {
        tags: ["Orders"],
        summary: "Assign a driver to a pending order (admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["driverId"],
                properties: { driverId: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Driver assigned; order moves to in progress" },
          403: { description: "Not an admin" },
          409: { description: "Order is not pending" },
          422: { description: "driverId is not a driver account" },
        },
      },
    },
    "/order/{id}/deliver": {
      patch: {
        tags: ["Orders"],
        summary: "Mark an in-progress order delivered (assigned driver only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Delivered" },
          403: { description: "Caller is not the assigned driver" },
          409: { description: "Order is not in progress" },
        },
      },
    },
    "/order/{id}/cancel": {
      patch: {
        tags: ["Orders"],
        summary: "Cancel own pending order (customer)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Canceled" },
          403: { description: "Not the order owner" },
          409: { description: "Order is not pending" },
        },
      },
    },
    "/order/best-route": {
      get: {
        tags: ["Orders"],
        summary: "Optimised delivery route across active orders (admin, driver)",
        description:
          "Builds a full NxN distance matrix from the Google Distance Matrix API, " +
          "constructs a route with nearest-neighbour, then refines it with 2-opt. " +
          "Reports both distances and the improvement percentage.",
        responses: {
          200: { description: "Route", content: { "application/json": { schema: { $ref: "#/components/schemas/RouteResult" } } } },
          422: { description: "Fewer than two inventories, or no active orders" },
          502: { description: "Distance Matrix API failure" },
        },
      },
    },
    "/users/getAllUser": {
      get: {
        tags: ["Users (admin)"],
        summary: "List all users",
        responses: { 200: { description: "Users", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } } },
      },
    },
    "/users/updateUser/{id}": {
      put: {
        tags: ["Users (admin)"],
        summary: "Update a user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
      },
    },
    "/users/deleteUser/{id}": {
      delete: {
        tags: ["Users (admin)"],
        summary: "Delete a user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
      },
    },
    "/users/fetchSortedUsers": {
      get: {
        tags: ["Users (admin)"],
        summary: "Users sorted by registration time",
        parameters: [{ name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } }],
        responses: { 200: { description: "Users" } },
      },
    },
    "/users/fetchUsersByDateRange": {
      get: {
        tags: ["Users (admin)"],
        summary: "Users registered within a date range",
        parameters: [
          { name: "startDateStr", in: "query", required: true, schema: { type: "string", example: "01/01/2026" } },
          { name: "endDateStr", in: "query", required: true, schema: { type: "string", example: "31/01/2026" } },
        ],
        responses: { 200: { description: "Users" }, 400: { description: "Bad date format" } },
      },
    },
    "/users/edit-profile": {
      put: {
        tags: ["Users (admin)"],
        summary: "Edit own profile (name, mobile, coordinates only)",
        responses: { 200: { description: "Updated" }, 400: { description: "Attempted to change email/password" } },
      },
    },
    "/inventory/addInventory": {
      post: {
        tags: ["Inventory (admin)"],
        summary: "Add an inventory location",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Inventory" } } },
        },
        responses: { 201: { description: "Created" }, 409: { description: "Name already exists" } },
      },
    },
    "/inventory/updateInventory/{id}": {
      put: {
        tags: ["Inventory (admin)"],
        summary: "Update an inventory location",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
      },
    },
    "/inventory/deleteInventory/{id}": {
      delete: {
        tags: ["Inventory (admin)"],
        summary: "Delete an inventory location",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
      },
    },
  },
};

module.exports = spec;
