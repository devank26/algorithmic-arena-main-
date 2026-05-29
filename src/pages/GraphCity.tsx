import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Play, Pause, RotateCcw, Trash2, Shuffle, MousePointer, Square, MapPin, Flag, Radio, Code2, Cone, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  createEmptyGrid,
  generateMaze,
  PATHFINDING_ALGORITHMS,
  PATHFINDING_INFO,
  type CellType,
  type PathfindingStep,
} from "@/lib/pathfinding-algorithms";
import { FloydWarshallVisualizer } from "@/components/graph/FloydWarshallVisualizer";
import { MSTVisualizer } from "@/components/graph/MSTVisualizer";
import { AdvancedGraphVisualizer } from "@/components/graph/AdvancedGraphVisualizer";
import { MaxFlowVisualizer } from "@/components/graph/MaxFlowVisualizer";
import { SCCVisualizer } from "@/components/graph/SCCVisualizer";
import { BridgeVisualizer } from "@/components/graph/BridgeVisualizer";
import { ColoringVisualizer } from "@/components/graph/ColoringVisualizer";
import { RouteMasteryVisualizer } from "@/components/graph/RouteMasteryVisualizer";

type Tool = "wall" | "traffic" | "start" | "end" | "erase";

const ROWS = 20;
const COLS_DESKTOP = 35;
const COLS_MOBILE = 16;

const cellColors: Record<CellType, string> = {
  empty: "bg-muted/30",
  wall: "bg-foreground/80 shadow-[1px_1px_2px_rgba(0,0,0,0.7)]",
  traffic: "bg-orange-500/50 border border-orange-500/80",
  start: "bg-neon-green",
  end: "bg-neon-pink",
  visited: "bg-neon-purple/40",
  path: "bg-neon-green shadow-[0_0_15px_var(--neon-green)] z-20",
  current: "bg-neon-yellow shadow-[0_0_15px_var(--neon-yellow)] z-30",
};

export default function GraphCity() {
  const [cols, setCols] = useState(COLS_DESKTOP);
  const [grid, setGrid] = useState<CellType[][]>(() => createEmptyGrid(ROWS, COLS_DESKTOP));
  const [start, setStart] = useState<[number, number]>([2, 2]);
  const [end, setEnd] = useState<[number, number]>([ROWS - 3, COLS_DESKTOP - 3]);
  const [tool, setTool] = useState<Tool>("wall");
  const [algo, setAlgo] = useState<string>("dijkstra");
  const [steps, setSteps] = useState<PathfindingStep[] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layout Mode Toggle
  const [cityMode, setCityMode] = useState<"grid" | "matrix" | "mst" | "adv" | "flow" | "scc" | "bridges" | "coloring" | "route">("grid");

  // Voice Sync
  useEffect(() => {
    if (voiceEnabled && steps && steps.length > 0) {
      const currentStep = steps[stepIndex];
      if (currentStep?.explanation) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentStep.explanation);
        utterance.rate = 1.15;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [stepIndex, voiceEnabled, steps]);

  // Responsive cols
  useEffect(() => {
    const handleResize = () => {
      const newCols = window.innerWidth < 768 ? COLS_MOBILE : COLS_DESKTOP;
      if (newCols !== cols) {
        setCols(newCols);
        const newGrid = createEmptyGrid(ROWS, newCols);
        setGrid(newGrid);
        setStart([2, 2]);
        setEnd([ROWS - 3, newCols - 3]);
        setSteps(null);
        setStepIndex(0);
        setIsPlaying(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [cols]);

  const maxSteps = steps ? steps.length : 0;

  // Animation loop
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && steps) {
      const delay = Math.max(5, 300 - speed * 2.8);
      intervalRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return maxSteps - 1;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, maxSteps, steps]);

  const handleCellInteraction = useCallback((row: number, col: number) => {
    if (steps) return; // Don't edit during visualization
    if (row === start[0] && col === start[1]) return;
    if (row === end[0] && col === end[1]) return;

    if (tool === "start") {
      setStart([row, col]);
      setGrid((g) => { const ng = g.map(r => [...r]); ng[row][col] = "empty"; return ng; });
    } else if (tool === "end") {
      setEnd([row, col]);
      setGrid((g) => { const ng = g.map(r => [...r]); ng[row][col] = "empty"; return ng; });
    } else if (tool === "wall") {
      setGrid((g) => { const ng = g.map(r => [...r]); ng[row][col] = "wall"; return ng; });
    } else if (tool === "traffic") {
      setGrid((g) => { const ng = g.map(r => [...r]); ng[row][col] = "traffic"; return ng; });
    } else if (tool === "erase") {
      setGrid((g) => { const ng = g.map(r => [...r]); ng[row][col] = "empty"; return ng; });
    }
  }, [tool, start, end, steps]);

  const handleRun = useCallback(() => {
    const algoFn = PATHFINDING_ALGORITHMS[algo];
    const result = algoFn(grid, start, end);
    setSteps(result);
    setStepIndex(0);
    setIsPlaying(true);
  }, [algo, grid, start, end]);

  const handleClear = useCallback(() => {
    setGrid(createEmptyGrid(ROWS, cols));
    setSteps(null);
    setStepIndex(0);
    setIsPlaying(false);
  }, [cols]);

  const handleClearPath = useCallback(() => {
    setSteps(null);
    setStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleMaze = useCallback(() => {
    const maze = generateMaze(ROWS, cols, 0.3);
    maze[start[0]][start[1]] = "empty";
    maze[end[0]][end[1]] = "empty";
    setGrid(maze);
    setSteps(null);
    setStepIndex(0);
    setIsPlaying(false);
  }, [cols, start, end]);

  // Current display grid
  const displayGrid = useMemo(() => {
    if (steps && steps.length > 0) {
      const s = steps[Math.min(stepIndex, steps.length - 1)];
      return s.grid;
    }
    // Base grid with start/end
    const g = grid.map(r => [...r]);
    g[start[0]][start[1]] = "start";
    g[end[0]][end[1]] = "end";
    return g;
  }, [grid, steps, stepIndex, start, end]);

  const currentStepData = steps ? steps[Math.min(stepIndex, steps.length - 1)] : null;
  const isComplete = currentStepData?.finished ?? false;

  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: "wall", icon: Square, label: "Building (Wall)" },
    { id: "traffic", icon: Cone, label: "Traffic Condition (+5 Cost)" },
    { id: "erase", icon: MousePointer, label: "Erase" },
    { id: "start", icon: MapPin, label: "Start Location" },
    { id: "end", icon: Flag, label: "Destination" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold neon-text-cyan flex items-center gap-3">
          <GitBranch className="h-8 w-8" />
          Graph City Map
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Construct navigation environments and observe how pathfinding AI routes units from coordinates A to B. Switch nodes to compare uniform algorithms against heuristic approximations, or examine all-pairs routing via Matrix mapping.
        </p>

        <div className="mt-4 flex flex-wrap bg-muted/30 p-1.5 rounded-lg border border-border w-fit gap-1">
          <button 
            onClick={() => setCityMode("grid")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "grid" ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 border" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            GPS Navigation
          </button>
          <button 
            onClick={() => setCityMode("matrix")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "matrix" ? "bg-neon-pink/20 text-neon-pink border-neon-pink/50 border" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            Floyd-Warshall
          </button>
          <button 
            onClick={() => setCityMode("mst")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "mst" ? "bg-neon-green/20 text-neon-green border-neon-green/50 border" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            MST Zone (Prim/Kruskal)
          </button>
          <button 
            onClick={() => setCityMode("adv")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "adv" ? "bg-neon-purple/20 text-neon-purple border-neon-purple/50 border" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            Advanced Lab (Topo/BF/Johnson)
          </button>
          <button 
            onClick={() => setCityMode("flow")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "flow" ? "bg-blue-500/20 text-blue-400 border-blue-500/50 border" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            Network Flow (Max-Flow/Min-Cut)
          </button>
          <button 
            onClick={() => setCityMode("scc")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "scc" ? "bg-neon-yellow/20 text-neon-yellow border-neon-yellow/50 border" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            SCC Extraction (Kosaraju/Tarjan)
          </button>
          <button 
            onClick={() => setCityMode("bridges")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "bridges" ? "bg-red-500/20 text-red-400 border-red-500/50 border" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            Critical Diagnostics (Bridges/Points)
          </button>
          <button 
            onClick={() => setCityMode("coloring")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "coloring" ? "bg-green-500/20 text-green-400 border-green-500/50 border" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            Graph Coloring (Greedy/Backtracking)
          </button>
          <button 
            onClick={() => setCityMode("route")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${cityMode === "route" ? "bg-orange-500/20 text-orange-400 border-orange-500/50 border shadow-[0_0_10px_rgba(255,165,0,0.5)]" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            Route Mastery (Euler/Hamiltonian)
          </button>
        </div>
      </header>

      {/* Mode View Router */}
      {cityMode === "matrix" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-16">
          <FloydWarshallVisualizer />
        </motion.div>
      ) : cityMode === "mst" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-16">
          <MSTVisualizer />
        </motion.div>
      ) : cityMode === "adv" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-16">
          <AdvancedGraphVisualizer />
        </motion.div>
      ) : cityMode === "flow" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-16">
          <MaxFlowVisualizer />
        </motion.div>
      ) : cityMode === "scc" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-16">
          <SCCVisualizer />
        </motion.div>
      ) : cityMode === "bridges" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-16">
          <BridgeVisualizer />
        </motion.div>
      ) : cityMode === "coloring" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-16">
          <ColoringVisualizer />
        </motion.div>
      ) : cityMode === "route" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-16">
          <RouteMasteryVisualizer />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel p-3 flex flex-wrap gap-3 items-center mb-6"
          >
            {/* Algorithm selector */}
            <div className="flex gap-1.5">
              {Object.entries(PATHFINDING_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => { setAlgo(key); handleClearPath(); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-display font-bold tracking-wider transition-all duration-200 active:scale-95
                    ${algo === key
                      ? "bg-muted border border-neon-green/40 neon-text-green"
                      : "bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/60"
                    }`}
                >
                  {info.name}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-border hidden md:block" />

            {/* Drawing tools */}
            <div className="flex gap-1">
              {tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={`p-1.5 rounded-md transition-all duration-150 active:scale-95
                    ${tool === t.id
                      ? "bg-primary/15 border border-primary/30 text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  title={t.label}
                >
                  <t.icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-border hidden md:block" />

            {/* Actions */}
            <div className="flex gap-1.5">
              <Button
                onClick={handleRun}
                size="sm"
                disabled={isPlaying}
                className="bg-neon-green/20 border border-neon-green/40 hover:bg-neon-green/30 text-neon-green neon-glow-green text-xs font-display"
              >
                <Play className="h-3.5 w-3.5 mr-1" /> Run
              </Button>
              {steps && (
                <Button
                  onClick={() => isComplete ? handleClearPath() : setIsPlaying(!isPlaying)}
                  size="sm"
                  variant="outline"
                  className="border-muted-foreground/30 text-xs"
                >
                  {isComplete ? <RotateCcw className="h-3.5 w-3.5" /> : isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
              )}
              <Button onClick={handleMaze} size="sm" variant="outline" className="border-muted-foreground/30 text-xs" title="Random Maze">
                <Shuffle className="h-3.5 w-3.5" />
              </Button>
              <Button onClick={handleClear} size="sm" variant="outline" className="border-muted-foreground/30 text-xs" title="Clear All">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button 
                onClick={() => setVoiceEnabled(!voiceEnabled)} 
                size="sm" 
                variant="outline" 
                className={`text-xs transition-colors ml-2 ${voiceEnabled ? "border-neon-yellow text-neon-yellow bg-neon-yellow/10" : "border-muted-foreground/30"}`} 
                title="Toggle AI Voice Navigation"
              >
                {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 opacity-50" />}
              </Button>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-2 ml-auto min-w-[120px]">
              <span className="text-[10px] font-mono text-muted-foreground">SPD</span>
              <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={1} max={100} step={1} className="flex-1" />
            </div>
          </motion.div>

          {/* Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel p-2 md:p-3 overflow-x-auto"
          >
            <div
              className="grid gap-px mx-auto w-fit select-none"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              onMouseLeave={() => setIsDrawing(false)}
            >
              {displayGrid.map((row, r) =>
                row.map((cell, c) => {
                  const isStart = cell === "start";
                  const isEnd = cell === "end";
                  const isPath = cell === "path";
                  const isCurrent = cell === "current";
                  const isFrontier = !isStart && !isEnd && !isPath && !isCurrent && currentStepData?.frontier?.some(([fr, fc]) => fr === r && fc === c);

                  const key = `${r},${c}`;
                  let nodeMetricValue = null;
                  if (currentStepData?.distances?.[key] !== undefined && !isStart && !isEnd) {
                     if (currentStepData.distances[key] < 1000) nodeMetricValue = currentStepData.distances[key];
                  }
                  if (algo === 'astar' && currentStepData?.fScores?.[key] !== undefined && !isStart && !isEnd) {
                     if (currentStepData.fScores[key] < 1000) nodeMetricValue = currentStepData.fScores[key];
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`
                        relative w-4 h-4 md:w-5 md:h-5 rounded-[2px] transition-colors duration-100 cursor-pointer
                        ${isFrontier ? "bg-[#3db7cc]/40 border border-[#3db7cc] shadow-[0_0_8px_var(--neon-cyan)]" : cellColors[cell]}
                        ${isPath ? "neon-glow-green" : ""}
                        ${isCurrent ? "animate-pulse-neon" : ""}
                        ${isStart ? "neon-glow-green" : ""}
                        ${isEnd ? "neon-glow-purple" : ""}
                      `}
                      onMouseDown={() => { setIsDrawing(true); handleCellInteraction(r, c); }}
                      onMouseEnter={() => { if (isDrawing) handleCellInteraction(r, c); }}
                      onMouseUp={() => setIsDrawing(false)}
                      onTouchStart={(e) => { e.preventDefault(); handleCellInteraction(r, c); }}
                    >
                      {nodeMetricValue !== null && (
                         <span className="absolute inset-0 flex items-center justify-center text-[6px] md:text-[8px] font-mono text-white/90 font-bold leading-none pointer-events-none z-10">
                           {nodeMetricValue}
                         </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel p-4 mt-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground font-mono block mb-0.5">ALGORITHM</span>
                <span className="font-display font-bold neon-text-green">{PATHFINDING_INFO[algo].name}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block mb-0.5">COMPLEXITY</span>
                <span className="font-mono text-foreground">{PATHFINDING_INFO[algo].timeComplexity}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block mb-0.5">NODES VISITED</span>
                <span className="font-mono text-neon-purple">{currentStepData?.visited.length ?? 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block mb-0.5">PATH LENGTH</span>
                <span className="font-mono text-neon-green">
                  {isComplete ? (currentStepData?.path.length ? currentStepData.path.length : "No path") : "—"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Detailed Analysis Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 mt-6"
          >
            {/* Live Explanation Panel */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-neon-yellow" /> Live Execution Log
              </h3>
              <div className="min-h-[60px] flex items-center bg-muted/20 rounded p-3 border border-border/50">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={currentStepData?.explanation || "empty"}
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -10 }} 
                    className={`text-sm font-mono leading-relaxed ${currentStepData?.explanation ? "text-foreground" : "text-muted-foreground italic"}`}
                  >
                    {currentStepData?.explanation || "Awaiting algorithm execution..."}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Pseudocode Panel */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Logic
              </h3>
              <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30 overflow-x-auto">
                {PATHFINDING_INFO[algo].pseudocode ? (
                  PATHFINDING_INFO[algo].pseudocode!.map((line, i) => {
                    const isActive = currentStepData?.pseudocodeLine === i;
                    return (
                      <motion.div 
                        key={i} 
                        animate={{ backgroundColor: isActive ? "hsla(195, 100%, 50%, 0.15)" : "transparent" }} 
                        className={`px-2 py-1 rounded-sm transition-colors whitespace-pre ${isActive ? "text-neon-cyan border-l-2 border-neon-cyan font-bold" : "text-muted-foreground/70 border-l-2 border-transparent"}`}
                      >
                        {line}
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground/50 italic p-2 whitespace-normal">Pseudocode not mapped for this pathfinding algorithm.</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
