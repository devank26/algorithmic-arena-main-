import { AdvNode, AdvEdge, AdvStep } from "./advanced-graph-algorithms";

export interface RouteStep extends AdvStep {
  orderedPath?: string[];         // Sequence of node traversal
  orderedEdges?: string[];        // Sequence of edges successfully consumed
  degrees?: Record<string, number>;// Eulerian structural degree mapping
  backtrackCount?: number;        // Tracker for Hamiltonian iterations
  visitedCount?: number;          // Tracker for actual unique nodes
}

export const EULER_PSEUDOCODE = [
  "Condition: Validate Node Degrees (Only 0 or 2 Odds)",
  "Initialize empty Edge Stack and final Path array",
  "While Current Node has unvisited connecting edges:",
  "  Pick an untraversed edge leading to Neighbor",
  "  Mark Edge as Visited, shift Current Node to Neighbor",
  "Loop stuck? Backtrack path while pushing to final circuit!"
];

export const HAMILTONIAN_PSEUDOCODE = [
  "Function traceHamiltonian(CurrentNode, TargetDepth):",
  "  If VisitedNodes == TotalNodes: Return SUCCESS!",
  "  For each Neighbor connected to CurrentNode:",
  "    If Neighbor is NOT in VisitedNodes set:",
  "      Mark Neighbor visited, append to path",
  "      If traceHamiltonian(Neighbor) == SUCCESS: Return SUCCESS",
  "      Remove Neighbor from path (Backtrack heavily)",
  "  Return FAILURE (Dead end reached entirely)"
];

// EULER (Hierholzer's Algorithm mapping)
export function runEulerPath(nodes: AdvNode[], edges: AdvEdge[], startNodeId?: string): RouteStep[] {
  const steps: RouteStep[] = [];
  if (nodes.length === 0 || edges.length === 0) return steps;

  const nodeIds = nodes.map(n => n.id);
  const adj: Record<string, { target: string, edgeId: string }[]> = {};
  const degreeMap: Record<string, number> = {};
  
  nodes.forEach(n => { adj[n.id] = []; degreeMap[n.id] = 0; });
  
  // Euler usually operates perfectly natively on Undirected for delivery routes
  edges.forEach(e => {
    adj[e.source].push({ target: e.target, edgeId: e.id });
    adj[e.target].push({ target: e.source, edgeId: e.id });
    degreeMap[e.source]++;
    degreeMap[e.target]++;
  });

  steps.push({
     currentNodes: nodeIds,
     degrees: { ...degreeMap },
     phaseMessage: "Euler Conditions Analysis",
     explanation: "AI: Parsing global topology for Eulerian prerequisites... Evaluating exactly how many edges connect directly to every single hub.",
     pseudocodeLine: 0
  });

  const oddNodes = nodeIds.filter(id => degreeMap[id] % 2 !== 0);
  if (oddNodes.length !== 0 && oddNodes.length !== 2) {
     steps.push({
         currentNodes: nodeIds,
         degrees: { ...degreeMap },
         phaseMessage: "Eulerian Failure: Geometric Constraints Violated",
         explanation: `AI WARNING: Found ${oddNodes.length} nodes with Odd degrees. Eulerian physics mathematically demands exactly 0 or 2 odd nodes. Traversal is impossible!`,
         pseudocodeLine: 0
     });
     return steps;
  }

  // Choose starting node
  let curr = startNodeId;
  if (!curr) {
      if (oddNodes.length === 2) curr = oddNodes[0];
      else {
          // Find first node with edges
          curr = nodeIds.find(id => degreeMap[id] > 0) || nodeIds[0];
      }
  } else if (oddNodes.length === 2 && !oddNodes.includes(curr)) {
     steps.push({
         currentNodes: nodeIds,
         degrees: { ...degreeMap },
         phaseMessage: "Invalid Start Node",
         explanation: `AI ERROR: Graph has exactly 2 odd nodes. You MUST start at an odd node to successfully terminate at the other odd node.`,
         pseudocodeLine: 0
     });
     return steps;
  }

  // We must track used edges (undirected)
  const usedEdges = new Set<string>();
  const currPath: string[] = [curr];
  const circuit: string[] = [];
  const edgeCircuit: string[] = []; // Output sequence of edges
  const currEdgePath: string[] = []; // Stack of edges taken to current

  steps.push({
     currentNodes: nodeIds,
     activeNodes: [curr],
     orderedPath: [curr],
     degrees: { ...degreeMap },
     phaseMessage: "Hierholzer Traversal Initiated",
     explanation: `AI: Eulerian bounds verified. Tracking delivery routes outward from ${nodes.find(n=>n.id===curr)?.label}. Every edge must be consumed!`,
     pseudocodeLine: 1
  });

  // Hierholzer iteration (DFS iterative is safer than recursive for Euler circuits usually)
  // To visualize step by step easily, we trace manually natively:
  while (currPath.length > 0) {
      const u = currPath[currPath.length - 1];
      
      // Find an unused edge
      let nextTarget = null;
      let usedEdgeId = null;

      for (const neighbor of adj[u]) {
          if (!usedEdges.has(neighbor.edgeId)) {
             nextTarget = neighbor.target;
             usedEdgeId = neighbor.edgeId;
             break;
          }
      }

      if (nextTarget && usedEdgeId) {
          usedEdges.add(usedEdgeId);
          currPath.push(nextTarget);
          currEdgePath.push(usedEdgeId);

          steps.push({
             currentNodes: nodeIds,
             activeNodes: [nextTarget],
             activeEdges: [usedEdgeId],   // Currently interacting edge
             orderedEdges: Array.from(usedEdges), // All burned edges
             orderedPath: [...currPath],
             degrees: { ...degreeMap },
             explanation: `AI: Edge ${usedEdgeId} successfully consumed. Traversing topology toward ${nodes.find(n=>n.id===nextTarget)?.label}.`,
             pseudocodeLine: 4
          });
      } else {
          // Dead end! Backtrack sequence
          const backNode = currPath.pop()!;
          circuit.push(backNode);
          const backEdge = currEdgePath.pop();
          if (backEdge) edgeCircuit.push(backEdge);

          if (currPath.length > 0) {
               steps.push({
                 currentNodes: nodeIds,
                 activeNodes: [currPath[currPath.length-1]],
                 orderedEdges: Array.from(usedEdges),
                 orderedPath: [...currPath],
                 degrees: { ...degreeMap },
                 phaseMessage: "Backtracking / Pushing to Circuit",
                 explanation: `AI: Structural dead end reached cleanly. Freezing path tail logic. Backtracking to re-route remaining topological edges.`,
                 pseudocodeLine: 5
              });
          }
      }
  }

  circuit.reverse();
  edgeCircuit.reverse();

  steps.push({
     currentNodes: nodeIds,
     orderedEdges: Array.from(usedEdges),
     orderedPath: circuit,
     degrees: { ...degreeMap },
     phaseMessage: `Delivery Sequence Complete!`,
     explanation: `AI SUCCESS: 100% of spatial edges traversed elegantly in a continuous vector. A complete ${oddNodes.length === 0 ? "Eulerian Circuit" : "Eulerian Path"} synthesized!`,
     pseudocodeLine: -1
  });

  return steps;
}

// HAMILTONIAN (Recursive Backtracking)
export function runHamiltonianPath(nodes: AdvNode[], edges: AdvEdge[], startNodeId: string, searchCycles: boolean): RouteStep[] {
  const steps: RouteStep[] = [];
  if (nodes.length === 0) return steps;

  const nodeIds = nodes.map(n => n.id);
  const adj: Record<string, { target: string, edgeId: string }[]> = {};
  
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => {
    adj[e.source].push({ target: e.target, edgeId: e.id });
    adj[e.target].push({ target: e.source, edgeId: e.id });
  });

  let backtrackCount = 0;
  const path: string[] = [startNodeId];
  const visited = new Set<string>([startNodeId]);
  const activeEdgesPath: string[] = []; // Which edges are actively highlighting the path?

  steps.push({
     currentNodes: nodeIds,
     activeNodes: [startNodeId],
     orderedPath: [...path],
     visitedCount: visited.size,
     backtrackCount: 0,
     phaseMessage: "Hamiltonian Node Traversal Initiated",
     explanation: "AI: Searching purely for Node-Saturation (100% Visitation) ignoring edge counts. This generates absolute massive $O(N!)$ NP-Complete topological branching.",
     pseudocodeLine: 0
  });

  // Limit execution aggressively. Max 2000 steps to prevent massive loop structures breaking memory
  let maxSafeguard = 0;

  function recursiveTraverse(u: string): boolean {
      if (maxSafeguard > 2000) return false;
      maxSafeguard++;

      if (visited.size === nodes.length) {
          if (!searchCycles) return true;
          // For cycles, we must check if start node connects to last node cleanly
          const returningEdge = adj[u].find(n => n.target === startNodeId);
          if (returningEdge) {
              activeEdgesPath.push(returningEdge.edgeId);
              path.push(startNodeId);
              return true;
          }
          return false;
      }

      for (const neighbor of adj[u]) {
          if (!visited.has(neighbor.target)) {
             visited.add(neighbor.target);
             path.push(neighbor.target);
             activeEdgesPath.push(neighbor.edgeId);

             steps.push({
                 currentNodes: nodeIds,
                 activeNodes: [neighbor.target],
                 orderedPath: [...path],
                 orderedEdges: [...activeEdgesPath],
                 visitedCount: visited.size,
                 backtrackCount,
                 explanation: `AI: Traversal jumping smoothly into undiscovered node [${nodes.find(n=>n.id===neighbor.target)?.label}]. Nodes isolated: ${visited.size}/${nodes.length}.`,
                 pseudocodeLine: 4
             });

             if (recursiveTraverse(neighbor.target)) {
                 return true;
             }

             // Backtrack gracefully
             visited.delete(neighbor.target);
             path.pop();
             const rejectedEdge = activeEdgesPath.pop()!;
             backtrackCount++;

             steps.push({
                 currentNodes: nodeIds,
                 activeNodes: [u],
                 activeEdges: [rejectedEdge], // highlight red
                 orderedPath: [...path],
                 orderedEdges: [...activeEdgesPath], // Path edge array excluding the red one
                 visitedCount: visited.size,
                 backtrackCount,
                 phaseMessage: "Recursive Topological Dead-End",
                 explanation: `AI DANGER: Traversal hit a structural wall. We cannot reach all remaining nodes efficiently. Backtracking brutally reversing state geometries!`,
                 pseudocodeLine: 6
             });
          }
      }

      return false;
  }

  const success = recursiveTraverse(startNodeId);

  if (maxSafeguard > 2000) {
     steps.push({
         currentNodes: nodeIds,
         orderedPath: [...path],
         visitedCount: visited.size,
         backtrackCount,
         phaseMessage: "Hamiltonian Complexity Safeguard Triggered",
         explanation: `AI FATAL ERROR: Evaluated over 2,000 permutations instantly! NP-Complete exponential topology prevented extraction inside acceptable human time constraints.`,
         pseudocodeLine: -1
     });
     return steps;
  }

  if (success) {
      steps.push({
         currentNodes: nodeIds,
         orderedPath: [...path],
         orderedEdges: [...activeEdgesPath],
         visitedCount: visited.size,
         backtrackCount,
         phaseMessage: searchCycles ? "Hamiltonian Cycle Synchronized" : "Hamiltonian Node Path Optimized",
         explanation: `AI SUCCESS: Traversed and identified 100% of spatial target nodes utilizing absolutely no structural repeats. Backtrack sequence anomalies resolved entirely!`,
         pseudocodeLine: 1
      });
  } else {
      steps.push({
         currentNodes: nodeIds,
         orderedPath: [...path],
         orderedEdges: [...activeEdgesPath],
         visitedCount: visited.size,
         backtrackCount,
         phaseMessage: "Absolute Topological Impossibility",
         explanation: `AI ERROR: Graph geometry mathematically prohibits visiting every isolated delivery node uniquely. Exhausted all combinational branches!`,
         pseudocodeLine: 7
      });
  }

  return steps;
}
