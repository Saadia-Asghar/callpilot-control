import { useState } from "react";
import { Zap, AlertTriangle, RefreshCw, Play, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { simulatorScenarios, trustIndicators } from "@/data/agentIntelligenceData";
import { useToast } from "@/hooks/use-toast";

const typeColors = {
  objection: "bg-warning/15 text-warning border-warning/30",
  conflict: "bg-destructive/15 text-destructive border-destructive/30",
  preference: "bg-info/15 text-info border-info/30",
};

const trustStatusColors = {
  verified: "bg-success/15 text-success",
  pass: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  pending: "bg-muted text-muted-foreground animate-pulse-soft",
};

export default function NegotiationSimulator() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [stressTesting, setStressTesting] = useState(false);
  const { toast } = useToast();

  const handleStressTest = () => {
    setStressTesting(true);
    setTimeout(() => {
      setStressTesting(false);
      toast({
        title: "Stress Test Complete",
        description: "Agent handled 12/15 scenarios successfully. 2 escalated. 1 failed.",
      });
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Simulator & Trust</h1>
            <p className="text-sm text-muted-foreground">Test agent resilience & monitor trust indicators</p>
          </div>
        </div>
        <Button
          onClick={handleStressTest}
          disabled={stressTesting}
          className="gap-2 gradient-primary text-primary-foreground border-0"
        >
          {stressTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {stressTesting ? "Testing..." : "Stress Test Agent"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Simulator */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-semibold text-card-foreground">Negotiation Scenarios</h2>
          {simulatorScenarios.map((scenario) => (
            <GlassPanel key={scenario.id}>
              <GlassPanelHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${typeColors[scenario.type]}`}>
                    {scenario.type}
                  </Badge>
                  <span className="text-xs font-medium text-card-foreground">{scenario.label}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setActiveScenario(activeScenario === scenario.id ? null : scenario.id)}
                >
                  <Play className="h-3 w-3" /> Inject
                </Button>
              </GlassPanelHeader>

              <AnimatePresence>
                {activeScenario === scenario.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <GlassPanelContent className="space-y-3">
                      {/* Injected input */}
                      <div className="flex gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold text-destructive">!</div>
                        <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs font-mono text-card-foreground">
                          {scenario.injection}
                        </div>
                      </div>
                      {/* Agent response */}
                      <div className="flex gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">AI</div>
                        <div className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
                          {scenario.agentResponse}
                        </div>
                      </div>
                      {/* Adaptations */}
                      <div className="border-t border-border/50 pt-2">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">ADAPTATIONS</p>
                        <div className="space-y-1">
                          {scenario.adaptations.map((a, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-card-foreground font-mono">
                              <span className="text-success">→</span> {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    </GlassPanelContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          ))}
        </div>

        {/* Trust Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Trust & Safety
          </h2>
          <GlassPanel glow>
            <GlassPanelContent className="space-y-3">
              {trustIndicators.map((indicator) => (
                <div key={indicator.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${trustStatusColors[indicator.status]} text-sm`}>
                    {indicator.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-card-foreground">{indicator.label}</span>
                      <Badge variant="outline" className={`text-[9px] px-1.5 ${trustStatusColors[indicator.status]}`}>
                        {indicator.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{indicator.detail}</p>
                  </div>
                </div>
              ))}
            </GlassPanelContent>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
