import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Trash2, Move, Navigation, Volume2, VolumeX, Code2, Radio, Activity, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AdvNode, AdvEdge } from "@/lib/advanced-graph-algorithms";
import { runGreedyColoring, runBacktrackingColoring, ColoringStep, GREEDY_COLOR_PSEUDOCODE, BACKTRACKING_COLOR_PSEUDOCODE } from "@/lib/coloring-algorithms";
import { NODE_FILL, NODE_STROKE, NODE_TEXT, NODE_GLOW, EDGE_COLOR } from "@/lib/graph-colors";

type Tool = "select" | "add_node" | "add_edge" | "erase";
type ColorMode = "greedy" | "backtrack";

const INIT_NODES: AdvNode[] = [
  { id: "A", x: 150, y: 100, label: "A" },
  { id: "B", x: 350, y: 100, label: "B" },
  { id: "C", x: 550, y: 100, label: "C" },
  { id: "D", x: 250, y: 250, label: "D" },
  { id: "E", x: 450, y: 250, label: "E" },
  { id: "F", x: 350, y: 400, label: "F" },
];

const INIT_EDGES: AdvEdge[] = [
  { id: "e1", source: "A", target: "B", weight: 1 },
  { id: "e2", source: "B", target: "C", weight: 1 },
  { id: "e3", source: "A", target: "D", weight: 1 },
  { id: "e4", source: "B", target: "D", weight: 1 },
  { id: "e5", source: "B", target: "E", weight: 1 },
  { id: "e6", source: "C", target: "E", weight: 1 },
  { id: "e7", source: "D", target: "E", weight: 1 },
  { id: "e8", source: "D", target: "F", weight: 1 },
  { id: "e9", source: "E", target: "F", weight: 1 },
];

const PREDEFINED_COLORS = [
  "hsl(var(--neon-green))",
  "hsl(var(--neon-cyan))",
  "hsl(var(--neon-purple))",
  "hsl(var(--neon-yellow))",
  "hsl(var(--neon-pink))",
  "#FF9800", // Orange
  "#4CAF50", // Green variant
  "#03A9F4", // Light Blue
  "#9C27B0"  // Deep Purple
];

const getChromaticColor = (cIndex: number) => {
   if (cIndex < PREDEFINED_COLORS.length) return PREDEFINED_COLORS[cIndex];
   return `hsl(${cIndex * 40 % 360}, 80%, 60%)`;
};

export function ColoringVisualizer() {
  const [nodes, setNodes] = useState<AdvNode[]>(INIT_NODES);
  const [edges, setEdges] = useState<AdvEdge[]>(INIT_EDGES);
  const [tool, setTool] = useState<Tool>("select");
  const [colorMode, setColorMode] = useState<ColorMode>("backtrack");
  const [maxColors, setMaxColors] = useState(3);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // States for Execution
  const [steps, setSteps] = useState<ColoringStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(40);

  const [edgeStart, setEdgeStart] = useState<string | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      if (stepIndex < steps.length - 1) {
        const delay = Math.max(50, 3000 - speed * 29.5);
        intervalRef.current = setInterval(() => {
          setStepIndex(prev => {
            if (prev >= steps.length - 1) {
              setIsPlaying(false);
              return steps.length - 1;
            }
            return prev + 1;
          });
        }, delay);
      } else {
        setIsPlaying(false);
      }
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, stepIndex, steps.length]);

  useEffect(() => {
    if (voiceEnabled && isPlaying && steps.length > 0) {
      const currentStep = steps[stepIndex];
      if (currentStep?.explanation) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentStep.explanation.replace(/AI:|AI WARNING:|AI DANGER:|AI SUCCESS:/g, ""));
        utterance.rate = 1.25;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [stepIndex, voiceEnabled, isPlaying, steps]);

  const handleSVGClick = (e: React.MouseEvent) => {
    if (steps.length > 0) return;
    if (tool === "add_node" && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newId = Date.now().toString();
      const newLabel = String.fromCharCode(65 + (nodes.length % 26));
      setNodes([...nodes, { id: newId, x, y, label: newLabel }]);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (steps.length > 0) return;

    if (tool === "erase") {
      setNodes(nodes.filter(n => n.id !== id));
      setEdges(edges.filter(ed => ed.source !== id && ed.target !== id));
    } else if (tool === "add_edge") {
      if (!edgeStart) {
        setEdgeStart(id);
      } else {
        if (edgeStart !== id) {
           setEdges([...edges, { id: Date.now().toString(), source: edgeStart, target: id, weight: 1 }]);
        }
        setEdgeStart(null);
      }
    }
  };

  const handleEdgeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (steps.length > 0) return;
    if (tool === "erase") setEdges(edges.filter(ed => ed.id !== id));
  };

  const runSimulation = () => {
    window.speechSynthesis.cancel();
    let computedSteps: ColoringStep[] = [];
    if (colorMode === "greedy") computedSteps = runGreedyColoring(nodes, edges);
    if (colorMode === "backtrack") computedSteps = runBacktrackingColoring(nodes, edges, maxColors);
    
    setSteps(computedSteps);
    setStepIndex(0);
    setIsPlaying(true);
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setSteps([]);
    setStepIndex(0);
    window.speechSynthesis.cancel();
  };

  const currentStep = steps.length > 0 ? steps[stepIndex] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-neon-green flex items-center gap-2">
            <Activity className="h-5 w-5" /> Graph Coloring Matrix
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Visualize conflict-aware heuristics intersecting complex spatial chromatic layouts.</p>
        </div>

        <div className="glass-panel p-2 flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-muted/40 p-1 rounded border border-border/50 text-xs mr-2">
            {[
              { id: "greedy", label: "Greedy Map" },
              { id: "backtrack", label: "Recursive Backtrack" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setColorMode(m.id as ColorMode); resetSimulation(); }}
                className={`px-3 py-1.5 rounded transition-all ${colorMode === m.id ? "bg-neon-green/20 text-neon-green font-bold border border-neon-green/30" : "text-muted-foreground"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border mx-1" />

          {steps.length === 0 ? (
            <>
              {colorMode === "backtrack" && (
                 <div className="flex items-center gap-2 mr-2 bg-muted/20 px-3 py-1.5 rounded border border-border/30">
                    <span className="text-xs font-bold text-muted-foreground">Max K:</span>
                    <span className="text-xs font-mono font-bold w-4 text-center">{maxColors}</span>
                    <input 
                       type="range" min={1} max={6} value={maxColors} 
                       onChange={(e) => setMaxColors(parseInt(e.target.value))}
                       className="w-20"
                    />
                 </div>
              )}

              <div className="flex bg-muted/30 p-1 rounded-md border border-border">
                {[
                  { id: "select", icon: Move, bg: "bg-blue-500/20 text-blue-400" },
                  { id: "add_node", icon: Plus, bg: "bg-green-500/20 text-green-400" },
                  { id: "add_edge", icon: Navigation, bg: "bg-yellow-500/20 text-yellow-400" },
                  { id: "erase", icon: Trash2, bg: "bg-red-500/20 text-red-400" },
                ].map(t => (
                  <button key={t.id} onClick={() => { setTool(t.id as Tool); setEdgeStart(null); }} className={`p-2 rounded transition-colors ${tool === t.id ? t.bg : "text-muted-foreground hover:bg-muted"}`}>
                    <t.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <Button onClick={runSimulation} className="bg-neon-green/20 border-neon-green/40 text-neon-green hover:bg-neon-green/30 text-xs ml-2">
                <Play className="h-3.5 w-3.5 mr-1" /> Run Compiler
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline" size="sm">
                {isPlaying ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
              </Button>
              <Button onClick={resetSimulation} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <div className="flex items-center gap-2 ml-2 min-w-[100px]">
                <span className="text-[10px] font-mono text-muted-foreground">SPD</span>
                <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={1} max={100} className="flex-1" />
              </div>
            </>
          )}

          <div className="h-5 w-px bg-border mx-2" />
          <Button 
            onClick={() => setVoiceEnabled(!voiceEnabled)} 
            size="sm" variant="outline" 
            className={voiceEnabled ? "border-neon-green text-neon-green" : "text-muted-foreground"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        
        {/* GRAPH CANVAS */}
        <div className="glass-panel overflow-hidden h-[500px] flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 to-transparent">
          
          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-1.5 rounded-b-lg shadow-lg flex items-center gap-2 backdrop-blur-sm">
                <Radio className="h-4 w-4 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Simulation Active: Click Reset to Edit Topology</span>
              </motion.div>
            )}
          </AnimatePresence>

          {currentStep?.phaseMessage && (
             <motion.div key={currentStep.phaseMessage} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`absolute top-0 right-0 ${currentStep.phaseMessage.includes("Backtrack") || currentStep.phaseMessage.includes("Conflict") || currentStep.phaseMessage.includes("ERROR") ? 'bg-neon-pink' : 'bg-neon-green'} text-black px-4 py-1.5 font-display font-bold text-xs uppercase tracking-widest rounded-bl-lg shadow-lg z-10 transition-colors`}>
               {currentStep.phaseMessage}
             </motion.div>
          )}

          <svg
            ref={svgRef}
            onClick={steps.length === 0 ? handleSVGClick : undefined}
            onPointerMove={e => {
              if (svgRef.current && tool === "select") {
                const rect = svgRef.current.getBoundingClientRect();
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                if (dragNode) setNodes(nodes.map(n => n.id === dragNode ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n));
              } else if (svgRef.current && tool === "add_edge") {
                const rect = svgRef.current.getBoundingClientRect();
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }
            }}
            onPointerUp={() => setDragNode(null)}
            className="w-full h-full cursor-crosshair touch-none select-none relative z-0"
          >
            {edges.map(ed => {
              const src = nodes.find(n => n.id === ed.source);
              const tgt = nodes.find(n => n.id === ed.target);
              if (!src || !tgt) return null;

              // ── Edge State Rendering Engine ──────────────────────────
              let stroke = EDGE_COLOR.default;
              let strokeWidth = 2;
              let opacity = 0.55;

              if (currentStep) {
                if (currentStep.conflicts?.includes(ed.id)) {
                  stroke = EDGE_COLOR.conflict;
                  strokeWidth = 6;
                  opacity = 1;
                } else if (
                  currentStep.colors?.[src.id] !== undefined &&
                  currentStep.colors?.[tgt.id] !== undefined
                ) {
                  stroke = EDGE_COLOR.visited;
                  opacity = 0.7;
                }
              }

              return (
                <g key={ed.id} onClick={e => handleEdgeClick(e, ed.id)}
                  className={tool === "erase" ? "cursor-pointer hover:opacity-100" : ""}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={opacity}
                    className="transition-all duration-300"
                  />
                  {currentStep?.conflicts?.includes(ed.id) && (
                    <circle cx={(src.x + tgt.x) / 2} cy={(src.y + tgt.y) / 2}
                      r={9} fill={EDGE_COLOR.conflict} opacity={0.9}
                      className="animate-pulse" />
                  )}
                </g>
              );
            })}

            {tool === "add_edge" && edgeStart && (
              <line
                x1={nodes.find(n => n.id === edgeStart)?.x || 0}
                y1={nodes.find(n => n.id === edgeStart)?.y || 0}
                x2={mousePos.x} y2={mousePos.y}
                stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={2}
              />
            )}

            {nodes.map(n => {
              // ── Node State Rendering Engine ──────────────────────────
              // Default: gray fill — never transparent/black so text is visible
              let fill       = NODE_FILL.default;
              let strokeColor = NODE_STROKE.default;
              let textColor  = NODE_TEXT.default;
              let glow       = NODE_GLOW.default;
              const isCurrent = currentStep?.activeNodes?.includes(n.id) ?? false;

              if (currentStep) {
                if (currentStep.colors?.[n.id] !== undefined) {
                  // Node has been assigned a chromatic color
                  const colorIdx = currentStep.colors[n.id];
                  const chromatic = getChromaticColor(colorIdx);
                  fill        = chromatic; // opacity handled gracefully by SVG fill
                  strokeColor = chromatic;
                  textColor   = "#1C1917"; // dark for contrast on bright chroma colors
                }

                if (isCurrent) {
                  // Pulse the currently-evaluated node in yellow
                  if (currentStep.colors?.[n.id] === undefined) {
                    fill        = NODE_FILL.current;
                    strokeColor = NODE_STROKE.current;
                    textColor   = NODE_TEXT.current;
                  }
                  glow = NODE_GLOW.current;
                }
              }

              return (
                <g
                  key={n.id} transform={`translate(${n.x}, ${n.y})`}
                  onClick={e => handleNodeClick(e, n.id)}
                  onPointerDown={() => { if (tool === "select" && steps.length === 0) setDragNode(n.id); }}
                  className="cursor-pointer"
                  style={{ filter: glow }}
                >
                  {/* Glow pulse ring for active node */}
                  {isCurrent && (
                    <circle r={28} fill="none" stroke={strokeColor} strokeWidth={2} opacity={0.4}
                      className="animate-ping" style={{ transformOrigin: "0 0" }} />
                  )}
                  {currentStep?.phaseMessage === "Conflict Detected!" && isCurrent && (
                    <circle r={32} fill="none" stroke="#FF003C" strokeWidth={3}
                      className="animate-pulse" />
                  )}
                  <circle
                    r={22} fill={fill} stroke={strokeColor}
                    strokeWidth={isCurrent ? 4 : 2}
                    className="transition-all duration-300"
                  />
                  <text
                    textAnchor="middle" dominantBaseline="central"
                    fill={textColor} fontSize={14} fontWeight="bold" fontFamily="monospace"
                  >
                    {n.label}
                  </text>

                  {currentStep?.candidateColor !== undefined && isCurrent && (
                    <g transform="translate(0, -38)">
                      <motion.rect initial={{ scale: 0 }} animate={{ scale: 1 }} x={-35} y={-12} width={70} height={24} rx={6}
                        fill="#0F172A" stroke={getChromaticColor(currentStep.candidateColor)} strokeWidth={2} />
                      <text textAnchor="middle" dominantBaseline="central"
                        fill={getChromaticColor(currentStep.candidateColor)}
                        fontSize={11} fontFamily="monospace" fontWeight="bold">
                        {currentStep.phaseMessage === "Conflict Detected!" ? "CONFLICT" : `K: ${currentStep.candidateColor}`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* HUD SIDEBAR */}
        <div className="glass-panel p-4 flex flex-col gap-4 overflow-hidden max-h-[500px]">
            <h3 className="font-display text-[12px] font-bold tracking-widest text-neon-green uppercase border-b border-border/50 pb-2 flex items-center gap-2">
              <TerminalSquare className="h-4 w-4" /> Chromatic Operations HUD
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
               <div className="space-y-4">
                  <div className="bg-muted/10 p-2 rounded border border-border">
                    <h4 className="text-[10px] uppercase text-muted-foreground tracking-widest mb-2 font-bold flex items-center justify-between">
                      Active Palette
                    </h4>
                    <div className="flex flex-wrap gap-2.5 min-h-[30px] items-center">
                      {(currentStep?.totalColorsUsed !== undefined && currentStep.totalColorsUsed > 0) ? (
                         Array.from({ length: currentStep.totalColorsUsed }, (_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 animate-scale-in">
                              <div className="w-6 h-6 rounded shadow-[0_0_8px_currentColor] opacity-80" style={{ backgroundColor: getChromaticColor(i), color: getChromaticColor(i) }} />
                              <span className="text-[9px] font-mono font-bold text-muted-foreground">{i}</span>
                            </div>
                         ))
                      ) : (
                         <span className="text-[10px] text-muted-foreground/30 italic font-mono uppercase tracking-tighter">No color states active...</span>
                      )}
                    </div>
                  </div>
               </div>

               <div className="bg-muted/5 p-3 rounded border border-border/50">
                  <h4 className="text-[10px] uppercase text-muted-foreground tracking-widest mb-2 font-bold">Assignment Log</h4>
                  <div className="space-y-1.5">
                    {nodes.map(n => {
                      const color = currentStep?.colors?.[n.id];
                      return (
                        <div key={`log-${n.id}`} className="flex items-center justify-between text-[11px] font-mono p-1 rounded hover:bg-muted/20 transition-colors">
                          <span className="text-muted-foreground">Node {n.label}:</span>
                          {color !== undefined ? (
                            <span className="font-bold flex items-center gap-2" style={{ color: getChromaticColor(color) }}>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getChromaticColor(color) }} />
                              COLOR {color}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/20 italic uppercase tracking-tighter">UNCOLORED</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
               </div>

               {colorMode === "backtrack" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                     <div className="bg-neon-pink/10 border border-neon-pink/30 p-3 rounded-lg text-center shadow-[0_0_15px_-5px_rgba(255,0,60,0.3)]">
                        <span className="text-[10px] text-neon-pink font-bold uppercase tracking-widest block mb-1">Backtrack Cycles</span>
                        <span className="text-3xl font-mono block text-neon-pink font-bold">{currentStep?.backtrackCount || 0}</span>
                     </div>
                     <div className="border border-border/70 p-3 rounded-lg bg-muted/5">
                        <span className="text-[10px] uppercase text-muted-foreground tracking-widest mb-3 font-bold block">Capacity Boundary (K)</span>
                        <div className="flex gap-2.5 flex-wrap">
                           {Array.from({ length: maxColors }, (_, i) => (
                              <div key={`k_${i}`} className="w-6 h-6 rounded flex items-center justify-center border-2 shadow-sm" style={{ borderColor: getChromaticColor(i), backgroundColor: getChromaticColor(i) + '22' }}>
                                <span className="text-[9px] font-bold" style={{ color: getChromaticColor(i) }}>{i}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-neon-yellow" /> Semantic Engine Output
          </h3>
          <div className="min-h-[60px] flex items-center bg-muted/20 rounded p-3 border border-border/50">
            <AnimatePresence mode="wait">
              <motion.p 
                key={currentStep?.explanation || "empty"}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} 
                className={`text-sm font-mono leading-relaxed ${currentStep?.explanation ? (currentStep?.explanation.includes("DANGER") || currentStep?.explanation.includes("WARNING") || currentStep?.explanation.includes("ERROR") ? "text-neon-pink font-bold" : "text-foreground") : "text-muted-foreground italic"}`}
              >
                {currentStep?.explanation || "Awaiting structural vector compilation instructions..."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Loop ({colorMode})
          </h3>
          <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30 overflow-y-auto max-h-[140px]">
            {(colorMode === "greedy" ? GREEDY_COLOR_PSEUDOCODE : BACKTRACKING_COLOR_PSEUDOCODE).map((line, i) => {
              const isActive = currentStep?.pseudocodeLine === i;
              return (
                <motion.div 
                  key={i} animate={{ backgroundColor: isActive ? "hsla(120, 100%, 50%, 0.15)" : "transparent" }} 
                  className={`px-2 py-1 rounded-sm transition-colors whitespace-pre ${isActive ? "text-neon-green border-l-2 border-neon-green font-bold" : "text-muted-foreground/70 border-l-2 border-transparent"}`}
                >
                  {line}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
