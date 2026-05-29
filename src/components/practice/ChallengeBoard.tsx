import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VISUAL_ALGORITHMS } from "@/lib/visualizer-algorithms";

export function ChallengeBoard({ 
  level, 
  algorithm, 
  initialArray, 
  onComplete 
}: { 
  level: number, 
  algorithm: string, 
  initialArray: number[], 
  onComplete: (stars: number) => void 
}) {
  const [array, setArray] = useState([...initialArray]);
  const [selected, setSelected] = useState<number[]>([]);
  const [stepIdx, setStepIdx] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info", message: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const targetResult = useMemo(() => VISUAL_ALGORITHMS[algorithm]([...initialArray]), [algorithm, initialArray]);
  const maxSteps = targetResult.steps.length - 1;
  const currentExpectedStep = targetResult.steps[stepIdx];

  // Auto advance trivial initial steps if any
  useEffect(() => {
    if (stepIdx === 1 && currentExpectedStep.comparing.length === 0 && currentExpectedStep.swapping.length === 0) {
       advanceStep();
    }
  }, []);

  const handleSelect = (idx: number) => {
    if (selected.includes(idx)) {
      setSelected(selected.filter(i => i !== idx));
    } else {
      if (selected.length < 2) setSelected([...selected, idx]);
    }
  };

  const showFeedback = (type: "success" | "error" | "info", msg: string) => {
    setFeedback({ type, message: msg });
    setTimeout(() => setFeedback(null), 2500);
  };

  const advanceStep = (customArr?: number[]) => {
    if (stepIdx >= maxSteps) return;
    const nextIdx = stepIdx + 1;
    setStepIdx(nextIdx);
    setSelected([]);
    if (customArr) setArray(customArr);
    
    let peekStep = targetResult.steps[nextIdx];
    let autoAdvancedIdx = nextIdx;
    
    // Auto advance through elements being marked as sorted, etc.
    while (peekStep && peekStep.comparing.length === 0 && peekStep.swapping.length === 0 && autoAdvancedIdx < maxSteps) {
       autoAdvancedIdx++;
       peekStep = targetResult.steps[autoAdvancedIdx];
    }
    
    if (autoAdvancedIdx !== nextIdx) {
      setStepIdx(autoAdvancedIdx);
      if (targetResult.steps[autoAdvancedIdx]) {
         setArray([...targetResult.steps[autoAdvancedIdx].array]);
      }
    }

    if (autoAdvancedIdx >= maxSteps) {
      setIsFinished(true);
      const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
      onComplete(stars);
    }
  };

  const handleAction = (actionType: "compare" | "swap") => {
    if (!currentExpectedStep) return;

    if (actionType === "compare") {
      if (currentExpectedStep.comparing.length > 0) {
        const expected = [...currentExpectedStep.comparing].sort();
        const actual = [...selected].sort();
        if (expected.length === actual.length && expected.every((val, i) => val === actual[i])) {
          showFeedback("success", "Correctly identified comparison!");
          advanceStep();
        } else {
          setMistakes(m => m + 1);
          showFeedback("error", "Wrong elements compared. Check the algorithm logic!");
        }
      } else {
        setMistakes(m => m + 1);
        showFeedback("error", "A comparison is not the next step.");
      }
    } else if (actionType === "swap") {
      if (currentExpectedStep.swapping.length > 0) {
        const expected = [...currentExpectedStep.swapping].sort();
        const actual = [...selected].sort();
        if (expected.length === actual.length && expected.every((val, i) => val === actual[i])) {
          showFeedback("success", "Correct Swap!");
          const newArr = [...array];
          [newArr[actual[0]], newArr[actual[1]]] = [newArr[actual[1]], newArr[actual[0]]];
          advanceStep(newArr);
        } else {
          setMistakes(m => m + 1);
          showFeedback("error", "Wrong elements swapped.");
        }
      } else {
        setMistakes(m => m + 1);
        showFeedback("error", "A swap is not needed right now.");
      }
    }
  };

  const useHint = () => {
    setMistakes(m => m + 1.5); // penalty is slightly harsher
    if (!currentExpectedStep) return;
    if (currentExpectedStep.comparing.length > 0) {
      setSelected([...currentExpectedStep.comparing]);
      showFeedback("info", "Hint: Compare these two elements.");
    } else if (currentExpectedStep.swapping.length > 0) {
      setSelected([...currentExpectedStep.swapping]);
      showFeedback("info", "Hint: Swap these two elements.");
    } else {
      showFeedback("info", "Hint: No action needed, advancing.");
      advanceStep();
    }
  };

  const maxValue = Math.max(...initialArray);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-lg">{targetResult.name} Challenge</h2>
          <p className="text-xs text-muted-foreground">Select two elements and choose the next action.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <span className="block text-[10px] text-muted-foreground uppercase">Mistakes</span>
            <span className="font-mono font-bold text-neon-pink">{Math.floor(mistakes)}</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] text-muted-foreground uppercase">Progress</span>
            <span className="font-mono font-bold text-primary">{Math.min(100, Math.round((stepIdx / maxSteps) * 100))}%</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="flex items-end gap-2 w-full h-[200px] max-w-3xl justify-center z-10">
          {array.map((val, idx) => {
            const isSelected = selected.includes(idx);
            const isSorted = currentExpectedStep?.sorted?.includes(idx);
            return (
              <motion.div
                key={`${idx}-${val}`}
                layout
                onClick={() => handleSelect(idx)}
                className={`w-12 rounded-t-md relative flex items-center justify-center cursor-pointer border-2 transition-colors duration-300 ${
                  isSelected ? "bg-primary border-primary bar-glow-cyan" :
                  isSorted ? "bg-neon-green/30 border-neon-green/50 opacity-50" :
                  "bg-muted border-muted-foreground/30 hover:border-primary/50"
                }`}
                style={{ height: `${(val / maxValue) * 100}%` }}
                animate={{ y: isSelected ? -16 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <span className="font-mono font-bold drop-shadow-md text-foreground pointer-events-none">{val}</span>
              </motion.div>
            )
          })}
        </div>
        
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`px-4 py-2 rounded-full border text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-md ${
                  feedback.type === 'success' ? 'bg-neon-green/20 border-neon-green text-neon-green' :
                  feedback.type === 'error' ? 'bg-neon-pink/20 border-neon-pink text-neon-pink' :
                  'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                }`}
              >
                {feedback.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {feedback.type === 'error' && <XCircle className="h-4 w-4" />}
                {feedback.type === 'info' && <AlertCircle className="h-4 w-4" />}
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Button size="lg" variant="outline" className="gap-2 border-neon-yellow text-neon-yellow hover:bg-neon-yellow/10" disabled={selected.length !== 2} onClick={() => handleAction("compare")}>
          Compare
        </Button>
        <Button size="lg" variant="outline" className="gap-2 border-neon-orange text-neon-orange hover:bg-neon-orange/10" disabled={selected.length !== 2} onClick={() => handleAction("swap")}>
          Swap
        </Button>
        <div className="w-px bg-border/50 mx-2" />
        <Button size="lg" variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={useHint}>
          <HelpCircle className="h-4 w-4" /> Hint
        </Button>
      </div>

      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel p-8 text-center max-w-sm w-full space-y-4"
            >
              <h2 className="font-display font-bold text-3xl neon-text-cyan">Level Cleared!</h2>
              <div className="flex justify-center gap-2 text-neon-yellow my-4">
                {Array.from({ length: 3 }).map((_, i) => {
                  const starsEarned = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
                  return <Star key={i} className={`h-10 w-10 ${i < starsEarned ? 'fill-neon-yellow' : 'opacity-20'}`} />
                })}
              </div>
              <p className="text-muted-foreground">Mistakes made: {Math.floor(mistakes)}</p>
              <Button onClick={() => window.location.reload()} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                Continue to Arena
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
