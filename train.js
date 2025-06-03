class Graph {
  constructor() {
    this.adj = new Map(); // node -> [ { node, time } ]
  }

  addEdge(node1, node2, time) {
    if (!this.adj.has(node1)) this.adj.set(node1, []);
    if (!this.adj.has(node2)) this.adj.set(node2, []);
    this.adj.get(node1).push({ node: node2, time });
    this.adj.get(node2).push({ node: node1, time });
  }

  // Dijkstra's algorithm
  shortestPath(start, end) {
    const pq = [[0, start, []]]; // [cost, node, path]
    const visited = new Set();

    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]); // min-heap behavior
      const [cost, node, path] = pq.shift();

      if (visited.has(node)) continue;
      visited.add(node);

      const newPath = [...path, node];
      if (node === end) return [newPath, cost];

      for (const neighbor of this.adj.get(node) || []) {
        if (!visited.has(neighbor.node)) {
          pq.push([cost + neighbor.time * 60, neighbor.node, newPath]);
        }
      }
    }

    return [[], Infinity];
  }
}

// ==== Sample Input ====

const stations = ["A", "B", "C"];
const edges = [
  ["E1", "A", "B", 30],
  ["E2", "B", "C", 10],
  ["E3", "A", "C", 50],
];
const trains = [{ name: "Q1", capacity: 6, location: "B" }];
const packages = [{ name: "K1", weight: 5, start: "A", end: "C" }];

// ==== Build Graph ====

const graph = new Graph();
for (const [_, n1, n2, time] of edges) {
  graph.addEdge(n1, n2, time);
}

// ==== Plan Moves ====

let moves = [];
let trainStates = {};
for (const train of trains) {
  trainStates[train.name] = {
    location: train.location,
    time: 0,
    cargo: [],
  };
}

for (const pkg of packages) {
  const { name: pkgName, weight, start, end } = pkg;

  for (const train of trains) {
    if (train.capacity >= weight) {
      const state = trainStates[train.name];
      let currLoc = state.location;
      let currTime = state.time;

      // Move to package start
      if (currLoc !== start) {
        const [path, cost] = graph.shortestPath(currLoc, start);
        for (let i = 0; i < path.length - 1; i++) {
          const from = path[i];
          const to = path[i + 1];
          const travelTime =
            graph.adj.get(from).find((n) => n.node === to).time * 60;
          moves.push({
            W: currTime,
            T: train.name,
            N1: from,
            P1: [],
            N2: to,
            P2: [],
          });
          currTime += travelTime;
        }
        currLoc = start;
      }

      // Pick up package
      state.cargo.push(pkgName);

      // Move to destination
      const [pathToEnd, costToEnd] = graph.shortestPath(start, end);
      for (let i = 0; i < pathToEnd.length - 1; i++) {
        const from = pathToEnd[i];
        const to = pathToEnd[i + 1];
        const travelTime =
          graph.adj.get(from).find((n) => n.node === to).time * 60;
        const dropOff = to === end ? [pkgName] : [];
        moves.push({
          W: currTime,
          T: train.name,
          N1: from,
          P1: i === 0 ? [pkgName] : [],
          N2: to,
          P2: dropOff,
        });
        currTime += travelTime;
      }

      state.time = currTime;
      state.location = end;
      state.cargo = [];

      break; // one train per package in this simple version
    }
  }
}

// ==== Output Moves ====

console.log("Moves:");
for (const move of moves) {
  console.log(
    `W=${move.W}, T=${move.T}, N1=${move.N1}, P1=[${move.P1}], N2=${move.N2}, P2=[${move.P2}]`
  );
}
