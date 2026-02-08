import { useState } from "react";
import { PlayCircle, BarChart3, Phone, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface SimResult {
  id: number;
  caller: string;
  outcome: "booked" | "recovered" | "failed" | "draft";
  duration: string;
  confidence: number;
}

export default function CallSimulation() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimResult[]>([]);
  const { toast } = useToast();

  const runSimulation = () => {
    setRunning(true);
    setResults([]);
    setProgress(0);

    const mockResults: SimResult[] = [
      { id: 1, caller: "Sim Caller A", outcome: "booked", duration: "2:14", confidence: 96 },
      { id: 2, caller: "Sim Caller B", outcome: "booked", duration: "3:05", confidence: 91 },
      { id: 3, caller: "Sim Caller C", outcome: "recovered", duration: "1:48", confidence: 87 },
      { id: 4, caller: "Sim Caller D", outcome: "draft", duration: "2:55", confidence: 78 },
      { id: 5, caller: "Sim Caller E", outcome: "failed", duration: "0:42", confidence: 34 },
    ];

    mockResults.forEach((result, i) => {
      setTimeout(() => {
        setResults((prev) => [...prev, result]);
        setProgress(((i + 1) / mockResults.length) * 100);
        if (i === mockResults.length - 1) {
          setRunning(false);
          toast({ title: "✅ Simulation Complete", description: "5 calls simulated. Check results below." });
        }
      }, (i + 1) * 800);
    });
  };

  const outcomeConfig = {
    booked: { label: "Booked", class: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
    recovered: { label: "Recovered", class: "bg-info/15 text-info border-info/30", icon: RotateCcw },
    failed: { label: "Failed", class: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
    draft: { label: "Draft", class: "bg-warning/15 text-warning border-warning/30", icon: Phone },
  };

  const successCount = results.filter((r) => r.outcome === "booked" || r.outcome === "recovered").length;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <PlayCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Call Simulation</h1>
            <p className="text-sm text-muted-foreground">Test your agent with simulated calls</p>
          </div>
        </div>
        <Button
          size="sm"
          disabled={running}
          onClick={runSimulation}
          className="gap-1.5 text-xs gradient-primary text-primary-foreground border-0"
        >
          <PlayCircle className="h-3.5 w-3.5" /> {running ? "Running…" : "Run 5 Calls"}
        </Button>
      </div>

      {(running || results.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Simulation Progress</p>
            <p className="text-sm font-semibold text-card-foreground">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2 mb-4" />

          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold text-card-foreground">{results.length}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="rounded-lg bg-success/10 p-3 text-center">
                <p className="text-2xl font-bold text-success">{successCount}</p>
                <p className="text-[10px] text-muted-foreground">Success</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold text-card-foreground">
                  {results.length > 0 ? Math.round((successCount / results.length) * 100) : 0}%
                </p>
                <p className="text-[10px] text-muted-foreground">Rate</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {results.map((result) => {
              const config = outcomeConfig[result.outcome];
              const Icon = config.icon;
              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.class.split(" ")[1]}`} />
                    <span className="text-sm text-card-foreground">{result.caller}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{result.duration}</span>
                    <Badge variant="outline" className={`text-[10px] ${config.class}`}>{config.label}</Badge>
                    <span className="text-xs text-muted-foreground">{result.confidence}%</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {results.length === 0 && !running && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-card">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-semibold text-card-foreground mb-1">No Simulations Yet</h3>
          <p className="text-xs text-muted-foreground">Click "Run 5 Calls" to test your agent with simulated scenarios.</p>
        </div>
      )}
    </div>
  );
}
