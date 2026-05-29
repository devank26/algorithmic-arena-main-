import { AdvNode, AdvEdge, AdvStep } from "./advanced-graph-algorithms";

export interface BridgeStep extends AdvStep {
  disc?: Record<string, number>;        // Discovery time map
  low?: Record<string, number>;         // Low-link connection map
  articulationPoints?: string[];        // Evaluated absolute isolation nodes
  bridges?: string[];                   // Evaluated absolute isolation edges
  edgeBacklinks?: string[];             // Traced back references
}

export const BRIDGE_PSEUDOCODE = [
  "Run depth-first search on undirected graph layout",
  "Set discovery time (disc) and low-link (low) values",
  "Loop over all neighbors V across current node U:",
  "  if V is not visited:",
  "    Parent[v] = u. DFS(V).",
  "    low[u] = min(low[u], low[v])",
  "    If low[v] >= disc[u] AND U != root: U is Articulation Point",
  "    If low[v] > disc[u]: Edge(U-V) is a CRITICAL BRIDGE",
  "  if V != Parent[u] (Back Edge Detected!):",
  "    low[u] = min(low[u], disc[v])",
  "If root node U has > 1 child trees: U is an Articulation Point"
];

export function runBridgeDiagnostics(nodes: AdvNode[], edges: AdvEdge[]): BridgeStep[] {
  const steps: BridgeStep[] = [];
  if (nodes.length === 0) return steps;

  const nodeIds = nodes.map(n => n.id);
  const adj: Record<string, { target: string, edgeId: string }[]> = {};
  
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => {
    adj[e.source].push({ target: e.target, edgeId: e.id });
    adj[e.target].push({ target: e.source, edgeId: e.id }); // Undirected
  });

  const disc: Record<string, number> = {};
  const low: Record<string, number> = {};
  const parent: Record<string, string | null> = {};
  const visited = new Set<string>();
  
  const articulationPoints = new Set<string>();
  const bridges: string[] = [];
  const edgeBacklinks: string[] = [];
  
  nodes.forEach(n => {
    disc[n.id] = -1;
    low[n.id] = -1;
    parent[n.id] = null;
  });

  let time = 0;

  steps.push({
    currentNodes: nodeIds,
    phaseMessage: "Critical Analysis Booted",
    explanation: "AI: Spinning up structural Discovery tracking! Mapping absolute node dependencies to isolate critical layout structures.",
    pseudocodeLine: 0
  });

  function dfs(u: string) {
    visited.add(u);
    time++;
    disc[u] = time;
    low[u] = time;
    let childrenCount = 0;

    steps.push({
      currentNodes: nodeIds,
      activeNodes: [u],
      disc: { ...disc },
      low: { ...low },
      articulationPoints: Array.from(articulationPoints),
      bridges: [...bridges],
      edgeBacklinks: [...edgeBacklinks],
      explanation: `AI: Traversal hitting ${nodes.find(n=>n.id===u)?.label}. Setting Discovery Time: ${time}. Initializing sequence threshold bounds.`,
      pseudocodeLine: 1
    });

    for (const neighbor of adj[u]) {
      const v = neighbor.target;
      const edgeId = neighbor.edgeId;

      if (!visited.has(v)) {
        childrenCount++;
        parent[v] = u;

        steps.push({
           currentNodes: nodeIds,
           activeNodes: [v],
           activeEdges: [edgeId],
           disc: { ...disc },
           low: { ...low },
           articulationPoints: Array.from(articulationPoints),
           bridges: [...bridges],
           edgeBacklinks: [...edgeBacklinks],
           explanation: `AI: Exploring untraversed structural branch from ${nodes.find(n=>n.id===u)?.label} → ${nodes.find(n=>n.id===v)?.label}.`,
           pseudocodeLine: 3
        });

        dfs(v);

        low[u] = Math.min(low[u], low[v]);

        steps.push({
           currentNodes: nodeIds,
           activeNodes: [u],
           disc: { ...disc },
           low: { ...low },
           articulationPoints: Array.from(articulationPoints),
           bridges: [...bridges],
           edgeBacklinks: [...edgeBacklinks],
           explanation: `AI: Pulling topological data back! Updating ${nodes.find(n=>n.id===u)?.label}'s absolute low-bound threshold.`,
           pseudocodeLine: 5
        });

        // Articulation point condition
        if (parent[u] !== null && low[v] >= disc[u]) {
           articulationPoints.add(u);
           steps.push({
              currentNodes: nodeIds,
              activeNodes: [u],
              disc: { ...disc },
              low: { ...low },
              articulationPoints: Array.from(articulationPoints),
              bridges: [...bridges],
              edgeBacklinks: [...edgeBacklinks],
              phaseMessage: `Articulation Point Isolated`,
              explanation: `AI DANGER: Found Critical Isolation Point! If Node ${nodes.find(n=>n.id===u)?.label} collapses, network structurally bisects entirely.`,
              pseudocodeLine: 6
           });
        }

        // Bridge condition
        if (low[v] > disc[u]) {
           bridges.push(edgeId);
           steps.push({
              currentNodes: nodeIds,
              activeNodes: [u, v],
              activeEdges: [edgeId],
              disc: { ...disc },
              low: { ...low },
              articulationPoints: Array.from(articulationPoints),
              bridges: [...bridges],
              edgeBacklinks: [...edgeBacklinks],
              phaseMessage: `Structural Bridge Identified`,
              explanation: `AI DANGER: Found Critical Single-Point-Of-Failure Edge connecting ${nodes.find(n=>n.id===u)?.label} ↔ ${nodes.find(n=>n.id===v)?.label}. Total structural dissection if severed!`,
              pseudocodeLine: 7
           });
        }

      } else if (v !== parent[u]) {
         low[u] = Math.min(low[u], disc[v]);
         edgeBacklinks.push(edgeId);
         
         steps.push({
            currentNodes: nodeIds,
            activeNodes: [u],
            activeEdges: [edgeId],
            disc: { ...disc },
            low: { ...low },
            articulationPoints: Array.from(articulationPoints),
            bridges: [...bridges],
            edgeBacklinks: [...edgeBacklinks],
            explanation: `AI: Found geometric backtracking loop linking to ${nodes.find(n=>n.id===v)?.label}! This structure contains deep topological overlap reinforcing stability.`,
            pseudocodeLine: 9
         });
      }
    }

    // Root node articulation point condition
    if (parent[u] === null && childrenCount > 1) {
       articulationPoints.add(u);
       steps.push({
          currentNodes: nodeIds,
          activeNodes: [u],
          disc: { ...disc },
          low: { ...low },
          articulationPoints: Array.from(articulationPoints),
          bridges: [...bridges],
          edgeBacklinks: [...edgeBacklinks],
          phaseMessage: `Root Articulation Point`,
          explanation: `AI DANGER: Network Root Hub ${nodes.find(n=>n.id===u)?.label} spans multiple distinct geometric trees. Collapse severs entirely unique graph components.`,
          pseudocodeLine: 10
       });
    }
  }

  nodeIds.forEach(id => {
    if (!visited.has(id)) {
      dfs(id);
    }
  });

  steps.push({
    currentNodes: nodeIds,
    disc: { ...disc },
    low: { ...low },
    articulationPoints: Array.from(articulationPoints),
    bridges: [...bridges],
    edgeBacklinks: [...edgeBacklinks],
    phaseMessage: "Operational Tracing Finished",
    explanation: `AI SUCCESS: Diagnostic Complete. Found ${articulationPoints.size} structural Weak Points and completely resolved ${bridges.length} localized Critical Bridges!`,
    pseudocodeLine: -1
  });

  return steps;
}
