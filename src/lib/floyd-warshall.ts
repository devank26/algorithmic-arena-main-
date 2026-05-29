export interface FWNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface FWEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface FWStep {
  matrix: number[][];
  nextMatrix: number[][];
  k: number;
  i: number;
  j: number;
  oldVal: number;
  viaK: number;
  distIK: number;
  distKJ: number;
  updated: boolean;
  explanation: string;
  pseudocodeLine: number;
}

export const FW_PSEUDOCODE = [
  "for k from 0 to V-1 (Intermediate Bridge):",
  "  for i from 0 to V-1 (Source Node):",
  "    for j from 0 to V-1 (Destination Node):",
  "      if dist[i][j] > dist[i][k] + dist[k][j]:",
  "        dist[i][j] = dist[i][k] + dist[k][j]",
  "        next[i][j] = next[i][k]",
];

export function runFloydWarshall(
  nodes: FWNode[],
  edges: FWEdge[],
  isDirected = true
): { steps: FWStep[]; initialMatrix: number[][]; initialNext: number[][]; nodeIds: string[] } {
  const n = nodes.length;
  if (n === 0) return { steps: [], initialMatrix: [], initialNext: [], nodeIds: [] };

  const nodeIds = nodes.map((nd) => nd.id);
  const getIndex = (id: string) => nodeIds.indexOf(id);

  const dist: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(Infinity));
  const next: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(-1));

  for (let i = 0; i < n; i++) {
    dist[i][i] = 0;
    next[i][i] = i;
  }

  for (const edge of edges) {
    const u = getIndex(edge.source);
    const v = getIndex(edge.target);
    if (u !== -1 && v !== -1) {
      if (edge.weight < dist[u][v]) {
        dist[u][v] = edge.weight;
        next[u][v] = v;
      }
      // Undirected: mirror the edge
      if (!isDirected && edge.weight < dist[v][u]) {
        dist[v][u] = edge.weight;
        next[v][u] = u;
      }
    }
  }

  const initialMatrix = dist.map((row) => [...row]);
  const initialNext = next.map((row) => [...row]);
  const steps: FWStep[] = [];

  const copyMatrix = (m: number[][]) => m.map((row) => [...row]);

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const oldVal = dist[i][j];
        const distIK = dist[i][k];
        const distKJ = dist[k][j];
        const viaK = distIK + distKJ;

        let updated = false;
        let explanation = "";

        if (distIK !== Infinity && distKJ !== Infinity && oldVal > viaK) {
          dist[i][j] = viaK;
          next[i][j] = next[i][k];
          updated = true;
          explanation = `AI: Found a stronger route! Path [${nodes[i].label}]→[${nodes[j].label}] via bridge [${nodes[k].label}] costs ${viaK} — shorter than current ${oldVal === Infinity ? "∞" : oldVal}.`;
        } else {
          explanation = `AI: Testing [${nodes[i].label}]→[${nodes[j].label}] via [${nodes[k].label}]. Current route (${oldVal === Infinity ? "∞" : oldVal}) is already optimal. Continuing...`;
        }

        steps.push({
          matrix: copyMatrix(dist),
          nextMatrix: copyMatrix(next),
          k,
          i,
          j,
          oldVal,
          viaK,
          distIK,
          distKJ,
          updated,
          explanation,
          pseudocodeLine: updated ? 4 : 3,
        });
      }
    }
  }

  return { steps, initialMatrix, initialNext, nodeIds };
}

/** Pure-function: reconstruct path array from a completed next[][] matrix */
export function reconstructPath(
  nextMatrix: number[][],
  distMatrix: number[][],
  u: number,
  v: number
): number[] | null {
  if (nextMatrix[u][v] === -1 || distMatrix[u][v] === Infinity) return null;
  const path = [u];
  let curr = u;
  while (curr !== v) {
    curr = nextMatrix[curr][v];
    if (curr === -1) return null;
    path.push(curr);
  }
  return path;
}
