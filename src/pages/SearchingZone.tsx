import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Pause, SkipForward, SkipBack, RotateCcw, Shuffle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SEARCH_ALGORITHMS, SEARCH_ALGORITHM_LIST, VisualSearchResult } from "@/lib/searching-algorithms";
import { generateRandomArray } from "@/lib/visualizer-algorithms";

const DEFAULT_SIZE = 25;

export default function SearchingZone() {
  const [algoKey, setAlgoKey] = useState("linear");
  const [arraySize, setArraySize] = useState(DEFAULT_SIZE);
  const [array, setArray] = useState(() => generateRandomArray(DEFAULT_SIZE));
  const [target, setTarget] = useState(array[Math.floor(Math.random() * array.length)]);
  const [result, setResult] = useState<VisualSearchResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const r = SEARCH_ALGORITHMS[algoKey]([...array], target);
    setResult(r);
    setStepIndex(0);
    setIsPlaying(false);
  }, [array, algoKey, target]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && result) {
      const maxSteps = result.steps.length - 1;
      const delay = Math.max(10, 800 - speed * 7.5);
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
    const newArr = generateRandomArray(arraySize);
    setArray(newArr);
    setTarget(newArr[Math.floor(Math.random() * newArr.length)]);
  }, [arraySize]);

  const handleSort = useCallback(() => {
    const newArr = [...array].sort((a, b) => a - b);
    setArray(newArr);
  }, [array]);

  const handleSizeChange = useCallback((size: number) => {
    setArraySize(size);
    const newArr = generateRandomArray(size);
    setArray(newArr);
    setTarget(newArr[Math.floor(Math.random() * newArr.length)]);
  }, []);

  if (!result) return null;

  const step = result.steps[stepIndex];
  const maxSteps = result.steps.length - 1;
  const isComplete = stepIndex >= maxSteps;
  const maxValue = Math.max(...array, target);
  const progress = maxSteps > 0 ? (stepIndex / maxSteps) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 neon-glow-cyan">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight neon-text-cyan leading-none">Searching Zone</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Find elements step-by-step</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {SEARCH_ALGORITHM_LIST.map(({ key, name }) => (
            <button key={key} onClick={() => setAlgoKey(key)} className={`px-3 py-1.5 rounded-md text-xs font-display font-bold tracking-wider transition-all cursor-pointer active:scale-95 ${algoKey === key ? "bg-primary/15 border border-primary/40 neon-text-cyan" : "bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/60"}`}>
              {name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[150px]">
            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">SIZE</span>
            <Slider value={[arraySize]} onValueChange={([v]) => handleSizeChange(v)} min={5} max={60} step={1} className="flex-1" />
            <span className="text-xs font-mono text-primary w-6 text-right">{arraySize}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">TARGET</span>
            <input type="number" value={target} onChange={(e) => setTarget(parseInt(e.target.value) || 0)} className="w-16 h-8 rounded-md bg-muted/50 border border-border px-2 text-xs font-mono text-foreground focus:outline-none" />
          </div>
          <Button onClick={handleShuffle} size="sm" variant="outline" className="gap-1.5 border-muted-foreground/30 text-muted-foreground text-xs"><Shuffle className="h-3 w-3" /> Randomize</Button>
          <Button onClick={handleSort} size="sm" variant="outline" className="gap-1.5 border-muted-foreground/30 text-muted-foreground text-xs"><ArrowUpCircle className="h-3 w-3" /> Sort Array</Button>
        </div>
      </motion.div>

      {/* Main Visualization */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-4 space-y-4">
        {/* Live Explanation */}
        <div className="flex items-center gap-2 min-h-[32px]">
          <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse-neon shrink-0" />
          <AnimatePresence mode="wait">
            <motion.p key={step.explanation} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="text-sm font-body text-foreground">{step.explanation}</motion.p>
          </AnimatePresence>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
        </div>

        {/* Arrays rendering */}
        <div className="flex items-end gap-[2px] min-h-[160px] pt-4">
          {step.array.map((value, index) => {
            const isComparing = step.comparing.includes(index);
            const isFound = step.found.includes(index);
            const inBounds = index >= step.leftBounds && index <= step.rightBounds;
            const heightPercent = (value / maxValue) * 100;
            
            let barClass = "bg-primary/50";
            if (!inBounds) barClass = "bg-muted-foreground/20 opacity-30";
            else if (isFound) barClass = "bg-neon-green bar-glow-green";
            else if (isComparing) barClass = "bg-neon-yellow bar-glow-yellow";

            return (
              <motion.div
                key={index}
                className={`flex-1 rounded-t-sm relative ${barClass}`}
                initial={false}
                animate={{ height: `${heightPercent}%`, scale: isComparing || isFound ? 1.05 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Button onClick={() => setStepIndex((p) => Math.max(0, p - 1))} size="icon" variant="outline" className="h-8 w-8 border-muted-foreground/30 text-muted-foreground" disabled={stepIndex === 0}><SkipBack className="h-3.5 w-3.5" /></Button>
          <Button onClick={() => { if (isComplete) { setStepIndex(0); setIsPlaying(true); } else setIsPlaying(!isPlaying); }} size="icon" className="h-9 w-9 bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary neon-glow-cyan">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
          <Button onClick={() => setStepIndex((p) => Math.min(maxSteps, p + 1))} size="icon" variant="outline" className="h-8 w-8 border-muted-foreground/30 text-muted-foreground" disabled={isComplete}><SkipForward className="h-3.5 w-3.5" /></Button>
          <Button onClick={() => { setStepIndex(0); setIsPlaying(false); }} size="icon" variant="outline" className="h-8 w-8 border-muted-foreground/30 text-muted-foreground"><RotateCcw className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-[10px] font-mono text-muted-foreground">SPEED</span>
          <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={1} max={100} step={1} className="flex-1" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>STEP</span><span className="text-primary">{stepIndex}</span><span>/</span><span>{maxSteps}</span>
        </div>
      </motion.div>

      {/* Bottom Panels */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pseudocode Panel */}
        <div className="glass-panel p-4 space-y-2">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Pseudocode</h3>
          <div className="space-y-0.5 font-mono text-xs">
            {result.pseudocode.map((line, i) => (
              <motion.div key={i} animate={{ backgroundColor: step.pseudocodeLine === i ? "hsla(195, 100%, 50%, 0.12)" : "transparent" }} className={`px-2 py-0.5 rounded-sm transition-colors ${step.pseudocodeLine === i ? "text-primary border-l-2 border-primary" : "text-muted-foreground/70 border-l-2 border-transparent"}`}>
                {line}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-display text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Algorithm Info</h3>
          <div>
            <span className="font-display text-sm font-bold neon-text-cyan">{result.name}</span>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{result.description}</p>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Time Complexity</span><span className="font-mono text-neon-yellow">{result.timeComplexity}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Space Complexity</span><span className="font-mono text-neon-green">{result.spaceComplexity}</span></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
