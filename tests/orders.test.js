process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const app = require("../src/app");
const db = require("./db");
const User = require("../src/models/usersSchema");

beforeAll(async () => await db.connect());
afterAll(async () => await db.close());

let customerToken, driverToken, adminToken, driverId, orderId;

const makeUser = (overrides) => ({
  name: "User",
  email: `${Math.random().toString(36).slice(2)}@example.com`,
  mobile: String(Math.floor(1000000000 + Math.random() * 8999999999)),
  password: "password123",
  coordinates: { latitude: 53.42, longitude: -7.94 },
  ...overrides,
});

const login = async (email) => {
  const res = await request(app)
    .post("/auth/login")
    .send({ email, password: "password123" });
  return res.body.token;
};

beforeAll(async () => {
  // Roles other than customer are created directly via the model,
  // mirroring what the seed script / an admin would do.
  const customer = await User.create(makeUser({ email: "cust@example.com" }));
  const driver = await User.create(
    makeUser({ email: "driver@example.com", role: "driver" }),
  );
  await User.create(makeUser({ email: "admin@example.com", role: "admin" }));

  driverId = driver._id.toString();
  customerToken = await login("cust@example.com");
  driverToken = await login("driver@example.com");
  adminToken = await login("admin@example.com");
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("order lifecycle", () => {
  test("customer creates an order; owner comes from the JWT", async () => {
    const res = await request(app)
      .post("/order/createOrder")
      .set(auth(customerToken))
      .send({
        products: [{ productId: "64b7f8a2c9d1e2f3a4b5c6d7", quantity: 2 }],
        deliveryAddress: { latitude: 53.43, longitude: -7.95 },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.orderStatus).toBe("pending");
    orderId = res.body.data._id;
  });

  test("client-supplied userId is rejected", async () => {
    const res = await request(app)
      .post("/order/createOrder")
      .set(auth(customerToken))
      .send({
        userId: "64b7f8a2c9d1e2f3a4b5c6d7",
        products: [{ productId: "64b7f8a2c9d1e2f3a4b5c6d7", quantity: 1 }],
        deliveryAddress: { latitude: 53.43, longitude: -7.95 },
      });

    expect(res.status).toBe(400);
  });

  test("driver cannot assign (403); admin can", async () => {
    const denied = await request(app)
      .patch(`/order/${orderId}/assign`)
      .set(auth(driverToken))
      .send({ driverId });
    expect(denied.status).toBe(403);

    const ok = await request(app)
      .patch(`/order/${orderId}/assign`)
      .set(auth(adminToken))
      .send({ driverId });
    expect(ok.status).toBe(200);
    expect(ok.body.data.orderStatus).toBe("in progress");
  });

  test("customer cannot cancel once in progress (409)", async () => {
    const res = await request(app)
      .patch(`/order/${orderId}/cancel`)
      .set(auth(customerToken));
    expect(res.status).toBe(409);
  });

  test("only the assigned driver can deliver", async () => {
    const other = await User.create(
      makeUser({ email: "driver2@example.com", role: "driver" }),
    );
    const otherToken = await login("driver2@example.com");

    const denied = await request(app)
      .patch(`/order/${orderId}/deliver`)
      .set(auth(otherToken));
    expect(denied.status).toBe(403);

    const ok = await request(app)
      .patch(`/order/${orderId}/deliver`)
      .set(auth(driverToken));
    expect(ok.status).toBe(200);
    expect(ok.body.data.orderStatus).toBe("delivered");
  });

  test("delivered orders cannot be delivered again (409)", async () => {
    const res = await request(app)
      .patch(`/order/${orderId}/deliver`)
      .set(auth(driverToken));
    expect(res.status).toBe(409);
  });
});
