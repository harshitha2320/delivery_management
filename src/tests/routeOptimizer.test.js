const {
  routeDistance,
  nearestNeighborRoute,
  twoOptImprove,
  optimizeRoute,
} = require("../src/services/routeOptimizer");

// Helper: build a distance matrix from 2D points
const dist = (a, b) => Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) * 1000);
const buildMatrix = (pts) => pts.map((a) => pts.map((b) => dist(a, b)));

describe("routeDistance", () => {
  test("sums consecutive legs", () => {
    const matrix = [
      [0, 5, 9],
      [5, 0, 3],
      [9, 3, 0],
    ];
    expect(routeDistance([0, 1, 2], matrix)).toBe(8); // 5 + 3
  });
});

describe("nearestNeighborRoute", () => {
  test("starts at 0, ends at last index, visits every stop once", () => {
    const matrix = buildMatrix([[0, 0], [1, 5], [2, 1], [3, 4], [6, 0]]);
    const route = nearestNeighborRoute(matrix);

    expect(route[0]).toBe(0);
    expect(route[route.length - 1]).toBe(4);
    expect([...route].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  test("hops to the nearest stop from the CURRENT position, not the start", () => {
    // From 0, stop 1 is nearest. From 1, stop 2 is nearest even though
    // stop 3 is closer to the start - the old bug would pick wrong here.
    const matrix = [
      [0, 1, 10, 2, 20],
      [1, 0, 2, 9, 20],
      [10, 2, 0, 8, 20],
      [2, 9, 8, 0, 20],
      [20, 20, 20, 20, 0],
    ];
    const route = nearestNeighborRoute(matrix);
    expect(route).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("twoOptImprove", () => {
  test("never makes the route worse and keeps endpoints fixed", () => {
    const matrix = buildMatrix([
      [0, 0], [1, 5], [2, 0.5], [3, 5], [4, 0.5], [5, 5], [6, 0],
    ]);
    const nn = nearestNeighborRoute(matrix);
    const improved = twoOptImprove(nn, matrix);

    expect(routeDistance(improved, matrix)).toBeLessThanOrEqual(routeDistance(nn, matrix));
    expect(improved[0]).toBe(0);
    expect(improved[improved.length - 1]).toBe(6);
    expect([...improved].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  test("untangles a route with an obvious crossing", () => {
    // Straight line of stops; force a deliberately bad visiting order.
    const matrix = buildMatrix([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]);
    const bad = [0, 3, 1, 2, 4]; // zig-zag
    const improved = twoOptImprove(bad, matrix);
    expect(routeDistance(improved, matrix)).toBe(4000); // straight through
  });
});

describe("optimizeRoute", () => {
  test("reports both distances and a non-negative improvement", () => {
    const matrix = buildMatrix([
      [0, 0], [1, 5], [2, 0.5], [3, 5], [4, 0.5], [5, 5], [6, 0],
    ]);
    const result = optimizeRoute(matrix);

    expect(result.optimizedDistance).toBeLessThanOrEqual(result.nnDistance);
    expect(result.improvementPct).toBeGreaterThanOrEqual(0);
    expect(result.optimizedRoute[0]).toBe(0);
    expect(result.optimizedRoute[result.optimizedRoute.length - 1]).toBe(6);
  });
});
