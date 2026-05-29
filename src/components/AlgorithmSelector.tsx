import { ALGORITHM_INFO } from "@/lib/sorting-algorithms";

interface AlgorithmSelectorProps {
  selected: string;
  onChange: (algo: string) => void;
  side: "left" | "right";
  disabledAlgo?: string;
}

export function AlgorithmSelector({ selected, onChange, side, disabledAlgo }: AlgorithmSelectorProps) {
  const borderColor = side === "left" ? "border-neon-cyan/40" : "border-neon-purple/40";

  return (
    <div className="flex gap-2 flex-wrap">
      {Object.entries(ALGORITHM_INFO).map(([key, info]) => {
        const isSelected = selected === key;
        const isDisabled = key === disabledAlgo;

        return (
          <button
            key={key}
            onClick={() => !isDisabled && onChange(key)}
            disabled={isDisabled}
            className={`
              px-3 py-1.5 rounded-md text-xs font-display font-bold tracking-wider transition-all duration-200
              ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-95"}
              ${isSelected
                ? `bg-muted ${borderColor} border neon-text-${side === "left" ? "cyan" : "purple"}`
                : "bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/60"
              }
            `}
          >
            {info.name}
          </button>
        );
      })}
    </div>
  );
}
