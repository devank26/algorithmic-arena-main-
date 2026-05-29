import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Trash2, Move, Navigation, Volume2, VolumeX, Code2, Radio, Activity, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AdvNode, AdvEdge } from "@/lib/advanced-graph-algorithms";
import { runKosaraju, runTarjan, SCCStep, KOSARAJU_PSEUDOCODE, TARJAN_PSEUDOCODE } from "@/lib/scc-algorithms";
import { NODE_FILL, NODE_STROKE, NODE_TEXT, NODE_GLOW, EDGE_COLOR } from "@/lib/graph-colors";

type Tool = "select" | "add_node" | "add_edge" | "erase";
type SCCMode = "kosaraju" | "tarjan";

const INIT_NODES: AdvNode[] = [
  { id: "0", x: 100, y: 150, label: "0" },
  { id: "1", x: 250, y: 80, label: "1" },
  { id: "2", x: 200, y: 300, label: "2" },
  { id: "3", x: 350, y: 200, label: "3" },
  { id: "4", x: 450, y: 350, label: "4" },
];

const INIT_EDGES: AdvEdge[] = [
  { id: "e1", source: "1", target: "0", weight: 1 },
  { id: "e2", source: "0", target: "2", weight: 1 },
  { id: "e3", source: "2", target: "1", weight: 1 },
  { id: "e4", source: "0", target: "3", weight: 1 },
  { id: "e5", source: "3", target: "4", weight: 1 },
];

export function SCCVisualizer() {
  const [nodes, setNodes] = useState<AdvNode[]>(INIT_NODES);
  const [edges, setEdges] = useState<AdvEdge[]>(INIT_EDGES);
  const [tool, setTool] = useState<Tool>("select");
  const [sccMode, setSccMode] = useState<SCCMode>("kosaraju");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // States for Execution
  const [steps, setSteps] = useState<SCCStep[]>([]);
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
        const utterance = new SpeechSynthesisUtterance(currentStep.explanation.replace(/AI:|AI SUCCESS:/g, ""));
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
    let computedSteps: SCCStep[] = [];
    if (sccMode === "kosaraju") computedSteps = runKosaraju(nodes, edges);
    if (sccMode === "tarjan") computedSteps = runTarjan(nodes, edges);
    
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

  // Derive unique HSL colors for up to 12 clusters
  const getSCCColor = (sccIndex: number) => {
     return `hsl(${sccIndex * 55}, 100%, 75%)`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-neon-yellow flex items-center gap-2">
            <Activity className="h-5 w-5" /> Strongly Connected Components Zone
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Isolate directional topological cycles using massive depth-first tracking algorithms.</p>
        </div>

        <div className="glass-panel p-2 flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-muted/40 p-1 rounded border border-border/50 text-xs mr-2">
            {[
              { id: "kosaraju", label: "Kosaraju's Alg" },
              { id: "tarjan", label: "Tarjan's Alg" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setSccMode(m.id as SCCMode); resetSimulation(); }}
                className={`px-3 py-1.5 rounded transition-all ${sccMode === m.id ? "bg-neon-yellow/20 text-neon-yellow font-bold border border-neon-yellow/30" : "text-muted-foreground"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border mx-1" />

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
              <Button onClick={runSimulation} className="bg-neon-yellow/20 border-neon-yellow/40 text-neon-yellow hover:bg-neon-yellow/30 text-xs ml-2">
                <Play className="h-3.5 w-3.5 mr-1" /> Run Engine
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
            className={voiceEnabled ? "border-neon-yellow text-neon-yellow" : "text-muted-foreground"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        
        {/* GRAPH CANVAS */}
        <div className="glass-panel overflow-hidden h-[500px] flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 to-transparent">
          {currentStep?.phaseMessage && (
             <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className={`absolute top-0 right-0 ${currentStep.isReversedOut ? 'bg-neon-pink' : 'bg-neon-yellow'} text-black px-4 py-1.5 font-display font-bold text-xs uppercase tracking-widest rounded-bl-lg shadow-lg z-10 transition-colors`}>
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
            <defs>
              <marker id="arrow-scc" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" opacity={0.6}/>
              </marker>
              <marker id="arrow-scc-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--neon-cyan)" />
              </marker>
            </defs>

            {edges.map(ed => {
              const src = nodes.find(n => n.id === (currentStep?.isReversedOut ? ed.target : ed.source));
              const tgt = nodes.find(n => n.id === (currentStep?.isReversedOut ? ed.source : ed.target));
              if (!src || !tgt) return null;

              let stroke = EDGE_COLOR.default;
              let strokeWidth = 2;
              let opacity = 0.5;
              let marker = "url(#arrow-scc)";

              if (currentStep) {
                if (currentStep.activeEdges?.includes(ed.id)) {
                   stroke = EDGE_COLOR.active;
                   strokeWidth = 3;
                   opacity = 1;
                   marker = "url(#arrow-scc-active)";
                } else if (currentStep.isReversedOut) {
                   stroke = EDGE_COLOR.back;
                   marker = ""; 
                }
              }

              // Are both nodes in same SCC?
              let sccGroupIndex = -1;
              if (currentStep?.sccs) {
                 sccGroupIndex = currentStep.sccs.findIndex(group => group.includes(src.id) && group.includes(tgt.id));
              }
              if (sccGroupIndex !== -1) {
                 stroke = getSCCColor(sccGroupIndex);
                 strokeWidth = 3;
                 opacity = 1;
              }

              return (
                <g key={ed.id} onClick={e => handleEdgeClick(e, ed.id)}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={opacity}
                    markerEnd={currentStep?.isReversedOut && sccGroupIndex === -1 ? "" : marker}
                    className="transition-all duration-300"
                  />
                  {currentStep?.isReversedOut && sccGroupIndex === -1 && (
                     <polygon 
                        points="0,0 10,5 0,10" 
                        fill={EDGE_COLOR.back} 
                        opacity={opacity}
                        transform={`translate(${tgt.x - (tgt.x - src.x)*0.15}, ${tgt.y - (tgt.y - src.y)*0.15}) rotate(${Math.atan2(tgt.y - src.y, tgt.x - src.x) * 180 / Math.PI}) translate(-10, -5)`} 
                     />
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

              let sccGroupIndex = -1;
              if (currentStep?.sccs) {
                 sccGroupIndex = currentStep.sccs.findIndex(group => group.includes(n.id));
              }

              if (currentStep) {
                if (currentStep.activeNodes?.includes(n.id)) {
                  fill = NODE_FILL.active;
                  strokeColor = NODE_STROKE.active;
                  textColor = NODE_TEXT.active;
                  glow = NODE_GLOW.active;
                } else if (sccGroupIndex !== -1) {
                  const c = getSCCColor(sccGroupIndex);
                  fill = c;
                  strokeColor = c;
                  textColor = "black";
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
                    r={20} fill={fill} stroke={strokeColor} strokeWidth={3}
                    className="transition-colors duration-300 shadow-xl"
                  />
                  <text 
                    textAnchor="middle" dominantBaseline="central" 
                    fill={textColor} fontSize={14} fontWeight="bold" fontFamily="monospace"
                  >
                    {n.label}
                  </text>
                  
                  {/* Tarjan Specific Badges! */}
                  {sccMode === "tarjan" && currentStep?.disksMap && currentStep.disksMap[n.id] !== undefined && currentStep.disksMap[n.id] !== -1 && (
                     <g transform="translate(18, -18)">
                        <rect x={-8} y={-8} width={16} height={16} fill="#0F172A" stroke={NODE_STROKE.current} strokeWidth={1} rx={4}/>
                        <text textAnchor="middle" dominantBaseline="central" fill={NODE_STROKE.current} fontSize={10} fontFamily="monospace" fontWeight="bold">
                          {currentStep.disksMap[n.id]}
                        </text>
                     </g>
                  )}
                  {sccMode === "tarjan" && currentStep?.lowLinkMap && currentStep.lowLinkMap[n.id] !== undefined && currentStep.lowLinkMap[n.id] !== -1 && (
                     <g transform="translate(-18, -18)">
                        <rect x={-8} y={-8} width={16} height={16} fill="#0F172A" stroke="#06B6D4" strokeWidth={1} rx={4}/>
                        <text textAnchor="middle" dominantBaseline="central" fill="#06B6D4" fontSize={10} fontFamily="monospace" fontWeight="bold">
                          {currentStep.lowLinkMap[n.id]}
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
           <h3 className="font-display text-[12px] font-bold tracking-widest text-neon-yellow uppercase border-b border-border/50 pb-2 flex items-center gap-2">
             <TerminalSquare className="h-4 w-4" /> SCC Tracing Analytics
           </h3>

           <div className="flex-1 overflow-y-auto space-y-4">
              
              <div className="space-y-4">
                 <div className="bg-muted/10 p-2 rounded border border-border">
                   <h4 className="text-[10px] uppercase text-muted-foreground tracking-widest mb-2 font-bold break-words flex items-center justify-between">
                     Active Depth Stack
                     {sccMode === "tarjan" && <span className="text-neon-cyan">Tarjan Discovery</span>}
                     {sccMode === "kosaraju" && <span className="text-neon-pink">Post-Order Bounds</span>}
                   </h4>
                   <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                     {currentStep?.orderedStack && currentStep.orderedStack.length > 0 ? (
                        currentStep.orderedStack.map((stackedId, idx) => (
                           <div key={`${stackedId}-${idx}`} className="w-8 h-8 rounded bg-background border border-border text-foreground flex items-center justify-center font-bold font-mono text-xs shadow-md animate-scale-in">
                             {nodes.find(n=>n.id===stackedId)?.label}
                           </div>
                        ))
                     ) : (
                        <span className="text-xs text-muted-foreground/40 italic">Buffer sequence empty...</span>
                     )}
                   </div>
                 </div>
              </div>

              {currentStep && currentStep.sccs && currentStep.sccs.length > 0 && (
                 <div className="anime-fade-in space-y-2">
                   <h4 className="text-[10px] uppercase text-neon-yellow tracking-widest mb-1 font-bold">Isolated Connected Groups</h4>
                   <div className="space-y-2">
                     {currentStep.sccs.map((group, gIdx) => (
                        <div key={gIdx} className="p-2 border rounded shadow-md" style={{ borderColor: getSCCColor(gIdx), backgroundColor: getSCCColor(gIdx) + '1A' }}>
                          <span className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: getSCCColor(gIdx) }}>
                             Structural Tree {gIdx + 1}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {group.map(id => (
                               <div key={id} className="w-6 h-6 rounded-sm text-black font-bold flex items-center justify-center text-xs" style={{ backgroundColor: getSCCColor(gIdx) }}>
                                 {nodes.find(n=>n.id===id)?.label}
                               </div>
                            ))}
                          </div>
                        </div>
                     ))}
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
                className={`text-sm font-mono leading-relaxed ${currentStep?.explanation ? (currentStep?.explanation.includes("ERROR") || currentStep?.explanation.includes("FAILURE") ? "text-neon-pink font-bold" : "text-foreground") : "text-muted-foreground italic"}`}
              >
                {currentStep?.explanation || "Awaiting structural components rendering logic..."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Tracing ({sccMode})
          </h3>
          <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30 overflow-y-auto max-h-[140px]">
            {(sccMode === "kosaraju" ? KOSARAJU_PSEUDOCODE : TARJAN_PSEUDOCODE).map((line, i) => {
              const isActive = currentStep?.pseudocodeLine === i;
              return (
                <motion.div 
                  key={i} animate={{ backgroundColor: isActive ? "hsla(60, 100%, 50%, 0.15)" : "transparent" }} 
                  className={`px-2 py-1 rounded-sm transition-colors whitespace-pre ${isActive ? "text-neon-yellow border-l-2 border-neon-yellow font-bold" : "text-muted-foreground/70 border-l-2 border-transparent"}`}
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
