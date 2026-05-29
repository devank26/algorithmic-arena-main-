import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Trash2, MousePointer, Move, Navigation, Volume2, VolumeX, Code2, Radio, SplitSquareHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MSTNode, MSTEdge, MSTStep, runPrim, runKruskal, PRIM_PSEUDOCODE, KRUSKAL_PSEUDOCODE } from "@/lib/mst-algorithms";
import { NODE_FILL, NODE_STROKE, NODE_TEXT, NODE_GLOW, EDGE_COLOR } from "@/lib/graph-colors";

type Tool = "select" | "add_node" | "add_edge" | "erase";
type MSTMode = "prim" | "kruskal" | "compare";

const INIT_NODES: MSTNode[] = [
  { id: "0", x: 100, y: 100, label: "A" },
  { id: "1", x: 300, y: 80, label: "B" },
  { id: "2", x: 400, y: 200, label: "C" },
  { id: "3", x: 250, y: 300, label: "D" },
  { id: "4", x: 80, y: 250, label: "E" },
];

const INIT_EDGES: MSTEdge[] = [
  { id: "e1", source: "0", target: "1", weight: 4 },
  { id: "e2", source: "1", target: "2", weight: 2 },
  { id: "e3", source: "2", target: "3", weight: 3 },
  { id: "e4", source: "3", target: "4", weight: 2 },
  { id: "e5", source: "4", target: "0", weight: 5 },
  { id: "e6", source: "0", target: "3", weight: 7 },
  { id: "e7", source: "1", target: "4", weight: 1 },
];

export function MSTVisualizer() {
  const [nodes, setNodes] = useState<MSTNode[]>(INIT_NODES);
  const [edges, setEdges] = useState<MSTEdge[]>(INIT_EDGES);
  const [tool, setTool] = useState<Tool>("select");
  const [mstMode, setMstMode] = useState<MSTMode>("kruskal");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // States for Execution
  const [stepsPrim, setStepsPrim] = useState<MSTStep[]>([]);
  const [stepsKruskal, setStepsKruskal] = useState<MSTStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);

  const [edgeStart, setEdgeStart] = useState<string | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const activeSteps = mstMode === "prim" ? stepsPrim : mstMode === "kruskal" ? stepsKruskal : stepsKruskal; // Compare binds to longest
      const maxLen = mstMode === "compare" ? Math.max(stepsPrim.length, stepsKruskal.length) : activeSteps.length;
      
      if (stepIndex < maxLen - 1) {
        const delay = Math.max(50, 3000 - speed * 29.5);
        intervalRef.current = setInterval(() => {
          setStepIndex(prev => {
            if (prev >= maxLen - 1) {
              setIsPlaying(false);
              return maxLen - 1;
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
  }, [isPlaying, speed, stepIndex, mstMode, stepsPrim, stepsKruskal]);

  // Voice engine
  useEffect(() => {
    if (voiceEnabled && isPlaying && mstMode !== "compare") {
      const stepsToRead = mstMode === "prim" ? stepsPrim : stepsKruskal;
      if (stepsToRead.length > 0) {
        const currentStep = stepsToRead[Math.min(stepIndex, stepsToRead.length - 1)];
        if (currentStep?.explanation) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(currentStep.explanation);
          utterance.rate = 1.15;
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  }, [stepIndex, voiceEnabled, isPlaying, mstMode, stepsPrim, stepsKruskal]);

  const handleSVGClick = (e: React.MouseEvent) => {
    const isEditingAllowed = stepsPrim.length === 0 && stepsKruskal.length === 0;
    if (!isEditingAllowed) return;

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
    const isEditingAllowed = stepsPrim.length === 0 && stepsKruskal.length === 0;
    if (!isEditingAllowed) return;

    if (tool === "erase") {
      setNodes(nodes.filter(n => n.id !== id));
      setEdges(edges.filter(ed => ed.source !== id && ed.target !== id));
    } else if (tool === "add_edge") {
      if (!edgeStart) {
        setEdgeStart(id);
      } else {
        if (edgeStart !== id) {
          const weight = parseInt(window.prompt("Enter integer Edge Weight:", "1") || "1");
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
    const pSteps = runPrim(nodes, edges);
    const kSteps = runKruskal(nodes, edges);
    setStepsPrim(pSteps);
    setStepsKruskal(kSteps);
    setStepIndex(0);
    setIsPlaying(true);
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setStepsPrim([]);
    setStepsKruskal([]);
    setStepIndex(0);
    window.speechSynthesis.cancel();
  };

  // Helper renderer
  const renderGraphCanvas = (steps: MSTStep[], modeLabel: string) => {
    const currentStep = steps.length > 0 ? steps[Math.min(stepIndex, steps.length - 1)] : null;
    return (
      <div className="flex flex-col h-full">
        <div className="bg-muted/40 p-2 text-center text-xs font-bold tracking-wider uppercase text-muted-foreground border-b border-border shadow-sm">
          {modeLabel} Map
        </div>
        <div className="relative flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 to-transparent overflow-hidden">
          <svg
            ref={svgRef}
            onClick={modeLabel.includes("Prim") || stepsPrim.length === 0 ? handleSVGClick : undefined}
            onPointerMove={e => {
              if (svgRef.current) {
                const rect = svgRef.current.getBoundingClientRect();
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                if (dragNode) setNodes(nodes.map(n => n.id === dragNode ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n));
              }
            }}
            onPointerUp={() => setDragNode(null)}
            className="w-full h-full min-h-[350px] cursor-crosshair touch-none select-none"
          >
            {/* Draw Edges */}
            {edges.map(ed => {
              const src = nodes.find(n => n.id === ed.source);
              const tgt = nodes.find(n => n.id === ed.target);
              if (!src || !tgt) return null;

              let stroke = "hsl(var(--muted-foreground))";
              let strokeWidth = 2;
              let opacity = 0.3;
              let isAnimated = false;

              if (currentStep) {
                if (currentStep.mstEdges.includes(ed.id)) {
                  stroke = "var(--neon-green)";
                  strokeWidth = 4;
                  opacity = 1;
                } else if (currentStep.rejectedEdges.includes(ed.id)) {
                  stroke = "var(--neon-pink)";
                  strokeWidth = 2;
                  opacity = 0.5;
                } else if (currentStep.currentEdge === ed.id) {
                  stroke = "var(--neon-purple)";
                  strokeWidth = 5;
                  opacity = 1;
                  isAnimated = true;
                } else if (currentStep.candidateEdges.includes(ed.id)) {
                  stroke = "var(--neon-yellow)";
                  strokeWidth = 3;
                  opacity = 0.8;
                }
              }

              return (
                <g key={ed.id} onClick={e => handleEdgeClick(e, ed.id)}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={opacity}
                    className={`transition-all duration-300 ${isAnimated ? 'animate-pulse-neon' : ''}`}
                  />
                  <rect 
                    x={(src.x + tgt.x)/2 - 10} y={(src.y + tgt.y)/2 - 10} 
                    width={20} height={20} rx={4}
                    fill="hsl(var(--background))" stroke={stroke} strokeOpacity={opacity}
                  />
                  <text
                    x={(src.x + tgt.x)/2} y={(src.y + tgt.y)/2}
                    textAnchor="middle" dominantBaseline="central"
                    fill={opacity === 1 ? stroke : "currentColor"}
                    fontSize={10} fontFamily="monospace" fontWeight="bold"
                  >
                    {ed.weight}
                  </text>
                </g>
              );
            })}

            {/* Edge Drawing Placeholder */}
            {tool === "add_edge" && edgeStart && modeLabel.includes("Config") && (
              <line
                x1={nodes.find(n => n.id === edgeStart)?.x || 0}
                y1={nodes.find(n => n.id === edgeStart)?.y || 0}
                x2={mousePos.x} y2={mousePos.y}
                stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={2}
              />
            )}

            {/* Draw Nodes — Node State Rendering Engine */}
            {nodes.map(n => {
              // Never use transparent/black: always start with visible gray
              let fill        = NODE_FILL.default;
              let strokeColor = NODE_STROKE.default;
              let textColor   = NODE_TEXT.default;
              let glow        = NODE_GLOW.default;

              const isVisited = currentStep?.visitedNodes?.includes(n.id) ?? false;
              const isActive  = currentStep?.currentEdge && (
                edges.find(e => e.id === currentStep.currentEdge)?.source === n.id ||
                edges.find(e => e.id === currentStep.currentEdge)?.target === n.id
              ) ? true : false;

              if (currentStep) {
                if (isVisited) {
                  fill        = NODE_FILL.visited;
                  strokeColor = NODE_STROKE.visited;
                  textColor   = NODE_TEXT.visited;
                }
                if (isActive) {
                  fill        = NODE_FILL.current;
                  strokeColor = NODE_STROKE.current;
                  textColor   = NODE_TEXT.current;
                  glow        = NODE_GLOW.current;
                }
              }

              return (
                <g
                  key={n.id} transform={`translate(${n.x}, ${n.y})`}
                  onClick={e => handleNodeClick(e, n.id)}
                  onPointerDown={() => { if (tool === "select" && stepsPrim.length === 0) setDragNode(n.id); }}
                  className="cursor-pointer"
                  style={{ filter: glow }}
                >
                  {isActive && (
                    <circle r={22} fill="none" stroke={strokeColor} strokeWidth={2}
                      opacity={0.4} className="animate-ping"
                      style={{ transformOrigin: "0 0" }} />
                  )}
                  <circle
                    r={16} fill={fill} stroke={strokeColor}
                    strokeWidth={isActive ? 3 : 2}
                    className="transition-all duration-300"
                  />
                  <text
                    textAnchor="middle" dominantBaseline="central"
                    fill={textColor} fontSize={12} fontWeight="bold" fontFamily="monospace"
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
          {currentStep && (
            <div className="absolute top-2 left-2 p-2 bg-background/80 border border-border rounded backdrop-blur text-xs font-mono">
              <span className="text-muted-foreground block mb-1">Total MST Cost:</span>
              <span className="text-xl font-bold neon-text-green">{currentStep.totalCost}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleEdgeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (stepsPrim.length > 0) return;
    if (tool === "erase") setEdges(edges.filter(ed => ed.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-neon-purple flex items-center gap-2">
            <SplitSquareHorizontal className="h-5 w-5" /> Minimum Spanning Tree
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Prim's and Kruskal's Shortest Connective Topology.</p>
        </div>

        <div className="glass-panel p-2 flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-muted/40 p-1 rounded border border-border/50 text-xs mr-2">
            {[
              { id: "prim", label: "Prim's" },
              { id: "kruskal", label: "Kruskal's" },
              { id: "compare", label: "Compare Both" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMstMode(m.id as MSTMode)}
                className={`px-3 py-1.5 rounded transition-all ${mstMode === m.id ? "bg-neon-purple/20 text-neon-purple font-bold border border-neon-purple/30" : "text-muted-foreground"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border mx-1" />

          {stepsPrim.length === 0 ? (
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
              <Button onClick={runSimulation} className="bg-neon-purple/20 border-neon-purple/40 text-neon-purple hover:bg-neon-purple/30 text-xs ml-2">
                <Play className="h-3.5 w-3.5 mr-1" /> Build MST
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
            disabled={mstMode === "compare"}
            size="sm" variant="outline" 
            className={voiceEnabled ? "border-neon-yellow text-neon-yellow" : "text-muted-foreground"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
          </Button>
        </div>
      </div>

      {mstMode === "compare" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel overflow-hidden">{renderGraphCanvas(stepsPrim, "Prim's Algorithm")}</div>
          <div className="glass-panel overflow-hidden">{renderGraphCanvas(stepsKruskal, "Kruskal's Algorithm")}</div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden h-[500px]">
          {renderGraphCanvas(mstMode === "prim" ? stepsPrim : stepsKruskal, `${mstMode === "prim" ? "Prim's" : "Kruskal's"} Execution Configuration`)}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-3 items-center">
        {[
          { color: "bg-muted-foreground border-border", label: "Unselected Road" },
          { color: "bg-neon-yellow/30 border-neon-yellow", label: "Candidate Edge" },
          { color: "bg-neon-purple/50 border-neon-purple", label: "Active Review Edge" },
          { color: "bg-neon-green/50 border-neon-green", label: "Selected MST Edge" },
          { color: "bg-neon-pink/50 border-neon-pink", label: "Cycle Formed (Rejected)" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-6 h-1 rounded flex-shrink-0 border ${item.color}`} />
            <span className="text-[10px] text-muted-foreground font-mono">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Analytics Panel */}
      {mstMode !== "compare" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          <div className="glass-panel p-4 space-y-3">
            <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-neon-yellow" /> AI Execution Analysis
            </h3>
            <div className="min-h-[60px] flex items-center bg-muted/20 rounded p-3 border border-border/50">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={(mstMode === "prim" ? stepsPrim : stepsKruskal)[Math.min(stepIndex, (mstMode === "prim" ? stepsPrim : stepsKruskal).length - 1)]?.explanation || "empty"}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} 
                  className={`text-sm font-mono leading-relaxed ${(mstMode === "prim" ? stepsPrim : stepsKruskal)[Math.min(stepIndex, (mstMode === "prim" ? stepsPrim : stepsKruskal).length - 1)]?.explanation ? "text-foreground" : "text-muted-foreground italic"}`}
                >
                  {(mstMode === "prim" ? stepsPrim : stepsKruskal)[Math.min(stepIndex, (mstMode === "prim" ? stepsPrim : stepsKruskal).length - 1)]?.explanation || "Awaiting algorithm deployment..."}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="glass-panel p-4 space-y-3">
            <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Code2 className="h-3.5 w-3.5 text-neon-cyan" /> Algorithm Logic ({mstMode})
            </h3>
            <div className="space-y-0.5 font-mono text-xs bg-muted/10 p-2 rounded border border-border/30 overflow-x-auto">
              {(mstMode === "prim" ? PRIM_PSEUDOCODE : KRUSKAL_PSEUDOCODE).map((line, i) => {
                const stepArr = mstMode === "prim" ? stepsPrim : stepsKruskal;
                const isActive = stepArr[Math.min(stepIndex, stepArr.length - 1)]?.pseudocodeLine === i;
                return (
                  <motion.div 
                    key={i} animate={{ backgroundColor: isActive ? "hsla(270, 60%, 50%, 0.15)" : "transparent" }} 
                    className={`px-2 py-1 rounded-sm transition-colors whitespace-pre ${isActive ? "text-neon-purple border-l-2 border-neon-purple font-bold" : "text-muted-foreground/70 border-l-2 border-transparent"}`}
                  >
                    {line}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
