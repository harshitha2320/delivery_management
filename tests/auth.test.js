process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const app = require("../src/app");
const db = require("./db");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clear());
afterAll(async () => await db.close());

const validUser = {
  name: "Test User",
  email: "test@example.com",
  mobile: "0891234567",
  password: "password123",
  coordinates: { latitude: 53.42, longitude: -7.94 },
};

describe("POST /auth/register", () => {
  test("registers a customer and never returns the password", async () => {
    const res = await request(app).post("/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("customer");
    expect(res.body.data.password).toBeUndefined();
  });

  test("rejects a client-supplied role (privilege escalation attempt)", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ ...validUser, role: "admin" });

    expect(res.status).toBe(400);
  });

  test("rejects duplicate email with 409", async () => {
    await request(app).post("/auth/register").send(validUser);
    const res = await request(app).post("/auth/register").send(validUser);

    expect(res.status).toBe(409);
  });

  test("rejects invalid input with per-field details", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/register").send(validUser);
  });

  test("returns a token for valid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: validUser.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  test("protected routes reject requests without a token", async () => {
    const res = await request(app).get("/order");
    expect(res.status).toBe(401);
  });
});
