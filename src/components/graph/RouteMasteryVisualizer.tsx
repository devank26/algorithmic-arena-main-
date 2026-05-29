import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Trash2, Move, Navigation, Volume2, VolumeX, Code2, Radio, Activity, TerminalSquare, AlertTriangle, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AdvNode, AdvEdge } from "@/lib/advanced-graph-algorithms";
import { runEulerPath, runHamiltonianPath, RouteStep, EULER_PSEUDOCODE, HAMILTONIAN_PSEUDOCODE } from "@/lib/route-mastery-algorithms";
import { NODE_FILL, NODE_STROKE, NODE_TEXT, NODE_GLOW, EDGE_COLOR } from "@/lib/graph-colors";

type Tool = "select" | "add_node" | "add_edge" | "erase";
type RouteMode = "euler" | "hamiltonian";

// Initial Layout heavily skewed towards a Hamiltonian challenge
const INIT_NODES: AdvNode[] = [
  { id: "0", x: 200, y: 150, label: "0" },
  { id: "1", x: 300, y: 100, label: "1" },
  { id: "2", x: 400, y: 150, label: "2" },
  { id: "3", x: 200, y: 300, label: "3" },
  { id: "4", x: 300, y: 350, label: "4" },
  { id: "5", x: 400, y: 300, label: "5" },
];

const INIT_EDGES: AdvEdge[] = [
  { id: "e1", source: "0", target: "1", weight: 1 },
  { id: "e2", source: "1", target: "2", weight: 1 },
  { id: "e3", source: "2", target: "5", weight: 1 },
  { id: "e4", source: "5", target: "4", weight: 1 },
  { id: "e5", source: "4", target: "3", weight: 1 },
  { id: "e6", source: "3", target: "0", weight: 1 },
  { id: "e7", source: "0", target: "4", weight: 1 },
  { id: "e8", source: "3", target: "1", weight: 1 },
  { id: "e9", source: "1", target: "5", weight: 1 },
];

export function RouteMasteryVisualizer() {
  const [nodes, setNodes] = useState<AdvNode[]>(INIT_NODES);
  const [edges, setEdges] = useState<AdvEdge[]>(INIT_EDGES);
  const [tool, setTool] = useState<Tool>("select");
  const [routeMode, setRouteMode] = useState<RouteMode>("euler");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const [searchCycles, setSearchCycles] = useState(false); // Valid mostly for Hamiltonian Mode

  // States for Execution
  const [steps, setSteps] = useState<RouteStep[]>([]);
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
        const utterance = new SpeechSynthesisUtterance(currentStep.explanation.replace(/AI:|AI DANGER:|AI WARNING:|AI SUCCESS:|AI FATAL ERROR:|AI ERROR:/g, ""));
        utterance.rate = 1.2;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [stepIndex, voiceEnabled, isPlaying, steps]);

  const handleSVGClick = (e: React.MouseEvent) => {
    if (steps.length > 0) return;
    if (tool === "add_node" && svgRef.current) {
      if (nodes.length >= 15 && routeMode === "hamiltonian") {
        alert("Maximum safe computational node limit reached for NP-Complete Hamiltonian routing visualization.");
        return;
      }
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newId = Date.now().toString();
      const newLabel = nodes.length.toString();
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
           // Prevent exact duplicate edges
           if (!edges.find(ed => (ed.source === edgeStart && ed.target === id) || (ed.source === id && ed.target === edgeStart))) {
             setEdges([...edges, { id: Date.now().toString(), source: edgeStart, target: id, weight: 1 }]);
           }
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
    if (nodes.length === 0) return;
    
    let computedSteps: RouteStep[] = [];
    if (routeMode === "euler") computedSteps = runEulerPath(nodes, edges);
    if (routeMode === "hamiltonian") {
        const primaryStartId = nodes[0].id;
        computedSteps = runHamiltonianPath(nodes, edges, primaryStartId, searchCycles);
    }
    
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
          <h2 className="text-xl font-display font-bold text-blue-400 flex items-center gap-2">
            <Route className="h-5 w-5" /> Route Mastery Lab
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Dissecting absolute traversal logic mapping between Edge dependencies and Node saturations.</p>
        </div>

        <div className="glass-panel p-2 flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-muted/40 p-1 rounded border border-border/50 text-xs mr-2">
            {[
              { id: "euler", label: "Euler (Edge Traversal)" },
              { id: "hamiltonian", label: "Hamiltonian (Node Traversal)" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setRouteMode(m.id as RouteMode); resetSimulation(); }}
                className={`px-3 py-1.5 rounded transition-all ${routeMode === m.id ? (m.id === "euler" ? "bg-neon-cyan/20 text-neon-cyan font-bold border border-neon-cyan/30" : "bg-neon-purple/20 text-neon-purple font-bold border border-neon-purple/30") : "text-muted-foreground"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border mx-1" />

          {steps.length === 0 ? (
            <>
              {routeMode === "hamiltonian" && (
                 <label className="flex items-center gap-2 mr-2 text-xs font-bold text-muted-foreground cursor-pointer px-2 py-1.5 rounded bg-muted/20 border border-border/50 hover:bg-muted/40">
                    <input type="checkbox" checked={searchCycles} onChange={() => setSearchCycles(!searchCycles)} className="rounded bg-background" />
                     Force Cycle Return
                 </label>
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
              <Button onClick={runSimulation} className={`${routeMode === "euler" ? "bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30" : "bg-neon-purple/20 border-neon-purple/40 text-neon-purple hover:bg-neon-purple/30"} text-xs ml-2`}>
                <Play className="h-3.5 w-3.5 mr-1" /> Run Diagnostics
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
            className={voiceEnabled ? (routeMode === "euler" ? "border-neon-cyan text-neon-cyan" : "border-neon-purple text-neon-purple") : "text-muted-foreground"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        
        {/* GRAPH CANVAS */}
        <div className="glass-panel overflow-hidden h-[500px] flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 to-transparent">
          {currentStep?.phaseMessage && (
             <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className={`absolute top-0 right-0 ${currentStep.phaseMessage.includes("ERROR") || currentStep.phaseMessage.includes("Impossibility") || currentStep.phaseMessage.includes("Failure") ? 'bg-neon-pink' : (routeMode === "euler" ? 'bg-neon-cyan' : 'bg-neon-purple')} text-black px-4 py-1.5 font-display font-bold text-xs uppercase tracking-widest rounded-bl-lg shadow-lg z-10 transition-colors`}>
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

              let stroke = EDGE_COLOR.default;
              let strokeWidth = 2;
              let opacity = 0.5;
              let strokeDash = "0";

              if (currentStep) {
                 if (currentStep.activeEdges?.includes(ed.id)) {
                    stroke = EDGE_COLOR.conflict;
                    strokeWidth = 6;
                    opacity = 1;
                 } else if (currentStep.orderedEdges?.includes(ed.id)) {
                    stroke = routeMode === "euler" ? EDGE_COLOR.flow : EDGE_COLOR.trace;
                    strokeWidth = 4;
                    opacity = 1;
                 } else if (routeMode === "euler") {
                    stroke = EDGE_COLOR.default;
                    strokeDash = "3 3";
                 }
              } else {
                 if (routeMode === "euler") strokeDash = "3 3";
              }

              return (
                <g key={ed.id} onClick={e => handleEdgeClick(e, ed.id)} className={tool === "erase" ? "cursor-pointer hover:opacity-100" : ""}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={opacity}
                    strokeDasharray={strokeDash}
                    className="transition-all duration-300"
                  />
                  {currentStep?.activeEdges?.includes(ed.id) && (
                    <circle cx={(src.x + tgt.x)/2} cy={(src.y + tgt.y)/2} r={6} fill={EDGE_COLOR.conflict} className="animate-pulse" />
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
              let fill = NODE_FILL.default;
              let strokeColor = NODE_STROKE.default;
              let textColor = NODE_TEXT.default;
              let glow = NODE_GLOW.default;

              if (currentStep) {
                 if (routeMode === "euler" && currentStep.degrees && currentStep.degrees[n.id] % 2 !== 0) {
                    strokeColor = NODE_STROKE.target;
                    glow = NODE_GLOW.target;
                 }

                 if (currentStep.orderedPath?.includes(n.id)) {
                    fill = routeMode === "euler" ? "#06B6D4" : "#8B5CF6";
                    textColor = "white";
                    if (routeMode === "hamiltonian") fill = fill + "80"; 
                 }

                 if (currentStep.activeNodes?.includes(n.id)) {
                    fill = NODE_FILL.current;
                    strokeColor = NODE_STROKE.current;
                    textColor = NODE_TEXT.current;
                    glow = NODE_GLOW.current;
                 }
              }

              return (
                <g 
                  key={n.id} transform={`translate(${n.x}, ${n.y})`}
                  onClick={e => handleNodeClick(e, n.id)}
                  onPointerDown={() => { if (tool === "select" && steps.length === 0) setDragNode(n.id); }}
                  className="cursor-pointer transition-opacity duration-300"
                  style={{ filter: glow }}
                >
                  <circle 
                    r={22} fill={fill} stroke={strokeColor} strokeWidth={currentStep?.degrees && currentStep.degrees[n.id] % 2 !== 0 ? 3 : 2}
                    className="transition-colors duration-300"
                  />
                  <text 
                    textAnchor="middle" dominantBaseline="central" 
                    fill={textColor} fontSize={16} fontWeight="bold" fontFamily="monospace"
                  >
                    {n.label}
                  </text>

                  {/* Euler Node Degrees! */}
                  {routeMode === "euler" && (!currentStep || currentStep?.degrees) && (
                     <g transform="translate(18, -18)">
                        <rect x={-8} y={-8} width={16} height={16} fill="#0F172A" stroke={currentStep?.degrees && currentStep.degrees[n.id] % 2 !== 0 ? "#EF4444" : "#06B6D4"} strokeWidth={1} rx={4}/>
                        <text textAnchor="middle" dominantBaseline="central" fill={currentStep?.degrees && currentStep.degrees[n.id] % 2 !== 0 ? "#EF4444" : "#06B6D4"} fontSize={10} fontFamily="monospace" fontWeight="bold">
                          {currentStep ? currentStep?.degrees?.[n.id] : edges.filter(e => e.source === n.id || e.target === n.id).length}
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
           <h3 className="font-display text-[12px] font-bold tracking-widest uppercase border-b border-border/50 pb-2 flex items-center gap-2" style={{ color: routeMode === "euler" ? "var(--neon-cyan)" : "var(--neon-purple)" }}>
             <TerminalSquare className="h-4 w-4" /> {routeMode === "euler" ? "Hierholzer Tracking" : "Hamiltonian Sequence Analysis"}
           </h3>

           <div className="flex-1 overflow-y-auto space-y-4">
              
              <div className="space-y-4">
                 <div className="bg-muted/10 p-2 rounded border border-border">
                   <h4 className="text-[10px] uppercase text-muted-foreground tracking-widest mb-2 font-bold break-words flex items-center justify-between">
                     Sequential Path Array
                   </h4>
                   <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                     {currentStep?.orderedPath !== undefined && currentStep.orderedPath.length > 0 ? (
                        currentStep.orderedPath.map((pathId, idx) => (
                           <div key={`${pathId}-${idx}`} className="flex items-center gap-1.5 animate-scale-in">
                             <div className="w-6 h-6 rounded shadow-[0_0_8px_currentColor]" style={{ backgroundColor: routeMode === "euler" ? "var(--neon-cyan)" : "var(--neon-purple)", color: routeMode === "euler" ? "var(--neon-cyan)" : "var(--neon-purple)" }}>
                               <span className="w-full h-full flex items-center justify-center text-black font-bold font-mono text-xs">{nodes.find(n=>n.id===pathId)?.label}</span>
                             </div>
                             {idx < currentStep.orderedPath!.length - 1 && <span className="text-[10px] text-muted-foreground font-mono">→</span>}
                           </div>
                        ))
                     ) : (
                        <span className="text-xs text-muted-foreground/40 italic">Awaiting structural route formulation...</span>
                     )}
                   </div>
                 </div>
              </div>

              {routeMode === "euler" && (
                 <div className="space-y-4 anime-fade-in">
                    <div className="border border-neon-cyan/30 p-2 rounded bg-neon-cyan/5">
                       <span className="text-[10px] uppercase text-neon-cyan tracking-widest mb-1 font-bold block">Topological Edge Consumption</span>
                       <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-mono block text-neon-cyan font-bold">{currentStep?.orderedEdges?.length || 0}</span>
                          <span className="text-muted-foreground font-mono text-sm">/ {edges.length} Extracted</span>
                       </div>
                       
                       <div className="w-full bg-background border border-border rounded-full h-2 mt-2 overflow-hidden">
                           <div className="bg-neon-cyan h-full transition-all duration-300" style={{ width: `${(currentStep?.orderedEdges?.length || 0) / edges.length * 100}%` }} />
                       </div>
                    </div>
                 </div>
              )}

              {routeMode === "hamiltonian" && (
                 <div className="space-y-4 anime-fade-in">
                    <div className="bg-neon-pink/10 border border-neon-pink/30 p-3 rounded text-center">
                       <span className="text-[10px] text-neon-pink font-bold uppercase tracking-widest block mb-1">Deep Backtrack Overrides</span>
                       <span className="text-2xl font-mono block text-neon-pink font-bold">{currentStep?.backtrackCount || 0}</span>
                    </div>

                    <div className="border border-neon-purple/30 p-2 rounded bg-neon-purple/5">
                       <span className="text-[10px] uppercase text-neon-purple tracking-widest mb-1 font-bold block">Topological Geometry Saturation</span>
                       <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-mono block text-neon-purple font-bold">{currentStep?.visitedCount || 0}</span>
                          <span className="text-muted-foreground font-mono text-sm">/ {nodes.length} Target Nodes Found</span>
                       </div>
                       <div className="w-full bg-background border border-border rounded-full h-2 mt-2 overflow-hidden">
                           <div className="bg-neon-purple h-full transition-all duration-300" style={{ width: `${(currentStep?.visitedCount || 0) / nodes.length * 100}%` }} />
                       </div>
                    </div>
                 </div>
              )}

           </div>

        </div>
      </div>

      {/* Extreme Focus HUD Euler VS Hamiltonian Comparison Engine */}
      <div className="mb-4 glass-panel p-4 pb-6 mt-4 relative border-l-4 border-l-orange-500 overflow-hidden">
         <div className="absolute opacity-5 -top-10 -right-10 pointer-events-none">
            <Route className="w-64 h-64" />
         </div>
         <h3 className="font-display font-bold text-orange-400 flex items-center gap-2 mb-4">
             <AlertTriangle className="h-5 w-5" /> Fundamental Route Math Breakdown
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="pl-4 border-l border-neon-cyan/50 space-y-2">
               <h4 className="text-sm font-bold text-neon-cyan tracking-widest uppercase mb-2">Euler Theory (Edge-Focus)</h4>
               <p className="text-xs text-muted-foreground leading-relaxed">
                  The Eulerian traversal requires passing across <strong className="text-white">every single connection completely unique</strong> leaving no abandoned Edge traces behind! This mathematically operates purely in polynomial linear logic `O(E)`.
               </p>
               <p className="text-[10px] text-neon-cyan font-mono border border-neon-cyan/20 bg-neon-cyan/5 inline-block px-2 py-1 rounded">
                  Requires 100% Edge Coverage
               </p>
            </div>
            <div className="pl-4 border-l border-neon-purple/50 space-y-2">
               <h4 className="text-sm font-bold text-neon-purple tracking-widest uppercase mb-2">Hamiltonian Theory (Node-Focus)</h4>
               <p className="text-xs text-muted-foreground leading-relaxed">
                  The Hamiltonian route entirely ignores excess connections focusing exclusively on finding <strong className="text-white">every structural layout Target Node completely unique</strong>. A purely NP-Complete logic vector mapping `O(N!)` depths dynamically resolving massive backtracking.
               </p>
               <p className="text-[10px] text-neon-purple font-mono border border-neon-purple/20 bg-neon-purple/5 inline-block px-2 py-1 rounded">
                  Requires 100% Node Coverage
               </p>
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
                className={`text-sm font-mono leading-relaxed tracking-tight ${currentStep?.explanation ? (currentStep?.explanation.includes("DANGER") || currentStep?.explanation.includes("WARNING") || currentStep?.explanation.includes("ERROR") ? "text-neon-pink font-bold" : "text-foreground") : "text-muted-foreground italic"}`}
              >
                {currentStep?.explanation || "Awaiting advanced topological route parameter extraction..."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Tracing ({routeMode})
          </h3>
          <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30 overflow-y-auto max-h-[140px]">
            {(routeMode === "euler" ? EULER_PSEUDOCODE : HAMILTONIAN_PSEUDOCODE).map((line, i) => {
              const isActive = currentStep?.pseudocodeLine === i;
              return (
                <motion.div 
                  key={i} animate={{ backgroundColor: isActive ? (routeMode === "euler" ? "hsla(180, 100%, 50%, 0.15)" : "hsla(270, 100%, 50%, 0.15)") : "transparent" }} 
                  className={`px-2 py-1 rounded-sm transition-colors whitespace-pre ${isActive ? (routeMode === "euler" ? "text-neon-cyan border-l-2 border-neon-cyan font-bold" : "text-neon-purple border-l-2 border-neon-purple font-bold") : "text-muted-foreground/70 border-l-2 border-transparent"}`}
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
