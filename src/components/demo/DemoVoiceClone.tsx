import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Pause, Volume2, Loader2, Download, ArrowRight, Lock, Info, Square, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", tag: "Warm" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", tag: "Professional" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", tag: "Friendly" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", tag: "Academic" },
];

const TEXT_LIMIT = 100;
const AUDIO_LIMIT_SEC = 15;

type InputMode = "text" | "record";

interface Props {
  onDemoUsed: () => void | Promise<void>;
  remaining: number;
  sessionId?: string;
}

export function DemoVoiceClone({ onDemoUsed, remaining }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("Hi! I'd love to help schedule your appointment.");
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [speed, setSpeed] = useState([50]);
  const [warmth, setWarmth] = useState([70]);
  const [energy, setEnergy] = useState([40]);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordSeconds(0);
      setRecordedBlob(null);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setRecording(true);

      // Timer with auto-stop at limit
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev + 1 >= AUDIO_LIMIT_SEC) {
            mediaRecorder.stop();
            setRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return AUDIO_LIMIT_SEC;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to record.", variant: "destructive" });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handlePreview = useCallback(async () => {
    if (remaining <= 0) return;

    if (inputMode === "text" && !text.trim()) return;
    if (inputMode === "record" && !recordedBlob) {
      toast({ title: "No recording", description: "Record audio first before previewing.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      // For both modes we use TTS with the text input for now
      // Audio recording mode plays back the recording as a "clone preview"
      if (inputMode === "record" && recordedBlob) {
        // Play recorded audio as "your voice" preview
        const url = URL.createObjectURL(recordedBlob);
        if (audioRef.current) {
          audioRef.current.pause();
          if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
        }
        setLastBlobUrl(url);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setPlaying(true);
        audio.onended = () => setPlaying(false);
        audio.onpause = () => setPlaying(false);
        await audio.play();
        onDemoUsed();
        toast({ title: "🎙️ Voice Sample Captured", description: "In production, this would clone your voice via ElevenLabs. Demo plays your recording back." });
        setGenerating(false);
        return;
      }

      // Call backend API for voice preview
      const previewData = await api.previewVoice({
        voice_id: selectedVoice.id,
        sample_text: text.slice(0, TEXT_LIMIT),
        tone: warmth[0],
        speed: speed[0],
        energy: energy[0],
      }, sessionId);

      if (previewData.success && previewData.preview_audio_base64) {
        // Convert base64 to blob
        const audioBytes = Uint8Array.from(atob(previewData.preview_audio_base64), c => c.charCodeAt(0));
        const blob = new Blob([audioBytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        if (audioRef.current) {
          audioRef.current.pause();
          if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
        }
        setLastBlobUrl(url);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setPlaying(true);
        audio.onended = () => setPlaying(false);
        audio.onpause = () => setPlaying(false);
        await audio.play();
        await onDemoUsed();
        toast({ 
          title: "Voice Preview Generated", 
          description: `${previewData.demo_tries_remaining || remaining - 1} demo tries remaining` 
        });
      } else {
        throw new Error(previewData.error || "Voice preview failed");
      }
    } catch {
      toast({ title: "Preview failed", description: "Could not generate voice preview.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [text, selectedVoice, remaining, onDemoUsed, toast, lastBlobUrl, inputMode, recordedBlob, speed, warmth, energy, sessionId]);

  const stopPlayback = () => audioRef.current?.pause();

  const downloadRecording = () => {
    if (!lastBlobUrl || remaining <= 0) return;
    const a = document.createElement("a");
    a.href = lastBlobUrl;
    a.download = `callpilot-voice-${inputMode === "record" ? "recording" : selectedVoice.name.toLowerCase()}.mp3`;
    a.click();
    toast({ title: "Downloaded!", description: "Voice recording saved." });
  };

  // Exhausted state
  if (remaining <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">Voice Clone Demo Complete</p>
          <p className="text-xs text-muted-foreground mt-1">You've used all 3 free voice previews.</p>
          <p className="text-xs text-muted-foreground">Sign up to unlock unlimited cloning & export.</p>
        </div>
        <Button className="gap-2 gradient-primary text-primary-foreground border-0" onClick={() => navigate("/auth")}>
          Sign Up for Unlimited Access <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with tooltip */}
      <div className="flex items-center gap-2 mb-1">
        <Mic className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-card-foreground">Voice Clone Studio</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[240px] text-xs">
            Clone your own voice in real-time. Hear how AI can speak for you professionally. Free for 3 tries — unlock full access after signup.
          </TooltipContent>
        </Tooltip>
        <Badge variant="outline" className="ml-auto text-[10px]">
          <motion.span
            key={remaining}
            initial={{ scale: 1.4, color: "hsl(var(--primary))" }}
            animate={{ scale: 1, color: "currentColor" }}
            transition={{ duration: 0.3 }}
          >
            {remaining}
          </motion.span>
          {" "}demo {remaining === 1 ? "try" : "tries"} remaining
        </Badge>
      </div>

      {/* Mode toggle: Text / Record */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setInputMode("text")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            inputMode === "text"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-card-foreground"
          }`}
        >
          <Volume2 className="h-3.5 w-3.5" /> Type Text
        </button>
        <button
          onClick={() => setInputMode("record")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            inputMode === "record"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-card-foreground"
          }`}
        >
          <Mic className="h-3.5 w-3.5" /> Record Voice
        </button>
      </div>

      <AnimatePresence mode="wait">
        {inputMode === "text" ? (
          <motion.div key="text-mode" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
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
            <div className="relative">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, TEXT_LIMIT))}
                placeholder="Type what your AI agent should say..."
                className="text-xs min-h-[60px] resize-none pr-14"
                maxLength={TEXT_LIMIT}
              />
              <span className={`absolute bottom-2 right-3 text-[10px] ${text.length >= TEXT_LIMIT ? "text-destructive" : "text-muted-foreground"}`}>
                {text.length}/{TEXT_LIMIT}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div key="record-mode" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
            {/* Record panel */}
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
              {/* Recording indicator */}
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors ${
                    recording ? "border-destructive bg-destructive/10" : recordedBlob ? "border-success bg-success/10" : "border-border bg-card"
                  }`}
                  animate={recording ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  {recording ? (
                    <MicOff className="h-6 w-6 text-destructive" />
                  ) : recordedBlob ? (
                    <Mic className="h-6 w-6 text-success" />
                  ) : (
                    <Mic className="h-6 w-6 text-muted-foreground" />
                  )}
                </motion.div>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-1">
                <span className={`text-lg font-mono font-bold ${recording ? "text-destructive" : "text-card-foreground"}`}>
                  {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted-foreground">/ 0:{String(AUDIO_LIMIT_SEC).padStart(2, "0")}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${recording ? "bg-destructive" : "bg-success"}`}
                  animate={{ width: `${(recordSeconds / AUDIO_LIMIT_SEC) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <p className="text-[10px] text-muted-foreground">
                {recording
                  ? "Recording... speak naturally"
                  : recordedBlob
                  ? "✓ Audio captured — click Preview to hear your clone"
                  : `Tap Record to capture up to ${AUDIO_LIMIT_SEC}s of your voice`}
              </p>

              {!recording ? (
                <Button
                  size="sm"
                  variant={recordedBlob ? "outline" : "default"}
                  className={`gap-1.5 ${!recordedBlob ? "gradient-primary text-primary-foreground border-0" : ""}`}
                  onClick={startRecording}
                >
                  <Mic className="h-3.5 w-3.5" />
                  {recordedBlob ? "Record Again" : "Start Recording"}
                </Button>
              ) : (
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={stopRecording}>
                  <Square className="h-3 w-3" /> Stop Recording
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className={`flex-1 rounded-full ${playing || recording ? "bg-primary" : "bg-muted"}`}
            animate={{
              height: playing || recording
                ? `${20 + Math.sin(i * 0.5 + Date.now() * 0.003) * 60}%`
                : `${15 + Math.sin(i * 0.4) * 25}%`,
            }}
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2 gradient-primary text-primary-foreground border-0"
          onClick={handlePreview}
          disabled={generating || (inputMode === "text" && !text.trim()) || (inputMode === "record" && !recordedBlob) || recording}
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
          {generating ? "Generating..." : "Preview Voice"}
        </Button>
        {playing && (
          <Button variant="outline" size="icon" onClick={stopPlayback}>
            <Pause className="h-4 w-4" />
          </Button>
        )}
      {lastBlobUrl && !playing && remaining > 0 && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={downloadRecording} title="Download recording">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export cloned audio</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate("/auth")}
                >
                  <Save className="h-3.5 w-3.5" /> Save Voice
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-xs">
                Sign up to save your voice and use it on any script or call draft.
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {inputMode === "text"
          ? `Text limited to ${TEXT_LIMIT} chars · Download recording while tries remain`
          : `Record up to ${AUDIO_LIMIT_SEC}s · Export available while tries remain`}
      </p>
    </div>
  );
}
