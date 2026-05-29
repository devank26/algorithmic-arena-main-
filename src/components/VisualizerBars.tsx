import { motion } from "framer-motion";
import type { VisualStep } from "@/lib/visualizer-algorithms";

type VisualMode = "abstract" | "books" | "people" | "cards" | "boxes";

interface VisualizerBarsProps {
  step: VisualStep;
  maxValue: number;
  arraySize: number;
  mode: VisualMode;
}

const BOOK_COLORS = [
  "hsl(var(--neon-cyan))",
  "hsl(var(--neon-purple))",
  "hsl(var(--neon-green))",
  "hsl(var(--neon-pink))",
  "hsl(var(--neon-orange))",
  "hsl(var(--neon-yellow))",
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
];

function getStatusClass(index: number, step: VisualStep) {
  const isSorted = step.sorted.includes(index);
  const isSwapping = step.swapping.includes(index);
  const isComparing = step.comparing.includes(index);
  return { isSorted, isSwapping, isComparing };
}

function getBarColor(isSorted: boolean, isSwapping: boolean, isComparing: boolean) {
  if (isSorted) return "bg-neon-green";
  if (isSwapping) return "bg-neon-orange";
  if (isComparing) return "bg-neon-yellow";
  return "bg-primary/50 bar-glow-cyan";
}

function AbstractBar({ value, index, maxValue, step }: { value: number; index: number; maxValue: number; step: VisualStep }) {
  const heightPercent = (value / maxValue) * 100;
  const { isSorted, isSwapping, isComparing } = getStatusClass(index, step);
  const barClass = getBarColor(isSorted, isSwapping, isComparing);

  return (
    <motion.div
      className={`flex-1 rounded-t-sm relative ${barClass}`}
      initial={false}
      animate={{
        height: `${heightPercent}%`,
        scale: isComparing ? 1.05 : isSwapping ? 1.08 : 1,
      }}
      transition={{
        height: { type: "spring", stiffness: 300, damping: 25 },
        scale: { type: "spring", stiffness: 400, damping: 20 },
      }}
    >
      {isComparing && (
        <motion.div
          className="absolute inset-0 rounded-t-sm bg-neon-yellow/30"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function BookBar({ value, index, maxValue, step, arraySize }: { value: number; index: number; maxValue: number; step: VisualStep; arraySize: number }) {
  const heightPercent = (value / maxValue) * 100;
  const { isSorted, isSwapping, isComparing } = getStatusClass(index, step);
  const bookColor = BOOK_COLORS[value % BOOK_COLORS.length];

  let borderColor = "transparent";
  if (isSorted) borderColor = "hsl(var(--neon-green))";
  else if (isSwapping) borderColor = "hsl(var(--neon-orange))";
  else if (isComparing) borderColor = "hsl(var(--neon-yellow))";

  const showLabel = arraySize <= 25;

  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-end relative"
      initial={false}
      animate={{ scale: isComparing ? 1.05 : isSwapping ? 1.08 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {showLabel && (
        <span className="text-[8px] font-mono text-muted-foreground mb-0.5 truncate w-full text-center">
          {value}p
        </span>
      )}
      <motion.div
        className="w-full rounded-t-sm relative overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${bookColor}, ${bookColor}dd)`,
          borderLeft: `2px solid ${borderColor}`,
          borderRight: `2px solid ${borderColor}`,
          borderTop: `2px solid ${borderColor}`,
          boxShadow: isSorted
            ? "0 0 8px hsl(var(--neon-green) / 0.5)"
            : isComparing
            ? "0 0 8px hsl(var(--neon-yellow) / 0.5)"
            : isSwapping
            ? "0 0 8px hsl(var(--neon-orange) / 0.5)"
            : "none",
        }}
        initial={false}
        animate={{ height: `${heightPercent}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Book spine detail */}
        <div className="absolute inset-y-0 left-0 w-[2px] bg-background/20" />
        <div className="absolute inset-y-0 right-0 w-[2px] bg-background/20" />
        {/* Title lines */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col gap-[2px] items-center w-3/4">
          <div className="w-full h-[1px] bg-background/30 rounded" />
          <div className="w-2/3 h-[1px] bg-background/30 rounded" />
        </div>
      </motion.div>
      {/* Shelf line */}
      <div className="w-full h-[2px] bg-muted-foreground/30 rounded" />
    </motion.div>
  );
}

function PersonBar({ value, index, maxValue, step, arraySize }: { value: number; index: number; maxValue: number; step: VisualStep; arraySize: number }) {
  const heightPercent = (value / maxValue) * 100;
  const { isSorted, isSwapping, isComparing } = getStatusClass(index, step);

  let glowClass = "";
  if (isSorted) glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-green))]";
  else if (isSwapping) glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-orange))]";
  else if (isComparing) glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-yellow))]";

  const skinTones = ["#F5D0A9", "#D4A574", "#C68642", "#8D5524", "#E8C39E", "#A0785A"];
  const skinColor = skinTones[value % skinTones.length];
  const age = Math.round((value / maxValue) * 60 + 10);
  const showLabel = arraySize <= 25;

  return (
    <motion.div
      className={`flex-1 flex flex-col items-center justify-end relative ${glowClass}`}
      initial={false}
      animate={{ scale: isComparing ? 1.05 : isSwapping ? 1.1 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {showLabel && (
        <span className="text-[8px] font-mono text-muted-foreground mb-0.5">
          {age}y
        </span>
      )}
      {/* Head */}
      <motion.div
        className="rounded-full mb-[1px] shrink-0"
        style={{
          width: "60%",
          aspectRatio: "1",
          maxWidth: "16px",
          backgroundColor: skinColor,
          border: isSorted
            ? "1.5px solid hsl(var(--neon-green))"
            : isSwapping
            ? "1.5px solid hsl(var(--neon-orange))"
            : isComparing
            ? "1.5px solid hsl(var(--neon-yellow))"
            : "1.5px solid transparent",
        }}
        initial={false}
      />
      {/* Body */}
      <motion.div
        className="w-full rounded-t-sm relative overflow-hidden"
        style={{
          background: isSorted
            ? "hsl(var(--neon-green) / 0.7)"
            : isSwapping
            ? "hsl(var(--neon-orange) / 0.7)"
            : isComparing
            ? "hsl(var(--neon-yellow) / 0.7)"
            : "hsl(var(--primary) / 0.5)",
        }}
        initial={false}
        animate={{ height: `${Math.max(heightPercent * 0.85, 5)}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {isComparing && (
          <motion.div
            className="absolute inset-0 bg-neon-yellow/20"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </motion.div>
      {/* Ground */}
      <div className="w-full h-[2px] bg-muted-foreground/20 rounded" />
    </motion.div>
  );
}

function CardBar({ value, index, maxValue, step, arraySize }: { value: number; index: number; maxValue: number; step: VisualStep; arraySize: number }) {
  const heightPercent = (value / maxValue) * 100;
  const { isSorted, isSwapping, isComparing } = getStatusClass(index, step);
  
  let borderColor = "hsl(var(--border))";
  let glowClass = "";
  if (isSorted) { borderColor = "hsl(var(--neon-green))"; glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-green))]"; }
  else if (isSwapping) { borderColor = "hsl(var(--neon-orange))"; glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-orange))]"; }
  else if (isComparing) { borderColor = "hsl(var(--neon-yellow))"; glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-yellow))]"; }

  const suits = ["♠", "♥", "♦", "♣"];
  const suit = suits[value % 4];
  const isRed = suit === "♥" || suit === "♦";
  const numMatches = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const rank = numMatches[value % 13];
  
  return (
    <motion.div
      className={`flex-1 flex flex-col items-center justify-end relative ${glowClass}`}
      initial={false}
      animate={{ scale: isComparing ? 1.05 : isSwapping ? 1.1 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <motion.div
        className="w-full rounded-sm bg-white flex flex-col items-center justify-between overflow-hidden relative"
        style={{
          border: `2px solid ${borderColor}`,
          color: isRed ? "#ef4444" : "#1f2937",
        }}
        initial={false}
        animate={{ height: `${Math.max(heightPercent, 20)}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="text-[10px] sm:text-xs font-bold w-full text-left pl-0.5 pt-0.5 leading-none">{rank}</div>
        <div className="text-[12px] sm:text-lg leading-none mb-1">{suit}</div>
      </motion.div>
    </motion.div>
  );
}

function BoxBar({ value, index, maxValue, step, arraySize }: { value: number; index: number; maxValue: number; step: VisualStep; arraySize: number }) {
  const numBoxes = Math.max(1, Math.ceil((value / maxValue) * 10));
  const { isSorted, isSwapping, isComparing } = getStatusClass(index, step);
  
  let glowClass = "";
  let baseColor = "hsl(var(--primary) / 0.6)";
  let borderColor = "var(--primary)";
  if (isSorted) { glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-green))]"; baseColor = "hsl(var(--neon-green) / 0.8)"; borderColor = "var(--neon-green)"; }
  else if (isSwapping) { glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-orange))]"; baseColor = "hsl(var(--neon-orange) / 0.8)"; borderColor = "var(--neon-orange)"; }
  else if (isComparing) { glowClass = "drop-shadow-[0_0_6px_hsl(var(--neon-yellow))]"; baseColor = "hsl(var(--neon-yellow) / 0.8)"; borderColor = "var(--neon-yellow)"; }

  return (
    <motion.div
      className={`flex-1 flex flex-col items-center justify-end gap-[1px] relative ${glowClass}`}
      initial={false}
      animate={{ scale: isComparing ? 1.05 : isSwapping ? 1.1 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {Array.from({ length: numBoxes }).map((_, i) => (
        <motion.div
          key={i}
          className="w-full rounded-[2px]"
          style={{
            minHeight: "4px",
            flexBasis: "10%",
            backgroundColor: baseColor,
            border: `1px solid hsl(${borderColor})`,
            backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)",
            backgroundSize: "4px 4px",
          }}
        />
      ))}
      <div className="w-full h-[2px] bg-muted-foreground/30 mt-[2px] rounded" />
    </motion.div>
  );
}

export function VisualizerBars({ step, maxValue, arraySize, mode }: VisualizerBarsProps) {
  return (
    <div className="flex items-end gap-[2px] min-h-[220px]">
      {step.array.map((value, index) => {
        switch (mode) {
          case "books":
            return <BookBar key={index} value={value} index={index} maxValue={maxValue} step={step} arraySize={arraySize} />;
          case "people":
            return <PersonBar key={index} value={value} index={index} maxValue={maxValue} step={step} arraySize={arraySize} />;
          case "cards":
            return <CardBar key={index} value={value} index={index} maxValue={maxValue} step={step} arraySize={arraySize} />;
          case "boxes":
            return <BoxBar key={index} value={value} index={index} maxValue={maxValue} step={step} arraySize={arraySize} />;
          default:
            return <AbstractBar key={index} value={value} index={index} maxValue={maxValue} step={step} />;
        }
      })}
    </div>
  );
}
