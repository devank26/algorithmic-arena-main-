import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { SortingVisualizer } from "@/components/SortingVisualizer";
import { BattleControls } from "@/components/BattleControls";
import { MetricsPanel } from "@/components/MetricsPanel";
import { AlgorithmSelector } from "@/components/AlgorithmSelector";
import { ALGORITHMS, ALGORITHM_INFO, generateRandomArray } from "@/lib/sorting-algorithms";
import type { AlgorithmResult } from "@/lib/sorting-algorithms";

const ARRAY_SIZE = 30;

export default function BattleArena() {
  const [algo1Key, setAlgo1Key] = useState("quick");
  const [algo2Key, setAlgo2Key] = useState("merge");
  const [array, setArray] = useState(() => generateRandomArray(ARRAY_SIZE));
  const [results, setResults] = useState<{ r1: AlgorithmResult; r2: AlgorithmResult } | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(20);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxSteps = results ? Math.max(results.r1.steps.length, results.r2.steps.length) : 0;
  const maxValue = Math.max(...array);

  // Generate results when array or algorithms change
  useEffect(() => {
    const r1 = ALGORITHMS[algo1Key]([...array]);
    const r2 = ALGORITHMS[algo2Key]([...array]);
    setResults({ r1, r2 });
    setStepIndex(0);
    setIsPlaying(false);
  }, [array, algo1Key, algo2Key]);

  // Animation loop
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && results) {
      const delay = Math.max(10, 500 - speed * 4.5);
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
  }, [isPlaying, speed, maxSteps, results]);

  const handleShuffle = useCallback(() => {
    setArray(generateRandomArray(ARRAY_SIZE));
  }, []);

  const handleReset = useCallback(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, []);

  if (!results) return null;

  const step1 = results.r1.steps[Math.min(stepIndex, results.r1.steps.length - 1)];
  const step2 = results.r2.steps[Math.min(stepIndex, results.r2.steps.length - 1)];
  const isComplete = stepIndex >= maxSteps - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 neon-glow-cyan">
          <Swords className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight neon-text-cyan leading-none">
            Battle Arena
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pit algorithms against each other in real-time combat
          </p>
        </div>
      </motion.div>

      {/* Algorithm Selectors */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="glass-panel p-3">
          <span className="text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-2 block">
            Fighter 1
          </span>
          <AlgorithmSelector selected={algo1Key} onChange={setAlgo1Key} side="left" disabledAlgo={algo2Key} />
        </div>
        <div className="glass-panel p-3">
          <span className="text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-2 block">
            Fighter 2
          </span>
          <AlgorithmSelector selected={algo2Key} onChange={setAlgo2Key} side="right" disabledAlgo={algo1Key} />
        </div>
      </motion.div>

      {/* Visualization Panels */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[280px]"
      >
        <SortingVisualizer
          step={step1}
          color="cyan"
          label={ALGORITHM_INFO[algo1Key].name}
          maxValue={maxValue}
        />
        <SortingVisualizer
          step={step2}
          color="purple"
          label={ALGORITHM_INFO[algo2Key].name}
          maxValue={maxValue}
        />
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <BattleControls
          isPlaying={isPlaying}
          speed={speed}
          onPlayPause={() => {
            if (isComplete) { setStepIndex(0); setIsPlaying(true); }
            else setIsPlaying(!isPlaying);
          }}
          onReset={handleReset}
          onShuffle={handleShuffle}
          onSpeedChange={setSpeed}
          progress={stepIndex}
          totalSteps={maxSteps - 1}
        />
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <MetricsPanel
          algo1={{
            name: ALGORITHM_INFO[algo1Key].name,
            steps: Math.min(stepIndex, results.r1.steps.length - 1),
            totalSteps: results.r1.steps.length,
            timeComplexity: results.r1.timeComplexity,
            spaceComplexity: results.r1.spaceComplexity,
          }}
          algo2={{
            name: ALGORITHM_INFO[algo2Key].name,
            steps: Math.min(stepIndex, results.r2.steps.length - 1),
            totalSteps: results.r2.steps.length,
            timeComplexity: results.r2.timeComplexity,
            spaceComplexity: results.r2.spaceComplexity,
          }}
          isComplete={isComplete}
        />
      </motion.div>
    </div>
  );
}
