import { AdvNode, AdvEdge, AdvStep } from "./advanced-graph-algorithms";

export interface FlowStep extends AdvStep {
  edgeFlows?: Record<string, number>;
  residualCapacities?: Record<string, number>;
  augmentingPath?: string[]; // Node IDs in current path
  augmentingEdges?: string[]; // Edge IDs in current path
  currentFlow?: number;
  bottleneck?: number;
  
  // Min Cut variables
  sSet?: string[];
  tSet?: string[];
  cutEdges?: string[];
  minCutCapacity?: number;
}

export const MAX_FLOW_PSEUDOCODE = [
  "Initialize max_flow = 0",
  "Initialize edge flows = 0, residual network setup",
  "while BFS finds an augmenting path from Source(S) to Sink(T):",
  "  Find bottleneck capacity along path",
  "  max_flow += bottleneck",
  "  For each edge in path:",
  "    flow[edge] += bottleneck",
  "    residual_cap[edge] -= bottleneck",
  "// Min-Cut Extraction",
  "Run BFS from Source on residual network with cap > 0",
  "S-Set = Reached nodes. T-Set = Unreached nodes.",
  "Cut Edges = Org Edges spanning from S-Set to T-Set",
];

export function runMaxFlowMinCut(nodes: AdvNode[], edges: AdvEdge[], sourceId: string, sinkId: string): FlowStep[] {
  const steps: FlowStep[] = [];
  if (nodes.length === 0 || !sourceId || !sinkId) return steps;

  const nodeIds = nodes.map(n => n.id);
  const flows: Record<string, number> = {};
  const capacities: Record<string, number> = {};
  
  // Forward and reverse edges for residual
  const adj: Record<string, { target: string, edgeId: string, isForward: boolean, reverseEdgeId: string }[]> = {};
  nodes.forEach(n => adj[n.id] = []);

  edges.forEach(e => {
    flows[e.id] = 0;
    capacities[e.id] = e.weight;
    
    // Virtual residual edges id
    const revId = `rev_${e.id}`;
    flows[revId] = 0;
    capacities[revId] = 0; // Starts at 0, increases as flow goes forward

    adj[e.source].push({ target: e.target, edgeId: e.id, isForward: true, reverseEdgeId: revId });
    adj[e.target].push({ target: e.source, edgeId: revId, isForward: false, reverseEdgeId: e.id });
  });

  let totalFlow = 0;

  steps.push({
    currentNodes: nodeIds,
    edgeFlows: { ...flows },
    residualCapacities: { ...capacities },
    currentFlow: totalFlow,
    phaseMessage: "Phase 1: Edmonds-Karp BFS Accumulation",
    explanation: `AI: Initializing Max-Flow parameters. Scanning network capabilities from Source ${nodes.find(n=>n.id===sourceId)?.label} to Sink ${nodes.find(n=>n.id===sinkId)?.label}.`,
    pseudocodeLine: 1
  });

  while (true) {
    // BFS to find shortest augmenting path based on valid residual capacities
    const parent: Record<string, { node: string, edgeId: string, isForward: boolean, reverseEdgeId: string } | null> = {};
    nodes.forEach(n => parent[n.id] = null);
    
    const queue: string[] = [sourceId];
    const visited = new Set<string>();
    visited.add(sourceId);

    let pathFound = false;

    while (queue.length > 0) {
      const u = queue.shift()!;
      if (u === sinkId) {
        pathFound = true;
        break;
      }

      for (const neighbor of adj[u]) {
        const remainingCap = neighbor.isForward 
          ? capacities[neighbor.edgeId] - flows[neighbor.edgeId] 
          : flows[neighbor.reverseEdgeId]; // Reverse capacity is the forward flow

        if (!visited.has(neighbor.target) && remainingCap > 0) {
          visited.add(neighbor.target);
          parent[neighbor.target] = { node: u, edgeId: neighbor.edgeId, isForward: neighbor.isForward, reverseEdgeId: neighbor.reverseEdgeId };
          queue.push(neighbor.target);
        }
      }
    }

    if (!pathFound) {
       steps.push({
         currentNodes: nodeIds,
         edgeFlows: { ...flows },
         currentFlow: totalFlow,
         phaseMessage: "Edmonds-Karp Iterations Terminated",
         explanation: `AI: Network saturation reached. No further viable channels exist linking Source to Sink. Maximum capacity threshold locked at ${totalFlow}.`,
         pseudocodeLine: 8
       });
       break;
    }

    // Backtrack path to find bottleneck
    let curr = sinkId;
    let bottleneck = Infinity;
    const pathNodes: string[] = [sinkId];
    const pathEdges: string[] = [];
    const forwardDirections: boolean[] = [];

    while (curr !== sourceId) {
      const p = parent[curr]!;
      const remainingCap = p.isForward 
        ? capacities[p.edgeId] - flows[p.edgeId] 
        : flows[p.reverseEdgeId];

      bottleneck = Math.min(bottleneck, remainingCap);
      pathNodes.push(p.node);
      pathEdges.push(p.edgeId);
      forwardDirections.push(p.isForward);
      curr = p.node;
    }
    
    pathNodes.reverse();
    pathEdges.reverse();
    forwardDirections.reverse();

    steps.push({
      currentNodes: nodeIds,
      augmentingPath: pathNodes,
      activeEdges: pathEdges.filter((_, idx) => forwardDirections[idx]), // Highlight real forward edges traversed
      edgeFlows: { ...flows },
      bottleneck: bottleneck,
      currentFlow: totalFlow,
      phaseMessage: `Augmenting Path Detected (Bottleneck: ${bottleneck})`,
      explanation: `AI: Optimal residual vector path mapped via BFS. Deepest physical pipeline bottleneck restricts throughput to ${bottleneck}.`,
      pseudocodeLine: 3
    });

    // Augment flow
    totalFlow += bottleneck;
    
    for (let i = 0; i < pathEdges.length; i++) {
        const edgeId = pathEdges[i];
        const isFwd = forwardDirections[i];
        if (isFwd) {
           flows[edgeId] += bottleneck;
        } else {
           // It's a reverse edge, representing undoing flow on original
           flows[edgeId] -= bottleneck;
        }
    }

    steps.push({
      currentNodes: nodeIds,
      augmentingPath: pathNodes,
      activeEdges: pathEdges.filter((_, idx) => forwardDirections[idx]),
      edgeFlows: { ...flows },
      currentFlow: totalFlow,
      phaseMessage: `Pushing Flow`,
      explanation: `AI: Activating fluid pressure. Pumping ${bottleneck} volume dynamically across topological vector series, reducing remaining available channel tolerance.`,
      pseudocodeLine: 6
    });
  }

  // Phase 2: Compute Min-Cut Partition (BFS on residual graph)
  steps.push({
      currentNodes: nodeIds,
      edgeFlows: { ...flows },
      currentFlow: totalFlow,
      phaseMessage: "Phase 2: Mathematical Graph Dissection (Min-Cut)",
      explanation: `AI: Initiating post-saturation analytics. Re-mapping all viable residual connectivity originating backwards exclusively from the Source.`,
      pseudocodeLine: 9
  });

  const sSet = new Set<string>();
  const queue: string[] = [sourceId];
  sSet.add(sourceId);

  while (queue.length > 0) {
     const u = queue.shift()!;
     for (const neighbor of adj[u]) {
        const remainingCap = neighbor.isForward 
          ? capacities[neighbor.edgeId] - flows[neighbor.edgeId] 
          : flows[neighbor.reverseEdgeId];
        
        if (!sSet.has(neighbor.target) && remainingCap > 0) {
           sSet.add(neighbor.target);
           queue.push(neighbor.target);
        }
     }
  }

  const tSet = nodeIds.filter(id => !sSet.has(id));
  const cutEdges: string[] = [];
  let minCutValue = 0;

  edges.forEach(e => {
     if (sSet.has(e.source) && !sSet.has(e.target)) {
        cutEdges.push(e.id);
        minCutValue += e.weight;
     }
  });

  steps.push({
      currentNodes: nodeIds,
      edgeFlows: { ...flows },
      currentFlow: totalFlow,
      sSet: Array.from(sSet),
      tSet: tSet,
      cutEdges: cutEdges,
      minCutCapacity: minCutValue,
      phaseMessage: "Max-Flow / Min-Cut Theorem Validated",
      explanation: `AI SUCCESS: System partition finalized! Dissected matrix into Isolated Nodes [S-Set] and [T-Set]. Saturated cut-edges glow red. Min-Cut Cost (${minCutValue}) is mathematically equivalent to Max-Flow (${totalFlow})!`,
      pseudocodeLine: 11
  });

  return steps;
}
