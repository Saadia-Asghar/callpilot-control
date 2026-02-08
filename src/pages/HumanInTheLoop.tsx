import { useState } from "react";
import { Hand, Pause, Play, MessageSquare, ArrowUpRight, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { liveTranscript } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export default function HumanInTheLoop() {
  const [paused, setPaused] = useState(false);
  const [approveBeforeBooking, setApproveBeforeBooking] = useState(true);
  const [suggestedReply, setSuggestedReply] = useState("");
  const { toast } = useToast();

  const handlePause = () => {
    setPaused(!paused);
    toast({
      title: paused ? "Agent Resumed" : "Agent Paused",
      description: paused ? "Agent is back in control." : "Agent is paused. You have manual control.",
    });
  };

  const handleSuggestReply = () => {
    if (!suggestedReply.trim()) return;
    toast({ title: "Reply Suggested", description: `"${suggestedReply}" queued for agent.` });
    setSuggestedReply("");
  };

  const handleOverrideSlot = () => {
    toast({ title: "Slot Overridden", description: "Changed to Wednesday 2:00 PM per your override." });
  };

  const handleEscalate = () => {
    toast({ title: "Escalated", description: "Call transferred to human operator.", variant: "destructive" });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Hand className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Human-in-the-Loop</h1>
            <p className="text-sm text-muted-foreground">Intervention tools for live call control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${paused ? "bg-warning/15" : "bg-success/15"}`}>
            <div className={`h-2 w-2 rounded-full ${paused ? "bg-warning" : "bg-success animate-pulse-soft"}`} />
            <span className={`text-xs font-medium ${paused ? "text-warning" : "text-success"}`}>
              {paused ? "Agent Paused" : "Agent Active"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live transcript with controls */}
        <div className="lg:col-span-2 space-y-4">
          <GlassPanel>
            <GlassPanelHeader>
              <span className="text-xs font-medium text-card-foreground">Live Transcript</span>
              <Button
                size="sm"
                variant={paused ? "default" : "outline"}
                className={`h-7 gap-1.5 text-xs ${paused ? "gradient-primary text-primary-foreground border-0" : ""}`}
                onClick={handlePause}
              >
                {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {paused ? "Resume" : "Pause Agent"}
              </Button>
            </GlassPanelHeader>
            <GlassPanelContent>
              <div className="space-y-3 max-h-[300px] overflow-auto">
                {liveTranscript.map((line, i) => (
                  <div key={i} className={`flex gap-3 ${line.speaker === "agent" ? "" : "flex-row-reverse"}`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      line.speaker === "agent" ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {line.speaker === "agent" ? "AI" : "C"}
                    </div>
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                      line.speaker === "agent" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggest Reply */}
              <div className="mt-4 border-t border-border/50 pt-4">
                <p className="text-[10px] font-semibold text-muted-foreground mb-2">SUGGEST NEXT REPLY</p>
                <div className="flex gap-2">
                  <Textarea
                    value={suggestedReply}
                    onChange={(e) => setSuggestedReply(e.target.value)}
                    placeholder="Type a reply for the agent to use..."
                    className="h-16 text-xs resize-none"
                  />
                  <Button size="sm" className="h-16 gradient-primary text-primary-foreground border-0" onClick={handleSuggestReply}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </GlassPanelContent>
          </GlassPanel>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <GlassPanel glow>
            <GlassPanelHeader>
              <span className="text-xs font-medium text-card-foreground">Intervention Controls</span>
            </GlassPanelHeader>
            <GlassPanelContent className="space-y-4">
              {/* Override slot */}
              <div>
                <p className="text-xs font-semibold text-card-foreground mb-2">Override Slot Choice</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/30">Current: Tue 10:30 AM</Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleOverrideSlot}>
                    <RotateCcw className="h-3 w-3" /> Override
                  </Button>
                </div>
              </div>

              {/* Approve before booking */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-card-foreground">Approve Before Booking</p>
                  <p className="text-[10px] text-muted-foreground">Require human approval</p>
                </div>
                <Switch checked={approveBeforeBooking} onCheckedChange={setApproveBeforeBooking} />
              </div>

              {/* Escalate */}
              <div className="border-t border-border/50 pt-4">
                <Button
                  variant="destructive"
                  className="w-full gap-2 text-xs"
                  onClick={handleEscalate}
                >
                  <ArrowUpRight className="h-4 w-4" /> Escalate to Human
                </Button>
              </div>

              {/* Status */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground">AGENT STATUS</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Mode</p>
                    <p className="font-medium text-card-foreground">{paused ? "Manual" : "Autonomous"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Confidence</p>
                    <p className="font-medium text-card-foreground">94%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Turn #</p>
                    <p className="font-medium text-card-foreground">6</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Approval</p>
                    <p className="font-medium text-card-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-success" /> Required
                    </p>
                  </div>
                </div>
              </div>
            </GlassPanelContent>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
