import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, Mic, MicOff, Pause, Play, Hand, ShieldCheck, AlertTriangle, ArrowUpRight, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { ReasoningTimeline } from "@/components/agent/ReasoningTimeline";
import { toolCalls } from "@/data/mockData";
import { reasoningStream, trustIndicators } from "@/data/agentIntelligenceData";
import { useToast } from "@/hooks/use-toast";
import { useConversation } from "@elevenlabs/react";

interface TranscriptLine {
  speaker: "agent" | "caller";
  text: string;
  timestamp: string;
}

const toolStatusColors = {
  success: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30 animate-pulse-soft",
  queued: "bg-muted text-muted-foreground border-border",
};

const trustStatusColors: Record<string, string> = {
  verified: "bg-success/15 text-success",
  pass: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  pending: "bg-muted text-muted-foreground animate-pulse-soft",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LiveCall() {
  const [paused, setPaused] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const [confidence, setConfidence] = useState(94);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs agent connected");
      toast({ title: "Connected", description: "Live conversation started with AI agent." });
      // Start timer
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    },
    onDisconnect: () => {
      console.log("ElevenLabs agent disconnected");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    onMessage: (message: any) => {
      console.log("Agent message:", message);
      if (message.type === "user_transcript") {
        const text = message.user_transcription_event?.user_transcript;
        if (text) {
          setTranscript((prev) => [
            ...prev,
            { speaker: "caller", text, timestamp: formatTime(elapsed) },
          ]);
          setTurnCount((p) => p + 1);
        }
      } else if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response;
        if (text) {
          setTranscript((prev) => [
            ...prev,
            { speaker: "agent", text, timestamp: formatTime(elapsed) },
          ]);
          setTurnCount((p) => p + 1);
          // Simulate confidence fluctuation
          setConfidence(Math.min(99, Math.max(80, 94 + Math.floor(Math.random() * 10 - 5))));
        }
      }
    },
    onError: (error: any) => {
      console.error("ElevenLabs error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isConnected = conversation.status === "connected";

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Token request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.token) throw new Error("No token received");

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      setTranscript([]);
      setElapsed(0);
      setTurnCount(0);
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Failed to connect",
        description: error.message || "Could not start voice conversation.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    toast({ title: "Call Ended", description: `Conversation lasted ${formatTime(elapsed)}.` });
  }, [conversation, elapsed, toast]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePause = () => {
    setPaused(!paused);
    toast({
      title: paused ? "Agent Resumed" : "Agent Paused",
      description: paused ? "Agent is back in control." : "Agent paused. Manual override active.",
    });
  };

  const handleEscalate = () => {
    stopConversation();
    toast({ title: "Escalated", description: "Call transferred to human operator.", variant: "destructive" });
  };

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Call Command Center</h1>
          <p className="text-sm text-muted-foreground">Unified operator cockpit — Real-time AI Voice Agent</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <div className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] ${isConnected ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Live" : "Disconnected"}
          </div>

          {!isConnected ? (
            <Button
              size="sm"
              className="gap-1.5 text-xs gradient-primary text-primary-foreground border-0"
              onClick={startConversation}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Mic className="h-3 w-3 animate-pulse" /> Connecting...
                </>
              ) : (
                <>
                  <Phone className="h-3 w-3" /> Start Call
                </>
              )}
            </Button>
          ) : (
            <>
              <Button size="sm" variant={paused ? "default" : "outline"}
                className={`gap-1.5 text-xs ${paused ? "gradient-primary text-primary-foreground border-0" : ""}`}
                onClick={handlePause}>
                {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {paused ? "Resume" : "Pause"}
              </Button>
              <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={handleEscalate}>
                <ArrowUpRight className="h-3 w-3" /> Escalate
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={stopConversation}>
                <MicOff className="h-3 w-3" /> End Call
              </Button>
            </>
          )}

          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${!isConnected ? "bg-muted" : paused ? "bg-warning/15" : "bg-success/15"}`}>
            <div className={`h-2 w-2 rounded-full ${!isConnected ? "bg-muted-foreground" : paused ? "bg-warning" : "bg-success animate-pulse-soft"}`} />
            <span className={`text-xs font-medium ${!isConnected ? "text-muted-foreground" : paused ? "text-warning" : "text-success"}`}>
              {!isConnected ? "Idle" : paused ? "Paused" : `Live — ${formatTime(elapsed)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassPanel>
          <GlassPanelContent className="py-3 flex items-center gap-3">
            <div className="text-xs">
              <p className="text-muted-foreground">Confidence</p>
              <p className="text-lg font-bold text-card-foreground">{confidence}%</p>
            </div>
            <Progress value={confidence} className="flex-1 h-2" />
          </GlassPanelContent>
        </GlassPanel>
        <GlassPanel>
          <GlassPanelContent className="py-3 flex items-center gap-3">
            <div className="text-xs">
              <p className="text-muted-foreground">Agent</p>
              <p className={`text-lg font-bold ${conversation.isSpeaking ? "text-primary" : "text-success"}`}>
                {conversation.isSpeaking ? "Speaking" : isConnected ? "Listening" : "Idle"}
              </p>
            </div>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${conversation.isSpeaking ? "bg-primary" : "bg-success"}`}
                animate={{ width: conversation.isSpeaking ? "70%" : isConnected ? "30%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </GlassPanelContent>
        </GlassPanel>
        <GlassPanel>
          <GlassPanelContent className="py-3 text-xs">
            <p className="text-muted-foreground">Turn</p>
            <p className="text-lg font-bold text-card-foreground">{turnCount} / ~{Math.max(8, turnCount + 2)}</p>
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
        {/* Transcript */}
        <div className="lg:col-span-5">
          <GlassPanel className="h-full">
            <GlassPanelHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-card-foreground">Live Transcript</span>
              </div>
              <div className="flex items-center gap-1">
                {isConnected && (
                  <>
                    <Mic className="h-3.5 w-3.5 text-success" />
                    <span className="text-[10px] text-muted-foreground">Recording</span>
                  </>
                )}
              </div>
            </GlassPanelHeader>
            <GlassPanelContent className="max-h-[500px] overflow-auto space-y-3">
              {transcript.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  {isConnected
                    ? "Listening... Start speaking to the agent."
                    : "Click \"Start Call\" to begin a live conversation with the AI agent."}
                </div>
              )}
              <AnimatePresence initial={false}>
                {transcript.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${line.speaker === "agent" ? "" : "flex-row-reverse"}`}
                  >
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
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={transcriptEndRef} />
            </GlassPanelContent>
          </GlassPanel>
        </div>

        {/* Reasoning Timeline */}
        <div className="lg:col-span-4">
          <GlassPanel className="h-full">
            <GlassPanelHeader>
              <span className="text-xs font-semibold text-card-foreground">Agent Reasoning</span>
              {isConnected && <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />}
            </GlassPanelHeader>
            <GlassPanelContent className="max-h-[500px] overflow-auto">
              <ReasoningTimeline nodes={reasoningStream} />
            </GlassPanelContent>
          </GlassPanel>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-3 space-y-4">
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
                  <Badge variant="outline" className={`text-[8px] px-1 ${trustStatusColors[t.status]}`}>{t.status}</Badge>
                </div>
              ))}
            </GlassPanelContent>
          </GlassPanel>

          <GlassPanel>
            <GlassPanelHeader>
              <span className="text-xs font-semibold text-card-foreground">Tool Calls</span>
            </GlassPanelHeader>
            <GlassPanelContent>
              <div className="flex flex-wrap gap-1.5">
                {toolCalls.map((tool, i) => (
                  <Badge key={i} variant="outline" className={`font-mono text-[10px] ${toolStatusColors[tool.status]}`}>{tool.name}</Badge>
                ))}
              </div>
            </GlassPanelContent>
          </GlassPanel>

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
                <Button size="sm" className="flex-1 h-7 text-[10px] gradient-primary text-primary-foreground border-0">Approve</Button>
                <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]">Override</Button>
              </div>
            </GlassPanelContent>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
