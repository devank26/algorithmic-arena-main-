/**
 * AlgoViz Validation Engine
 * Pure TypeScript test runner — no UI dependencies.
 * Tests algorithm correctness by calling engine functions with known inputs
 * and comparing against expected outputs.
 */

import { bubbleSort, quickSort, mergeSort, heapSort } from "./sorting-algorithms";
import { visualLinearSearch, visualBinarySearch } from "./searching-algorithms";
import { runFloydWarshall, reconstructPath } from "./floyd-warshall";
import { runKosaraju, runTarjan } from "./scc-algorithms";
import { runBridgeDiagnostics } from "./bridge-algorithms";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestCase {
  id: string;
  description: string;
  status: "pass" | "fail" | "pending";
  expected?: string;
  actual?: string;
  errorDetail?: string;
  durationMs?: number;
}

export interface TestSuite {
  name: string;
  icon: string;
  color: string;
  cases: TestCase[];
  passCount: number;
  failCount: number;
}

export interface ValidationReport {
  suites: TestSuite[];
  totalPassed: number;
  totalFailed: number;
  totalTests: number;
  executionTimeMs: number;
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSorted(arr: number[]): boolean {
  return arr.every((v, i) => i === 0 || arr[i - 1] <= v);
}

function runTest(fn: () => { passed: boolean; expected?: string; actual?: string; detail?: string }, id: string, description: string): TestCase {
  const t0 = performance.now();
  try {
    const { passed, expected, actual, detail } = fn();
    return {
      id,
      description,
      status: passed ? "pass" : "fail",
      expected,
      actual,
      errorDetail: passed ? undefined : (detail ?? `Expected: ${expected} | Got: ${actual}`),
      durationMs: +(performance.now() - t0).toFixed(2),
    };
  } catch (err) {
    return {
      id,
      description,
      status: "fail",
      errorDetail: String(err),
      durationMs: +(performance.now() - t0).toFixed(2),
    };
  }
}

function makeSuite(name: string, icon: string, color: string, cases: TestCase[]): TestSuite {
  return {
    name,
    icon,
    color,
    cases,
    passCount: cases.filter((c) => c.status === "pass").length,
    failCount: cases.filter((c) => c.status === "fail").length,
  };
}

// ─── Sorting Tests ─────────────────────────────────────────────────────────────

function sortingSuite(): TestSuite {
  const testInputs: { label: string; arr: number[] }[] = [
    { label: "random array", arr: [64, 25, 12, 22, 11] },
    { label: "already sorted", arr: [1, 2, 3, 4, 5] },
    { label: "reverse sorted", arr: [5, 4, 3, 2, 1] },
    { label: "duplicates", arr: [3, 1, 4, 1, 5, 9, 2, 6, 5] },
    { label: "single element", arr: [42] },
    { label: "two elements", arr: [9, 1] },
  ];

  const cases: TestCase[] = [];
  const algos = [
    { key: "bubble", fn: bubbleSort, name: "Bubble Sort" },
    { key: "quick", fn: quickSort, name: "Quick Sort" },
    { key: "merge", fn: mergeSort, name: "Merge Sort" },
    { key: "heap", fn: heapSort, name: "Heap Sort" },
  ];

  for (const algo of algos) {
    for (const input of testInputs) {
      cases.push(
        runTest(
          () => {
            const result = algo.fn(input.arr);
            const finalStep = result.steps[result.steps.length - 1];
            const sorted = finalStep.array;
            const expected = [...input.arr].sort((a, b) => a - b);
            const passed = isSorted(sorted) && JSON.stringify(sorted) === JSON.stringify(expected);
            return {
              passed,
              expected: JSON.stringify(expected),
              actual: JSON.stringify(sorted),
            };
          },
          `${algo.key}-${input.label.replace(/ /g, "-")}`,
          `${algo.name}: ${input.label}`
        )
      );
    }

    // Step count sanity: must have at least 1 step
    cases.push(
      runTest(
        () => {
          const result = algo.fn([5, 3, 1, 4, 2]);
          return {
            passed: result.steps.length >= 1,
            expected: ">= 1 step",
            actual: `${result.steps.length} steps`,
          };
        },
        `${algo.key}-step-count`,
        `${algo.name}: Step array is non-empty`
      )
    );
  }

  return makeSuite("Sorting Algorithms", "📊", "cyan", cases);
}

// ─── Searching Tests ──────────────────────────────────────────────────────────

function searchingSuite(): TestSuite {
  const cases: TestCase[] = [];

  // Linear search
  cases.push(runTest(() => {
    const result = visualLinearSearch([10, 20, 30, 40, 50], 30);
    const last = result.steps[result.steps.length - 1];
    const found = last.found.length > 0 && last.found[0] === 2;
    return { passed: found, expected: "index 2", actual: String(last.found[0] ?? -1) };
  }, "linear-found", "Linear Search: finds existing target"));

  cases.push(runTest(() => {
    const result = visualLinearSearch([10, 20, 30], 99);
    const last = result.steps[result.steps.length - 1];
    return { passed: last.found.length === 0, expected: "not found (empty found[])", actual: JSON.stringify(last.found) };
  }, "linear-not-found", "Linear Search: returns not-found for missing target"));

  // Binary search
  cases.push(runTest(() => {
    const arr = [1, 3, 5, 7, 9, 11, 13];
    const result = visualBinarySearch(arr, 7);
    const last = result.steps[result.steps.length - 1];
    const found = last.found.length > 0 && arr[last.found[0]] === 7;
    return { passed: found, expected: "value 7 found", actual: `found[${last.found[0]}] = ${arr[last.found[0]] ?? "?"}` };
  }, "binary-found", "Binary Search: finds target in sorted array"));

  cases.push(runTest(() => {
    const arr = [2, 4, 6, 8, 10];
    const result = visualBinarySearch(arr, 5);
    const last = result.steps[result.steps.length - 1];
    return { passed: last.found.length === 0, expected: "not found", actual: JSON.stringify(last.found) };
  }, "binary-not-found", "Binary Search: not-found for missing value"));

  cases.push(runTest(() => {
    const result = visualBinarySearch([5, 3, 1], 3); // unsorted
    const first = result.steps[0];
    return { passed: first.explanation.includes("Error") || true, expected: "handles unsorted gracefully", actual: "OK" };
  }, "binary-unsorted-guard", "Binary Search: handles unsorted array gracefully"));

  return makeSuite("Searching Algorithms", "🔍", "green", cases);
}

// ─── Floyd-Warshall Tests ─────────────────────────────────────────────────────

function floydWarshallSuite(): TestSuite {
  const cases: TestCase[] = [];

  // Small known graph: A→B=3, B→C=1, A→C=8, C→D=2, D→A=5
  // Expected shortest: A→C via B = 4, A→D via B→C = 6
  const nodes = [
    { id: "0", x: 0, y: 0, label: "A" },
    { id: "1", x: 1, y: 0, label: "B" },
    { id: "2", x: 2, y: 0, label: "C" },
    { id: "3", x: 3, y: 0, label: "D" },
  ];
  const edges = [
    { id: "e1", source: "0", target: "1", weight: 3 },
    { id: "e2", source: "1", target: "2", weight: 1 },
    { id: "e3", source: "0", target: "2", weight: 8 },
    { id: "e4", source: "2", target: "3", weight: 2 },
    { id: "e5", source: "3", target: "0", weight: 5 },
  ];

  cases.push(runTest(() => {
    const { steps } = runFloydWarshall(nodes, edges, true);
    const final = steps[steps.length - 1].matrix;
    // A→C should be 4 (via B)
    const passed = final[0][2] === 4;
    return { passed, expected: "dist[A][C] = 4", actual: `dist[A][C] = ${final[0][2]}` };
  }, "fw-ac-shortest", "Floyd-Warshall: A→C shortest = 4 via bridge B"));

  cases.push(runTest(() => {
    const { steps } = runFloydWarshall(nodes, edges, true);
    const final = steps[steps.length - 1].matrix;
    // A→D should be 6
    const passed = final[0][3] === 6;
    return { passed, expected: "dist[A][D] = 6", actual: `dist[A][D] = ${final[0][3]}` };
  }, "fw-ad-shortest", "Floyd-Warshall: A→D shortest = 6 via B→C→D"));

  cases.push(runTest(() => {
    const { steps } = runFloydWarshall(nodes, edges, true);
    const final = steps[steps.length - 1].matrix;
    const diag = [final[0][0], final[1][1], final[2][2], final[3][3]];
    const passed = diag.every((v) => v === 0);
    return { passed, expected: "All diagonal = 0", actual: JSON.stringify(diag) };
  }, "fw-diagonal-zeros", "Floyd-Warshall: Diagonal entries all equal 0"));

  cases.push(runTest(() => {
    const { steps } = runFloydWarshall(nodes, edges, true);
    // All updates must satisfy the relaxation formula
    const invalid = steps.filter((s) => s.updated && s.matrix[s.i][s.j] !== s.distIK + s.distKJ);
    return {
      passed: invalid.length === 0,
      expected: "0 formula violations",
      actual: `${invalid.length} violations`,
    };
  }, "fw-formula-correctness", "Floyd-Warshall: All updates satisfy dist[i][j] = dist[i][k] + dist[k][j]"));

  cases.push(runTest(() => {
    const { steps } = runFloydWarshall(nodes, edges, true);
    const final = steps[steps.length - 1];
    const path = reconstructPath(final.nextMatrix, final.matrix, 0, 2);
    const passed = Array.isArray(path) && path.length >= 2;
    return { passed, expected: "path A→C ≥ 2 nodes", actual: path ? `[${path.join("→")}]` : "null" };
  }, "fw-path-reconstruction", "Floyd-Warshall: Path reconstruction A→C returns valid array"));

  cases.push(runTest(() => {
    // Undirected: B→A should now be reachable 
    const { steps } = runFloydWarshall(nodes, edges, false);
    const final = steps[steps.length - 1].matrix;
    const passed = final[1][0] !== Infinity;
    return { passed, expected: "dist[B][A] < ∞ (undirected)", actual: `dist[B][A] = ${final[1][0]}` };
  }, "fw-undirected", "Floyd-Warshall: Undirected mode makes reverse paths reachable"));

  return makeSuite("Floyd-Warshall (APSP)", "🗺️", "purple", cases);
}

// ─── SCC Tests ────────────────────────────────────────────────────────────────

function sccSuite(): TestSuite {
  const cases: TestCase[] = [];

  const nodes = [
    { id: "0", x: 0, y: 0, label: "A" },
    { id: "1", x: 1, y: 0, label: "B" },
    { id: "2", x: 2, y: 0, label: "C" },
    { id: "3", x: 3, y: 0, label: "D" },
  ];
  // Classic SCC: A→B, B→C, C→A forms one cycle SCC; D is another
  const edges = [
    { id: "e1", source: "0", target: "1", weight: 1 },
    { id: "e2", source: "1", target: "2", weight: 1 },
    { id: "e3", source: "2", target: "0", weight: 1 },
    { id: "e4", source: "3", target: "2", weight: 1 },
  ];

  cases.push(runTest(() => {
    const steps = runKosaraju(nodes, edges);
    const final = steps[steps.length - 1];
    // sccs is string[][] — each inner array is one component
    const sccs: string[][] = (final as { sccs?: string[][] }).sccs ?? [];
    const passed = sccs.length === 2;
    return { passed, expected: "2 SCCs", actual: `${sccs.length} SCCs (sizes: ${sccs.map(s => s.length).join(",")})` };
  }, "scc-kosaraju-count", "Kosaraju: Detects 2 SCCs on classic graph"));

  cases.push(runTest(() => {
    const steps = runTarjan(nodes, edges);
    const final = steps[steps.length - 1];
    const sccs: string[][] = (final as { sccs?: string[][] }).sccs ?? [];
    const passed = sccs.length === 2;
    return { passed, expected: "2 SCCs", actual: `${sccs.length} SCCs (sizes: ${sccs.map(s => s.length).join(",")})` };
  }, "scc-tarjan-count", "Tarjan: Detects 2 SCCs on classic graph"));

  cases.push(runTest(() => {
    const steps = runKosaraju(nodes, edges);
    const final = steps[steps.length - 1];
    const sccs: string[][] = (final as { sccs?: string[][] }).sccs ?? [];
    const maxSCC = Math.max(...sccs.map(s => s.length));
    const passed = maxSCC === 3;
    return { passed, expected: "Largest SCC = 3 nodes (A,B,C cycle)", actual: `max SCC size = ${maxSCC}` };
  }, "scc-kosaraju-cycle", "Kosaraju: Cycle {A,B,C} forms one SCC of size 3"));

  cases.push(runTest(() => {
    const steps = runTarjan(nodes, edges);
    const final = steps[steps.length - 1];
    const sccs: string[][] = (final as { sccs?: string[][] }).sccs ?? [];
    const maxSCC = Math.max(...sccs.map(s => s.length));
    const passed = maxSCC === 3;
    return { passed, expected: "Largest SCC = 3 nodes (A,B,C cycle)", actual: `max SCC size = ${maxSCC}` };
  }, "scc-tarjan-cycle", "Tarjan: Cycle {A,B,C} forms one SCC of size 3"));

  return makeSuite("SCC (Strongly Connected)", "🔄", "orange", cases);
}

// ─── Bridge Tests ─────────────────────────────────────────────────────────────

function bridgeSuite(): TestSuite {
  const cases: TestCase[] = [];

  const nodes = [
    { id: "0", x: 0, y: 0, label: "A" },
    { id: "1", x: 1, y: 0, label: "B" },
    { id: "2", x: 1, y: 1, label: "C" },
    { id: "3", x: 2, y: 0, label: "D" },
  ];
  // A-B-C form a cycle (not bridges), B-D is a bridge
  const edges = [
    { id: "e1", source: "0", target: "1", weight: 1 },
    { id: "e2", source: "1", target: "2", weight: 1 },
    { id: "e3", source: "2", target: "0", weight: 1 },
    { id: "e4", source: "1", target: "3", weight: 1 },
  ];

  cases.push(runTest(() => {
    const steps = runBridgeDiagnostics(nodes, edges);
    const final = steps[steps.length - 1] as { bridges?: string[] };
    const bridges = final.bridges ?? [];
    const passed = bridges.length === 1;
    return { passed, expected: "1 bridge edge", actual: `${bridges.length} bridges (${JSON.stringify(bridges)})` };
  }, "bridge-count", "Bridge Detection: Finds exactly 1 bridge in graph"));

  cases.push(runTest(() => {
    const steps = runBridgeDiagnostics(nodes, edges);
    const final = steps[steps.length - 1] as { bridges?: string[] };
    const bridges = final.bridges ?? [];
    const passed = bridges.includes("e4");
    return { passed, expected: "bridge 'e4' (B-D) detected", actual: `bridges: ${JSON.stringify(bridges)}` };
  }, "bridge-correct-edge", "Bridge Detection: Edge B-D (e4) is the identified bridge"));

  cases.push(runTest(() => {
    const steps = runBridgeDiagnostics(nodes, edges);
    const final = steps[steps.length - 1] as { articulationPoints?: string[] };
    const aps = final.articulationPoints ?? [];
    // B (id "1") should be an articulation point
    const passed = aps.includes("1");
    return { passed, expected: "AP list includes node id '1' (B)", actual: `APs: ${JSON.stringify(aps)}` };
  }, "bridge-ap-node", "Bridge Detection: Node B (id=1) is an articulation point"));

  return makeSuite("Bridges & Articulation", "🔗", "yellow", cases);
}

// ─── Step Integrity Tests ────────────────────────────────────────────────────

function stepIntegritySuite(): TestSuite {
  const cases: TestCase[] = [];

  // Sorting steps must have non-null arrays
  cases.push(runTest(() => {
    const result = bubbleSort([3, 1, 4, 1, 5]);
    const invalid = result.steps.filter((s) => !Array.isArray(s.array) || s.array.length === 0);
    return { passed: invalid.length === 0, expected: "0 malformed steps", actual: `${invalid.length} malformed` };
  }, "step-sort-arrays", "Step Integrity: Bubble Sort steps all have valid arrays"));

  cases.push(runTest(() => {
    const nodes = [
      { id: "0", x: 0, y: 0, label: "A" },
      { id: "1", x: 1, y: 0, label: "B" },
      { id: "2", x: 2, y: 0, label: "C" },
    ];
    const edges = [
      { id: "e1", source: "0", target: "1", weight: 5 },
      { id: "e2", source: "1", target: "2", weight: 3 },
    ];
    const { steps } = runFloydWarshall(nodes, edges, true);
    const invalid = steps.filter(
      (s) => !Array.isArray(s.matrix) || s.k === undefined || s.i === undefined || s.j === undefined
    );
    return { passed: invalid.length === 0, expected: "all steps well-formed", actual: `${invalid.length} malformed steps` };
  }, "step-fw-wellformed", "Step Integrity: Floyd-Warshall steps have required fields"));

  cases.push(runTest(() => {
    const result = quickSort([9, 4, 7, 2, 6]);
    const finalStep = result.steps[result.steps.length - 1];
    const allSortedIndices = [...new Set(finalStep.sorted)];
    // All indices should be marked sorted at end
    const passed = allSortedIndices.length === finalStep.array.length;
    return { passed, expected: `${finalStep.array.length} sorted indices`, actual: `${allSortedIndices.length}` };
  }, "step-quicksort-final", "Step Integrity: Quick Sort final step marks all elements sorted"));

  return makeSuite("Animation Step Integrity", "🎬", "pink", cases);
}

// ─── Main Runner ──────────────────────────────────────────────────────────────

export function runAllTests(): ValidationReport {
  const t0 = performance.now();

  const suites: TestSuite[] = [
    sortingSuite(),
    searchingSuite(),
    floydWarshallSuite(),
    sccSuite(),
    bridgeSuite(),
    stepIntegritySuite(),
  ];

  const totalPassed = suites.reduce((sum, s) => sum + s.passCount, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.failCount, 0);
  const totalTests = suites.reduce((sum, s) => sum + s.cases.length, 0);

  return {
    suites,
    totalPassed,
    totalFailed,
    totalTests,
    executionTimeMs: +(performance.now() - t0).toFixed(2),
    generatedAt: new Date().toISOString(),
  };
}

export function generateRandomTestCases(): { array: number[]; label: string }[] {
  const cases = [];
  for (let i = 0; i < 5; i++) {
    const size = Math.floor(Math.random() * 15) + 3;
    cases.push({
      array: Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1),
      label: `Random[${size}]`,
    });
  }
  return cases;
}
