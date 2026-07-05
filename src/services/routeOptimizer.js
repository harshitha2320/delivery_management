/**
 * Route optimisation for a delivery run with fixed endpoints:
 * start at index 0 (origin depot), visit every order stop exactly once,
 * finish at the last index (destination depot).
 *
 * This is an open Travelling Salesman Problem. Exact solutions are
 * exponential, so we use:
 *   1. Nearest-neighbour construction: from the current stop, always go
 *      to the closest unvisited stop. Fast (O(n^2)) but greedy - it can
 *      lock itself into bad late-route choices.
 *   2. 2-opt improvement: repeatedly reverse route segments whenever the
 *      reversal shortens the total distance, until no improvement exists.
 *      Recovers most of the gap between greedy and optimal.
 *
 * All functions take `matrix` where matrix[i][j] = travel distance in
 * metres from location i to location j (asymmetric is fine - real road
 * networks are).
 */

// Total distance of a route (array of location indexes, in visit order)
const routeDistance = (route, matrix) => {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += matrix[route[i]][route[i + 1]];
  }
  return total;
};

// Greedy construction: start at 0, always hop to the nearest unvisited
// middle stop, finish at the final index.
const nearestNeighborRoute = (matrix) => {
  const n = matrix.length;
  const lastIndex = n - 1;
  const visited = new Array(n).fill(false);
  visited[0] = true;
  visited[lastIndex] = true; // endpoint is fixed, not chosen greedily

  const route = [0];
  let current = 0;

  for (let step = 0; step < n - 2; step++) {
    let nearest = -1;
    let shortest = Infinity;
    for (let j = 1; j < lastIndex; j++) {
      if (!visited[j] && matrix[current][j] < shortest) {
        shortest = matrix[current][j];
        nearest = j;
      }
    }
    visited[nearest] = true;
    route.push(nearest);
    current = nearest; // <- the fix: measure from where we now are
  }

  route.push(lastIndex);
  return route;
};

// Local search: try reversing every middle segment [i..k]; keep any
// reversal that shortens the route; repeat until a full pass finds none.
// Endpoints (positions 0 and length-1) never move.
const twoOptImprove = (initialRoute, matrix) => {
  let route = [...initialRoute];
  let best = routeDistance(route, matrix);
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) {
      for (let k = i + 1; k < route.length - 1; k++) {
        const candidate = [
          ...route.slice(0, i),
          ...route.slice(i, k + 1).reverse(),
          ...route.slice(k + 1),
        ];
        const candidateDistance = routeDistance(candidate, matrix);
        if (candidateDistance < best) {
          route = candidate;
          best = candidateDistance;
          improved = true;
        }
      }
    }
  }
  return route;
};

// Full pipeline: NN construction, then 2-opt refinement.
const optimizeRoute = (matrix) => {
  const nnRoute = nearestNeighborRoute(matrix);
  const nnDistance = routeDistance(nnRoute, matrix);

  const optimizedRoute = twoOptImprove(nnRoute, matrix);
  const optimizedDistance = routeDistance(optimizedRoute, matrix);

  const improvementPct =
    nnDistance === 0 ? 0 : ((nnDistance - optimizedDistance) / nnDistance) * 100;

  return {
    nnRoute,
    nnDistance,
    optimizedRoute,
    optimizedDistance,
    improvementPct: Math.round(improvementPct * 100) / 100,
  };
};

module.exports = { routeDistance, nearestNeighborRoute, twoOptImprove, optimizeRoute };
