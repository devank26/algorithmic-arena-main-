export type CellType = "empty" | "wall" | "start" | "end" | "visited" | "path" | "current" | "traffic";

export interface GridCell {
  row: number;
  col: number;
  type: CellType;
  gCost: number; // distance from start
  hCost: number; // heuristic to end
  fCost: number; // gCost + hCost
  parent: GridCell | null;
}

export interface PathfindingStep {
  grid: CellType[][];
  current: [number, number] | null;
  visited: [number, number][];
  path: [number, number][];
  finished: boolean;
  explanation?: string;
  pseudocodeLine?: number;
  frontier?: [number, number][];
  distances?: Record<string, number>;
  fScores?: Record<string, number>;
  hScores?: Record<string, number>;
}

function cloneGrid(grid: CellType[][]): CellType[][] {
  return grid.map((row) => [...row]);
}

function getNeighbors(row: number, col: number, rows: number, cols: number): [number, number][] {
  const neighbors: [number, number][] = [];
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      neighbors.push([nr, nc]);
    }
  }
  return neighbors;
}

function heuristic(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function reconstructPath(
  cameFrom: Map<string, [number, number]>,
  current: [number, number]
): [number, number][] {
  const path: [number, number][] = [current];
  let key = `${current[0]},${current[1]}`;
  while (cameFrom.has(key)) {
    const prev = cameFrom.get(key)!;
    path.unshift(prev);
    key = `${prev[0]},${prev[1]}`;
  }
  return path;
}

export function dijkstra(
  baseGrid: CellType[][],
  start: [number, number],
  end: [number, number]
): PathfindingStep[] {
  const rows = baseGrid.length;
  const cols = baseGrid[0].length;
  const steps: PathfindingStep[] = [];
  const visited = new Set<string>();
  const visitedList: [number, number][] = [];
  const dist = new Map<string, number>();
  const cameFrom = new Map<string, [number, number]>();
  
  const queue: { pos: [number, number]; cost: number }[] = [{ pos: start, cost: 0 }];
  dist.set(`${start[0]},${start[1]}`, 0);

  steps.push({ 
    grid: cloneGrid(baseGrid), current: start, visited: [], path: [], finished: false,
    explanation: "AI: Initialization sequence started. Calibrating optimal starting coordinates to distance 0.", pseudocodeLine: 0,
    frontier: [start], distances: Object.fromEntries(dist) 
  });

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const { pos: current } = queue.shift()!;
    const key = `${current[0]},${current[1]}`;

    if (visited.has(key)) continue;
    visited.add(key);
    if (!(current[0] === start[0] && current[1] === start[1]) && 
        !(current[0] === end[0] && current[1] === end[1])) {
      visitedList.push(current);
    }

    const snap = cloneGrid(baseGrid);
    for (const [vr, vc] of visitedList) snap[vr][vc] = "visited";
    snap[current[0]][current[1]] = "current";
    snap[start[0]][start[1]] = "start";
    snap[end[0]][end[1]] = "end";
    
    steps.push({ 
      grid: snap, current, visited: [...visitedList], path: [], finished: false,
      explanation: `AI: Navigating intersection [${current[0]}, ${current[1]}] (Current ETA Cost: ${dist.get(key)}). Scanning radar for accessible roads...`, pseudocodeLine: 3,
      frontier: queue.map(q => q.pos), distances: Object.fromEntries(dist) 
    });

    if (current[0] === end[0] && current[1] === end[1]) {
      const path = reconstructPath(cameFrom, end);
      const finalSnap = cloneGrid(baseGrid);
      for (const [vr, vc] of visitedList) finalSnap[vr][vc] = "visited";
      for (const [pr, pc] of path) finalSnap[pr][pc] = "path";
      finalSnap[start[0]][start[1]] = "start";
      finalSnap[end[0]][end[1]] = "end";
      steps.push({ 
        grid: finalSnap, current: null, visited: [...visitedList], path, finished: true,
        explanation: "AI: Destination reached! Calculating optimal driving route and painting path to map GPS.", pseudocodeLine: 5,
        frontier: queue.map(q => q.pos), distances: Object.fromEntries(dist)
      });
      return steps;
    }

    let updated = 0;
    for (const [nr, nc] of getNeighbors(current[0], current[1], rows, cols)) {
      const nKey = `${nr},${nc}`;
      const cell = baseGrid[nr][nc];
      if (visited.has(nKey) || cell === "wall") continue;
      const costMultiplier = cell === "traffic" ? 5 : 1;
      const newDist = (dist.get(key) ?? Infinity) + costMultiplier;
      if (newDist < (dist.get(nKey) ?? Infinity)) {
        dist.set(nKey, newDist);
        cameFrom.set(nKey, current);
        queue.push({ pos: [nr, nc], cost: newDist });
        updated++;
      }
    }

    if (updated > 0) {
      steps.push({ 
        grid: cloneGrid(snap), current, visited: [...visitedList], path: [], finished: false,
        explanation: `AI: Computed alternative routing for ${updated} valid surrounding blocks considering traffic geometry. Updating priority boundaries.`, pseudocodeLine: 9,
        frontier: queue.map(q => q.pos), distances: Object.fromEntries(dist)
      });
    }
  }

  const finalSnap = cloneGrid(baseGrid);
  for (const [vr, vc] of visitedList) finalSnap[vr][vc] = "visited";
  finalSnap[start[0]][start[1]] = "start";
  finalSnap[end[0]][end[1]] = "end";
  steps.push({ grid: finalSnap, current: null, visited: [...visitedList], path: [], finished: true, explanation: "AI: Warning. Destination is entirely blocked by physical obstacles. No roads available.", pseudocodeLine: -1 });
  return steps;
}

export function aStar(
  baseGrid: CellType[][],
  start: [number, number],
  end: [number, number]
): PathfindingStep[] {
  const rows = baseGrid.length;
  const cols = baseGrid[0].length;
  const steps: PathfindingStep[] = [];
  const visited = new Set<string>();
  const visitedList: [number, number][] = [];
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const hScoreMenu = new Map<string, number>();
  const cameFrom = new Map<string, [number, number]>();

  const startKey = `${start[0]},${start[1]}`;
  gScore.set(startKey, 0);
  const h = heuristic(start, end);
  hScoreMenu.set(startKey, h);
  fScore.set(startKey, h);

  const openSet: [number, number][] = [start];
  steps.push({ 
    grid: cloneGrid(baseGrid), current: start, visited: [], path: [], finished: false,
    explanation: `AI: Initiating A* trajectory tracking algorithm. Current heuristic spatial estimate to target set to ${h}.`, pseudocodeLine: 0,
    frontier: [...openSet], distances: Object.fromEntries(gScore), fScores: Object.fromEntries(fScore), hScores: Object.fromEntries(hScoreMenu)
  });

  while (openSet.length > 0) {
    openSet.sort((a, b) => (fScore.get(`${a[0]},${a[1]}`) ?? Infinity) - (fScore.get(`${b[0]},${b[1]}`) ?? Infinity));
    const current = openSet.shift()!;
    const key = `${current[0]},${current[1]}`;

    if (visited.has(key)) continue;
    visited.add(key);
    if (!(current[0] === start[0] && current[1] === start[1]) &&
        !(current[0] === end[0] && current[1] === end[1])) {
      visitedList.push(current);
    }

    const snap = cloneGrid(baseGrid);
    for (const [vr, vc] of visitedList) snap[vr][vc] = "visited";
    snap[current[0]][current[1]] = "current";
    snap[start[0]][start[1]] = "start";
    snap[end[0]][end[1]] = "end";
    
    steps.push({ 
      grid: snap, current, visited: [...visitedList], path: [], finished: false,
      explanation: `AI: Analyzing vector constraints at [${current[0]}, ${current[1]}] possessing global optimal priority fScore = ${fScore.get(key)}.`, pseudocodeLine: 3,
      frontier: [...openSet], distances: Object.fromEntries(gScore), fScores: Object.fromEntries(fScore), hScores: Object.fromEntries(hScoreMenu)
    });

    if (current[0] === end[0] && current[1] === end[1]) {
      const path = reconstructPath(cameFrom, end);
      const finalSnap = cloneGrid(baseGrid);
      for (const [vr, vc] of visitedList) finalSnap[vr][vc] = "visited";
      for (const [pr, pc] of path) finalSnap[pr][pc] = "path";
      finalSnap[start[0]][start[1]] = "start";
      finalSnap[end[0]][end[1]] = "end";
      steps.push({ 
        grid: finalSnap, current: null, visited: [...visitedList], path, finished: true,
        explanation: "AI: Mathematical destination successfully intersected! Generating heuristic-optimized shortest path backwards.", pseudocodeLine: 5,
        frontier: [...openSet], distances: Object.fromEntries(gScore), fScores: Object.fromEntries(fScore), hScores: Object.fromEntries(hScoreMenu)
      });
      return steps;
    }

    let updated = 0;
    for (const [nr, nc] of getNeighbors(current[0], current[1], rows, cols)) {
      const nKey = `${nr},${nc}`;
      const cell = baseGrid[nr][nc];
      if (visited.has(nKey) || cell === "wall") continue;
      const costMultiplier = cell === "traffic" ? 5 : 1;
      const tentativeG = (gScore.get(key) ?? Infinity) + costMultiplier;
      if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
        cameFrom.set(nKey, current);
        gScore.set(nKey, tentativeG);
        const nh = heuristic([nr, nc], end);
        hScoreMenu.set(nKey, nh);
        fScore.set(nKey, tentativeG + nh);
        openSet.push([nr, nc]);
        updated++;
      }
    }
    
    if (updated > 0) {
      steps.push({ 
        grid: cloneGrid(snap), current, visited: [...visitedList], path: [], finished: false,
        explanation: `AI: Advanced spatial scan complete. Fused actual physical costs + heuristic vectors for ${updated} valid intersections taking traffic delays into account.`, pseudocodeLine: 10,
        frontier: [...openSet], distances: Object.fromEntries(gScore), fScores: Object.fromEntries(fScore), hScores: Object.fromEntries(hScoreMenu)
      });
    }
  }

  const finalSnap = cloneGrid(baseGrid);
  for (const [vr, vc] of visitedList) finalSnap[vr][vc] = "visited";
  finalSnap[start[0]][start[1]] = "start";
  finalSnap[end[0]][end[1]] = "end";
  steps.push({ grid: finalSnap, current: null, visited: [...visitedList], path: [], finished: true, explanation: "AI Error: Target coordinates are totally isolated. Navigation physics failed.", pseudocodeLine: -1 });
  return steps;
}

export function createEmptyGrid(rows: number, cols: number): CellType[][] {
  return Array.from({ length: rows }, () => Array(cols).fill("empty") as CellType[]);
}

export function generateMaze(rows: number, cols: number, density: number = 0.3): CellType[][] {
  const grid = createEmptyGrid(rows, cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < density) {
        grid[r][c] = "wall";
      }
    }
  }
  return grid;
}

export function bfs(
  baseGrid: CellType[][],
  start: [number, number],
  end: [number, number]
): PathfindingStep[] {
  const rows = baseGrid.length;
  const cols = baseGrid[0].length;
  const steps: PathfindingStep[] = [];
  const visited = new Set<string>();
  const visitedList: [number, number][] = [];
  const cameFrom = new Map<string, [number, number]>();

  const queue: [number, number][] = [start];
  visited.add(`${start[0]},${start[1]}`);

  steps.push({ grid: cloneGrid(baseGrid), current: start, visited: [], path: [], finished: false, explanation: "Starting Breadth-First Search. Adding start node to queue.", pseudocodeLine: 0 });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current[0]},${current[1]}`;

    if (!(current[0] === start[0] && current[1] === start[1]) && 
        !(current[0] === end[0] && current[1] === end[1])) {
      visitedList.push(current);
    }

    const snap = cloneGrid(baseGrid);
    for (const [vr, vc] of visitedList) snap[vr][vc] = "visited";
    snap[current[0]][current[1]] = "current";
    snap[start[0]][start[1]] = "start";
    snap[end[0]][end[1]] = "end";
    steps.push({ grid: snap, current, visited: [...visitedList], path: [], finished: false, explanation: `Dequeued node [${current[0]}, ${current[1]}]. Checking neighbors...`, pseudocodeLine: 2 });

    if (current[0] === end[0] && current[1] === end[1]) {
      const path = reconstructPath(cameFrom, end);
      const finalSnap = cloneGrid(baseGrid);
      for (const [vr, vc] of visitedList) finalSnap[vr][vc] = "visited";
      for (const [pr, pc] of path) finalSnap[pr][pc] = "path";
      finalSnap[start[0]][start[1]] = "start";
      finalSnap[end[0]][end[1]] = "end";
      steps.push({ grid: finalSnap, current: null, visited: [...visitedList], path, finished: true, explanation: "Target found! Reconstructing shortest path.", pseudocodeLine: 4 });
      return steps;
    }

    let addedNeighbors = 0;
    for (const [nr, nc] of getNeighbors(current[0], current[1], rows, cols)) {
      const nKey = `${nr},${nc}`;
      if (!visited.has(nKey) && baseGrid[nr][nc] !== "wall") {
        visited.add(nKey);
        cameFrom.set(nKey, current);
        queue.push([nr, nc]);
        addedNeighbors++;
      }
    }

    if (addedNeighbors > 0) {
      steps.push({ grid: snap, current, visited: [...visitedList], path: [], finished: false, explanation: `Added ${addedNeighbors} unvisited valid neighbor(s) to the queue.`, pseudocodeLine: 6 });
    }
  }

  const finalSnap = cloneGrid(baseGrid);
  for (const [vr, vc] of visitedList) finalSnap[vr][vc] = "visited";
  finalSnap[start[0]][start[1]] = "start";
  finalSnap[end[0]][end[1]] = "end";
  steps.push({ grid: finalSnap, current: null, visited: [...visitedList], path: [], finished: true, explanation: "Queue exhausted. Target is unreachable.", pseudocodeLine: -1 });
  return steps;
}

export function dfs(
  baseGrid: CellType[][],
  start: [number, number],
  end: [number, number]
): PathfindingStep[] {
  const rows = baseGrid.length;
  const cols = baseGrid[0].length;
  const steps: PathfindingStep[] = [];
  const visited = new Set<string>();
  const visitedList: [number, number][] = [];
  const cameFrom = new Map<string, [number, number]>();

  const stack: [number, number][] = [start];
  steps.push({ grid: cloneGrid(baseGrid), current: start, visited: [], path: [], finished: false, explanation: "Starting Depth-First Search. Pushing start node to stack.", pseudocodeLine: 0 });

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current[0]},${current[1]}`;

    if (visited.has(key)) continue;

    visited.add(key);
    if (!(current[0] === start[0] && current[1] === start[1]) && 
        !(current[0] === end[0] && current[1] === end[1])) {
      visitedList.push(current);
    }

    const snap = cloneGrid(baseGrid);
    for (const [vr, vc] of visitedList) snap[vr][vc] = "visited";
    snap[current[0]][current[1]] = "current";
    snap[start[0]][start[1]] = "start";
    snap[end[0]][end[1]] = "end";
    steps.push({ grid: snap, current, visited: [...visitedList], path: [], finished: false, explanation: `Popped node [${current[0]}, ${current[1]}] from stack and marked visited. Plunging deeper!`, pseudocodeLine: 3 });

    if (current[0] === end[0] && current[1] === end[1]) {
      const path = reconstructPath(cameFrom, end);
      const finalSnap = cloneGrid(baseGrid);
      for (const [vr, vc] of visitedList) finalSnap[vr][vc] = "visited";
      for (const [pr, pc] of path) finalSnap[pr][pc] = "path";
      finalSnap[start[0]][start[1]] = "start";
      finalSnap[end[0]][end[1]] = "end";
      steps.push({ grid: finalSnap, current: null, visited: [...visitedList], path, finished: true, explanation: "Found target node! Terminating recursion and highlighting path.", pseudocodeLine: 5 });
      return steps;
    }

    const neighbors = getNeighbors(current[0], current[1], rows, cols);
    let pushed = 0;
    
    for (const [nr, nc] of [...neighbors].reverse()) {
      const nKey = `${nr},${nc}`;
      if (!visited.has(nKey) && baseGrid[nr][nc] !== "wall") {
        cameFrom.set(nKey, current);
        stack.push([nr, nc]);
        pushed++;
      }
    }
    
    if (pushed > 0) {
      steps.push({ grid: snap, current, visited: [...visitedList], path: [], finished: false, explanation: `Found ${pushed} unvisited neighbors. Pushing them to stack.`, pseudocodeLine: 8 });
    } else {
      steps.push({ grid: snap, current, visited: [...visitedList], path: [], finished: false, explanation: `Dead end reached at [${current[0]}, ${current[1]}]. Backtracking through stack...`, pseudocodeLine: -1 });
    }
  }

  const finalSnap = cloneGrid(baseGrid);
  for (const [vr, vc] of visitedList) finalSnap[vr][vc] = "visited";
  finalSnap[start[0]][start[1]] = "start";
  finalSnap[end[0]][end[1]] = "end";
  steps.push({ grid: finalSnap, current: null, visited: [...visitedList], path: [], finished: true, explanation: "Stack exhausted! The target node is unreachable.", pseudocodeLine: -1 });
  return steps;
}

export const PATHFINDING_ALGORITHMS: Record<string, (grid: CellType[][], start: [number, number], end: [number, number]) => PathfindingStep[]> = {
  dijkstra,
  astar: aStar,
  bfs,
  dfs,
};

export const PATHFINDING_INFO: Record<string, { name: string; timeComplexity: string; description: string; pseudocode?: string[] }> = {
  dijkstra: { 
    name: "Dijkstra", 
    timeComplexity: "O((V+E) log V)", 
    description: "Guarantees shortest path — explores uniformly outward across all valid edges.",
    pseudocode: [
      "dist[start] = 0; priority_queue.push(start)",
      "while priority_queue is not empty:",
      "  current = get_min_dist_node()",
      "  if current == target: return path",
      "  for neighbor in current.neighbors:",
      "    new_dist = dist[current] + cost(current, neighbor)",
      "    if new_dist < dist[neighbor]:",
      "      dist[neighbor] = new_dist",
      "      priority_queue.push(neighbor)"
    ]
  },
  astar: { 
    name: "A*", 
    timeComplexity: "O(E log V)", 
    description: "Heuristic-guided shortest path. Generally faster by aiming toward exact target coordinates.",
    pseudocode: [
      "gScore[start] = 0; fScore[start] = heuristic(start, target)",
      "openSet.push(start)",
      "while openSet is not empty:",
      "  current = get_min_fscore_node()",
      "  if current == target: return path",
      "  for neighbor in current.neighbors:",
      "    tentative_gScore = gScore[current] + cost(current, neighbor)",
      "    if tentative_gScore < gScore[neighbor]:",
      "      gScore[neighbor] = tentative_gScore",
      "      fScore[neighbor] = tentative_gScore + heuristic(neighbor, target)",
      "      openSet.push(neighbor)"
    ]
  },
  bfs: { 
    name: "BFS", 
    timeComplexity: "O(V + E)", 
    description: "Explores radially level by level. Guarantees shortest path on unweighted grids.",
    pseudocode: [
      "queue.enqueue(start)",
      "while queue is not empty:",
      "  current = queue.dequeue()",
      "  if current == target:",
      "    return path",
      "  for neighbor in current.neighbors:",
      "    if not visited:",
      "      queue.enqueue(neighbor)",
      "      mark neighbor visited"
    ]
  },
  dfs: { 
    name: "DFS", 
    timeComplexity: "O(V + E)", 
    description: "Plunges deeply into branches before backtracking. Does NOT guarantee shortest path.",
    pseudocode: [
      "stack.push(start)",
      "while stack is not empty:",
      "  current = stack.pop()",
      "  mark current visited",
      "  if current == target:",
      "    return path",
      "  for neighbor in current.neighbors:",
      "    if not visited:",
      "      stack.push(neighbor)"
    ]
  }
};
