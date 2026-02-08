import { useState, useMemo } from "react";
import { Play, Pause, SkipForward, MessageSquare, Wrench, Brain, Handshake } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { replayEvents } from "@/data/agentIntelligenceData";

const eventIcons = {
  transcript_user: MessageSquare,
  transcript_agent: MessageSquare,
  tool_call: Wrench,
  decision: Brain,
  negotiation: Handshake,
};

const eventColors = {
  transcript_user: "bg-secondary text-secondary-foreground",
  transcript_agent: "bg-accent text-accent-foreground",
  tool_call: "bg-warning/15 text-warning",
  decision: "bg-info/15 text-info",
  negotiation: "bg-primary/15 text-primary",
};

export default function ReplayStudio() {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const maxTime = 30;

  const visibleEvents = useMemo(
    () => replayEvents.filter((e) => e.seconds <= currentTime),
    [currentTime]
  );

  const handlePlay = () => {
    if (playing) { setPlaying(false); return; }
    setPlaying(true);
    let t = currentTime;
    const interval = setInterval(() => {
      t += 1;
      if (t > maxTime) { clearInterval(interval); setPlaying(false); return; }
      setCurrentTime(t);
    }, 400);
  };

  const jumpToNegotiation = () => {
    const neg = replayEvents.find((e) => e.type === "negotiation");
    if (neg) setCurrentTime(neg.seconds);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Play className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Replay Studio</h1>
          <p className="text-sm text-muted-foreground">Scrub through past calls with synced agent decisions</p>
        </div>
      </div>

      {/* Timeline control */}
      <GlassPanel glow>
        <GlassPanelContent>
          <div className="flex items-center gap-4">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handlePlay}>
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <div className="flex-1 space-y-1">
              <Slider value={[currentTime]} onValueChange={([v]) => setCurrentTime(v)} max={maxTime} step={1} />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>0:{String(currentTime).padStart(2, "0")}</span>
                <span>0:{maxTime}</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={jumpToNegotiation}>
              <SkipForward className="h-3 w-3" /> Jump to Negotiation
            </Button>
          </div>

          {/* Event markers on timeline */}
          <div className="relative h-6 mt-2">
            {replayEvents.map((event) => {
              const Icon = eventIcons[event.type];
              const left = `${(event.seconds / maxTime) * 100}%`;
              return (
                <button
                  key={event.id}
                  className={`absolute -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full transition-all ${
                    event.seconds <= currentTime ? eventColors[event.type] : "bg-muted text-muted-foreground opacity-30"
                  }`}
                  style={{ left }}
                  onClick={() => setCurrentTime(event.seconds)}
                >
                  <Icon className="h-2.5 w-2.5" />
                </button>
              );
            })}
          </div>
        </GlassPanelContent>
      </GlassPanel>

      {/* Synced events */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transcript */}
        <GlassPanel>
          <GlassPanelHeader>
            <span className="text-xs font-medium text-card-foreground">Transcript</span>
          </GlassPanelHeader>
          <GlassPanelContent className="max-h-[400px] overflow-auto space-y-2">
            {visibleEvents
              .filter((e) => e.type.startsWith("transcript"))
              .map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${event.type === "transcript_agent" ? "" : "flex-row-reverse"}`}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    event.type === "transcript_agent" ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>
                    {event.type === "transcript_agent" ? "AI" : "C"}
                  </div>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${eventColors[event.type]}`}>
                    {event.content}
                    <span className="ml-2 text-[9px] opacity-60">{event.timestamp}</span>
                  </div>
                </motion.div>
              ))}
          </GlassPanelContent>
        </GlassPanel>

        {/* Agent Activity */}
        <GlassPanel>
          <GlassPanelHeader>
            <span className="text-xs font-medium text-card-foreground">Agent Activity</span>
          </GlassPanelHeader>
          <GlassPanelContent className="max-h-[400px] overflow-auto space-y-2">
            {visibleEvents
              .filter((e) => !e.type.startsWith("transcript"))
              .map((event) => {
                const Icon = eventIcons[event.type];
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2"
                  >
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${eventColors[event.type]}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-card-foreground">{event.content}</p>
                      {event.detail && <p className="text-[10px] text-muted-foreground">{event.detail}</p>}
                      <span className="text-[9px] font-mono text-muted-foreground">{event.timestamp}</span>
                    </div>
                  </motion.div>
                );
              })}
          </GlassPanelContent>
        </GlassPanel>
      </div>
    </div>
  );
}
