import { Play, Pause, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface BattleControlsProps {
  isPlaying: boolean;
  speed: number;
  onPlayPause: () => void;
  onReset: () => void;
  onShuffle: () => void;
  onSpeedChange: (speed: number) => void;
  progress: number;
  totalSteps: number;
}

export function BattleControls({
  isPlaying,
  speed,
  onPlayPause,
  onReset,
  onShuffle,
  onSpeedChange,
  progress,
  totalSteps,
}: BattleControlsProps) {
  return (
    <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={onPlayPause}
          size="icon"
          className="bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary neon-glow-cyan"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          onClick={onReset}
          size="icon"
          variant="outline"
          className="border-muted-foreground/30 hover:bg-muted text-muted-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          onClick={onShuffle}
          size="icon"
          variant="outline"
          className="border-muted-foreground/30 hover:bg-muted text-muted-foreground"
        >
          <Shuffle className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">SPEED</span>
        <Slider
          value={[speed]}
          onValueChange={([v]) => onSpeedChange(v)}
          min={1}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs font-mono text-primary w-8 text-right">{speed}x</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <span>STEP</span>
        <span className="text-primary">{progress}</span>
        <span>/</span>
        <span>{totalSteps}</span>
      </div>
    </div>
  );
}
