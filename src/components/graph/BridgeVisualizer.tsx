import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Trash2, Move, Navigation, Volume2, VolumeX, Code2, Radio, Activity, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AdvNode, AdvEdge } from "@/lib/advanced-graph-algorithms";
import { runBridgeDiagnostics, BridgeStep, BRIDGE_PSEUDOCODE } from "@/lib/bridge-algorithms";
import { NODE_FILL, NODE_STROKE, NODE_TEXT, NODE_GLOW, EDGE_COLOR } from "@/lib/graph-colors";

type Tool = "select" | "add_node" | "add_edge" | "erase";

// Initial Layout heavily susceptible to bridges/articulation points
const INIT_NODES: AdvNode[] = [
  { id: "A", x: 100, y: 150, label: "A" },
  { id: "B", x: 200, y: 80, label: "B" },
  { id: "C", x: 200, y: 220, label: "C" },
  { id: "D", x: 350, y: 150, label: "D" }, // Articulation Point
  { id: "E", x: 480, y: 80, label: "E" },
  { id: "F", x: 480, y: 220, label: "F" },
  { id: "G", x: 600, y: 150, label: "G" },
];

const INIT_EDGES: AdvEdge[] = [
  { id: "e1", source: "A", target: "B", weight: 1 },
  { id: "e2", source: "A", target: "C", weight: 1 },
  { id: "e3", source: "B", target: "C", weight: 1 },
  { id: "e4", source: "A", target: "D", weight: 1 }, // Note DFS will map from A to D. D is Articulation point. D-E is BRIDGE if we remove D-F loop maybe. Let's force a bridge.
  { id: "e5", source: "D", target: "E", weight: 1 }, // D-E is a bridge
  { id: "e6", source: "E", target: "F", weight: 1 },
  { id: "e7", source: "F", target: "G", weight: 1 },
  { id: "e8", source: "E", target: "G", weight: 1 }
];

export function BridgeVisualizer() {
  const [nodes, setNodes] = useState<AdvNode[]>(INIT_NODES);
  const [edges, setEdges] = useState<AdvEdge[]>(INIT_EDGES);
  const [tool, setTool] = useState<Tool>("select");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // States for Execution
  const [steps, setSteps] = useState<BridgeStep[]>([]);
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
        const utterance = new SpeechSynthesisUtterance(currentStep.explanation.replace(/AI:|AI DANGER:|AI SUCCESS:/g, ""));
        utterance.rate = 1.15;
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
    if (steps.length > 0 && tool !== "erase") return; // Allow erasing to test breakage dynamics? Actually let's stop simulating on edit.
    
    if (tool === "erase") {
       setEdges(edges.filter(ed => ed.id !== id));
       if (steps.length > 0) resetSimulation();
    }
  };

  const runSimulation = () => {
    window.speechSynthesis.cancel();
    const computedSteps = runBridgeDiagnostics(nodes, edges);
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
          <h2 className="text-xl font-display font-bold text-red-400 flex items-center gap-2">
            <Activity className="h-5 w-5" /> Critical Connections Matrix (Bridges/Points)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Visually identify mathematical vulnerabilities spanning structural topology matrices.</p>
        </div>

        <div className="glass-panel p-2 flex flex-wrap items-center gap-2">
          {steps.length === 0 ? (
            <>
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
              <Button onClick={runSimulation} className="bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30 text-xs ml-2">
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
            className={voiceEnabled ? "border-red-400 text-red-400" : "text-muted-foreground"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        
        {/* GRAPH CANVAS */}
        <div className="glass-panel overflow-hidden h-[500px] flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 to-transparent">
          {currentStep?.phaseMessage && (
             <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className={`absolute top-0 right-0 bg-red-500 text-white px-4 py-1.5 font-display font-bold text-xs uppercase tracking-widest rounded-bl-lg shadow-lg z-10 transition-colors`}>
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
                   stroke = EDGE_COLOR.active;
                   strokeWidth = 3;
                   opacity = 1;
                } else if (currentStep.edgeBacklinks?.includes(ed.id)) {
                   stroke = "#10B981"; // Emerald-500 for backlinks
                   strokeWidth = 3;
                   opacity = 0.8;
                   strokeDash = "4 4";
                }
                if (currentStep.bridges?.includes(ed.id)) {
                   stroke = EDGE_COLOR.bridge;
                   strokeWidth = 6;
                   opacity = 1;
                }
              }

              return (
                <g key={ed.id} onClick={e => handleEdgeClick(e, ed.id)} className={tool === "erase" ? "cursor-pointer hover:opacity-100" : ""}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={opacity}
                    strokeDasharray={strokeDash}
                    className="transition-all duration-300"
                  />
                  {currentStep?.bridges?.includes(ed.id) && (
                     <circle cx={(src.x + tgt.x)/2} cy={(src.y + tgt.y)/2} r={6} fill={EDGE_COLOR.bridge} className="animate-pulse shadow-lg"/>
                  )}
                </g>
              );
            })}

            {tool === "add_edge" && edgeStart && (
              <line
                x1={nodes.find(n => n.id === edgeStart)?.x || 0}
                y1={nodes.find(n => n.id === edgeStart)?.y || 0}
                x2={mousePos.x} y2={mousePos.y}
                stroke="#6366F1" strokeDasharray="4 4" strokeWidth={2}
              />
            )}

            {nodes.map(n => {
              let fill = NODE_FILL.default;
              let strokeColor = NODE_STROKE.default;
              let textColor = NODE_TEXT.default;
              let glow = NODE_GLOW.default;

              if (currentStep) {
                if (currentStep.activeNodes?.includes(n.id)) {
                  fill = NODE_FILL.active;
                  strokeColor = NODE_STROKE.active;
                  textColor = "black";
                  glow = NODE_GLOW.active;
                }
                
                if (currentStep.articulationPoints?.includes(n.id)) {
                   strokeColor = NODE_STROKE.bridge;
                   textColor = "white";
                   glow = NODE_GLOW.bridge;
                   if (!currentStep.activeNodes?.includes(n.id)) {
                       fill = NODE_FILL.bridge;
                   }
                }
              }

              return (
                <g 
                  key={n.id} transform={`translate(${n.x}, ${n.y})`}
                  onClick={e => handleNodeClick(e, n.id)}
                  onPointerDown={() => { if (tool === "select" && steps.length === 0) setDragNode(n.id); }}
                  className="cursor-pointer transition-opacity duration-500"
                  style={{ filter: glow }}
                >
                  <circle 
                    r={20} fill={fill} stroke={strokeColor} strokeWidth={currentStep?.articulationPoints?.includes(n.id) ? 4 : 2}
                    className={`transition-colors duration-300 ${currentStep?.articulationPoints?.includes(n.id) ? 'animate-pulse' : ''}`}
                  />
                  <text 
                    textAnchor="middle" dominantBaseline="central" 
                    fill={textColor} fontSize={14} fontWeight="bold" fontFamily="monospace"
                  >
                    {n.label}
                  </text>
                  
                  {/* Discovery Specific Badges! */}
                  {currentStep?.disc && currentStep.disc[n.id] !== undefined && currentStep.disc[n.id] !== -1 && (
                     <g transform="translate(18, -18)">
                        <rect x={-8} y={-8} width={16} height={16} fill="#0F172A" stroke={NODE_STROKE.active} strokeWidth={1} rx={4}/>
                        <text textAnchor="middle" dominantBaseline="central" fill={NODE_STROKE.active} fontSize={10} fontFamily="monospace" fontWeight="bold">
                          {currentStep.disc[n.id]}
                        </text>
                     </g>
                  )}
                  {currentStep?.low && currentStep.low[n.id] !== undefined && currentStep.low[n.id] !== -1 && (
                     <g transform="translate(-18, -18)">
                        <rect x={-8} y={-8} width={16} height={16} fill="#0F172A" stroke="#06B6D4" strokeWidth={1} rx={4}/>
                        <text textAnchor="middle" dominantBaseline="central" fill="#06B6D4" fontSize={10} fontFamily="monospace" fontWeight="bold">
                          {currentStep.low[n.id]}
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
           <h3 className="font-display text-[12px] font-bold tracking-widest text-red-400 uppercase border-b border-border/50 pb-2 flex items-center gap-2">
             <TerminalSquare className="h-4 w-4" /> Discovery Map Analytics
           </h3>

           <div className="flex-1 overflow-y-auto space-y-4">
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                 <h4 className="text-[10px] text-red-500 uppercase tracking-widest font-bold mb-2">Articulation Points</h4>
                 <div className="flex flex-wrap gap-1">
                    {currentStep?.articulationPoints && currentStep.articulationPoints.length > 0 ? (
                       currentStep.articulationPoints.map(p => (
                          <span key={p} className="w-6 h-6 rounded-sm bg-red-500 text-white font-bold flex items-center justify-center text-xs animate-scale-in">
                             {nodes.find(n=>n.id===p)?.label}
                          </span>
                       ))
                    ) : <span className="text-xs text-muted-foreground/60 italic">No nodes isolated...</span>}
                 </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                 <h4 className="text-[10px] text-red-500 uppercase tracking-widest font-bold mb-2">Critical Bridges</h4>
                 <div className="flex flex-col gap-1">
                    {currentStep?.bridges && currentStep.bridges.length > 0 ? (
                       currentStep.bridges.map(bId => {
                          const ed = edges.find(e=>e.id===bId);
                          if (!ed) return null;
                          return (
                             <span key={bId} className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-400 font-mono flex items-center animate-scale-in">
                               <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"/>
                               {nodes.find(n=>n.id===ed.source)?.label} ⟷ {nodes.find(n=>n.id===ed.target)?.label}
                             </span>
                          );
                       })
                    ) : <span className="text-xs text-muted-foreground/60 italic">No bridges isolated...</span>}
                 </div>
              </div>

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
                className={`text-sm font-mono leading-relaxed ${currentStep?.explanation ? (currentStep?.explanation.includes("DANGER") || currentStep?.explanation.includes("FAILURE") ? "text-red-400 font-bold" : "text-foreground") : "text-muted-foreground italic"}`}
              >
                {currentStep?.explanation || "Awaiting topographical structural discovery runs..."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Tracing (Diagnostics)
          </h3>
          <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30 overflow-y-auto max-h-[140px]">
            {BRIDGE_PSEUDOCODE.map((line, i) => {
              const isActive = currentStep?.pseudocodeLine === i;
              return (
                <motion.div 
                  key={i} animate={{ backgroundColor: isActive ? "hsla(0, 100%, 50%, 0.15)" : "transparent" }} 
                  className={`px-2 py-1 rounded-sm transition-colors whitespace-pre ${isActive ? "text-red-400 border-l-2 border-red-500 font-bold" : "text-muted-foreground/70 border-l-2 border-transparent"}`}
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
