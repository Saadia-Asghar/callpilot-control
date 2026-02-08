import { useState, useCallback } from "react";
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useConversation } from "@elevenlabs/react";
import { useToast } from "@/hooks/use-toast";

interface LiveVoiceDemoProps {
  /** Optional label override */
  title?: string;
}

export function LiveVoiceDemo({ title = "Talk to CallPilot Live" }: LiveVoiceDemoProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Demo agent connected");
    },
    onDisconnect: () => {
      console.log("Demo agent disconnected");
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript") {
        const text = message.user_transcription_event?.user_transcript;
        if (text) setTranscript((p) => [...p, { role: "user", text }]);
      } else if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response;
        if (text) setTranscript((p) => [...p, { role: "agent", text }]);
      }
    },
    onError: (error: any) => {
      console.error("Voice demo error:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect to voice agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isConnected = conversation.status === "connected";

  const start = useCallback(async () => {
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
        throw new Error(err.error || `Failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.token) throw new Error("No token received");

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      setTranscript([]);
    } catch (error: any) {
      console.error("Failed to start demo:", error);
      toast({
        title: "Microphone Required",
        description: error.message || "Please allow microphone access to talk to the agent.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stop = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        {isConnected && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-success font-medium">
              {conversation.isSpeaking ? "Agent speaking…" : "Listening…"}
            </span>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="min-h-[120px] max-h-[200px] overflow-auto rounded-lg bg-muted/50 p-3 space-y-2">
        {transcript.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            {isConnected
              ? "Start speaking — the agent is listening."
              : "Click the button below to start a live voice conversation with CallPilot's AI scheduling agent."}
          </p>
        )}
        <AnimatePresence initial={false}>
          {transcript.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${line.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                  line.role === "agent"
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {line.role === "agent" ? "AI" : "U"}
              </div>
              <div
                className={`rounded-lg px-2.5 py-1.5 text-xs max-w-[80%] ${
                  line.role === "agent"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {line.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Animated mic indicator */}
      {isConnected && (
        <div className="flex justify-center">
          <motion.div
            className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shadow-glow"
            animate={{
              scale: conversation.isSpeaking ? [1, 1.15, 1] : [1, 1.05, 1],
            }}
            transition={{ repeat: Infinity, duration: conversation.isSpeaking ? 0.6 : 1.5 }}
          >
            <Mic className="h-5 w-5 text-primary-foreground" />
          </motion.div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center">
        {!isConnected ? (
          <Button
            onClick={start}
            disabled={isConnecting}
            className="gap-2 gradient-primary text-primary-foreground border-0"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" /> Talk to Agent
              </>
            )}
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive" className="gap-2">
            <PhoneOff className="h-4 w-4" /> End Call
          </Button>
        )}
      </div>
    </div>
  );
}
