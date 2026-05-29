export interface AdvNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface AdvEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface AdvStep {
  // Topology state
  currentNodes: string[];           // Nodes currently active
  activeNodes?: string[];           // Nodes being highlighted (queue pop, relax target)
  activeEdges?: string[];           // Edges being evaluated
  rejectedEdges?: string[];         // Cycle or problem edges
  completedNodes?: string[];        // Safely processed nodes
  
  // Specific Algorithm States
  queue?: string[];                 // Topo sort Queue
  indegree?: Record<string, number>; // Topo Sort Indegrees
  distances?: Record<string, number>; // Distances (Bellman-Ford / Dijkstra)
  potentials?: Record<string, number>; // h(v) for Johnson
  distanceMatrix?: Record<string, Record<string, number>>; // Johnson's APSP matrix
  edgeWeights?: Record<string, number>; // dynamic reweighted edge weights
  
  // HUD
  phaseMessage?: string;            // Top level phase ("Phase 1: Reweighting")
  explanation: string;
  pseudocodeLine: number;
}

// ==== TOPOLOGICAL SORT (KAHN'S) ====
export const TOPO_PSEUDOCODE = [
  "Compute in-degree for all vertices",
  "Enqueue all vertices with in-degree == 0",
  "while queue is not empty:",
  "  u = dequeue()",
  "  topo_order.append(u)",
  "  for each neighbor v of u:",
  "    reduce target in-degree by 1",
  "    if target in-degree == 0: enqueue(v)",
  "if topo_order.size != V: CYCLE DETECTED",
];

export function runTopologicalSort(nodes: AdvNode[], edges: AdvEdge[]): AdvStep[] {
  const steps: AdvStep[] = [];
  if (nodes.length === 0) return steps;

  const indegree: Record<string, number> = {};
  const adj: Record<string, AdvEdge[]> = {};
  
  nodes.forEach(n => {
    indegree[n.id] = 0;
    adj[n.id] = [];
  });

  edges.forEach(e => {
    indegree[e.target] = (indegree[e.target] || 0) + 1;
    adj[e.source].push(e);
  });

  const queue: string[] = [];
  const initialCurrentNodes = nodes.map(n => n.id);
  const topoOrder: string[] = [];

  steps.push({
    currentNodes: [...initialCurrentNodes],
    indegree: { ...indegree },
    explanation: "AI: Calculated Structural Dependency trees. Compiling Indegree counts...",
    pseudocodeLine: 0
  });

  nodes.forEach(n => {
    if (indegree[n.id] === 0) {
      queue.push(n.id);
    }
  });

  steps.push({
    currentNodes: [...initialCurrentNodes],
    queue: [...queue],
    indegree: { ...indegree },
    explanation: `AI: Found tasks with ZERO structural dependencies. Moving ${queue.map(q => nodes.find(n=>n.id===q)?.label).join(", ")} into execution queue.`,
    pseudocodeLine: 1
  });

  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);

    steps.push({
      currentNodes: [...initialCurrentNodes],
      activeNodes: [u],
      queue: [...queue],
      completedNodes: [...topoOrder],
      indegree: { ...indegree },
      explanation: `AI: Processing standalone task ${nodes.find(n=>n.id===u)?.label}. Task completed and routed to pipeline output.`,
      pseudocodeLine: 3
    });

    const neighbors = adj[u];
    
    if (neighbors.length > 0) {
      steps.push({
        currentNodes: [...initialCurrentNodes],
        activeNodes: [...neighbors.map(n => n.target)],
        activeEdges: [...neighbors.map(n => n.id)],
        queue: [...queue],
        completedNodes: [...topoOrder],
        indegree: { ...indegree },
        explanation: `AI: Analyzing downstream locked tasks dependent on ${nodes.find(n=>n.id===u)?.label}. Relaxing their constraint locks by 1.`,
        pseudocodeLine: 5
      });
    }

    for (const edge of neighbors) {
      const v = edge.target;
      indegree[v] -= 1;
      if (indegree[v] === 0) {
        queue.push(v);
        steps.push({
          currentNodes: [...initialCurrentNodes],
          activeNodes: [v],
          activeEdges: [edge.id],
          queue: [...queue],
          completedNodes: [...topoOrder],
          indegree: { ...indegree },
          explanation: `AI: Constraint lock reached 0! Task ${nodes.find(n=>n.id===v)?.label} is fully unlocked. Appending to Ready-Execution Queue.`,
          pseudocodeLine: 7
        });
      }
    }
  }

  if (topoOrder.length !== nodes.length) {
    steps.push({
      currentNodes: [...initialCurrentNodes],
      completedNodes: [...topoOrder],
      rejectedEdges: edges.filter(e => indegree[e.source] > 0 && indegree[e.target] > 0).map(e => e.id),
      explanation: `AI ERROR FATAL: Topological Mapping aborted. Directed Cyclic graph loop detected. Nodes structurally locked in infinite dependency loop.`,
      pseudocodeLine: 8
    });
  } else {
    steps.push({
      currentNodes: [...initialCurrentNodes],
      completedNodes: [...topoOrder],
      explanation: `AI SUCCESS: Operation Scheduled successfully. Linear topological execution order generated.`,
      pseudocodeLine: -1
    });
  }

  return steps;
}

// ==== BELLMAN-FORD ====
export const BF_PSEUDOCODE = [
  "Initialize distances from start to all nodes as Infinity",
  "distance[start] = 0",
  "loop V - 1 times:",
  "  for each edge (u, v) with weight w:",
  "    if distance[u] + w < distance[v]:",
  "      distance[v] = distance[u] + w",
  "for each edge (u, v):",
  "  if distance[u] + w < distance[v]:",
  "    report NEGATIVE WEIGHT CYCLE DETECTED",
];

export function runBellmanFord(nodes: AdvNode[], edges: AdvEdge[], startNodeId: string): AdvStep[] {
  const steps: AdvStep[] = [];
  if (nodes.length === 0) return steps;

  const distances: Record<string, number> = {};
  nodes.forEach(n => distances[n.id] = Infinity);
  distances[startNodeId] = 0;

  steps.push({
    currentNodes: nodes.map(n => n.id),
    distances: { ...distances },
    explanation: `AI: Initializing Bellman-Ford Space. Routing source locked to Node ${nodes.find(n=>n.id===startNodeId)?.label}. Maximum theoretical route distance bounded strictly to V-1.`,
    pseudocodeLine: 1
  });

  const V = nodes.length;
  let relaxedAny = false;

  for (let i = 1; i <= V - 1; i++) {
    relaxedAny = false;
    
    steps.push({
      currentNodes: nodes.map(n => n.id),
      distances: { ...distances },
      phaseMessage: `Iteration Phase ${i}/${V - 1}`,
      explanation: `AI: Initiating global matrix relaxation pass ${i}. Scanning sequence for optimized shorter route vectors via negative tension.`,
      pseudocodeLine: 2
    });

    for (const edge of edges) {
      if (distances[edge.source] !== Infinity && distances[edge.source] + edge.weight < distances[edge.target]) {
        distances[edge.target] = distances[edge.source] + edge.weight;
        relaxedAny = true;
        
        steps.push({
          currentNodes: nodes.map(n => n.id),
          activeEdges: [edge.id],
          activeNodes: [edge.target],
          distances: { ...distances },
          phaseMessage: `Iteration Phase ${i}/${V - 1}`,
          explanation: `AI: Tension Shift! Path to ${nodes.find(n=>n.id===edge.target)?.label} optimized down to distance ${distances[edge.target]} via edge from ${nodes.find(n=>n.id===edge.source)?.label}.`,
          pseudocodeLine: 5
        });
      }
    }

    if (!relaxedAny) {
      steps.push({
        currentNodes: nodes.map(n => n.id),
        distances: { ...distances },
        phaseMessage: `Iteration Phase ${i}/${V - 1} (Terminated)`,
        explanation: `AI: Sequence Break. Optimization halted at phase ${i} because graph reached absolute minimal equilibrium metric constraint.`,
        pseudocodeLine: 2
      });
      break;
    }
  }

  // Check for negative weight cycles
  steps.push({
    currentNodes: nodes.map(n => n.id),
    distances: { ...distances },
    phaseMessage: `Final Verification Protocol`,
    explanation: `AI: Initializing structural Verification. Scanning graph one final loop to detect theoretical space anomalies (Negative infinite loops).`,
    pseudocodeLine: 6
  });

  const negativeCycleEdges: string[] = [];
  for (const edge of edges) {
    if (distances[edge.source] !== Infinity && distances[edge.source] + edge.weight < distances[edge.target]) {
      negativeCycleEdges.push(edge.id);
    }
  }

  if (negativeCycleEdges.length > 0) {
    steps.push({
      currentNodes: nodes.map(n => n.id),
      rejectedEdges: [...negativeCycleEdges],
      distances: { ...distances },
      phaseMessage: `Negative Cycle Collapse`,
      explanation: `AI FATAL ERROR: Dimensional tearing! A negative weight structural loop was targeted. Shortest distance theoretically equals negative infinity. Mathematical routing aborted.`,
      pseudocodeLine: 8
    });
  } else {
    steps.push({
      currentNodes: nodes.map(n => n.id),
      distances: { ...distances },
      phaseMessage: `Operation Success`,
      explanation: `AI: SSSP Map Verified. Structural graph physics safely resolve into a defined minimum optimal routing logic without infinite sinks.`,
      pseudocodeLine: -1
    });
  }

  return steps;
}

// ==== JOHNSON'S ALGORITHM ====
export const JOHNSON_PSEUDOCODE = [
  "Add artificial node S bridging all V nodes with weight 0.",
  "Run Bellman-Ford(S, V) to discover distance potentials h(v).",
  "If negative weight cycle exists, ABORT Graph Engine.",
  "Reweight map: w'(u, v) = w(u, v) + h(u) - h(v).",
  "Remove phantom node S from structure.",
  "For every original node v in V:",
  "  Run purely optimized Dijkstra(v)",
  "  map distance output to APSP Data Matrix."
];

export function runJohnsons(nodes: AdvNode[], edges: AdvEdge[]): AdvStep[] {
  const steps: AdvStep[] = [];
  if (nodes.length === 0) return steps;

  // Track the actual current state of nodes dynamically
  const initialNodeIds = nodes.map(n => n.id);

  // 1. Add Phantom Node S
  const phantomId = "phantom_S";
  const phantomNodes = [...initialNodeIds, phantomId];
  
  steps.push({
    currentNodes: phantomNodes,
    activeNodes: [phantomId],
    phaseMessage: `Phase 1: Singularity Bridge Injection`,
    explanation: `AI: Generating an artificial Phantom Singularity node S. Forcing mass 0-cost invisible bridge links dynamically to all operational nodes.`,
    pseudocodeLine: 0
  });

  // Construct mock BF representation
  const h: Record<string, number> = {};
  phantomNodes.forEach(n => h[n] = Infinity);
  h[phantomId] = 0;

  // Let's pretend to run Bellman Ford
  let bfCycles = false;
  nodes.forEach(n => h[n.id] = 0); // Bellman ford from node with 0 weight to all directly sets potentials to 0, then relaxes

  for (let i = 1; i < phantomNodes.length; i++) {
    for (const edge of edges) {
      if (h[edge.source] !== Infinity && h[edge.source] + edge.weight < h[edge.target]) {
        h[edge.target] = h[edge.source] + edge.weight;
      }
    }
  }

  for (const edge of edges) {
    if (h[edge.source] !== Infinity && h[edge.source] + edge.weight < h[edge.target]) {
      bfCycles = true;
    }
  }

  if (bfCycles) {
    steps.push({
      currentNodes: initialNodeIds, // Abort drops phantom
      phaseMessage: `Phase 2: Bellman-Ford Calculation (FAILED)`,
      potentials: { ...h },
      explanation: `AI FAILURE: Negative structural dimensional loop detected in Phantom Bridge Phase. Johnson's APSP is entirely impossible in this graph topology.`,
      pseudocodeLine: 2
    });
    return steps;
  }

  steps.push({
    currentNodes: phantomNodes,
    phaseMessage: `Phase 2: Bellman-Ford Calculation`,
    potentials: { ...h },
    explanation: `AI: Bellman-Ford cycle executed successfully across Phantom Bridges. Computed relative node Potentials 'h(v)' mapped globally.`,
    pseudocodeLine: 1
  });

  // 3. Reweight Edges
  const reweighted: Record<string, number> = {};
  edges.forEach(e => {
    reweighted[e.id] = e.weight + h[e.source] - h[e.target];
  });

  steps.push({
    currentNodes: initialNodeIds, // Drop phantom
    phaseMessage: `Phase 3: Mathematical Graph Reweighting`,
    potentials: { ...h },
    edgeWeights: { ...reweighted },
    explanation: `AI: Phantom S Node safely purged. Applying calculated h(v) potential formulas to rewrite all graph physical distances. No negative topology routes exist!`,
    pseudocodeLine: 3
  });

  // 4. Run mass Dijkstra executions (Optimized Simulation representation)
  const distanceMatrix: Record<string, Record<string, number>> = {};
  initialNodeIds.forEach(id => distanceMatrix[id] = {});

  const copyMatrix = (mat: Record<string, Record<string, number>>) => {
     const res: Record<string, Record<string, number>> = {};
     for (const k in mat) res[k] = { ...mat[k] };
     return res;
  };

  for (let i = 0; i < initialNodeIds.length; i++) {
    const src = initialNodeIds[i];
    
    steps.push({
      currentNodes: initialNodeIds,
      activeNodes: [src],
      phaseMessage: `Phase 4: Dijkstra Matrix Extraction [${i+1}/${initialNodeIds.length}]`,
      potentials: { ...h },
      edgeWeights: { ...reweighted },
      distanceMatrix: copyMatrix(distanceMatrix),
      explanation: `AI: Booting hyper-optimized Dijkstra operation from Root ${nodes.find(n=>n.id===src)?.label} across the fully positive-weight mapping field.`,
      pseudocodeLine: 6
    });

    // Simulating Dijkstra calculations using standard logic since we reweighted.
    // Standard Dijkstra across reweighted fields:
    const d: Record<string, number> = {};
    initialNodeIds.forEach(id => d[id] = Infinity);
    d[src] = 0;

    const visited = new Set<string>();
    while(visited.size < initialNodeIds.length) {
      let u: string | null = null;
      let minD = Infinity;
      initialNodeIds.forEach(n => {
        if (!visited.has(n) && d[n] < minD) { minD = d[n]; u = n; }
      });
      if (!u) break;
      visited.add(u);
      
      edges.filter(e => e.source === u).forEach(e => {
        const v = e.target;
        if (d[u!] + reweighted[e.id] < d[v]) d[v] = d[u!] + reweighted[e.id];
      });
    }

    // Convert back mapping
    initialNodeIds.forEach(target => {
       if (d[target] !== Infinity) {
          distanceMatrix[src][target] = d[target] - h[src] + h[target];
       } else {
          distanceMatrix[src][target] = Infinity;
       }
    });

    steps.push({
      currentNodes: initialNodeIds,
      activeNodes: [src],
      phaseMessage: `Phase 4: Matrix Extraction [${i+1}/${initialNodeIds.length}] Component Finished`,
      potentials: { ...h },
      edgeWeights: { ...reweighted },
      distanceMatrix: copyMatrix(distanceMatrix),
      explanation: `AI: Output mapped mathematically to Master Distance Matrix translating back out of simulated phantom-scale.`,
      pseudocodeLine: 7
    });
  }

  steps.push({
    currentNodes: initialNodeIds,
    phaseMessage: `Algorithmic Sequence Complete`,
    distanceMatrix: copyMatrix(distanceMatrix),
    explanation: `AI SUCCESS: Complete $O(V^2 \\log V + VE)$ Johnson's Sequence executed. The graph possesses complete localized optimized APSP data structurally embedded!`,
    pseudocodeLine: -1
  });

  return steps;
}
