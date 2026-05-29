export interface MSTNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface MSTEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface MSTStep {
  mstEdges: string[];
  rejectedEdges: string[];
  candidateEdges: string[];
  currentEdge?: string;
  visitedNodes: string[];
  explanation: string;
  pseudocodeLine: number;
  totalCost: number;
}

export const PRIM_PSEUDOCODE = [
  "visited.add(start_node)",
  "while visited_nodes < V:",
  "  candidates = get_edges_connecting_visited_to_unvisited()",
  "  min_edge = get_minimum_weight(candidates)",
  "  mst.add(min_edge)",
  "  visited.add(min_edge.target)",
];

export const KRUSKAL_PSEUDOCODE = [
  "sort_all_edges_by_weight_ascending()",
  "for each edge (u, v) in sorted_edges:",
  "  if find(u) != find(v): // No cycle formed",
  "    union(u, v)",
  "    mst.add(edge)",
  "  else:",
  "    reject(edge) // Prevents cycle",
];

// --- PRIM'S ALGORITHM ---
export function runPrim(nodes: MSTNode[], edges: MSTEdge[], startNodeId?: string): MSTStep[] {
  if (nodes.length === 0) return [];
  const start = startNodeId || nodes[0].id;

  const steps: MSTStep[] = [];
  const mstEdges: string[] = [];
  const rejectedEdges: string[] = [];
  const visited = new Set<string>([start]);
  let totalCost = 0;

  // Convert to adjacency list for easier processing
  const adj = new Map<string, MSTEdge[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    adj.get(e.source)?.push(e);
    adj.get(e.target)?.push({ ...e, source: e.target, target: e.source }); // Undirected
  });

  steps.push({
    mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], visitedNodes: Array.from(visited),
    explanation: `AI: Prim's algorithm initialized. Selected Start Node ${nodes.find(n => n.id === start)?.label}. Expanding territory.`,
    pseudocodeLine: 0, totalCost
  });

  while (visited.size < nodes.length) {
    let minEdge: MSTEdge | null = null;
    const candidates: MSTEdge[] = [];

    // Find all boundary edges
    for (const v of visited) {
      const connections = adj.get(v) || [];
      for (const edge of connections) {
        if (!visited.has(edge.target)) {
          candidates.push(edge);
        }
      }
    }

    steps.push({
      mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: candidates.map(c => c.id), visitedNodes: Array.from(visited),
      explanation: `AI: Scanning ${candidates.length} boundary routes connecting the active tree to unknown territories.`,
      pseudocodeLine: 2, totalCost
    });

    if (candidates.length === 0) {
      steps.push({
        mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], visitedNodes: Array.from(visited),
        explanation: "AI Warning: Graph is disjoint. Remaining nodes cannot be reached from expanding root structure.",
        pseudocodeLine: -1, totalCost
      });
      break;
    }

    // Select the minimum weight edge from candidates
    for (const edge of candidates) {
      if (!minEdge || edge.weight < minEdge.weight) {
        minEdge = edge;
      }
    }

    steps.push({
      mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: candidates.map(c => c.id), currentEdge: minEdge!.id, visitedNodes: Array.from(visited),
      explanation: `AI: Evaluating minimum cost geometry. Target shortest boundary vector is weight ${minEdge!.weight}.`,
      pseudocodeLine: 3, totalCost
    });

    // Add to MST
    visited.add(minEdge!.target);
    mstEdges.push(minEdge!.id);
    totalCost += minEdge!.weight;

    steps.push({
      mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], visitedNodes: Array.from(visited),
      explanation: `AI: Optimal boundary route permanently welded to the Minimum Spanning Tree. Connected node ${nodes.find(n => n.id === minEdge!.target)?.label}. Total Cost: ${totalCost}.`,
      pseudocodeLine: 5, totalCost
    });
  }

  if (visited.size === nodes.length) {
    steps.push({
      mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], visitedNodes: Array.from(visited),
      explanation: `AI: Operation Success! Mathematically perfect continuous topological structure achieved. Final Minimum Structural Cost sum: ${totalCost}.`,
      pseudocodeLine: -1, totalCost
    });
  }

  return steps;
}

// --- KRUSKAL'S ALGORITHM ---
class DisjointSet {
  parent: Map<string, string>;
  constructor(nodes: string[]) {
    this.parent = new Map();
    nodes.forEach(n => this.parent.set(n, n));
  }
  find(i: string): string {
    if (this.parent.get(i) === i) return i;
    const root = this.find(this.parent.get(i)!);
    this.parent.set(i, root);
    return root;
  }
  union(i: string, j: string): void {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent.set(rootI, rootJ);
    }
  }
}

export function runKruskal(nodes: MSTNode[], edges: MSTEdge[]): MSTStep[] {
  if (nodes.length === 0) return [];
  
  const steps: MSTStep[] = [];
  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
  const ds = new DisjointSet(nodes.map(n => n.id));
  
  const mstEdges: string[] = [];
  const rejectedEdges: string[] = [];
  const visited = new Set<string>();
  let totalCost = 0;

  steps.push({
    mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], visitedNodes: Array.from(visited),
    explanation: "AI: Kruskal initialized. Processed all graph relationships globally and organized combinations purely by ascending weight threshold.",
    pseudocodeLine: 0, totalCost
  });

  for (const edge of sortedEdges) {
    steps.push({
      mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], currentEdge: edge.id, visitedNodes: Array.from(visited),
      explanation: `AI: Queue popped smallest remaining route between ${nodes.find(n => n.id === edge.source)?.label} and ${nodes.find(n => n.id === edge.target)?.label} (Cost: ${edge.weight}). Analyzing cyclic structural integrity.`,
      pseudocodeLine: 2, totalCost
    });

    const rootSource = ds.find(edge.source);
    const rootTarget = ds.find(edge.target);

    if (rootSource !== rootTarget) {
      ds.union(rootSource, rootTarget);
      mstEdges.push(edge.id);
      visited.add(edge.source);
      visited.add(edge.target);
      totalCost += edge.weight;

      steps.push({
        mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], currentEdge: edge.id, visitedNodes: Array.from(visited),
        explanation: `AI: Safe route sequence confirmed (No cyclical loop). Sets merged. Welded edge to MST structure. New Structural Cost: ${totalCost}.`,
        pseudocodeLine: 4, totalCost
      });
    } else {
      rejectedEdges.push(edge.id);
      steps.push({
        mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], currentEdge: edge.id, visitedNodes: Array.from(visited),
        explanation: `AI Warning: Potential disastrous cyclical loop detected! Nodes belong to identical Union-Find sets. Edge permanently rejected and discarded.`,
        pseudocodeLine: 6, totalCost
      });
    }
  }

  steps.push({
    mstEdges: [...mstEdges], rejectedEdges: [...rejectedEdges], candidateEdges: [], visitedNodes: Array.from(visited),
    explanation: `AI: Spanning Tree completion! Total Cost optimized to ${totalCost}.`,
    pseudocodeLine: -1, totalCost
  });

  return steps;
}
