import { useState } from "react";
import { FlaskConical, Play, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { experimentStrategies } from "@/data/agentIntelligenceData";
import { useToast } from "@/hooks/use-toast";

const outcomeColors = {
  booked: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  escalated: "bg-warning/15 text-warning border-warning/30",
};

export default function ExperimentMode() {
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      toast({ title: "Experiment Complete", description: "3 strategies tested with same input call." });
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <FlaskConical className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Experiment Mode</h1>
            <p className="text-sm text-muted-foreground">Compare agent strategies side by side</p>
          </div>
        </div>
        <Button className="gap-2 gradient-primary text-primary-foreground border-0" onClick={handleRun} disabled={running}>
          <Play className="h-4 w-4" />
          {running ? "Running..." : "Run Experiment"}
        </Button>
      </div>

      <GlassPanel>
        <GlassPanelHeader>
          <span className="text-xs font-medium text-card-foreground">Test Scenario: "Book morning appointment next week"</span>
          <span className="text-[10px] font-mono text-muted-foreground">Input: Sarah Chen, Tue/Wed AM</span>
        </GlassPanelHeader>
      </GlassPanel>

      <div className="grid gap-4 lg:grid-cols-3">
        {experimentStrategies.map((strategy, i) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassPanel className={`h-full ${i === 0 ? "ring-2 ring-primary/30 shadow-glow" : ""}`}>
              <GlassPanelHeader>
                <span className="text-xs font-semibold text-card-foreground">{strategy.name}</span>
                {i === 0 && <Badge className="text-[9px] gradient-primary text-primary-foreground border-0">Best</Badge>}
              </GlassPanelHeader>
              <GlassPanelContent className="space-y-4">
                <p className="text-[11px] text-muted-foreground">{strategy.description}</p>

                {/* Outcome */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${outcomeColors[strategy.outcome]}`}>
                    {strategy.outcome === "booked" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {strategy.outcome}
                  </Badge>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Turns", value: strategy.turns },
                    { label: "Latency", value: `${strategy.latencyMs}ms` },
                    { label: "Success", value: `${strategy.successRate}%` },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center rounded-lg bg-muted/50 p-2">
                      <p className="text-sm font-bold text-card-foreground">{metric.value}</p>
                      <p className="text-[9px] text-muted-foreground">{metric.label}</p>
                    </div>
                  ))}
                </div>

                {/* Reasoning chain */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">REASONING CHAIN</p>
                  {strategy.reasoning.map((step, j) => (
                    <p key={j} className="text-[10px] text-card-foreground font-mono leading-relaxed">{step}</p>
                  ))}
                </div>
              </GlassPanelContent>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
