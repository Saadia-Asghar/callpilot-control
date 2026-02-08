import { Phone, PhoneOff, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { liveTranscript, agentReasoningSteps, toolCalls } from "@/data/mockData";

const toolStatusColors = {
  success: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30 animate-pulse-soft",
  queued: "bg-muted text-muted-foreground border-border",
};

export default function LiveCall() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Call Panel</h1>
          <p className="text-sm text-muted-foreground">Monitor the agent's active conversation</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-xs font-medium text-success">Live — 0:28</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transcript */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">Live Transcript</h3>
            </div>
            <div className="flex items-center gap-1">
              <Mic className="h-3.5 w-3.5 text-success" />
              <span className="text-xs text-muted-foreground">Recording</span>
            </div>
          </div>
          <div className="space-y-3 p-4 max-h-[400px] overflow-auto">
            {liveTranscript.map((line, i) => (
              <div key={i} className={`flex gap-3 ${line.speaker === "agent" ? "" : "flex-row-reverse"}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  line.speaker === "agent"
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {line.speaker === "agent" ? "AI" : "C"}
                </div>
                <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                  line.speaker === "agent"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {line.text}
                  <span className="ml-2 text-[10px] text-muted-foreground">{line.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reasoning + Tools */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Agent Reasoning</h3>
            </div>
            <div className="space-y-2 p-4">
              {agentReasoningSteps.map((step) => (
                <div key={step.step} className="flex items-start gap-2">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.status === "complete"
                      ? "bg-success/15 text-success"
                      : "gradient-primary text-primary-foreground animate-pulse-soft"
                  }`}>
                    {step.status === "complete" ? "✓" : step.step}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-card-foreground">{step.action}</p>
                    <p className="text-[11px] text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Tool Calls</h3>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {toolCalls.map((tool, i) => (
                <Badge key={i} variant="outline" className={`font-mono text-[11px] ${toolStatusColors[tool.status]}`}>
                  {tool.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="mb-2 text-sm font-semibold text-card-foreground">Booking Decision</h3>
            <div className="rounded-lg gradient-accent p-3">
              <p className="text-xs font-medium text-accent-foreground">Tuesday, 10:30 AM</p>
              <p className="text-[11px] text-muted-foreground">30 min · In-person · Awaiting confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
