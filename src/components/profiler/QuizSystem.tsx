import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

const QUIZZES = [
  {
    question: "Which algorithm has the best worst-case Time Complexity?",
    options: ["Selection Sort", "Quick Sort", "Merge Sort", "Bubble Sort"],
    answer: 2,
    explanation: "Merge Sort guarantees O(n log n) in the worst case, whereas Quick Sort can degrade to O(n²)."
  },
  {
    question: "Why is Quick Sort often preferred over Merge Sort in practice despite its O(n²) worst case?",
    options: ["It uses less space O(log n)", "It has better CPU cache locality", "The worst case is probabilistically rare", "All of the above"],
    answer: 3,
    explanation: "Quick sort operates in-place matching modern CPU cache pipelines, requires less memory, and randomized pivots effectively eliminate the worst-case O(n²) behavior."
  },
  {
    question: "Which algorithm is capable of running in O(n) time if the array is already perfectly sorted?",
    options: ["Insertion Sort", "Heap Sort", "Merge Sort", "Selection Sort"],
    answer: 0,
    explanation: "Insertion Sort (and optimized Bubble Sort) only requires O(n) passes on a pre-sorted array because no elements need shifting or swapping."
  },
  {
    question: "Which algorithmic paradigm does Binary Search belong to?",
    options: ["Dynamic Programming", "Greedy Algorithms", "Divide and Conquer", "Backtracking"],
    answer: 2,
    explanation: "Binary search explicitly implements 'Divide and Conquer' by halving the search space recursively until the target is found."
  }
];

export function QuizSystem() {
  const [activeQ, setActiveQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const quiz = QUIZZES[activeQ];

  const handleSelect = (index: number) => {
    if (hasAnswered) return;
    setSelected(index);
    setHasAnswered(true);
  };

  const nextQuestion = () => {
    setActiveQ((p) => (p + 1) % QUIZZES.length);
    setSelected(null);
    setHasAnswered(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="font-display text-xl font-bold neon-text-cyan">Knowledge Check</h2>
        <p className="text-sm text-muted-foreground">Test your understanding of algorithmic theory.</p>
      </div>

      <motion.div 
        key={activeQ}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 space-y-6 relative overflow-hidden"
      >
        <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
          <span>QUESTION {activeQ + 1} OF {QUIZZES.length}</span>
        </div>

        <h3 className="text-lg font-bold">{quiz.question}</h3>

        <div className="space-y-3">
          {quiz.options.map((opt, i) => {
            let className = "bg-muted/30 border-muted hover:border-primary/50 text-foreground cursor-pointer";
            if (hasAnswered) {
              if (i === quiz.answer) className = "bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(0,255,0,0.2)]";
              else if (i === selected) className = "bg-neon-pink/20 border-neon-pink text-neon-pink";
              else className = "bg-muted/10 border-muted opacity-50 cursor-not-allowed";
            }
            return (
              <div 
                key={i} 
                onClick={() => handleSelect(i)}
                className={`p-4 rounded-md border transition-all flex items-center justify-between ${className}`}
              >
                <span>{opt}</span>
                {hasAnswered && i === quiz.answer && <CheckCircle2 className="h-5 w-5" />}
                {hasAnswered && i === selected && i !== quiz.answer && <XCircle className="h-5 w-5" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="pt-4 border-t border-border mt-4 text-sm text-muted-foreground"
            >
              <strong className="text-foreground neon-text-cyan">Explanation:</strong> {quiz.explanation}
              <div className="mt-6 flex justify-end">
                <button onClick={nextQuestion} className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-bold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-[0_0_10px_var(--primary)]">
                  Next Question
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
