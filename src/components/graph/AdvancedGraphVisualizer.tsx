import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Trash2, Move, Navigation, Volume2, VolumeX, Code2, Radio, Activity, TerminalSquare, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  AdvNode, AdvEdge, AdvStep, 
  runTopologicalSort, runBellmanFord, runJohnsons, 
  TOPO_PSEUDOCODE, BF_PSEUDOCODE, JOHNSON_PSEUDOCODE 
} from "@/lib/advanced-graph-algorithms";
import { NODE_FILL, NODE_STROKE, NODE_TEXT, NODE_GLOW, EDGE_COLOR } from "@/lib/graph-colors";

type Tool = "select" | "add_node" | "add_edge" | "erase";
type AdvMode = "topo" | "bellman" | "johnson";

const INIT_NODES: AdvNode[] = [
  { id: "0", x: 100, y: 100, label: "A" },
  { id: "1", x: 300, y: 80, label: "B" },
  { id: "2", x: 400, y: 200, label: "C" },
  { id: "3", x: 250, y: 300, label: "D" },
  { id: "4", x: 80, y: 250, label: "E" },
];

const INIT_EDGES: AdvEdge[] = [
  { id: "e1", source: "0", target: "1", weight: 4 },
  { id: "e2", source: "1", target: "2", weight: -2 }, // negative weight for BF/Johnson
  { id: "e3", source: "0", target: "2", weight: 3 },
  { id: "e4", source: "3", target: "4", weight: 2 },
  { id: "e5", source: "2", target: "3", weight: 5 },
  { id: "e6", source: "0", target: "4", weight: 7 },
  // Ensure default is a DAG for Topo by keeping direction linear and no cycles
];

export function AdvancedGraphVisualizer() {
  const [nodes, setNodes] = useState<AdvNode[]>(INIT_NODES);
  const [edges, setEdges] = useState<AdvEdge[]>(INIT_EDGES);
  const [tool, setTool] = useState<Tool>("select");
  const [advMode, setAdvMode] = useState<AdvMode>("johnson");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // States for Execution
  const [steps, setSteps] = useState<AdvStep[]>([]);
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
        const utterance = new SpeechSynthesisUtterance(currentStep.explanation.replace(/AI:|AI ERROR FATAL:|AI FAILURE:|AI SUCCESS:/g, ""));
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
          const weightStr = window.prompt("Enter Edge Weight (Can be negative!):", "1");
          const weight = parseInt(weightStr || "1");
          if (!isNaN(weight)) {
            setEdges([...edges, { id: Date.now().toString(), source: edgeStart, target: id, weight }]);
          }
        }
        setEdgeStart(null);
      }
    }
  };

  const runSimulation = () => {
    window.speechSynthesis.cancel();
    let computedSteps: AdvStep[] = [];
    if (advMode === "topo") computedSteps = runTopologicalSort(nodes, edges);
    if (advMode === "bellman") computedSteps = runBellmanFord(nodes, edges, nodes[0].id); // Defaults to first node
    if (advMode === "johnson") computedSteps = runJohnsons(nodes, edges);
    
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
  const renderNodes = currentStep ? nodes.filter(n => currentStep.currentNodes.includes(n.id) || currentStep.currentNodes.includes("phantom_S") && n.id === "phantom_S") : nodes;
  
  // Mix in Phantom S specifically for UI during Johnson
  const allDrawNodes = [...renderNodes];
  if (currentStep?.currentNodes.includes("phantom_S") && !allDrawNodes.find(n=>n.id==="phantom_S")) {
    allDrawNodes.push({ id: "phantom_S", x: 250, y: 30, label: "S" });
  }

  const allDrawEdges = [...edges];
  if (currentStep?.currentNodes.includes("phantom_S")) {
     nodes.forEach(n => {
       allDrawEdges.push({ id: `p_${n.id}`, source: "phantom_S", target: n.id, weight: 0 });
     });
  }

  const handleEdgeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (steps.length > 0) return;
    if (tool === "erase") setEdges(edges.filter(ed => ed.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-neon-pink flex items-center gap-2">
            <Activity className="h-5 w-5" /> Advanced Graph Laboratory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Simulate massive structurally advanced graph mathematics dynamically.</p>
        </div>

        <div className="glass-panel p-2 flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-muted/40 p-1 rounded border border-border/50 text-xs mr-2">
            {[
              { id: "topo", label: "Topo Sort" },
              { id: "bellman", label: "Bellman-Ford" },
              { id: "johnson", label: "Johnson's" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setAdvMode(m.id as AdvMode); resetSimulation(); }}
                className={`px-3 py-1.5 rounded transition-all ${advMode === m.id ? "bg-neon-pink/20 text-neon-pink font-bold border border-neon-pink/30" : "text-muted-foreground"}`}
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
              <Button onClick={runSimulation} className="bg-neon-pink/20 border-neon-pink/40 text-neon-pink hover:bg-neon-pink/30 text-xs ml-2">
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
            <div className="absolute top-0 right-0 bg-neon-pink text-black px-4 py-1.5 font-display font-bold text-xs uppercase tracking-widest rounded-bl-lg shadow-lg z-10 animate-fade-in">
               {currentStep.phaseMessage}
            </div>
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
              <marker id="arrow-adv" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" opacity={0.6}/>
              </marker>
              <marker id="arrow-adv-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--neon-pink)" />
              </marker>
              <marker id="arrow-adv-reject" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--neon-pink)" opacity={0.8}/>
              </marker>
            </defs>

            {allDrawEdges.map(ed => {
              const src = allDrawNodes.find(n => n.id === ed.source);
              const tgt = allDrawNodes.find(n => n.id === ed.target);
              if (!src || !tgt) return null;

              let stroke = EDGE_COLOR.default;
              let strokeWidth = 2;
              let opacity = 0.55;
              let marker = "url(#arrow-adv)";

              if (currentStep) {
                if (currentStep.activeEdges?.includes(ed.id)) {
                   stroke = EDGE_COLOR.active;
                   strokeWidth = 3;
                   opacity = 1;
                   marker = "url(#arrow-adv-active)";
                } else if (currentStep.rejectedEdges?.includes(ed.id)) {
                   stroke = EDGE_COLOR.rejected;
                   strokeWidth = 4;
                   opacity = 0.8;
                   marker = "url(#arrow-adv-reject)";
                } else if (!currentStep.currentNodes.includes(src.id) || !currentStep.currentNodes.includes(tgt.id)) {
                   opacity = 0.05;
                }
              }

              // Visual dynamic weight rewrites for Johnson
              const displayWeight = currentStep?.edgeWeights?.[ed.id] !== undefined ? currentStep.edgeWeights[ed.id] : ed.weight;

              return (
                <g key={ed.id} onClick={e => handleEdgeClick(e, ed.id)}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={opacity}
                    markerEnd={marker}
                    className="transition-all duration-300"
                  />
                  <rect 
                    x={(src.x + tgt.x)/2 - 12} y={(src.y + tgt.y)/2 - 12} 
                    width={24} height={24} rx={4}
                    fill={stroke === EDGE_COLOR.active ? EDGE_COLOR.active : "#0F172A"} 
                    stroke={stroke} strokeOpacity={opacity}
                    className="transition-colors duration-300"
                  />
                  <text
                    x={(src.x + tgt.x)/2} y={(src.y + tgt.y)/2}
                    textAnchor="middle" dominantBaseline="central"
                    fill={stroke === EDGE_COLOR.active ? "black" : "currentColor"}
                    fontSize={11} fontFamily="monospace" fontWeight="bold" opacity={opacity}
                  >
                    {displayWeight}
                  </text>
                </g>
              );
            })}

            {tool === "add_edge" && edgeStart && (
              <line
                x1={allDrawNodes.find(n => n.id === edgeStart)?.x || 0}
                y1={allDrawNodes.find(n => n.id === edgeStart)?.y || 0}
                x2={mousePos.x} y2={mousePos.y}
                stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={2}
              />
            )}

            {allDrawNodes.map(n => {
              let fill = NODE_FILL.default;
              let strokeColor = NODE_STROKE.default;
              let textColor = NODE_TEXT.default;
              let glow = NODE_GLOW.default;
              let opacity = 1;

              if (n.id === "phantom_S") {
                 fill = "transparent";
                 strokeColor = "#A855F7"; // purple-500
                 textColor = "#A855F7";
              }

              if (currentStep) {
                if (!currentStep.currentNodes.includes(n.id) && n.id !== "phantom_S") {
                  opacity = 0.1;
                } else if (currentStep.activeNodes?.includes(n.id)) {
                  fill = NODE_FILL.active;
                  strokeColor = NODE_STROKE.active;
                  textColor = "black";
                  glow = NODE_GLOW.active;
                } else if (currentStep.completedNodes?.includes(n.id)) {
                  fill = NODE_FILL.finalPath;
                  strokeColor = NODE_STROKE.finalPath;
                  textColor = "white";
                  glow = NODE_GLOW.finalPath;
                }

                if (advMode === "topo" && currentStep.indegree && currentStep.indegree[n.id] === 0 && !currentStep.completedNodes?.includes(n.id)) {
                   strokeColor = NODE_STROKE.scc;
                   glow = NODE_GLOW.scc;
                }
              }

              return (
                <g 
                  key={n.id} transform={`translate(${n.x}, ${n.y})`}
                  onClick={e => handleNodeClick(e, n.id)}
                  onPointerDown={() => { if (tool === "select" && steps.length === 0) setDragNode(n.id); }}
                  className="cursor-pointer transition-opacity duration-500"
                  style={{ opacity }}
                >
                  <circle 
                    r={18} fill={fill} stroke={strokeColor} strokeWidth={n.id==="phantom_S" ? 2 : (strokeColor !== NODE_STROKE.default ? 3 : 2)}
                    strokeDasharray={n.id === "phantom_S" ? "4 4" : "0"}
                    className="transition-colors duration-300"
                  />
                  <text 
                    textAnchor="middle" dominantBaseline="central" 
                    fill={textColor} fontSize={14} fontWeight="bold" fontFamily="monospace"
                  >
                    {n.label}
                  </text>

                  {/* Topo Sort Indegree Badge */}
                  {advMode === "topo" && currentStep?.indegree && currentStep.indegree[n.id] !== undefined && (
                    <g transform="translate(14, -14)">
                      <circle r={8} fill="#1E293B" stroke={NODE_STROKE.default} strokeWidth={1}/>
                      <text textAnchor="middle" dominantBaseline="central" fill={NODE_TEXT.default} fontSize={10} fontFamily="monospace">{currentStep.indegree[n.id]}</text>
                    </g>
                  )}
                  {/* Potentials badge for Johnson */}
                  {advMode === "johnson" && currentStep?.potentials && currentStep.potentials[n.id] !== undefined && (
                    <g transform="translate(16, -16)">
                       <rect x={-14} y={-8} width={28} height={16} rx={2} fill="#A855F7" fillOpacity={0.2} stroke="#A855F7" strokeWidth={1} />
                       <text textAnchor="middle" dominantBaseline="central" fill="#A855F7" fontSize={10} fontFamily="monospace" fontWeight="bold">{currentStep.potentials[n.id] === Infinity ? "∞" : `h(${currentStep.potentials[n.id]})`}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* HUD SIDEBAR */}
        <div className="glass-panel p-4 flex flex-col gap-4 overflow-hidden max-h-[500px]">
           <h3 className="font-display text-[12px] font-bold tracking-widest text-neon-pink uppercase border-b border-border/50 pb-2 flex items-center gap-2">
             <TerminalSquare className="h-4 w-4" /> Operations Data
           </h3>

           {advMode === "topo" && (
              <div className="flex-1 overflow-y-auto space-y-4">
                 <div>
                   <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">Kahn's Execution Queue</span>
                   <div className="flex gap-2 flex-wrap min-h-[40px] bg-muted/20 p-2 rounded border border-border/50 items-center">
                      {currentStep?.queue && currentStep.queue.length > 0 ? currentStep.queue.map(qId => (
                        <div key={qId} className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan text-neon-cyan flex items-center justify-center font-bold text-xs shadow-[0_0_8px_rgba(0,255,255,0.3)] animate-fade-in">
                           {nodes.find(n=>n.id===qId)?.label}
                        </div>
                      )) : <span className="text-xs text-muted-foreground/50">Queue Empty</span>}
                   </div>
                 </div>
                 
                 <div>
                   <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">Final topological sequence</span>
                   <div className="flex gap-1 flex-wrap">
                      {currentStep?.completedNodes?.map((cId, idx) => (
                        <div key={cId} className="flex items-center">
                           <div className="w-6 h-6 rounded bg-neon-green text-black font-bold flex items-center justify-center text-xs animate-scale-in">
                             {nodes.find(n=>n.id===cId)?.label}
                           </div>
                           {idx < (currentStep?.completedNodes?.length || 0) - 1 && <span className="mx-1 text-muted-foreground">→</span>}
                        </div>
                      ))}
                   </div>
                 </div>
              </div>
           )}

           {(advMode === "bellman" || (advMode === "johnson" && (currentStep?.phaseMessage?.includes("Phase 2") || currentStep?.phaseMessage?.includes("Phase 4") || currentStep?.phaseMessage?.includes("Complete")))) && (
              <div className="flex-1 overflow-y-auto space-y-4">
                 <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-between">
                       Distance Map Data
                       {(advMode === "bellman" && currentStep?.potentials) && <AlertTriangle className="h-3 w-3 text-neon-yellow" />}
                    </span>
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="bg-muted/40 text-muted-foreground">
                          <th className="p-1.5 border border-border">Target Node</th>
                          <th className="p-1.5 border border-border">Current Distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nodes.map(n => {
                          let distVal = "∞";
                          let highlight = false;
                          if (currentStep?.distances && currentStep.distances[n.id] !== undefined) {
                            distVal = currentStep.distances[n.id] === Infinity ? "∞" : currentStep.distances[n.id].toString();
                            if (currentStep.activeNodes?.includes(n.id)) highlight = true;
                          }
                          // for johnson P4 tracking
                           if (currentStep?.distanceMatrix && currentStep.activeNodes && currentStep.activeNodes.length > 0) {
                              const activeSrc = currentStep.activeNodes[0];
                              const actualDist = currentStep.distanceMatrix[activeSrc][n.id];
                              if (actualDist !== undefined) distVal = actualDist === Infinity ? "∞" : actualDist.toString();
                           }

                          return (
                            <tr key={n.id} className={`transition-colors duration-300 ${highlight ? 'bg-neon-yellow/20' : ''}`}>
                               <td className="p-1.5 border border-border/50 text-foreground font-bold">{n.label}</td>
                               <td className={`p-1.5 border border-border/50 ${distVal !== "∞" ? 'text-neon-cyan' : 'text-muted-foreground'} ${highlight ? 'text-neon-yellow font-bold text-sm' : ''}`}>
                                 {distVal}
                               </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                 </div>
                 
                 {advMode === "johnson" && currentStep?.edgeWeights && (
                   <div className="bg-neon-purple/10 border border-neon-purple/30 p-2 rounded">
                      <span className="text-[10px] text-neon-purple font-mono block mb-1">Johnson Reweight Formula Applied:</span>
                      <code className="text-xs font-mono block text-foreground">w'(u,v) = w(u,v) + h(u) - h(v)</code>
                   </div>
                 )}
              </div>
           )}

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-neon-yellow" /> System Logic Explanation
          </h3>
          <div className="min-h-[60px] flex items-center bg-muted/20 rounded p-3 border border-border/50">
            <AnimatePresence mode="wait">
              <motion.p 
                key={currentStep?.explanation || "empty"}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} 
                className={`text-sm font-mono leading-relaxed ${currentStep?.explanation ? (currentStep?.explanation.includes("ERROR") || currentStep?.explanation.includes("FAILURE") ? "text-neon-pink font-bold" : "text-foreground") : "text-muted-foreground italic"}`}
              >
                {currentStep?.explanation || "Awaiting advanced math compilation..."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Loop ({advMode})
          </h3>
          <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30 overflow-y-auto max-h-[140px]">
            {(advMode === "topo" ? TOPO_PSEUDOCODE : advMode === "bellman" ? BF_PSEUDOCODE : JOHNSON_PSEUDOCODE).map((line, i) => {
              const isActive = currentStep?.pseudocodeLine === i;
              return (
                <motion.div 
                  key={i} animate={{ backgroundColor: isActive ? "hsla(330, 100%, 71%, 0.15)" : "transparent" }} 
                  className={`px-2 py-1 rounded-sm transition-colors whitespace-pre ${isActive ? "text-neon-pink border-l-2 border-neon-pink font-bold" : "text-muted-foreground/70 border-l-2 border-transparent"}`}
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
