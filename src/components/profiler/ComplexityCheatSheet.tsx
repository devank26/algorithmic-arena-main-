import { motion } from "framer-motion";

const ALGORITHMS = [
  { name: "Bubble Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", explanation: "Best case occurs when array is already sorted. Worst case occurs when array is reverse sorted, requiring max swaps." },
  { name: "Selection Sort", best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", explanation: "Always scans the entire remaining array to find the minimum element, making it uniformly slow regardless of initial order." },
  { name: "Insertion Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", explanation: "Efficient for small or nearly sorted arrays (shifts few elements). In worst case, it must shift every element." },
  { name: "Quick Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)", explanation: "Highly efficient on average due to divide-and-conquer. Worst case occurs if the pivot is always the smallest or largest element." },
  { name: "Merge Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", explanation: "Consistently halves the array and merges. Predictable O(n log n) time but requires extra O(n) space to merge arrays." },
  { name: "Heap Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)", explanation: "Uses a binary heap. Provides O(n log n) guarantee like Merge Sort but with O(1) space. Slower in practice than Quick Sort." },
];

export function ComplexityCheatSheet() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold neon-text-cyan">Complexity Cheat Sheet</h2>
      <p className="text-sm text-muted-foreground">Understand the theoretical performance limits of standard algorithms.</p>
      
      <div className="grid gap-4 mt-6">
        {ALGORITHMS.map((algo, i) => (
          <motion.div 
            key={algo.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-4 flex flex-col md:flex-row gap-4"
          >
            <div className="md:w-1/4">
              <h3 className="font-bold text-lg">{algo.name}</h3>
            </div>
            <div className="md:w-1/2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-muted/40 p-2 rounded text-center">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Best</span>
                <span className="font-mono text-neon-green text-sm">{algo.best}</span>
              </div>
              <div className="bg-muted/40 p-2 rounded text-center">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Average</span>
                <span className="font-mono text-neon-yellow text-sm">{algo.avg}</span>
              </div>
              <div className="bg-muted/40 p-2 rounded text-center">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Worst</span>
                <span className="font-mono text-neon-pink text-sm">{algo.worst}</span>
              </div>
              <div className="bg-muted/40 p-2 rounded text-center">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Space</span>
                <span className="font-mono text-primary text-sm">{algo.space}</span>
              </div>
            </div>
            <div className="md:w-1/4">
              <p className="text-xs text-muted-foreground leading-relaxed">{algo.explanation}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
