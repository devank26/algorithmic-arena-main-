import { AdvNode, AdvEdge, AdvStep } from "./advanced-graph-algorithms";

export interface ColoringStep extends AdvStep {
  colors?: Record<string, number>;        // Numerical assignments dictating spatial color 
  conflicts?: string[];                   // Adjacency collision edge IDs
  candidateColor?: number;                // The current color being attempted
  totalColorsUsed?: number;               // Max color mapped
  backtrackCount?: number;                // Optimization tracker
}

export const GREEDY_COLOR_PSEUDOCODE = [
  "For every Node in graph topology:",
  "  Scan structural adjacency matrix for used colors",
  "  Assign minimum available integer color not utilized by neighbors",
  "  Store absolute color configuration",
  "Report total unique chromatic combinations utilized"
];

export const BACKTRACKING_COLOR_PSEUDOCODE = [
  "Function recursiveColor(NodeIndex):",
  "  If all nodes colored, Return SUCCESS!",
  "  For Color C from 1 to Max_Allowed_Colors:",
  "    If structurally safe to assign C:",
  "      Assign Color C to Node",
  "      If recursiveColor(NodeIndex + 1) == SUCCESS: Return SUCCESS",
  "      Backtrack: Remove Color C from Node (Conflict threshold reached)",
  "  Return FAILURE (Graph cannot be colored optimally)"
];

export function runGreedyColoring(nodes: AdvNode[], edges: AdvEdge[]): ColoringStep[] {
  const steps: ColoringStep[] = [];
  if (nodes.length === 0) return steps;

  const nodeIds = nodes.map(n => n.id);
  const adj: Record<string, string[]> = {};
  
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => {
    adj[e.source].push(e.target);
    adj[e.target].push(e.source);
  });

  const colors: Record<string, number> = {};
  let maxColor = 0;

  steps.push({
    currentNodes: nodeIds,
    colors: { ...colors },
    totalColorsUsed: 0,
    phaseMessage: "Initializing Greedy Heuristic",
    explanation: "AI: Deploying Greedy topology mapping. We will isolate each node structurally and force local chromatic minimal optimization.",
    pseudocodeLine: 0
  });

  for (let i = 0; i < nodeIds.length; i++) {
    const u = nodeIds[i];

    steps.push({
       currentNodes: nodeIds,
       activeNodes: [u],
       colors: { ...colors },
       totalColorsUsed: maxColor,
       explanation: `AI: Isolating Target Node ${nodes.find(n=>n.id===u)?.label}. Compiling adjacent mapped metrics...`,
       pseudocodeLine: 1
    });

    const usedColors = new Set<number>();
    adj[u].forEach(neighbor => {
       if (colors[neighbor] !== undefined) {
          usedColors.add(colors[neighbor]);
       }
    });

    let assignedColor = 0;
    while (usedColors.has(assignedColor)) {
       assignedColor++;
    }

    colors[u] = assignedColor;
    maxColor = Math.max(maxColor, assignedColor + 1);

    steps.push({
       currentNodes: nodeIds,
       activeNodes: [u],
       colors: { ...colors },
       totalColorsUsed: maxColor,
       explanation: `AI: Found minimal available topological state integer [Color ${assignedColor}]. Locking mapping structure permanently into memory.`,
       pseudocodeLine: 2
    });
  }

  steps.push({
     currentNodes: nodeIds,
     colors: { ...colors },
     totalColorsUsed: maxColor,
     phaseMessage: "Greedy Chromatic State Rendered",
     explanation: `AI SUCCESS: Graph structure colored dynamically utilizing exactly ${maxColor} minimum overlapping states locally.`,
     pseudocodeLine: 4
  });

  return steps;
}

export function runBacktrackingColoring(nodes: AdvNode[], edges: AdvEdge[], maxColors: number): ColoringStep[] {
  const steps: ColoringStep[] = [];
  if (nodes.length === 0) return steps;

  const nodeIds = nodes.map(n => n.id);
  const adj: Record<string, string[]> = {};
  
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => {
    adj[e.source].push(e.target);
    adj[e.target].push(e.source);
  });

  const colors: Record<string, number> = {};
  let backtrackCount = 0;

  steps.push({
    currentNodes: nodeIds,
    colors: { ...colors },
    backtrackCount: 0,
    phaseMessage: `Backtracking Matrix Execution (Max: ${maxColors})`,
    explanation: `AI: Initializing highly complex Recursive Extrapolation sequence. Absolute mathematical chromatic boundary set strictly at ${maxColors}.`,
    pseudocodeLine: 0
  });

  function isSafe(vId: string, assignedColor: number): { safe: boolean, conflictEdge?: string } {
     for (const neighbor of adj[vId]) {
        if (colors[neighbor] === assignedColor) {
           const conflictingEdge = edges.find(e => (e.source === vId && e.target === neighbor) || (e.source === neighbor && e.target === vId));
           return { safe: false, conflictEdge: conflictingEdge?.id };
        }
     }
     return { safe: true };
  }

  function renderRecursiveColor(nodeIndex: number): boolean {
     if (nodeIndex === nodeIds.length) {
         return true;
     }

     const u = nodeIds[nodeIndex];

     steps.push({
         currentNodes: nodeIds,
         activeNodes: [u],
         colors: { ...colors },
         backtrackCount,
         phaseMessage: "Evaluating Node",
         explanation: `AI: Layer ${nodeIndex}. Targeting node ${nodes.find(n=>n.id===u)?.label}. Testing structural viability [0 to ${maxColors-1}].`,
         pseudocodeLine: 2
     });

     for (let c = 0; c < maxColors; c++) {
         const { safe, conflictEdge } = isSafe(u, c);

         if (safe) {
             colors[u] = c;
             steps.push({
                 currentNodes: nodeIds,
                 activeNodes: [u],
                 colors: { ...colors },
                 backtrackCount,
                 candidateColor: c,
                 phaseMessage: "Color Assigned",
                 explanation: `AI: State Vector safe. Mapping [Color ${c}]. Diving into child structure.`,
                 pseudocodeLine: 4
             });

             if (renderRecursiveColor(nodeIndex + 1)) {
                 return true;
             }

             // Backtrack
             const failedColor = colors[u];
             delete colors[u];
             backtrackCount++;

             steps.push({
                 currentNodes: nodeIds,
                 activeNodes: [u],
                 colors: { ...colors },
                 backtrackCount,
                 phaseMessage: "Backtrack!",
                 explanation: `AI WARNING: Dead end detected. Snapping back and removing [Color ${failedColor}]. Ops: ${backtrackCount}.`,
                 pseudocodeLine: 6
             });

         } else {
             steps.push({
                 currentNodes: nodeIds,
                 activeNodes: [u],
                 activeEdges: conflictEdge ? [conflictEdge] : [],
                 conflicts: conflictEdge ? [conflictEdge] : [],
                 colors: { ...colors },
                 backtrackCount,
                 candidateColor: c,
                 phaseMessage: "Conflict Detected!",
                 explanation: `AI DANGER: Topologic configuration invalid. assigned [Color ${c}] forms a contiguous conflict bridge.`,
                 pseudocodeLine: 3
             });
         }
     }

     return false;
  }

  if (renderRecursiveColor(0)) {
     steps.push({
         currentNodes: nodeIds,
         colors: { ...colors },
         backtrackCount,
         phaseMessage: `Backtracking Success!`,
         explanation: `AI SUCCESS: Optimal Chromatic Layout Achieved seamlessly traversing recursion boundaries. Total backtracks evaluated during rendering: ${backtrackCount}.`,
         pseudocodeLine: 1
     });
  } else {
     steps.push({
         currentNodes: nodeIds,
         colors: { ...colors },
         backtrackCount,
         phaseMessage: `Recursive Constraint Maximum Reached`,
         explanation: `AI ERROR FATAL: Graph topology fundamentally violates bounds parameter. It is mathematically impossible to structurally route graph under configuration boundary (${maxColors} colors).`,
         pseudocodeLine: 7
     });
  }

  return steps;
}
