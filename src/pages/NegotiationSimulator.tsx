import { useState } from "react";
import { Zap, AlertTriangle, RefreshCw, Play, Ban, UserX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedPreset, setSelectedPreset] = useState("all");
  const { toast } = useToast();

  const handleStressTest = () => {
    setStressTesting(true);
    setTimeout(() => {
      setStressTesting(false);
      toast({ title: "Stress Test Complete", description: "Agent handled 12/15 scenarios successfully. 2 escalated. 1 failed." });
    }, 3000);
  };

  const handleInjectConflict = () => {
    toast({ title: "Conflict Injected", description: "Calendar conflict at Tue 10:30 AM injected into active session." });
  };

  const handleInjectObjection = () => {
    toast({ title: "Objection Injected", description: "User objection 'That's too expensive' injected." });
  };

  const filteredScenarios = selectedPreset === "all"
    ? simulatorScenarios
    : simulatorScenarios.filter(s => s.type === selectedPreset);

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Simulator & Trust</h1>
            <p className="text-sm text-muted-foreground">Test agent resilience & monitor trust indicators</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scenarios</SelectItem>
              <SelectItem value="objection">Objections</SelectItem>
              <SelectItem value="conflict">Conflicts</SelectItem>
              <SelectItem value="preference">Preferences</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleInjectConflict}>
            <Ban className="h-3 w-3" /> Inject Conflict
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleInjectObjection}>
            <UserX className="h-3 w-3" /> Inject Objection
          </Button>
          <Button
            size="sm"
            onClick={handleStressTest}
            disabled={stressTesting}
            className="gap-1.5 text-xs h-8 gradient-primary text-primary-foreground border-0"
          >
            {stressTesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            {stressTesting ? "Testing..." : "Stress Test"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-semibold text-card-foreground">Negotiation Scenarios</h2>
          {filteredScenarios.length === 0 && (
            <GlassPanel>
              <GlassPanelContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No scenarios match the current filter.</p>
              </GlassPanelContent>
            </GlassPanel>
          )}
          {filteredScenarios.map((scenario) => (
            <GlassPanel key={scenario.id}>
              <GlassPanelHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${typeColors[scenario.type]}`}>
                    {scenario.type}
                  </Badge>
                  <span className="text-xs font-medium text-card-foreground">{scenario.label}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => setActiveScenario(activeScenario === scenario.id ? null : scenario.id)}>
                  <Play className="h-3 w-3" /> Inject
                </Button>
              </GlassPanelHeader>

              <AnimatePresence>
                {activeScenario === scenario.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <GlassPanelContent className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold text-destructive">!</div>
                        <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs font-mono text-card-foreground">
                          {scenario.injection}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">AI</div>
                        <div className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
                          {scenario.agentResponse}
                        </div>
                      </div>
                      {/* Before/After comparison */}
                      <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-2">
                        <div className="rounded-lg bg-destructive/5 p-2">
                          <p className="text-[9px] font-semibold text-destructive mb-1">BEFORE</p>
                          <p className="text-[10px] text-card-foreground font-mono">Tue 10:30 AM selected</p>
                        </div>
                        <div className="rounded-lg bg-success/5 p-2">
                          <p className="text-[9px] font-semibold text-success mb-1">AFTER</p>
                          <p className="text-[10px] text-card-foreground font-mono">Wed 11:30 AM (adapted)</p>
                        </div>
                      </div>
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
