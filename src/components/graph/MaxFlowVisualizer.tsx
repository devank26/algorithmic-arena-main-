import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Trash2, Move, Navigation, Volume2, VolumeX, Code2, Radio, Activity, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AdvNode, AdvEdge } from "@/lib/advanced-graph-algorithms";
import { runMaxFlowMinCut, FlowStep, MAX_FLOW_PSEUDOCODE } from "@/lib/max-flow-algorithms";
import { NODE_FILL, NODE_STROKE, NODE_TEXT, NODE_GLOW, EDGE_COLOR } from "@/lib/graph-colors";

type Tool = "select" | "add_node" | "add_edge" | "erase";

const INIT_NODES: AdvNode[] = [
  { id: "S", x: 80, y: 250, label: "S" },
  { id: "1", x: 250, y: 150, label: "A" },
  { id: "2", x: 250, y: 350, label: "B" },
  { id: "3", x: 450, y: 150, label: "C" },
  { id: "4", x: 450, y: 350, label: "D" },
  { id: "T", x: 650, y: 250, label: "T" },
];

const INIT_EDGES: AdvEdge[] = [
  { id: "e1", source: "S", target: "1", weight: 10 },
  { id: "e2", source: "S", target: "2", weight: 10 },
  { id: "e3", source: "1", target: "2", weight: 2 },
  { id: "e4", source: "1", target: "3", weight: 4 },
  { id: "e5", source: "1", target: "4", weight: 8 },
  { id: "e6", source: "2", target: "4", weight: 9 },
  { id: "e7", source: "3", target: "T", weight: 10 },
  { id: "e8", source: "4", target: "3", weight: 6 },
  { id: "e9", source: "4", target: "T", weight: 10 },
];

export function MaxFlowVisualizer() {
  const [nodes, setNodes] = useState<AdvNode[]>(INIT_NODES);
  const [edges, setEdges] = useState<AdvEdge[]>(INIT_EDGES);
  const [tool, setTool] = useState<Tool>("select");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // States for Execution
  const [steps, setSteps] = useState<FlowStep[]>([]);
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
          const weightStr = window.prompt("Enter Edge Capacity limit (positive integer):", "10");
          const weight = parseInt(weightStr || "10");
          if (!isNaN(weight) && weight > 0) {
            setEdges([...edges, { id: Date.now().toString(), source: edgeStart, target: id, weight }]);
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
    // Defaulting to "S" and "T" identifiers if they exist, else first and last node.
    let sourceId = nodes.find(n => n.id === "S")?.id;
    let sinkId = nodes.find(n => n.id === "T")?.id;
    if (!sourceId) sourceId = nodes[0].id;
    if (!sinkId) sinkId = nodes[nodes.length - 1].id;

    if (!sourceId || !sinkId || sourceId === sinkId) {
        alert("Need distinct valid source and sink nodes.");
        return;
    }

    const computedSteps = runMaxFlowMinCut(nodes, edges, sourceId, sinkId);
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
          <h2 className="text-xl font-display font-bold text-neon-cyan flex items-center gap-2">
            <Activity className="h-5 w-5" /> Network Flow Simulator (Edmonds-Karp / Min-Cut)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Isolate maximum volumetric capacities and trace resulting structural mathematical topological partitions.</p>
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
              <Button onClick={runSimulation} className="bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30 text-xs ml-2">
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
            <div className="absolute top-0 right-0 bg-neon-cyan text-black px-4 py-1.5 font-display font-bold text-xs uppercase tracking-widest rounded-bl-lg shadow-lg z-10 animate-fade-in">
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
              <marker id="arrow-flow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" opacity={0.6}/>
              </marker>
              <marker id="arrow-flow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--neon-green)" />
              </marker>
              <marker id="arrow-flow-cut" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--neon-pink)" opacity={1}/>
              </marker>
            </defs>

            {edges.map(ed => {
              const src = nodes.find(n => n.id === ed.source);
              const tgt = nodes.find(n => n.id === ed.target);
              if (!src || !tgt) return null;

              let stroke = EDGE_COLOR.default;
              let strokeWidth = 2;
              let opacity = 0.55;
              let marker = "url(#arrow-flow)";

              let edgeFlow = currentStep?.edgeFlows?.[ed.id] || 0;
              let capacityText = `${edgeFlow}/${ed.weight}`;

              if (currentStep) {
                if (currentStep.activeEdges?.includes(ed.id)) {
                   stroke = EDGE_COLOR.finalPath;
                   strokeWidth = 4;
                   opacity = 1;
                   marker = "url(#arrow-flow-active)";
                } else if (currentStep.cutEdges?.includes(ed.id)) {
                   stroke = EDGE_COLOR.rejected;
                   strokeWidth = 4;
                   opacity = 1;
                   marker = "url(#arrow-flow-cut)";
                } else if (edgeFlow > 0) {
                   stroke = EDGE_COLOR.flow;
                   opacity = 0.8;
                }
              } else {
                 capacityText = ed.weight.toString();
              }

              return (
                <g key={ed.id} onClick={e => handleEdgeClick(e, ed.id)}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={opacity}
                    markerEnd={marker}
                    className="transition-all duration-300"
                  />
                  <rect 
                    x={(src.x + tgt.x)/2 - 16} y={(src.y + tgt.y)/2 - 12} 
                    width={32} height={24} rx={4}
                    fill={stroke === EDGE_COLOR.rejected ? "#EF4444" : (stroke === EDGE_COLOR.finalPath ? "#22C55E" : "#0F172A")} 
                    stroke={stroke} strokeOpacity={opacity}
                    className="transition-colors duration-300"
                  />
                  <text
                    x={(src.x + tgt.x)/2} y={(src.y + tgt.y)/2}
                    textAnchor="middle" dominantBaseline="central"
                    fill={stroke === EDGE_COLOR.rejected || stroke === EDGE_COLOR.finalPath ? "white" : "#F1F5F9"}
                    fontSize={10} fontFamily="monospace" fontWeight="bold"
                  >
                    {capacityText}
                  </text>
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
                if (currentStep.sSet?.includes(n.id)) {
                  fill = NODE_FILL.scc;
                  strokeColor = NODE_STROKE.scc;
                  textColor = "black";
                  glow = NODE_GLOW.scc;
                } else if (currentStep.tSet?.includes(n.id)) {
                  fill = NODE_FILL.frontier;
                  strokeColor = NODE_STROKE.frontier;
                  textColor = "white";
                  glow = NODE_GLOW.frontier;
                } else if (currentStep.augmentingPath?.includes(n.id)) {
                  fill = NODE_FILL.finalPath;
                  strokeColor = NODE_STROKE.finalPath;
                  textColor = "white";
                  glow = NODE_GLOW.finalPath;
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
                </g>
              );
            })}
          </svg>
        </div>

        {/* HUD SIDEBAR */}
        <div className="glass-panel p-4 flex flex-col gap-4 overflow-hidden max-h-[500px]">
           <h3 className="font-display text-[12px] font-bold tracking-widest text-neon-cyan uppercase border-b border-border/50 pb-2 flex items-center gap-2">
             <TerminalSquare className="h-4 w-4" /> Bottleneck Metrics
           </h3>

           <div className="flex-1 overflow-y-auto space-y-4">
              <div className="flex flex-col gap-2">
                 <div className="bg-muted/20 border border-border/50 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Volumetric Max Flow</span>
                    <span className="text-2xl font-bold font-mono text-neon-cyan">
                       {currentStep?.currentFlow || 0}
                    </span>
                 </div>
                 {currentStep?.minCutCapacity !== undefined && (
                   <div className="bg-neon-pink/10 border border-neon-pink/30 rounded-lg p-3 text-center animate-fade-in shadow-[0_0_15px_rgba(255,0,128,0.2)]">
                      <span className="text-[10px] text-neon-pink uppercase tracking-widest block mb-1 font-bold">Absolute Min-Cut Target</span>
                      <span className="text-2xl font-bold font-mono text-neon-pink">
                         {currentStep.minCutCapacity}
                      </span>
                   </div>
                 )}
              </div>

              {currentStep?.bottleneck !== undefined && (
                 <div className="bg-muted/10 p-2 rounded text-xs border border-border">
                   <strong className="text-neon-yellow">Path Bottleneck Tolerance:</strong> <span className="font-mono ml-2">+ {currentStep.bottleneck} Route Expansion</span>
                 </div>
              )}

              {currentStep?.sSet && (
                 <div className="space-y-2 mt-4 anime-fade-in">
                    <div>
                      <span className="text-[10px] text-neon-cyan uppercase tracking-widest mb-1 block font-bold">Partition: S-Set (Source Reachable)</span>
                      <div className="flex flex-wrap gap-1">
                        {currentStep.sSet.map(nId => (
                          <span key={nId} className="w-6 h-6 rounded-sm bg-neon-cyan text-black font-bold flex items-center justify-center text-xs">
                             {nodes.find(n=>n.id===nId)?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-neon-purple uppercase tracking-widest mb-1 block font-bold">Partition: T-Set (Sink Group)</span>
                      <div className="flex flex-wrap gap-1">
                        {currentStep.tSet?.map(nId => (
                          <span key={nId} className="w-6 h-6 rounded-sm bg-neon-purple text-black font-bold flex items-center justify-center text-xs">
                             {nodes.find(n=>n.id===nId)?.label}
                          </span>
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
            <Radio className="h-3.5 w-3.5 text-neon-yellow" /> System Logic Explanation
          </h3>
          <div className="min-h-[60px] flex items-center bg-muted/20 rounded p-3 border border-border/50">
            <AnimatePresence mode="wait">
              <motion.p 
                key={currentStep?.explanation || "empty"}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} 
                className={`text-sm font-mono leading-relaxed ${currentStep?.explanation ? (currentStep?.explanation.includes("ERROR") || currentStep?.explanation.includes("FAILURE") ? "text-neon-pink font-bold" : "text-foreground") : "text-muted-foreground italic"}`}
              >
                {currentStep?.explanation || "Awaiting advanced topological compilation..."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Loop (Flow-Logic)
          </h3>
          <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30 overflow-y-auto max-h-[140px]">
            {MAX_FLOW_PSEUDOCODE.map((line, i) => {
              const isActive = currentStep?.pseudocodeLine === i;
              return (
                <motion.div 
                  key={i} animate={{ backgroundColor: isActive ? "hsla(180, 100%, 50%, 0.15)" : "transparent" }} 
                  className={`px-2 py-1 rounded-sm transition-colors whitespace-pre ${isActive ? "text-neon-cyan border-l-2 border-neon-cyan font-bold" : "text-muted-foreground/70 border-l-2 border-transparent"}`}
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
