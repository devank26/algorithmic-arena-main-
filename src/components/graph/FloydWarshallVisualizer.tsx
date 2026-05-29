import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Plus, Trash2, Move, Navigation,
  Volume2, VolumeX, Code2, Radio, CheckCircle, FastForward,
  TableProperties, Component, Route, XCircle, Calculator,
  Info, Shuffle, ArrowLeftRight, ArrowRight, Ruler, Pencil, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FWNode, FWEdge, FWStep, runFloydWarshall, FW_PSEUDOCODE, reconstructPath } from "@/lib/floyd-warshall";
import { NODE_FILL, NODE_STROKE, NODE_TEXT, NODE_GLOW, EDGE_COLOR } from "@/lib/graph-colors";

type Tool = "select" | "add_node" | "add_edge" | "erase";
type TableMode = "distance" | "next";
type UnitMode = "none" | "km" | "mi";

const MI_PER_KM = 0.621371;

const INIT_NODES: FWNode[] = [
  { id: "0", x: 150, y: 150, label: "A" },
  { id: "1", x: 400, y: 120, label: "B" },
  { id: "2", x: 250, y: 300, label: "C" },
  { id: "3", x: 500, y: 350, label: "D" },
];
const INIT_EDGES: FWEdge[] = [
  { id: "e1", source: "0", target: "1", weight: 3 },
  { id: "e2", source: "1", target: "2", weight: 1 },
  { id: "e3", source: "0", target: "2", weight: 8 },
  { id: "e4", source: "2", target: "3", weight: 2 },
  { id: "e5", source: "3", target: "0", weight: 5 },
];

function weightToColor(w: number, maxW: number): string {
  const t = Math.min(w / Math.max(maxW, 1), 1);
  const lightness = Math.round(70 - t * 45); // 70% → 25%
  return `hsl(195, 90%, ${lightness}%)`;
}

function displayWeight(w: number, unit: UnitMode): string {
  if (unit === "km") return `${w} km`;
  if (unit === "mi") return `${(w * MI_PER_KM).toFixed(1)} mi`;
  return String(w);
}

export function FloydWarshallVisualizer() {
  const [nodes, setNodes] = useState<FWNode[]>(INIT_NODES);
  const [edges, setEdges] = useState<FWEdge[]>(INIT_EDGES);
  const [tool, setTool] = useState<Tool>("select");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [tableMode, setTableMode] = useState<TableMode>("distance");
  const [isDirected, setIsDirected] = useState(true);
  const [unitMode, setUnitMode] = useState<UnitMode>("none");
  const [showRandGen, setShowRandGen] = useState(false);
  const [randNodeCount, setRandNodeCount] = useState(5);
  const [randWMin, setRandWMin] = useState(1);
  const [randWMax, setRandWMax] = useState(15);
  const [randDirected, setRandDirected] = useState(true);
  const [graphChangeMsg, setGraphChangeMsg] = useState<string | null>(null);

  // Simulation state
  const [steps, setSteps] = useState<FWStep[]>([]);
  const [initialMatrix, setInitialMatrix] = useState<number[][]>([]);
  const [initialNext, setInitialNext] = useState<number[][]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);

  // Edit state
  const [edgeStart, setEdgeStart] = useState<string | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editingWeight, setEditingWeight] = useState("");

  // Path reconstruction
  const [reconSource, setReconSource] = useState("");
  const [reconTarget, setReconTarget] = useState("");
  const [tracedRoute, setTracedRoute] = useState<string[]>([]);
  const [tracedCost, setTracedCost] = useState<number>(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const maxWeight = Math.max(...edges.map((e) => e.weight), 1);

  // Focus the inline input when editing starts
  useEffect(() => {
    if (editingEdgeId && editInputRef.current) editInputRef.current.focus();
  }, [editingEdgeId]);

  // Playback loop
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      const delay = Math.max(50, 3000 - speed * 29.5);
      intervalRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= steps.length - 1) { setIsPlaying(false); return steps.length - 1; }
          return prev + 1;
        });
      }, delay);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, steps.length]);

  // Voice
  useEffect(() => {
    if (voiceEnabled && steps.length > 0 && isPlaying) {
      const s = steps[stepIndex];
      if (s?.updated && s.explanation) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(s.explanation.replace(/AI:/g, ""));
        u.rate = 1.3;
        window.speechSynthesis.speak(u);
      }
    }
  }, [stepIndex, voiceEnabled, steps, isPlaying]);

  // Change notification timer
  useEffect(() => {
    if (!graphChangeMsg) return;
    const t = setTimeout(() => setGraphChangeMsg(null), 3500);
    return () => clearTimeout(t);
  }, [graphChangeMsg]);

  // ── Graph edit helpers ─────────────────────────────────────

  const notifyChange = (msg: string) => setGraphChangeMsg(msg);

  const commitEdgeWeight = (edgeId: string) => {
    const raw = editingWeight.trim();
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      const old = edges.find((e) => e.id === edgeId)?.weight;
      setEdges((prev) => prev.map((e) => e.id === edgeId ? { ...e, weight: parsed } : e));
      notifyChange(`Distance changed from ${old} to ${parsed}${unitMode !== "none" ? ` ${unitMode}` : ""}. Recalculate to see updated paths.`);
    }
    setEditingEdgeId(null);
    setEditingWeight("");
  };

  const handleSVGClick = (e: React.MouseEvent) => {
    if (steps.length > 0) return;
    if (tool === "add_node" && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now().toString();
      const label = String.fromCharCode(65 + (nodes.length % 26));
      setNodes((prev) => [...prev, { id, x, y, label }]);
      notifyChange(`Node ${label} added.`);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (steps.length > 0) return;
    if (tool === "erase") {
      const label = nodes.find((n) => n.id === id)?.label ?? id;
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((ed) => ed.source !== id && ed.target !== id));
      notifyChange(`Node ${label} and its edges removed.`);
    } else if (tool === "add_edge") {
      if (!edgeStart) { setEdgeStart(id); }
      else {
        if (edgeStart !== id) {
          const weightStr = window.prompt("Enter edge weight / distance:", "5");
          const weight = parseFloat(weightStr ?? "X");
          if (!isNaN(weight) && weight >= 0) {
            const duplicate = edges.find((ed) => ed.source === edgeStart && ed.target === id);
            if (duplicate) {
              setEdges((prev) => prev.map((ed) => ed.id === duplicate.id ? { ...ed, weight } : ed));
              notifyChange(`Edge weight updated to ${weight}.`);
            } else {
              const srcLabel = nodes.find((n) => n.id === edgeStart)?.label ?? "";
              const tgtLabel = nodes.find((n) => n.id === id)?.label ?? "";
              const newId = Math.random().toString(36).substring(2, 9);
              setEdges((prev) => [...prev, { id: newId, source: edgeStart, target: id, weight }]);
              notifyChange(`Edge ${srcLabel}→${tgtLabel} added (weight ${weight}).`);
            }
          }
        }
        setEdgeStart(null);
      }
    }
  };

  const handleEdgeWeightClick = (e: React.MouseEvent, edgeId: string, currentWeight: number) => {
    e.stopPropagation();
    if (steps.length > 0 || tool === "erase") return;
    setEditingEdgeId(edgeId);
    setEditingWeight(String(currentWeight));
  };


  const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    if (steps.length > 0) return;
    if (tool === "erase") setEdges((prev) => prev.filter((ed) => ed.id !== edgeId));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (dragNode && tool === "select") {
      setNodes((prev) => prev.map((n) => n.id === dragNode ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n));
    }
  };

  // ── Random graph generator ─────────────────────────────────

  const generateRandom = () => {
    const count = randNodeCount;
    const w = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const cx = 300, cy = 220, r = 160;
    const newNodes: FWNode[] = Array.from({ length: count }, (_, i) => ({
      id: String(i),
      x: cx + r * Math.cos((2 * Math.PI * i) / count),
      y: cy + r * Math.sin((2 * Math.PI * i) / count),
      label: labels[i],
    }));
    const newEdges: FWEdge[] = [];
    // Ensure connectivity: ring
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      newEdges.push({ id: `r${i}`, source: String(i), target: String(j), weight: w(randWMin, randWMax) });
    }
    // Add some random extra edges
    const extras = Math.floor(count * 0.8);
    for (let k = 0; k < extras; k++) {
      const u = Math.floor(Math.random() * count);
      const v = Math.floor(Math.random() * count);
      if (u !== v && !newEdges.find((e) => e.source === String(u) && e.target === String(v))) {
        newEdges.push({ id: `rx${k}`, source: String(u), target: String(v), weight: w(randWMin, randWMax) });
      }
    }
    setNodes(newNodes);
    setEdges(newEdges);
    setIsDirected(randDirected);
    setSteps([]); setStepIndex(0); setTracedRoute([]);
    setShowRandGen(false);
    notifyChange(`Random graph generated: ${count} nodes, ${newEdges.length} edges.`);
  };

  // ── Simulation controls ────────────────────────────────────

  const runSimulation = () => {
    window.speechSynthesis.cancel();
    if (nodes.length > 15) { alert("Max 15 nodes for clear visualization."); return; }
    const result = runFloydWarshall(nodes, edges, isDirected);
    setSteps(result.steps); setInitialMatrix(result.initialMatrix);
    setInitialNext(result.initialNext); setStepIndex(0); setIsPlaying(true);
    setTracedRoute([]);
  };

  const resetSimulation = () => {
    setIsPlaying(false); setSteps([]); setStepIndex(0);
    setTracedRoute([]); setReconSource(""); setReconTarget("");
    window.speechSynthesis.cancel();
  };

  const jumpToNextLayer = () => {
    if (!steps.length) return;
    const currK = steps[stepIndex].k;
    const idx = steps.findIndex((s, i) => i > stepIndex && s.k === currK + 1 && s.i === 0 && s.j === 0);
    setStepIndex(idx !== -1 ? idx : steps.length - 1);
  };

  const constructPath = () => {
    if (!steps.length || !reconSource || !reconTarget) return;
    const last = steps[steps.length - 1];
    const u = nodes.findIndex((n) => n.id === reconSource);
    const v = nodes.findIndex((n) => n.id === reconTarget);
    const path = reconstructPath(last.nextMatrix, last.matrix, u, v);
    if (!path) { setTracedRoute([]); setTracedCost(Infinity); return; }
    setTracedCost(last.matrix[u][v]);
    setTracedRoute(path.map((idx) => nodes[idx].id));
  };

  const currentStep = steps.length > 0 ? steps[stepIndex] : null;
  const isFinished = steps.length > 0 && stepIndex === steps.length - 1;
  const activeMatrix = currentStep?.matrix ?? (initialMatrix.length ? initialMatrix : null);
  const activeNext = currentStep?.nextMatrix ?? (initialNext.length ? initialNext : null);

  // Midpoint helper
  const mid = (ed: FWEdge) => {
    const src = nodes.find((n) => n.id === ed.source);
    const tgt = nodes.find((n) => n.id === ed.target);
    if (!src || !tgt) return { x: 0, y: 0 };
    return { x: (src.x + tgt.x) / 2, y: (src.y + tgt.y) / 2 };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-display font-bold neon-text-cyan flex items-center gap-2">
              <Component className="h-5 w-5" /> Active Routing System (Floyd-Warshall)
            </h2>
            <span className="text-[10px] uppercase font-bold text-black bg-neon-cyan px-2 py-0.5 rounded">Premium</span>
            
            {/* Random generator */}
            {steps.length === 0 && (
              <div className="relative ml-auto xl:ml-4">
                <Button onClick={() => setShowRandGen(!showRandGen)} variant="outline" size="sm" className="text-xs gap-1 border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10">
                  <Shuffle className="h-3.5 w-3.5" /> Randomize Topology
                </Button>
                <AnimatePresence>
                  {showRandGen && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 mt-2 z-50 glass-panel p-4 w-64 border border-border/70 shadow-2xl rounded-xl space-y-3">
                      <h4 className="font-display text-[11px] uppercase tracking-widest text-neon-cyan font-bold">Random Graph Config</h4>
                      <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Nodes: {randNodeCount}</label>
                        <Slider value={[randNodeCount]} onValueChange={([v]) => setRandNodeCount(v)} min={2} max={10} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Min Weight</label>
                          <input type="number" value={randWMin} onChange={(e) => setRandWMin(+e.target.value)}
                            className="w-full bg-background border border-border text-foreground text-xs px-2 py-1 rounded mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Max Weight</label>
                          <input type="number" value={randWMax} onChange={(e) => setRandWMax(+e.target.value)}
                            className="w-full bg-background border border-border text-foreground text-xs px-2 py-1 rounded mt-1" />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={randDirected} onChange={(e) => setRandDirected(e.target.checked)} className="rounded" />
                        Directed graph
                      </label>
                      <Button onClick={generateRandom} className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 text-xs mt-2">
                        <Shuffle className="h-3.5 w-3.5 mr-1" /> Generate Graph
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">All-Pairs Shortest Path · O(V³) · Click edge weights to edit · {isDirected ? "Directed" : "Undirected"} Mode</p>
        </div>

        <div className="glass-panel p-2 flex flex-wrap items-center gap-2">
          {steps.length === 0 ? (
            <>
              {/* Graph mode toggles */}
              <button
                onClick={() => { setIsDirected(!isDirected); notifyChange(`Switched to ${isDirected ? "Undirected" : "Directed"} mode.`); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${isDirected ? "bg-neon-yellow/20 border-neon-yellow/40 text-neon-yellow" : "bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan"}`}
                title="Toggle directed/undirected"
              >
                {isDirected ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeftRight className="h-3.5 w-3.5" />}
                {isDirected ? "Directed" : "Undirected"}
              </button>

              {/* Unit mode */}
              <div className="flex text-xs bg-muted/30 border border-border rounded overflow-hidden">
                {(["none", "km", "mi"] as UnitMode[]).map((u) => (
                  <button key={u} onClick={() => setUnitMode(u)}
                    className={`px-2.5 py-1.5 font-bold transition-colors flex items-center gap-1 ${unitMode === u ? "bg-neon-purple/20 text-neon-purple" : "text-muted-foreground hover:bg-muted/50"}`}>
                    {u === "none" ? <><Ruler className="h-3 w-3" /> Raw</> : u.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-border" />

              {/* Drawing tools */}
              <div className="flex bg-muted/30 p-1 rounded-md border border-border">
                {[
                  { id: "select", icon: Move, bg: "bg-blue-500/20 text-blue-400" },
                  { id: "add_node", icon: Plus, bg: "bg-green-500/20 text-green-400" },
                  { id: "add_edge", icon: Navigation, bg: "bg-yellow-500/20 text-yellow-400" },
                  { id: "erase", icon: Trash2, bg: "bg-red-500/20 text-red-400" },
                ].map((t) => (
                  <button key={t.id} onClick={() => { setTool(t.id as Tool); setEdgeStart(null); }}
                    className={`p-2 rounded transition-colors ${tool === t.id ? t.bg : "text-muted-foreground hover:bg-muted"}`}>
                    <t.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <Button onClick={runSimulation} className="bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30 text-xs">
                <Play className="h-3.5 w-3.5 mr-1" /> Deploy Tracing
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline" size="sm">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button onClick={resetSimulation} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button onClick={jumpToNextLayer} size="sm" className="bg-neon-purple text-black hover:bg-neon-purple/80">
                <FastForward className="h-4 w-4" /> Next k-Layer
              </Button>
              <div className="flex items-center gap-2 min-w-[100px]">
                <span className="text-[10px] font-mono text-muted-foreground">SPD</span>
                <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={1} max={100} className="flex-1" />
              </div>
            </>
          )}
          <div className="h-5 w-px bg-border mx-1" />
          <Button onClick={() => setVoiceEnabled(!voiceEnabled)} size="sm" variant="outline"
            className={voiceEnabled ? "border-neon-yellow text-neon-yellow" : "text-muted-foreground"}>
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
          </Button>
        </div>
      </div>

      {/* Weight change notification banner */}
      <AnimatePresence>
        {graphChangeMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-panel px-4 py-2.5 border border-neon-yellow/40 bg-neon-yellow/5 flex items-center gap-3 rounded-lg">
            <Pencil className="h-4 w-4 text-neon-yellow shrink-0" />
            <p className="text-xs font-mono text-neon-yellow font-medium">{graphChangeMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      {steps.length === 0 && (
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Click edge weight to edit inline</span>
          <span className="flex items-center gap-1"><span className="w-6 h-1.5 rounded" style={{ background: "hsl(195,90%,70%)" }} /> Low weight</span>
          <span className="flex items-center gap-1"><span className="w-6 h-1.5 rounded" style={{ background: "hsl(195,90%,25%)" }} /> High weight</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Graph Canvas */}
        <div className="glass-panel p-2 min-h-[450px] relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 to-transparent border border-border/50"
          onClick={() => { if (showRandGen) setShowRandGen(false); }}>
          
          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-1.5 rounded-b-lg shadow-lg flex items-center gap-2 backdrop-blur-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Reset Simulation to Edit Graph</span>
              </motion.div>
            )}
          </AnimatePresence>

          <svg ref={svgRef} onClick={handleSVGClick}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragNode(null)}
            className="w-full h-full min-h-[450px] cursor-crosshair touch-none select-none">
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_COLOR.default} opacity={0.5} />
              </marker>
              <marker id="arr-act" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_COLOR.active} />
              </marker>
              <marker id="arr-trace" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_COLOR.trace} />
              </marker>
            </defs>

            {edges.map((ed) => {
              const src = nodes.find((n) => n.id === ed.source);
              const tgt = nodes.find((n) => n.id === ed.target);
              if (!src || !tgt) return null;
              const mx = (src.x + tgt.x) / 2;
              const my = (src.y + tgt.y) / 2;

              let isActive = false;
              let isTargetEdge = false;
              if (currentStep && !isFinished) {
                const si = nodes.findIndex((n) => n.id === ed.source);
                const ti = nodes.findIndex((n) => n.id === ed.target);
                isActive = (si === currentStep.i && ti === currentStep.k) || (si === currentStep.k && ti === currentStep.j);
                if (!isDirected && !isActive) {
                   isActive = (ti === currentStep.i && si === currentStep.k) || (ti === currentStep.k && si === currentStep.j);
                }
                isTargetEdge = (si === currentStep.i && ti === currentStep.j) || (!isDirected && ti === currentStep.i && si === currentStep.j);
              }
              const isTrace = isFinished && tracedRoute.length > 0 && tracedRoute.some((id, idx) => idx < tracedRoute.length - 1 && id === ed.source && tracedRoute[idx + 1] === ed.target);

              // Improved Edge State Rendering Engine
              let edgeColor = weightToColor(ed.weight, maxWeight);
              let edgeW = 2;
              let edgeOpacity = 0.45;
              let dasharray = "none";

              if (isTrace) {
                edgeColor = EDGE_COLOR.trace;
                edgeW = 6;
                edgeOpacity = 1;
              } else if (isActive) {
                edgeColor = EDGE_COLOR.active; // yellow/amber
                edgeW = 4;
                edgeOpacity = 1;
              } else if (isTargetEdge) {
                edgeColor = currentStep?.updated ? EDGE_COLOR.trace : EDGE_COLOR.rejected;
                edgeW = currentStep?.updated ? 5 : 3;
                edgeOpacity = 1;
                dasharray = currentStep?.updated ? "none" : "6 4";
              }

              const markerEnd = isDirected ? (isActive ? "url(#arr-act)" : isTrace || (isTargetEdge && currentStep?.updated) ? "url(#arr-trace)" : "url(#arr)") : "none";
              const markerStart = "none";

              const isEditing = editingEdgeId === ed.id;
              const dispW = displayWeight(ed.weight, unitMode);

              return (
                <g key={ed.id} onClick={(e) => handleEdgeClick(e, ed.id)}>
                  <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    strokeWidth={edgeW} stroke={edgeColor} strokeOpacity={edgeOpacity} strokeDasharray={dasharray}
                    markerEnd={markerEnd} markerStart={markerStart}
                    className="transition-all duration-300" />
                  {/* Midpoint weight label */}
                  {isTargetEdge && currentStep?.updated && (
                     <circle cx={mx} cy={my} r={14} fill="none" stroke={EDGE_COLOR.trace} strokeWidth={2} className="animate-ping" />
                  )}
                  {!isEditing ? (
                    <g onClick={(e) => handleEdgeWeightClick(e, ed.id, ed.weight)} className="cursor-pointer group">
                      <rect x={mx - 14} y={my - 11} width={28} height={22} rx={5}
                        fill="hsl(var(--background))" stroke={edgeColor} strokeWidth={1.5} className="group-hover:stroke-neon-yellow transition-colors" />
                      <text x={mx} y={my + 1} textAnchor="middle" dominantBaseline="central"
                        fill={isActive ? "hsl(var(--neon-cyan))" : isTrace ? "hsl(var(--neon-green))" : "hsl(var(--foreground))"}
                        fontSize={9} fontFamily="monospace" fontWeight="bold">
                        {dispW}
                      </text>
                      <text x={mx + 15} y={my - 10} fontSize={7} fill="hsl(var(--muted-foreground))" opacity={0.6} fontFamily="monospace">✎</text>
                    </g>
                  ) : (
                    <foreignObject x={mx - 28} y={my - 14} width={56} height={28}>
                      <input ref={editInputRef} type="number" value={editingWeight}
                        onChange={(e) => setEditingWeight(e.target.value)}
                        onBlur={() => commitEdgeWeight(ed.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdgeWeight(ed.id); if (e.key === "Escape") { setEditingEdgeId(null); setEditingWeight(""); } }}
                        className="w-full h-full text-center text-xs font-mono font-bold bg-background border-2 border-neon-yellow text-neon-yellow rounded focus:outline-none px-1"
                        style={{ fontSize: "11px" }} />
                    </foreignObject>
                  )}
                </g>
              );
            })}

            {/* Pending edge line */}
            {tool === "add_edge" && edgeStart && (
              <line x1={nodes.find((n) => n.id === edgeStart)?.x ?? 0}
                y1={nodes.find((n) => n.id === edgeStart)?.y ?? 0}
                x2={mousePos.x} y2={mousePos.y}
                stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={2} />
            )}

            {/* Nodes */}
            {nodes.map((n, i) => {
              let fill = NODE_FILL.default;
              let stroke = NODE_STROKE.default;
              let textColor = NODE_TEXT.default;
              let glow = NODE_GLOW.default;

              if (currentStep && !isFinished) {
                if (i === currentStep.k) { 
                  fill = NODE_FILL.frontier; 
                  stroke = NODE_STROKE.frontier; 
                  textColor = "white"; 
                  glow = NODE_GLOW.frontier; 
                } else if (i === currentStep.i) { 
                  fill = NODE_FILL.current; 
                  stroke = NODE_STROKE.current; 
                  textColor = "black"; 
                  glow = NODE_GLOW.current;
                } else if (i === currentStep.j) { 
                  fill = NODE_FILL.target; 
                  stroke = NODE_STROKE.target; 
                  textColor = "white"; 
                  glow = NODE_GLOW.target;
                }
              }
              if (isFinished && tracedRoute.includes(n.id)) {
                fill = NODE_FILL.finalPath; 
                stroke = NODE_STROKE.finalPath; 
                textColor = "black";
                glow = NODE_GLOW.finalPath;
              }
              if (edgeStart === n.id) {
                stroke = "#FBBF24"; // neon yellow feedback
                glow = "drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))";
              }
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`}
                  onClick={(e) => handleNodeClick(e, n.id)}
                  onPointerDown={() => { if (tool === "select" && !steps.length) setDragNode(n.id); }}
                  className="cursor-pointer" style={{ filter: glow }}>
                  <circle r={18} fill={fill} stroke={stroke} strokeWidth={edgeStart === n.id ? 4 : 2} className="transition-all duration-300" />
                  <text textAnchor="middle" dominantBaseline="central" fill={textColor}
                    fontSize={12} fontWeight="bold" fontFamily="monospace">{n.label}</text>
                </g>
              );
            })}
          </svg>

          {/* Legend overlay */}
          <div className="absolute top-2 right-2 glass-panel p-2 rounded border border-border/50 space-y-1 bg-background/80 backdrop-blur-sm z-10">
            {[["Source (i)", "bg-neon-yellow"], ["Bridge (k)", "bg-neon-purple"], ["Target (j)", "bg-neon-pink"]].map(([label, col]) => (
              <span key={label} className="text-[9px] font-mono text-foreground flex items-center gap-1 justify-end font-bold">
                {label} <span className={`w-2.5 h-2.5 rounded-full ${col} inline-block shadow-[0_0_5px_currentColor]`} />
              </span>
            ))}
            <div className="h-px bg-border my-1" />
            <span className="text-[9px] font-mono text-foreground flex items-center gap-1 justify-end font-bold">
              Intermediate via k <span className="w-4 h-1 bg-neon-yellow inline-block rounded" />
            </span>
            <span className="text-[9px] font-mono text-foreground flex items-center gap-1 justify-end font-bold">
              Updated path i→j <span className="w-4 h-1 bg-neon-green inline-block rounded shadow-[0_0_8px_var(--neon-green)]" />
            </span>
          </div>
        </div>

        {/* Matrix Panel */}
        <div className="glass-panel overflow-hidden flex flex-col">
          <div className="flex border-b border-border/60 bg-muted/20">
            {([["distance", TableProperties, "neon-cyan", "Distance [i][j]"], ["next", Route, "neon-purple", "Parent Next[i][j]"]] as const).map(([mode, Icon, col, label]) => (
              <button key={mode} onClick={() => setTableMode(mode as TableMode)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${tableMode === mode ? `border-b-2 border-${col} text-${col} bg-${col}/5` : "text-muted-foreground hover:bg-muted/40"}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
          <div className="p-4 flex-1 overflow-auto">
            {tableMode === "distance" ? (
              activeMatrix ? (
                <div className="overflow-auto max-h-[380px] border border-border/50 rounded">
                  <table className="w-full text-center border-collapse text-xs font-mono">
                    <thead className="sticky top-0">
                      <tr>
                        <th className="p-2 border border-border bg-muted/80 text-[10px]">D</th>
                        {nodes.map((n, ci) => <th key={n.id} className={`p-2 border border-border/80 ${currentStep && ci === currentStep.j && !isFinished ? "bg-neon-pink text-black" : "bg-muted/60 text-neon-cyan"}`}>{n.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {activeMatrix.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td className={`p-2 border border-border/80 font-bold select-none ${currentStep && rIdx === currentStep.i && !isFinished ? "bg-neon-yellow text-black" : "bg-muted/60 text-neon-yellow"}`}>{nodes[rIdx]?.label}</td>
                          {row.map((val, cIdx) => {
                            const isTarget = currentStep && !isFinished && rIdx === currentStep.i && cIdx === currentStep.j;
                            const isCross = currentStep && !isFinished && (rIdx === currentStep.i || cIdx === currentStep.j) && !isTarget;
                            return (
                              <td key={cIdx} className={`p-2 border border-border/40 transition-all duration-300 ${isTarget ? (currentStep.updated ? "bg-neon-green/30 text-neon-green font-bold text-sm" : "bg-muted text-white") : isCross ? "bg-muted/10" : "bg-background text-foreground"}`}>
                                {val === Infinity ? "∞" : unitMode === "mi" ? (val * MI_PER_KM).toFixed(1) : val}{val !== Infinity && unitMode !== "none" ? ` ${unitMode}` : ""}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-muted-foreground/50 text-sm italic text-center py-12">Run simulation to see the distance matrix.</p>
            ) : (
              activeNext ? (
                <div className="overflow-auto max-h-[380px] border border-border/50 rounded">
                  <table className="w-full text-center border-collapse text-xs font-mono">
                    <thead className="sticky top-0">
                      <tr>
                        <th className="p-2 border border-border bg-muted/80 text-[10px]">N</th>
                        {nodes.map((n) => <th key={n.id} className="p-2 border border-border/80 bg-muted/60 text-neon-purple">{n.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {activeNext.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td className="p-2 border border-border/80 bg-muted/60 font-bold text-neon-purple select-none">{nodes[rIdx]?.label}</td>
                          {row.map((val, cIdx) => {
                            const updated = currentStep && !isFinished && currentStep.updated && rIdx === currentStep.i && cIdx === currentStep.j;
                            return (
                              <td key={cIdx} className={`p-2 border border-border/40 transition-all duration-300 ${updated ? "bg-neon-purple/30 text-neon-purple font-bold" : "bg-background text-foreground"}`}>
                                {val === -1 ? "∅" : nodes[val]?.label ?? "?"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-muted-foreground/50 text-sm italic text-center py-12">Run simulation to see the routing matrix.</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Decision Calculus */}
      <AnimatePresence>
        {currentStep && !isFinished && (
          <motion.div key="dec" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="glass-panel border border-neon-purple/30 bg-neon-purple/5">
            <div className="flex flex-col md:flex-row gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
              <div className="px-5 py-3 flex items-center gap-3 shrink-0">
                <Calculator className="w-5 h-5 text-neon-purple" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neon-purple">Live Decision Calculus</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    k=<span className="text-neon-purple font-bold">{nodes[currentStep.k]?.label}</span> &nbsp;|&nbsp;
                    i=<span className="text-neon-yellow font-bold">{nodes[currentStep.i]?.label}</span> &nbsp;|&nbsp;
                    j=<span className="text-neon-pink font-bold">{nodes[currentStep.j]?.label}</span>
                  </p>
                </div>
              </div>
              <div className="px-5 py-3 flex flex-col justify-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current dist[i][j]</span>
                <span className="font-mono text-lg font-bold">{currentStep.oldVal === Infinity ? "∞" : displayWeight(currentStep.oldVal, unitMode)}</span>
              </div>
              <div className="px-5 py-3 flex flex-col justify-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Candidate via k</span>
                <span className="font-mono text-lg font-bold text-neon-cyan">
                  {currentStep.distIK === Infinity ? "∞" : currentStep.distIK} + {currentStep.distKJ === Infinity ? "∞" : currentStep.distKJ} = {currentStep.viaK === Infinity ? "∞" : currentStep.viaK}
                </span>
              </div>
              <div className="px-5 py-3 flex items-center gap-3 ml-auto">
                <motion.div key={String(currentStep.updated)} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border ${currentStep.updated ? "bg-neon-green/15 border-neon-green/40 text-neon-green" : "bg-neon-pink/10 border-neon-pink/30 text-neon-pink"}`}>
                  {currentStep.updated ? <><CheckCircle className="w-4 h-4" /> Updated: {currentStep.oldVal === Infinity ? "∞" : currentStep.oldVal} → {currentStep.viaK}</> : <><XCircle className="w-4 h-4" /> No change</>}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Path Reconstructer */}
      {isFinished && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 border-l-4 border-l-neon-green">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-neon-green uppercase tracking-widest flex items-center gap-2 mb-2">
                <Route className="w-5 h-5" /> Route Synthesis Reconstructer
              </h3>
              <p className="text-xs font-mono text-muted-foreground max-w-md">
                O(V³) complete. Select source &amp; destination to query the optimal path from the Next[i][j] parent map.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border/50 flex-wrap">
              {[["Source", reconSource, setReconSource], ["Target", reconTarget, setReconTarget]].map(([lbl, val, setter]) => (
                <div key={lbl as string} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase">{lbl as string}</span>
                  <select value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    className="bg-background border border-border text-foreground text-xs px-2 py-1 rounded">
                    <option value="">–</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>
              ))}
              <Button onClick={constructPath} disabled={!reconSource || !reconTarget}
                className="bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/40 h-8">Trace</Button>
            </div>
          </div>
          <AnimatePresence>
            {tracedRoute.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                className="bg-neon-green/5 border border-neon-green/20 p-4 rounded text-center overflow-hidden">
                <div className="flex items-center justify-center gap-2 flex-wrap text-lg font-mono font-bold text-neon-green mb-2">
                  {tracedRoute.map((id, idx) => (
                    <span key={idx} className="flex items-center gap-2">
                      <span className="bg-neon-green text-black px-2.5 py-1 rounded-sm shadow-[0_0_10px_var(--neon-green)]">
                        {nodes.find((n) => n.id === id)?.label}
                      </span>
                      {idx < tracedRoute.length - 1 && <span>→</span>}
                    </span>
                  ))}
                </div>
                <span className="text-xs uppercase font-bold text-muted-foreground">
                  Minimum Cost: <span className="text-foreground border border-border/50 bg-background px-2 py-0.5 rounded ml-1">
                    {displayWeight(tracedCost, unitMode)}
                  </span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Analytics footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-neon-yellow" /> AI Execution Analysis
          </h3>
          <div className="min-h-[60px] flex items-center bg-muted/20 rounded p-3 border border-border/50">
            <motion.p key={currentStep?.explanation ?? "empty"} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`text-sm font-mono leading-relaxed ${currentStep ? (currentStep.updated ? "text-neon-green font-bold" : "text-foreground") : "text-muted-foreground italic"}`}>
              {currentStep?.explanation ?? "Awaiting matrix deployment..."}
            </motion.p>
          </div>
        </div>
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Loop
            </h3>
            <span className="text-[9px] font-mono bg-muted/40 border border-border px-1.5 py-0.5 rounded text-muted-foreground">O(V³) | O(V²)</span>
          </div>
          <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30">
            {FW_PSEUDOCODE.map((line, i) => {
              const active = currentStep?.pseudocodeLine === i;
              return (
                <motion.div key={i} animate={{ backgroundColor: active ? "hsla(195,100%,50%,0.15)" : "transparent" }}
                  className={`px-2 py-1 rounded-sm whitespace-pre ${active ? "text-neon-cyan border-l-2 border-neon-cyan font-bold" : "text-muted-foreground/70 border-l-2 border-transparent"}`}>
                  {line}
                </motion.div>
              );
            })}
          </div>
          <div className="p-2 bg-muted/20 border border-border rounded text-[10px] text-muted-foreground/80 font-mono flex gap-2">
            <Info className="w-4 h-4 text-orange-400 shrink-0" />
            <span><strong>Note:</strong> For sparse graphs use Johnson's (O(VE log V)). For dense graphs Floyd-Warshall (O(V³)) is simpler. Negative cycles cause incorrect results.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
