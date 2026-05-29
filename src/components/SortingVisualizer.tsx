import { motion } from "framer-motion";
import type { SortStep } from "@/lib/sorting-algorithms";

interface SortingVisualizerProps {
  step: SortStep;
  color: "cyan" | "purple" | "green" | "pink";
  label: string;
  maxValue: number;
}

const colorMap = {
  cyan: {
    base: "bg-neon-cyan/70",
    comparing: "bg-neon-yellow",
    swapping: "bg-neon-orange",
    sorted: "bg-neon-green",
    glow: "bar-glow-cyan",
  },
  purple: {
    base: "bg-neon-purple/70",
    comparing: "bg-neon-yellow",
    swapping: "bg-neon-orange",
    sorted: "bg-neon-green",
    glow: "bar-glow-purple",
  },
  green: {
    base: "bg-neon-green/70",
    comparing: "bg-neon-yellow",
    swapping: "bg-neon-orange",
    sorted: "bg-neon-cyan",
    glow: "bar-glow-cyan",
  },
  pink: {
    base: "bg-neon-pink/70",
    comparing: "bg-neon-yellow",
    swapping: "bg-neon-orange",
    sorted: "bg-neon-green",
    glow: "bar-glow-purple",
  },
};

export function SortingVisualizer({ step, color, label, maxValue }: SortingVisualizerProps) {
  const colors = colorMap[color];

  function getBarColor(index: number) {
    if (step.sorted.includes(index)) return colors.sorted;
    if (step.swapping.includes(index)) return colors.swapping;
    if (step.comparing.includes(index)) return colors.comparing;
    return colors.base;
  }

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <h3 className={`font-display text-sm font-bold mb-3 neon-text-${color} uppercase tracking-widest`}>
        {label}
      </h3>
      <div className="flex items-end gap-[2px] flex-1 min-h-[200px]">
        {step.array.map((value, index) => {
          const heightPercent = (value / maxValue) * 100;
          return (
            <motion.div
              key={index}
              className={`flex-1 rounded-t-sm ${getBarColor(index)} ${colors.glow}`}
              initial={false}
              animate={{ height: `${heightPercent}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          );
        })}
      </div>
    </div>
  );
}
