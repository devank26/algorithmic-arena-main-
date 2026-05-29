import { motion } from "framer-motion";
import { Brain, LineChart as LineChartIcon, BookOpen, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplexityCheatSheet } from "@/components/profiler/ComplexityCheatSheet";
import { AlgorithmComparison } from "@/components/profiler/AlgorithmComparison";
import { QuizSystem } from "@/components/profiler/QuizSystem";

export default function Profiler() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded-lg bg-neon-pink/10 border border-neon-pink/30 neon-glow-pink">
          <Brain className="h-5 w-5 text-neon-pink" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground leading-none">
            Complexity Profiler
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize the exact mathematical limits of algorithms.
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="experiment" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 mb-6 rounded-md">
          <TabsTrigger value="experiment" className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_var(--primary)] transition-all rounded">
            <LineChartIcon className="h-4 w-4" /> Experiment
          </TabsTrigger>
          <TabsTrigger value="theory" className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-wider data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_10px_hsl(var(--neon-cyan))] transition-all rounded">
            <BookOpen className="h-4 w-4" /> Theory
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-wider data-[state=active]:bg-neon-yellow/20 data-[state=active]:text-neon-yellow data-[state=active]:shadow-[0_0_10px_hsl(var(--neon-yellow))] transition-all rounded">
            <HelpCircle className="h-4 w-4" /> Quizzes
          </TabsTrigger>
        </TabsList>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <TabsContent value="experiment" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <AlgorithmComparison />
          </TabsContent>
          <TabsContent value="theory" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ComplexityCheatSheet />
          </TabsContent>
          <TabsContent value="quizzes" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <QuizSystem />
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
