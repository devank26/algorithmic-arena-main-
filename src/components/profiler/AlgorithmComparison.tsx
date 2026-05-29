import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Slider } from "@/components/ui/slider";
import { VISUAL_ALGORITHMS, VISUAL_ALGORITHM_LIST, generateRandomArray } from "@/lib/visualizer-algorithms";

export function AlgorithmComparison() {
  const [maxSize, setMaxSize] = useState(200);
  const [selectedAlgos, setSelectedAlgos] = useState<string[]>(["bubble", "quick"]);
  const [metric, setMetric] = useState<"operations" | "time">("operations");

  const handleToggle = (key: string) => {
    if (selectedAlgos.includes(key)) {
      if (selectedAlgos.length > 1) setSelectedAlgos(selectedAlgos.filter(k => k !== key));
    } else {
      setSelectedAlgos([...selectedAlgos, key]);
    }
  };

  const chartData = useMemo(() => {
    // Generate data points for input sizes 10 to maxSize in steps of ~10%
    const step = Math.max(10, Math.floor(maxSize / 20));
    const data = [];
    for (let size = 10; size <= maxSize; size += step) {
      const arr = generateRandomArray(size, size * 2);
      const point: any = { size };
      
      for (const algoKey of selectedAlgos) {
        const start = performance.now();
        const r = VISUAL_ALGORITHMS[algoKey]([...arr]);
        const end = performance.now();
        
        const lastStep = r.steps[r.steps.length - 1];
        if (metric === "operations") {
          point[algoKey] = lastStep.comparisons + lastStep.swaps;
        } else {
          point[algoKey] = end - start; // JS performance.now() is usually in ms
        }
      }
      data.push(point);
    }
    return data;
  }, [maxSize, selectedAlgos, metric]);

  const colors = ["#0ea5e9", "#d946ef", "#22c55e", "#ec4899", "#f97316", "#eab308"];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Max Input Size (N): <span className="text-primary font-bold">{maxSize}</span>
          </label>
          <Slider value={[maxSize]} onValueChange={([v]) => setMaxSize(v)} min={50} max={500} step={10} />
        </div>
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Metrics</label>
          <div className="flex gap-2">
            <button onClick={() => setMetric("operations")} className={`px-4 py-1.5 text-xs font-bold rounded-md border transition-all ${metric === 'operations' ? 'bg-primary/20 border-primary text-primary neon-text-cyan' : 'border-muted-foreground/30 text-muted-foreground hover:bg-muted/50'}`}>Operations</button>
            <button onClick={() => setMetric("time")} className={`px-4 py-1.5 text-xs font-bold rounded-md border transition-all ${metric === 'time' ? 'bg-primary/20 border-primary text-primary neon-text-cyan' : 'border-muted-foreground/30 text-muted-foreground hover:bg-muted/50'}`}>Time (ms)</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {VISUAL_ALGORITHM_LIST.map(({ key, name }, idx) => {
          const isSelected = selectedAlgos.includes(key);
          const color = colors[idx % colors.length];
          return (
            <button
              key={key}
              onClick={() => handleToggle(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                isSelected ? "bg-opacity-20 shadow-md" : "bg-transparent border-muted-foreground/30 text-muted-foreground opacity-50"
              }`}
              style={{
                borderColor: isSelected ? color : undefined,
                color: isSelected ? color : undefined,
                backgroundColor: isSelected ? `${color}20` : undefined,
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="glass-panel p-4 h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="size" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} label={{ value: 'Input Array Size (N)', position: 'insideBottom', offset: -5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: "rgba(10, 10, 15, 0.9)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} 
              itemStyle={{ fontWeight: "bold" }} 
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            {selectedAlgos.map((key) => {
              const idx = VISUAL_ALGORITHM_LIST.findIndex(a => a.key === key);
              const color = colors[idx % colors.length];
              const name = VISUAL_ALGORITHM_LIST[idx].name;
              return (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  name={name} 
                  stroke={color} 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: color }} 
                  activeDot={{ r: 6 }} 
                  animationDuration={500}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
