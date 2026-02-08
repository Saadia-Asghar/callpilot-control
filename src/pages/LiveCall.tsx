import { useState } from "react";
import { Phone, Mic, Pause, Play, Hand, ShieldCheck, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { ReasoningTimeline } from "@/components/agent/ReasoningTimeline";
import { liveTranscript, toolCalls } from "@/data/mockData";
import { reasoningStream, trustIndicators } from "@/data/agentIntelligenceData";
import { useToast } from "@/hooks/use-toast";

const toolStatusColors = {
  success: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30 animate-pulse-soft",
  queued: "bg-muted text-muted-foreground border-border",
};

const trustStatusColors = {
  verified: "bg-success/15 text-success",
  pass: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  pending: "bg-muted text-muted-foreground animate-pulse-soft",
};

export default function LiveCall() {
  const [paused, setPaused] = useState(false);
  const { toast } = useToast();

  const handlePause = () => {
    setPaused(!paused);
    toast({
      title: paused ? "Agent Resumed" : "Agent Paused",
      description: paused ? "Agent is back in control." : "Agent paused. Manual override active.",
    });
  };

  const handleEscalate = () => {
    toast({ title: "Escalated", description: "Call transferred to human operator.", variant: "destructive" });
  };

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Call Command Center</h1>
          <p className="text-sm text-muted-foreground">Unified operator cockpit — Call #1847</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={paused ? "default" : "outline"}
            className={`gap-1.5 text-xs ${paused ? "gradient-primary text-primary-foreground border-0" : ""}`}
            onClick={handlePause}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={handleEscalate}>
            <ArrowUpRight className="h-3 w-3" /> Escalate
          </Button>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${paused ? "bg-warning/15" : "bg-success/15"}`}>
            <div className={`h-2 w-2 rounded-full ${paused ? "bg-warning" : "bg-success animate-pulse-soft"}`} />
            <span className={`text-xs font-medium ${paused ? "text-warning" : "text-success"}`}>
              {paused ? "Paused" : "Live — 0:28"}
            </span>
          </div>
        </div>
      </div>

      {/* Confidence + Interruption Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassPanel>
          <GlassPanelContent className="py-3 flex items-center gap-3">
            <div className="text-xs">
              <p className="text-muted-foreground">Confidence</p>
              <p className="text-lg font-bold text-card-foreground">94%</p>
            </div>
            <Progress value={94} className="flex-1 h-2" />
          </GlassPanelContent>
        </GlassPanel>
        <GlassPanel>
          <GlassPanelContent className="py-3 flex items-center gap-3">
            <div className="text-xs">
              <p className="text-muted-foreground">Interruption</p>
              <p className="text-lg font-bold text-success">None</p>
            </div>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-[8%] rounded-full bg-success" />
            </div>
          </GlassPanelContent>
        </GlassPanel>
        <GlassPanel>
          <GlassPanelContent className="py-3 text-xs">
            <p className="text-muted-foreground">Turn</p>
            <p className="text-lg font-bold text-card-foreground">6 / ~8</p>
          </GlassPanelContent>
        </GlassPanel>
        <GlassPanel>
          <GlassPanelContent className="py-3 text-xs">
            <p className="text-muted-foreground">Mode</p>
            <p className="text-lg font-bold text-card-foreground flex items-center gap-1.5">
              {paused ? <Hand className="h-4 w-4 text-warning" /> : <ShieldCheck className="h-4 w-4 text-success" />}
              {paused ? "Manual" : "Auto"}
            </p>
          </GlassPanelContent>
        </GlassPanel>
      </div>

      {/* Main 3-panel layout */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Transcript — wide */}
        <div className="lg:col-span-5">
          <GlassPanel className="h-full">
            <GlassPanelHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-card-foreground">Live Transcript</span>
              </div>
              <div className="flex items-center gap-1">
                <Mic className="h-3.5 w-3.5 text-success" />
                <span className="text-[10px] text-muted-foreground">Recording</span>
              </div>
            </GlassPanelHeader>
            <GlassPanelContent className="max-h-[500px] overflow-auto space-y-3">
              {liveTranscript.map((line, i) => (
                <div key={i} className={`flex gap-2 ${line.speaker === "agent" ? "" : "flex-row-reverse"}`}>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    line.speaker === "agent" ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>
                    {line.speaker === "agent" ? "AI" : "C"}
                  </div>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                    line.speaker === "agent" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>
                    {line.text}
                    <span className="ml-2 text-[9px] text-muted-foreground">{line.timestamp}</span>
                  </div>
                </div>
              ))}
            </GlassPanelContent>
          </GlassPanel>
        </div>

        {/* Reasoning Timeline — center */}
        <div className="lg:col-span-4">
          <GlassPanel className="h-full">
            <GlassPanelHeader>
              <span className="text-xs font-semibold text-card-foreground">Agent Reasoning</span>
              <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
            </GlassPanelHeader>
            <GlassPanelContent className="max-h-[500px] overflow-auto">
              <ReasoningTimeline nodes={reasoningStream} />
            </GlassPanelContent>
          </GlassPanel>
        </div>

        {/* Right panel — Trust + Tools + Decision */}
        <div className="lg:col-span-3 space-y-4">
          {/* Trust indicators */}
          <GlassPanel glow>
            <GlassPanelHeader>
              <span className="text-xs font-semibold text-card-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-warning" /> Trust & Safety
              </span>
            </GlassPanelHeader>
            <GlassPanelContent className="space-y-2">
              {trustIndicators.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] ${trustStatusColors[t.status]}`}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-card-foreground truncate">{t.label}</p>
                  </div>
                  <Badge variant="outline" className={`text-[8px] px-1 ${trustStatusColors[t.status]}`}>
                    {t.status}
                  </Badge>
                </div>
              ))}
            </GlassPanelContent>
          </GlassPanel>

          {/* Tool Calls */}
          <GlassPanel>
            <GlassPanelHeader>
              <span className="text-xs font-semibold text-card-foreground">Tool Calls</span>
            </GlassPanelHeader>
            <GlassPanelContent>
              <div className="flex flex-wrap gap-1.5">
                {toolCalls.map((tool, i) => (
                  <Badge key={i} variant="outline" className={`font-mono text-[10px] ${toolStatusColors[tool.status]}`}>
                    {tool.name}
                  </Badge>
                ))}
              </div>
            </GlassPanelContent>
          </GlassPanel>

          {/* Booking Decision */}
          <GlassPanel>
            <GlassPanelHeader>
              <span className="text-xs font-semibold text-card-foreground">Booking Decision</span>
            </GlassPanelHeader>
            <GlassPanelContent>
              <div className="rounded-lg gradient-accent p-3">
                <p className="text-xs font-semibold text-accent-foreground">Tuesday, 10:30 AM</p>
                <p className="text-[10px] text-muted-foreground">30 min · In-person · Awaiting confirmation</p>
              </div>
              <div className="mt-2 flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 text-[10px] gradient-primary text-primary-foreground border-0">
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]">
                  Override
                </Button>
              </div>
            </GlassPanelContent>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
