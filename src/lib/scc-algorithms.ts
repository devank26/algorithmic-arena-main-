import { AdvNode, AdvEdge, AdvStep } from "./advanced-graph-algorithms";

export interface SCCStep extends AdvStep {
  orderedStack?: string[];    // Stack representation spanning DFS tracking frames
  disksMap?: Record<string, number>; // Tarjan discovery id bindings
  lowLinkMap?: Record<string, number>; // Tarjan Low-link tree structures
  sccs?: string[][];          // Grouped node lists of finalized components
  isReversedOut?: boolean;    // For Kosaraju graph flip visualization
}

// ==== KOSARAJU ALGORITHM ====
export const KOSARAJU_PSEUDOCODE = [
  "Run DFS sequence mapping nodes to Post-Order Stack",
  "Reverse perfectly all graph edges orientations",
  "While strictly Stack is not empty:",
  "  Pop node V dynamically",
  "  If V not mapped: Run DFS(V) on reversed graph",
  "  DFS(V) structural bounds group a new SCC!",
];

export function runKosaraju(nodes: AdvNode[], edges: AdvEdge[]): SCCStep[] {
  const steps: SCCStep[] = [];
  if (nodes.length === 0) return steps;

  const nodeIds = nodes.map(n => n.id);
  const adj: Record<string, string[]> = {};
  const revAdj: Record<string, string[]> = {};
  
  nodes.forEach(n => { adj[n.id] = []; revAdj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source].push(e.target);
    revAdj[e.target].push(e.source);
  });

  const visited = new Set<string>();
  const stack: string[] = [];

  steps.push({
    currentNodes: nodeIds,
    phaseMessage: "Phase 1: Dynamic DFS Post-Order Stacking",
    explanation: "AI: Emitting Depth-First traces. Nodes fully resolving structural branches will sink into the Post-Order Stack layer.",
    pseudocodeLine: 0
  });

  // Phase 1 DFS
  function dfsPhase1(u: string) {
    visited.add(u);
    steps.push({
      currentNodes: nodeIds,
      activeNodes: [u],
      orderedStack: [...stack],
      explanation: `AI: Traversal hitting ${nodes.find(n=>n.id===u)?.label}. Recursively scanning localized adjacency variables.`,
      pseudocodeLine: 0
    });

    for (const v of adj[u]) {
      if (!visited.has(v)) dfsPhase1(v);
    }
    
    stack.push(u);
    steps.push({
      currentNodes: nodeIds,
      activeNodes: [u],
      orderedStack: [...stack],
      explanation: `AI: Sub-graph fully exhaustively analyzed at branch ${nodes.find(n=>n.id===u)?.label}. Injecting node bounds strictly into Master Stack.`,
      pseudocodeLine: 0
    });
  }

  nodeIds.forEach(id => { if (!visited.has(id)) dfsPhase1(id); });

  // Phase 2 graph flip
  steps.push({
    currentNodes: nodeIds,
    orderedStack: [...stack],
    isReversedOut: true,
    phaseMessage: "Phase 2: Topological Dimension Flip",
    explanation: "AI: Post-Order Stack built safely! Triggering complete map inversion. Flipping all Directed Path definitions topologically.",
    pseudocodeLine: 1
  });

  visited.clear();
  const sccs: string[][] = [];

  // Phase 2 DFS
  function dfsPhase2(u: string, currentScc: string[]) {
    visited.add(u);
    currentScc.push(u);

    steps.push({
      currentNodes: nodeIds,
      activeNodes: [u],
      orderedStack: [...stack],
      sccs: JSON.parse(JSON.stringify(sccs.concat([currentScc]))),
      isReversedOut: true,
      explanation: `AI: Resolving Reversed Path Logic mapping out connected structural sink hole across ${nodes.find(n=>n.id===u)?.label}.`,
      pseudocodeLine: 4
    });

    for (const v of revAdj[u]) {
      if (!visited.has(v)) {
        steps.push({
           currentNodes: nodeIds,
           activeNodes: [v],
           activeEdges: edges.filter(e => e.source === v && e.target === u).map(e=>e.id), // In reverse graph, edge was v->u
           orderedStack: [...stack],
           sccs: JSON.parse(JSON.stringify(sccs.concat([currentScc]))),
           isReversedOut: true,
           explanation: "AI: Edge tension tracing...",
           pseudocodeLine: 5
        });
        dfsPhase2(v, currentScc);
      }
    }
  }

  while (stack.length > 0) {
    const u = stack.pop()!;
    steps.push({
      currentNodes: nodeIds,
      activeNodes: [u],
      orderedStack: [...stack],
      sccs: JSON.parse(JSON.stringify(sccs)),
      isReversedOut: true,
      explanation: `AI: Dissecting Post-Order Element ${nodes.find(n=>n.id===u)?.label}. Executing sink-hole reverse DFS logic constraints.`,
      pseudocodeLine: 3
    });

    if (!visited.has(u)) {
      const currentScc: string[] = [];
      dfsPhase2(u, currentScc);
      sccs.push(currentScc);
      
      steps.push({
        currentNodes: nodeIds,
        orderedStack: [...stack],
        sccs: JSON.parse(JSON.stringify(sccs)),
        isReversedOut: true,
        phaseMessage: `Isolated SCC Formed (Rank: ${sccs.length})`,
        explanation: `AI: Reverse-Path structural DFS fully exhausted! Strongly Connected Group [${currentScc.map(id => nodes.find(n=>n.id===id)?.label).join(",")}] formally isolated geometrically.`,
        pseudocodeLine: 5
      });
    }
  }

  steps.push({
     currentNodes: nodeIds,
     orderedStack: [...stack],
     sccs: JSON.parse(JSON.stringify(sccs)),
     isReversedOut: true,
     phaseMessage: `Kosaraju SCC Diagnostics Complete`,
     explanation: `AI SUCCESS: Structural Matrix decoupled effectively into ${sccs.length} definitive Strictly Connected Components! Linear time execution finalized.`,
     pseudocodeLine: -1
  });

  return steps;
}

// ==== TARJAN ALGORITHM ====
export const TARJAN_PSEUDOCODE = [
  "Run localized DFS across structural graph layers.",
  "Assign DFS Discovery ID and Low-Link limits optimally.",
  "Push element deeply to the Active Execution Stack.",
  "For child trees: recursively compute Low-Links back-propagating IDs.",
  "For cross-edges to Active Stack: update Low-Link directly.",
  "If Discovery ID === Low-Link metric: Pop SCC group instantly!",
];

export function runTarjan(nodes: AdvNode[], edges: AdvEdge[]): SCCStep[] {
  const steps: SCCStep[] = [];
  if (nodes.length === 0) return steps;

  const nodeIds = nodes.map(n => n.id);
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => adj[e.source].push(e.target));

  let time = 0;
  const ids: Record<string, number> = {};
  const low: Record<string, number> = {};
  const onStack: Record<string, boolean> = {};
  const stack: string[] = [];
  const sccs: string[][] = [];

  nodes.forEach(n => {
    ids[n.id] = -1;
    low[n.id] = -1;
    onStack[n.id] = false;
  });

  steps.push({
      currentNodes: nodeIds,
      phaseMessage: "Tarjan Extraction Initialization",
      explanation: `AI: Tarjan SCC analysis booting. Structuring parallel DFS tree trace limits mapping strictly Low-Link geometric boundaries.`,
      pseudocodeLine: 0
  });

  function dfs(at: string) {
    stack.push(at);
    onStack[at] = true;
    time++;
    ids[at] = time;
    low[at] = time;

    steps.push({
       currentNodes: nodeIds,
       activeNodes: [at],
       orderedStack: [...stack],
       disksMap: { ...ids },
       lowLinkMap: { ...low },
       sccs: JSON.parse(JSON.stringify(sccs)),
       explanation: `AI: Depth Traversal reaching ${nodes.find(n=>n.id===at)?.label}. Discovery ID assigned: [${time}]. Localized Low-Link theoretical bound locked initially to [${time}].`,
       pseudocodeLine: 1
    });

    for (const to of adj[at]) {
       steps.push({
         currentNodes: nodeIds,
         activeNodes: [to],
         activeEdges: edges.filter(e => e.source === at && e.target === to).map(e=>e.id),
         orderedStack: [...stack],
         disksMap: { ...ids },
         lowLinkMap: { ...low },
         sccs: JSON.parse(JSON.stringify(sccs)),
         explanation: `AI: Investigating structural edge path vector ${nodes.find(n=>n.id===at)?.label} → ${nodes.find(n=>n.id===to)?.label}.`,
         pseudocodeLine: 3
       });

       if (ids[to] === -1) {
          dfs(to);
          low[at] = Math.min(low[at], low[to]);
          
          steps.push({
             currentNodes: nodeIds,
             activeNodes: [at],
             orderedStack: [...stack],
             disksMap: { ...ids },
             lowLinkMap: { ...low },
             sccs: JSON.parse(JSON.stringify(sccs)),
             explanation: `AI: Tree traversal bubbling back. Updating Low-Link constraint logic for ${nodes.find(n=>n.id===at)?.label} down to ${low[at]}.`,
             pseudocodeLine: 3
          });
       } else if (onStack[to]) {
          low[at] = Math.min(low[at], ids[to]);
          
          steps.push({
             currentNodes: nodeIds,
             activeNodes: [at],
             orderedStack: [...stack],
             disksMap: { ...ids },
             lowLinkMap: { ...low },
             sccs: JSON.parse(JSON.stringify(sccs)),
             explanation: `AI: Resolving Back-edge anomaly detected securely! Shrinking Low-Link constraint mathematically on map layer.`,
             pseudocodeLine: 4
          });
       }
    }

    if (ids[at] === low[at]) {
       const newScc: string[] = [];
       let poppedNode = "";
       do {
          poppedNode = stack.pop()!;
          onStack[poppedNode] = false;
          newScc.push(poppedNode);
       } while (poppedNode !== at);

       sccs.push(newScc);
       steps.push({
         currentNodes: nodeIds,
         orderedStack: [...stack],
         disksMap: { ...ids },
         lowLinkMap: { ...low },
         sccs: JSON.parse(JSON.stringify(sccs)),
         phaseMessage: `Root SCC Detected (Discovery === Low-Link)`,
         explanation: `AI: Structural sink equilibrium reached! Node ${nodes.find(n=>n.id===at)?.label} possesses matched topological ID bound. Extracting isolated cluster: [${newScc.map(id => nodes.find(n=>n.id===id)?.label).join(",")}]`,
         pseudocodeLine: 5
       });
    }
  }

  nodeIds.forEach(id => {
    if (ids[id] === -1) {
      dfs(id);
    }
  });

  steps.push({
     currentNodes: nodeIds,
     sccs: JSON.parse(JSON.stringify(sccs)),
     phaseMessage: `Tarjan Execution Verification Complete`,
     explanation: `AI SUCCESS: Highly optimized $O(V+E)$ operational single-pass Low-Link architecture successfully extracted ${sccs.length} isolated components gracefully!`,
     pseudocodeLine: -1
  });

  return steps;
}
