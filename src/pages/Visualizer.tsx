import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Play, Pause, SkipForward, SkipBack, RotateCcw, Shuffle, BookOpen, Users, BarChart3, Layers, RectangleVertical } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { VISUAL_ALGORITHMS, VISUAL_ALGORITHM_LIST, generateRandomArray } from "@/lib/visualizer-algorithms";
import type { VisualAlgorithmResult, VisualStep } from "@/lib/visualizer-algorithms";
import { VisualizerBars } from "@/components/VisualizerBars";

type VisualMode = "abstract" | "books" | "people" | "cards" | "boxes";

const DEFAULT_SIZE = 25;

export default function Visualizer() {
  const [algoKey, setAlgoKey] = useState("bubble");
  const [arraySize, setArraySize] = useState(DEFAULT_SIZE);
  const [array, setArray] = useState(() => generateRandomArray(DEFAULT_SIZE));
  const [customInput, setCustomInput] = useState("");
  const [result, setResult] = useState<VisualAlgorithmResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [visualMode, setVisualMode] = useState<VisualMode>("abstract");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chartData = useMemo(() => {
    return VISUAL_ALGORITHM_LIST.map(({ key, name }) => {
      const r = VISUAL_ALGORITHMS[key]([...array]);
      const lastStep = r.steps[r.steps.length - 1];
      return {
        name,
        comparisons: lastStep.comparisons,
        swaps: lastStep.swaps,
      };
    });
  }, [array]);

  // Recompute when array or algo changes
  useEffect(() => {
    const r = VISUAL_ALGORITHMS[algoKey]([...array]);
    setResult(r);
    setStepIndex(0);
    setIsPlaying(false);
  }, [array, algoKey]);

  // Animation loop
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && result) {
      const maxSteps = result.steps.length - 1;
      const delay = Math.max(10, 600 - speed * 5.5);
      intervalRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return maxSteps;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, result]);

  const handleShuffle = useCallback(() => {
    setArray(generateRandomArray(arraySize));
  }, [arraySize]);

  const handleSizeChange = useCallback((size: number) => {
    setArraySize(size);
    setArray(generateRandomArray(size));
  }, []);

  const handleCustomInput = useCallback(() => {
    const nums = customInput.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n > 0);
    if (nums.length >= 2) {
      setArraySize(nums.length);
      setArray(nums);
      setCustomInput("");
    }
  }, [customInput]);

  if (!result) return null;

  const step = result.steps[stepIndex];
  const maxSteps = result.steps.length - 1;
  const isComplete = stepIndex >= maxSteps;
  const maxValue = Math.max(...array);
  const progress = maxSteps > 0 ? (stepIndex / maxSteps) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 neon-glow-cyan">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight neon-text-cyan leading-none">
            Algorithm Visualizer
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Watch algorithms think and act in real time
          </p>
        </div>
      </motion.div>

      {/* Algorithm Selector + Input Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-4 space-y-3"
      >
        <div className="flex flex-wrap gap-2">
          {VISUAL_ALGORITHM_LIST.map(({ key, name }) => (
            <button
              key={key}
              onClick={() => setAlgoKey(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-display font-bold tracking-wider transition-all duration-200 cursor-pointer active:scale-95
                ${algoKey === key
                  ? "bg-primary/15 border border-primary/40 neon-text-cyan"
                  : "bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/60"
                }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[150px]">
            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">SIZE</span>
            <Slider
              value={[arraySize]}
              onValueChange={([v]) => handleSizeChange(v)}
              min={5}
              max={60}
              step={1}
              className="flex-1"
            />
            <span className="text-xs font-mono text-primary w-6 text-right">{arraySize}</span>
          </div>
          <Button onClick={handleShuffle} size="sm" variant="outline" className="gap-1.5 border-muted-foreground/30 text-muted-foreground text-xs">
            <Shuffle className="h-3 w-3" /> Randomize
          </Button>
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Custom: 45, 12, 78, 3, 56..."
            className="flex-1 h-8 rounded-md bg-muted/50 border border-border px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <Button onClick={handleCustomInput} size="sm" variant="outline" className="text-xs border-primary/30 text-primary h-8">
            Apply
          </Button>
        </div>
      </motion.div>

      {/* Main Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-4 space-y-3"
      >
        {/* Live Explanation */}
        <div className="flex items-center gap-2 min-h-[32px]">
          <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse-neon shrink-0" />
          <AnimatePresence mode="wait">
            <motion.p
              key={step.explanation}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-body text-foreground"
            >
              {step.explanation}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground mr-1">VIEW</span>
          {([
            { mode: "abstract" as VisualMode, icon: BarChart3, label: "Bars" },
            { mode: "books" as VisualMode, icon: BookOpen, label: "Books" },
            { mode: "people" as VisualMode, icon: Users, label: "People" },
            { mode: "cards" as VisualMode, icon: RectangleVertical, label: "Cards" },
            { mode: "boxes" as VisualMode, icon: Layers, label: "Boxes" },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setVisualMode(mode)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-display font-bold tracking-wider transition-all cursor-pointer active:scale-95
                ${visualMode === mode
                  ? "bg-primary/15 border border-primary/40 neon-text-cyan"
                  : "bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/60"
                }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Bars */}
        <VisualizerBars step={step} maxValue={maxValue} arraySize={arraySize} mode={visualMode} />
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-4 flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-1.5">
          <Button
            onClick={() => setStepIndex((p) => Math.max(0, p - 1))}
            size="icon"
            variant="outline"
            className="h-8 w-8 border-muted-foreground/30 text-muted-foreground"
            disabled={stepIndex === 0}
          >
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => {
              if (isComplete) { setStepIndex(0); setIsPlaying(true); }
              else setIsPlaying(!isPlaying);
            }}
            size="icon"
            className="h-9 w-9 bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary neon-glow-cyan"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setStepIndex((p) => Math.min(maxSteps, p + 1))}
            size="icon"
            variant="outline"
            className="h-8 w-8 border-muted-foreground/30 text-muted-foreground"
            disabled={isComplete}
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => { setStepIndex(0); setIsPlaying(false); }}
            size="icon"
            variant="outline"
            className="h-8 w-8 border-muted-foreground/30 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-[10px] font-mono text-muted-foreground">SPEED</span>
          <Slider
            value={[speed]}
            onValueChange={([v]) => setSpeed(v)}
            min={1}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>STEP</span>
          <span className="text-primary">{stepIndex}</span>
          <span>/</span>
          <span>{maxSteps}</span>
        </div>
      </motion.div>

      {/* Bottom Panels: Pseudocode + Metrics + Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Pseudocode Panel */}
        <div className="glass-panel p-4 space-y-2">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Pseudocode
          </h3>
          <div className="space-y-0.5 font-mono text-xs">
            {result.pseudocode.map((line, i) => (
              <motion.div
                key={i}
                animate={{
                  backgroundColor: step.pseudocodeLine === i
                    ? "hsla(195, 100%, 50%, 0.12)"
                    : "transparent",
                }}
                className={`px-2 py-0.5 rounded-sm transition-colors ${
                  step.pseudocodeLine === i
                    ? "text-primary border-l-2 border-primary"
                    : "text-muted-foreground/70 border-l-2 border-transparent"
                }`}
              >
                {line}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Performance
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricBox label="Comparisons" value={step.comparisons} color="cyan" />
            <MetricBox label="Swaps" value={step.swaps} color="purple" />
            <MetricBox label="Step" value={`${stepIndex}/${maxSteps}`} color="green" />
            <MetricBox label="Array Size" value={arraySize} color="pink" />
          </div>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-2 rounded-md bg-neon-green/10 border border-neon-green/30 text-center"
            >
              <span className="text-xs font-display text-neon-green font-bold tracking-wider">
                SORTING COMPLETE
              </span>
            </motion.div>
          )}
        </div>

        {/* Algorithm Info */}
        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Algorithm Info
          </h3>
          <div>
            <span className="font-display text-sm font-bold neon-text-cyan">{result.name}</span>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{result.description}</p>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Complexity</span>
              <span className="font-mono text-neon-yellow">{result.timeComplexity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Space Complexity</span>
              <span className="font-mono text-neon-green">{result.spaceComplexity}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cross-Algorithm Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel p-4 space-y-4"
      >
        <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Performance Comparison (Comparisons vs Swaps)
        </h3>
        <div className="w-full h-[250px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "rgba(10, 10, 15, 0.9)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} 
                itemStyle={{ fontWeight: "bold" }} 
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
              <Bar dataKey="comparisons" name="Comparisons" fill="hsl(var(--neon-cyan))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="swaps" name="Swaps" fill="hsl(var(--neon-purple))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    cyan: "border-neon-cyan/20",
    purple: "border-neon-purple/20",
    green: "border-neon-green/20",
    pink: "border-neon-pink/20",
  };
  const textClasses: Record<string, string> = {
    cyan: "text-neon-cyan",
    purple: "text-neon-purple",
    green: "text-neon-green",
    pink: "text-neon-pink",
  };
  return (
    <div className={`rounded-md p-2 bg-muted/30 border ${colorClasses[color]}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`font-mono text-sm font-bold ${textClasses[color]}`}>{value}</div>
    </div>
  );
}
