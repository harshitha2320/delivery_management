process.env.JWT_SECRET = "test-secret";
process.env.GOOGLE_API_KEY = "fake-key-for-tests";

// Mock axios so no real Google API call happens: tests are free,
// fast, and deterministic.
jest.mock("axios");
const axios = require("axios");

const request = require("supertest");
const app = require("../src/app");
const db = require("./db");
const User = require("../src/models/usersSchema");
const Inventory = require("../src/models/inventorySchema");
const Order = require("../src/models/orderSchema");

beforeAll(async () => await db.connect());
afterAll(async () => await db.close());

let adminToken;

// Build a fake Distance Matrix response from a plain matrix
const fakeMatrixResponse = (matrix) => ({
  data: {
    status: "OK",
    rows: matrix.map((row) => ({
      elements: row.map((metres) => ({
        status: "OK",
        distance: { value: metres },
      })),
    })),
  },
});

beforeAll(async () => {
  await User.create({
    name: "Admin",
    email: "admin@example.com",
    mobile: "1111111111",
    password: "password123",
    role: "admin",
    coordinates: { latitude: 0, longitude: 0 },
  });
  const res = await request(app)
    .post("/auth/login")
    .send({ email: "admin@example.com", password: "password123" });
  adminToken = res.body.token;
});

describe("GET /order/best-route", () => {
  test("422 when there are no inventories", async () => {
    const res = await request(app)
      .get("/order/best-route")
      .set({ Authorization: `Bearer ${adminToken}` });
    expect(res.status).toBe(422);
  });

  test("optimises across active orders and reports improvement", async () => {
    await Inventory.create([
      {
        name: "Depot A",
        capacity: 100,
        coordinates: { latitude: 0, longitude: 0 },
      },
      {
        name: "Depot B",
        capacity: 100,
        coordinates: { latitude: 6, longitude: 0 },
      },
    ]);
    const customer = await User.create({
      name: "Cust",
      email: "cust@example.com",
      mobile: "2222222222",
      password: "password123",
      coordinates: { latitude: 0, longitude: 0 },
    });
    await Order.create(
      [1, 2, 3].map((i) => ({
        userId: customer._id,
        products: [{ productId: customer._id, quantity: 1 }],
        deliveryAddress: { latitude: i, longitude: 0 },
      })),
    );

    // 5 stops: depot A, 3 orders, depot B - line layout
    const line = [0, 1, 2, 3, 6].map((a) =>
      [0, 1, 2, 3, 6].map((b) => Math.abs(a - b) * 1000),
    );
    axios.get.mockResolvedValue(fakeMatrixResponse(line));

    const res = await request(app)
      .get("/order/best-route")
      .set({ Authorization: `Bearer ${adminToken}` });

    expect(res.status).toBe(200);
    expect(res.body.stops).toHaveLength(5);
    expect(res.body.stops[0].label).toContain("Depot A");
    expect(res.body.stops[4].label).toContain("Depot B");
    expect(res.body.distances.optimizedMeters).toBe(6000); // straight line
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
