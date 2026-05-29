import { motion } from "framer-motion";
import { Clock, Footprints, Trophy, Cpu } from "lucide-react";

interface MetricsPanelProps {
  algo1: { name: string; steps: number; totalSteps: number; timeComplexity: string; spaceComplexity: string };
  algo2: { name: string; steps: number; totalSteps: number; timeComplexity: string; spaceComplexity: string };
  isComplete: boolean;
}

export function MetricsPanel({ algo1, algo2, isComplete }: MetricsPanelProps) {
  const winner = isComplete
    ? algo1.totalSteps < algo2.totalSteps ? algo1.name : algo2.totalSteps < algo1.totalSteps ? algo2.name : "Tie"
    : null;

  return (
    <div className="glass-panel p-4 space-y-4">
      <h3 className="font-display text-xs font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
        <Cpu className="h-3.5 w-3.5" /> Live Metrics
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label={algo1.name} color="cyan" steps={algo1.steps} total={algo1.totalSteps} tc={algo1.timeComplexity} sc={algo1.spaceComplexity} />
        <MetricCard label={algo2.name} color="purple" steps={algo2.steps} total={algo2.totalSteps} tc={algo2.timeComplexity} sc={algo2.spaceComplexity} />
      </div>

      {isComplete && winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 p-3 rounded-lg bg-neon-green/10 border border-neon-green/30"
        >
          <Trophy className="h-4 w-4 text-neon-green" />
          <span className="font-display text-sm text-neon-green font-bold tracking-wider">
            {winner === "Tie" ? "IT'S A TIE!" : `${winner.toUpperCase()} WINS!`}
          </span>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ label, color, steps, total, tc, sc }: {
  label: string; color: string; steps: number; total: number; tc: string; sc: string;
}) {
  return (
    <div className={`rounded-lg p-3 bg-muted/50 border border-neon-${color}/20 space-y-2`}>
      <span className={`text-xs font-display font-bold tracking-wider neon-text-${color}`}>{label}</span>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs">
          <Footprints className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Steps:</span>
          <span className="font-mono text-foreground">{steps} / {total}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Time:</span>
          <span className="font-mono text-foreground">{tc}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Space: <span className="font-mono text-foreground">{sc}</span>
        </div>
      </div>
    </div>
  );
}
