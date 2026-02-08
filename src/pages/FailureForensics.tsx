import { useState } from "react";
import { AlertOctagon, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { failureCases } from "@/data/agentIntelligenceData";
import { useToast } from "@/hooks/use-toast";

const severityColors = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  moderate: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

export default function FailureForensics() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRetry = (id: string) => {
    toast({ title: "Retrying with modified reasoning", description: "Simulation queued with suggested prompt fixes applied." });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
          <AlertOctagon className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Failure Forensics</h1>
          <p className="text-sm text-muted-foreground">Analyze where agent reasoning broke down</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Failed Bookings", value: "3", color: "text-destructive" },
          { label: "Top Failure Point", value: "Intent Classification", color: "text-warning" },
          { label: "Avg Missing Constraints", value: "2.3", color: "text-info" },
        ].map((stat) => (
          <GlassPanel key={stat.label}>
            <GlassPanelContent className="py-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </GlassPanelContent>
          </GlassPanel>
        ))}
      </div>

      {/* Cases */}
      <div className="space-y-4">
        {failureCases.map((fc) => (
          <GlassPanel key={fc.id}>
            <GlassPanelHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${severityColors[fc.severity]}`}>
                  {fc.severity}
                </Badge>
                <span className="text-xs font-semibold text-card-foreground">{fc.callerName}</span>
                <span className="text-[10px] text-muted-foreground">{fc.date}</span>
              </div>
              <button onClick={() => setExpanded(expanded === fc.id ? null : fc.id)} className="text-muted-foreground">
                {expanded === fc.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </GlassPanelHeader>

            {/* Summary always visible */}
            <div className="px-5 py-3 flex items-center gap-4 text-[11px]">
              <div>
                <span className="text-muted-foreground">Failure Point: </span>
                <span className="font-medium text-destructive">{fc.failurePoint}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Intent: </span>
                <span className="font-medium text-card-foreground">{fc.intent}</span>
              </div>
            </div>

            <AnimatePresence>
              {expanded === fc.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <GlassPanelContent className="border-t border-border/50 space-y-4">
                    {/* Missing constraints */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">MISSING CONSTRAINTS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {fc.missingConstraints.map((c, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-destructive/5 text-destructive border-destructive/20">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Reasoning breakdown */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">REASONING BREAKDOWN</p>
                      <p className="text-xs text-card-foreground font-mono leading-relaxed">{fc.reasoningBreakdown}</p>
                    </div>

                    {/* Suggested fix */}
                    <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                      <p className="text-[10px] font-semibold text-success mb-1">SUGGESTED FIX</p>
                      <p className="text-xs text-card-foreground">{fc.suggestedFix}</p>
                    </div>

                    <Button size="sm" className="gap-1.5 text-xs gradient-primary text-primary-foreground border-0" onClick={() => handleRetry(fc.id)}>
                      <RefreshCw className="h-3 w-3" /> Retry with Modified Reasoning
                    </Button>
                  </GlassPanelContent>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
