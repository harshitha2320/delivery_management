# Delivery Management API

[![CI](https://github.com/harshitha2320/delivery_management/actions/workflows/ci.yml/badge.svg)](https://github.com/harshitha2320/delivery_management/actions/workflows/ci.yml)

A REST API for managing deliveries end-to-end: customers place orders, admins assign drivers, drivers complete deliveries - and the system computes an **optimised multi-stop delivery route** using real road distances from the Google Distance Matrix API, a nearest-neighbour heuristic, and 2-opt local search.

Built with **Node.js, Express, MongoDB (Mongoose), and JWT authentication**.

## Features

- **JWT authentication with role-based access control** — three roles (customer, driver, admin) with route-level guards and ownership checks (only the assigned driver can complete a delivery; only the owning customer can cancel).
- **Order lifecycle workflow** — `pending → in progress → delivered`, with cancellation allowed only while pending. Invalid transitions return `409 Conflict`.
- **Delivery route optimisation** — computes a near-optimal route from a start depot through every active order to an end depot. See [the algorithm](#route-optimisation-why-nearest-neighbour--2-opt).
- **Input validation** on every endpoint (express-validator) with per-field error details, including protection against mass assignment and privilege escalation.
- **Central error handling** — typed operational errors, correct HTTP status codes, no internal details leaked to clients.
- **Interactive API documentation** — full OpenAPI 3.0 spec served with Swagger UI at `/api-docs`, including in-browser authentication and try-it-out.
- **Tested** — unit tests for the routing algorithm and integration tests for auth and the full order lifecycle, running against an in-memory MongoDB. External API calls are mocked.
- **CI** — GitHub Actions runs format checks and the test suite on every push and pull request.

## API overview

Interactive documentation lives at **`/api-docs`** when the server is running. Summary:

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Register (always a customer account) |
| POST | `/auth/login` | public | Login, returns JWT |
| POST | `/auth/users` | admin | Create driver/admin accounts |
| POST | `/order/createOrder` | customer | Create an order (owner taken from JWT) |
| GET | `/order` | customer / admin | Own orders / all orders |
| PATCH | `/order/:id/assign` | admin | Assign driver, order → in progress |
| PATCH | `/order/:id/deliver` | assigned driver | Mark delivered |
| PATCH | `/order/:id/cancel` | owning customer | Cancel while pending |
| GET | `/order/best-route` | admin, driver | Optimised route across active orders |
| GET/PUT/DELETE | `/users/...` | admin | User management |
| POST/PUT/DELETE | `/inventory/...` | admin | Inventory (depot) management |

## Route optimisation: why nearest-neighbour + 2-opt

Finding the shortest route that starts at one depot, visits every delivery exactly once, and ends at a second depot is an **open Travelling Salesman Problem** — NP-hard, meaning exact solutions scale exponentially with the number of stops.

The options considered:

| Approach | Quality | Cost | Verdict |
|---|---|---|---|
| Brute force / exact DP (Held-Karp) | Optimal | O(n²·2ⁿ) — infeasible beyond ~15 stops | Rejected: doesn't scale |
| Nearest-neighbour only | Often 20–25% worse than optimal | O(n²), instant | Too greedy on its own |
| **Nearest-neighbour + 2-opt** | Near-optimal in practice | O(n²) construction + fast local search | **Chosen** |
| External solver (e.g. OR-Tools) | Excellent | Extra dependency; outsources the core logic | Overkill at this scale |

**How it works:**

1. **Full distance matrix.** The Google Distance Matrix API is queried with every location as both origin and destination, giving real road distances between all pairs — not straight-line estimates. (An earlier version of this project queried only distances *from the start depot*, which silently broke the greedy step: "nearest" was measured from the wrong place. The fix — always measuring from the current stop — is covered by a dedicated regression test.)
2. **Nearest-neighbour construction.** Starting at the origin depot, repeatedly travel to the closest unvisited stop; finish at the destination depot. Fast, but greedy — early choices can force expensive detours later.
3. **2-opt refinement.** Repeatedly take two edges of the route and reverse the segment between them; keep any reversal that shortens the total distance; stop when a full pass finds no improvement. This untangles the "crossings" that greedy construction leaves behind, while never moving the fixed start/end depots.

The API response reports **both** the plain nearest-neighbour distance and the 2-opt-improved distance, plus the improvement percentage — so the value of the refinement step is measurable on every request.

**Known trade-offs** (deliberate, documented):
- 2-opt is a heuristic: near-optimal, not guaranteed optimal. In adversarial layouts it can settle a few percent above the true optimum.
- The full N×N matrix costs N² billed API elements per request versus N for the naive version — the price of correctness. Fine at demo scale; batching or caching would be needed for large fleets.

The algorithm lives in [`src/services/routeOptimizer.js`](src/services/routeOptimizer.js) as pure functions (matrix in, route out) so it is unit-testable without a database or network.

## Project structure

```
src/
├── server.js          # bootstrap: env, DB connection, HTTP server
├── app.js             # Express app: middleware, routes, swagger, error handling
├── config/db.js       # MongoDB connection
├── controllers/       # business logic (throws typed ApiErrors)
├── middleware/        # authenticate, authorize(roles), validate, errorHandler
├── models/            # Mongoose schemas
├── routes/            # thin routers: rules -> validate -> handler
├── services/          # pure logic (route optimizer)
├── validators/        # express-validator rule sets
├── utils/             # ApiError, asyncHandler, JWT helpers
└── docs/swagger.js    # OpenAPI 3.0 specification
tests/                 # jest + supertest + in-memory MongoDB
```

## Getting started

**Prerequisites:** Node.js 20+, a MongoDB instance (local or Atlas), a Google Maps Platform API key with the Distance Matrix API enabled.

```bash
git clone https://github.com/harshitha2320/delivery_management.git
cd delivery_management
npm install

# configure environment
cp .env.example .env
#   then fill in MONGO_URL, JWT_SECRET, GOOGLE_API_KEY
#   (generate a secret: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")

# create the first admin account (uses ADMIN_EMAIL / ADMIN_PASSWORD from .env)
node scripts/seedAdmin.js

# run
npm run dev
```

Open **http://localhost:3000/api-docs**, log in via `POST /auth/login` with the seeded admin, click **Authorize**, paste the token — and explore the API from the browser.

## Testing

```bash
npm test
```

Runs 4 suites (~20 tests): algorithm unit tests, auth integration, the full order lifecycle including permission denials, and the best-route endpoint with a mocked Distance Matrix API. Tests use `mongodb-memory-server`, so no database setup is required (first run downloads a MongoDB binary).

## Roadmap

- Deployment (Render + MongoDB Atlas)
- Route visualisation on an interactive map
- Distance matrix caching to reduce API cost
- Refresh tokens and logout

## License

MIT