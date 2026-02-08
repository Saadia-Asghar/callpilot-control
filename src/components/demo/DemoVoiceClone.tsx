import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, Play, Pause, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", tag: "Warm" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", tag: "Professional" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", tag: "Friendly" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", tag: "Academic" },
];

interface Props {
  onDemoUsed: () => void;
  remaining: number;
}

export function DemoVoiceClone({ onDemoUsed, remaining }: Props) {
  const [text, setText] = useState("Hi! I'd be happy to help you schedule an appointment. What day works best for you?");
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [speed, setSpeed] = useState([50]);
  const [warmth, setWarmth] = useState([70]);
  const [energy, setEnergy] = useState([40]);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handlePreview = useCallback(async () => {
    if (remaining <= 0) {
      toast({ title: "Demo limit reached", description: "Sign up for unlimited access!", variant: "destructive" });
      return;
    }
    if (!text.trim()) return;

    setGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId: selectedVoice.id }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setPlaying(true);
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      await audio.play();
      onDemoUsed();
    } catch {
      toast({ title: "Preview failed", description: "Could not generate voice preview.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [text, selectedVoice, remaining, onDemoUsed, toast]);

  const stopPlayback = () => {
    audioRef.current?.pause();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Mic className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-card-foreground">Voice Clone Studio</span>
        <Badge variant="outline" className="ml-auto text-[10px]">{remaining} tries left</Badge>
      </div>

      {/* Voice selector */}
      <div className="grid grid-cols-2 gap-2">
        {VOICES.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedVoice(v)}
            className={`rounded-lg border p-2.5 text-left transition-all text-xs ${
              selectedVoice.id === v.id
                ? "border-primary bg-accent shadow-glow"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <span className="font-medium text-card-foreground">{v.name}</span>
            <span className="ml-1.5 text-muted-foreground">· {v.tag}</span>
          </button>
        ))}
      </div>

      {/* Text input */}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type what your AI agent should say..."
        className="text-xs min-h-[60px] resize-none"
        maxLength={200}
      />

      {/* Sliders */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Speed", value: speed, set: setSpeed },
          { label: "Warmth", value: warmth, set: setWarmth },
          { label: "Energy", value: energy, set: setEnergy },
        ].map((s) => (
          <div key={s.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{s.value[0]}%</span>
            </div>
            <Slider value={s.value} onValueChange={s.set} max={100} step={1} className="h-1" />
          </div>
        ))}
      </div>

      {/* Waveform */}
      <div className="flex items-center gap-0.5 h-8">
        {Array.from({ length: 40 }, (_, i) => (
          <motion.div
            key={i}
            className={`flex-1 rounded-full ${playing ? "bg-primary" : "bg-muted"}`}
            animate={{
              height: playing
                ? `${20 + Math.sin(i * 0.5 + Date.now() * 0.003) * 60}%`
                : `${15 + Math.sin(i * 0.4) * 25}%`,
            }}
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>

      {/* Play button */}
      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2 gradient-primary text-primary-foreground border-0"
          onClick={handlePreview}
          disabled={generating || !text.trim() || remaining <= 0}
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Preview Voice"}
        </Button>
        {playing && (
          <Button variant="outline" size="icon" onClick={stopPlayback}>
            <Pause className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
