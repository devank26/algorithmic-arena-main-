import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Play, Download, RefreshCw, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Zap, Clock, BarChart3,
  AlertTriangle, Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAllTests, generateRandomTestCases, ValidationReport, TestSuite, TestCase } from "@/lib/validation-engine";

// ── Helpers ───────────────────────────────────────────────────────────────────

function PassBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neon-green/15 border border-neon-green/40 text-neon-green">
      <CheckCircle2 className="w-3 h-3" /> PASS
    </span>
  );
}

function FailBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neon-pink/15 border border-neon-pink/40 text-neon-pink">
      <XCircle className="w-3 h-3" /> FAIL
    </span>
  );
}

function TestCaseRow({ tc }: { tc: TestCase }) {
  const [open, setOpen] = useState(false);
  const passed = tc.status === "pass";
  return (
    <motion.div layout className={`border rounded-lg overflow-hidden ${passed ? "border-neon-green/20" : "border-neon-pink/30"}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/20 transition-colors ${passed ? "" : "bg-neon-pink/5"}`}
      >
        <span className="shrink-0">{passed ? <PassBadge /> : <FailBadge />}</span>
        <span className="flex-1 font-mono text-xs text-foreground">{tc.description}</span>
        {tc.durationMs !== undefined && (
          <span className="text-[10px] font-mono text-muted-foreground shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {tc.durationMs}ms
          </span>
        )}
        {!passed && (open ? <ChevronUp className="w-4 h-4 text-neon-pink shrink-0" /> : <ChevronDown className="w-4 h-4 text-neon-pink shrink-0" />)}
      </button>
      <AnimatePresence>
        {!passed && open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-3 pt-1 space-y-1.5 bg-neon-pink/5 border-t border-neon-pink/20">
              {tc.expected && (
                <p className="text-[11px] font-mono">
                  <span className="text-muted-foreground">Expected: </span>
                  <span className="text-neon-green">{tc.expected}</span>
                </p>
              )}
              {tc.actual && (
                <p className="text-[11px] font-mono">
                  <span className="text-muted-foreground">Actual: </span>
                  <span className="text-neon-pink">{tc.actual}</span>
                </p>
              )}
              {tc.errorDetail && (
                <p className="text-[11px] font-mono text-muted-foreground italic">{tc.errorDetail}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SuiteCard({ suite }: { suite: TestSuite }) {
  const [expanded, setExpanded] = useState(false);
  const pct = suite.cases.length > 0 ? Math.round((suite.passCount / suite.cases.length) * 100) : 0;
  const allPass = suite.failCount === 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`glass-panel overflow-hidden border ${allPass ? "border-neon-green/30" : "border-neon-pink/30"}`}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors text-left">
        <span className="text-2xl">{suite.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display font-bold text-sm truncate">{suite.name}</h3>
            {allPass
              ? <PassBadge />
              : <FailBadge />}
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${allPass ? "bg-neon-green" : "bg-neon-pink"}`} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-mono text-lg font-bold ${allPass ? "text-neon-green" : "text-neon-pink"}`}>{pct}%</p>
          <p className="text-[10px] text-muted-foreground font-mono">{suite.passCount}/{suite.cases.length}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2 border-t border-border/40">
              {suite.cases.map((tc) => <TestCaseRow key={tc.id} tc={tc} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ValidationDashboard() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [randomResults, setRandomResults] = useState<string[]>([]);

  const handleRunAll = useCallback(async () => {
    setRunning(true);
    setProgress(0);
    setRandomResults([]);

    // Fake incremental progress for UX (actual run is synchronous + fast)
    const tick = setInterval(() => setProgress((p) => Math.min(p + 12, 90)), 60);
    await new Promise((res) => setTimeout(res, 600)); // let the UI breathe

    const result = runAllTests();
    clearInterval(tick);
    setProgress(100);
    setReport(result);
    setRunning(false);
  }, []);

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `algviz-validation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRandomCases = () => {
    const cases = generateRandomTestCases();
    import("@/lib/sorting-algorithms").then(({ bubbleSort }) => {
      const msgs = cases.map(({ array, label }) => {
        const result = bubbleSort(array);
        const finalArr = result.steps[result.steps.length - 1].array;
        const sorted = [...array].sort((a, b) => a - b);
        const ok = JSON.stringify(finalArr) === JSON.stringify(sorted);
        return `${label}: ${ok ? "✅ PASS" : "❌ FAIL"}`;
      });
      setRandomResults(msgs);
    });
  };

  const totalPct = report
    ? Math.round((report.totalPassed / Math.max(report.totalTests, 1)) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-neon-green/15 border border-neon-green/30">
              <ShieldCheck className="h-6 w-6 text-neon-green" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-neon-green">AlgoViz Validation Dashboard</h1>
              <p className="text-sm text-muted-foreground">Automated correctness testing across all algorithm families</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleRandomCases} variant="outline" className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Random Test Cases
          </Button>
          {report && (
            <Button onClick={handleDownload} variant="outline" className="gap-2 text-xs border-neon-cyan/40 text-neon-cyan">
              <Download className="h-3.5 w-3.5" /> Export JSON
            </Button>
          )}
          <Button onClick={handleRunAll} disabled={running}
            className="gap-2 bg-neon-green/20 border border-neon-green/40 text-neon-green hover:bg-neon-green/30">
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Running Tests…" : "Run All Tests"}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <AnimatePresence>
        {(running || progress > 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-panel p-4 border border-neon-green/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-neon-green font-bold uppercase tracking-widest">
                {running ? "Executing Test Suites…" : "Test Run Complete"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
              <motion.div className="h-full bg-neon-green rounded-full" animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Random case results */}
      <AnimatePresence>
        {randomResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-panel p-4 border border-neon-cyan/30">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neon-cyan mb-3 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" /> Random Sorting Test Cases (Bubble Sort)
            </h3>
            <div className="space-y-1">
              {randomResults.map((msg, i) => (
                <p key={i} className={`font-mono text-xs ${msg.includes("PASS") ? "text-neon-green" : "text-neon-pink"}`}>{msg}</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Tests", value: report.totalTests, color: "text-foreground", icon: BarChart3 },
            { label: "Passed", value: report.totalPassed, color: "text-neon-green", icon: CheckCircle2 },
            { label: "Failed", value: report.totalFailed, color: report.totalFailed > 0 ? "text-neon-pink" : "text-neon-green", icon: XCircle },
            { label: "Exec Time", value: `${report.executionTimeMs}ms`, color: "text-neon-cyan", icon: Clock },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-panel p-4 text-center border border-border/40">
              <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
              <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Overall pass rate */}
      {report && (
        <div className="glass-panel p-5 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${totalPct === 100 ? "text-neon-green" : "text-neon-yellow"}`} />
              <span className="font-display font-bold text-sm">Overall Pass Rate</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-2xl font-bold ${totalPct === 100 ? "text-neon-green" : "text-neon-yellow"}`}>{totalPct}%</span>
              {totalPct === 100
                ? <span className="text-xs font-bold text-neon-green bg-neon-green/10 border border-neon-green/30 px-3 py-1 rounded-full">All Systems Nominal ✅</span>
                : <span className="flex items-center gap-1 text-xs font-bold text-neon-yellow bg-neon-yellow/10 border border-neon-yellow/30 px-3 py-1 rounded-full"><AlertTriangle className="w-3.5 h-3.5" /> Issues Detected</span>}
            </div>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${totalPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className={`h-full rounded-full ${totalPct === 100 ? "bg-neon-green" : "bg-neon-yellow"}`}
              style={{ boxShadow: totalPct === 100 ? "0 0 12px var(--neon-green)" : "0 0 12px var(--neon-yellow)" }}
            />
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-2 text-right">
            Generated: {new Date(report.generatedAt).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Suite cards */}
      {report && (
        <div className="space-y-4">
          <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Test Suite Breakdown
          </h2>
          {report.suites.map((suite) => <SuiteCard key={suite.name} suite={suite} />)}
        </div>
      )}

      {/* Empty state */}
      {!report && !running && (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center border border-dashed border-border/50">
          <ShieldCheck className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="font-display font-bold text-lg text-muted-foreground/60 mb-2">Ready to Validate</h3>
          <p className="text-sm text-muted-foreground/40 max-w-md mb-6">
            Click "Run All Tests" to execute the automated correctness suite across Sorting, Searching, Floyd-Warshall, SCC, Bridges, and Step Integrity checks.
          </p>
          <Button onClick={handleRunAll} className="gap-2 bg-neon-green/20 border border-neon-green/40 text-neon-green hover:bg-neon-green/30">
            <Play className="h-4 w-4" /> Run All Tests
          </Button>
        </div>
      )}
    </div>
  );
}
