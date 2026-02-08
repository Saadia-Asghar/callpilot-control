import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Play, Pause, Search, Upload, Volume2, Star, MoreVertical, CheckCircle2, Loader2, Music, Save, Square, RotateCcw, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { useToast } from "@/hooks/use-toast";
import { useVoiceProfiles } from "@/hooks/useVoiceProfiles";
import { SaveVoiceDialog } from "@/components/voice/SaveVoiceDialog";

interface VoiceProfile {
  id: string;
  name: string;
  elevenlabs_voice_id: string | null;
  is_cloned: boolean;
  is_default: boolean;
  is_business_voice: boolean;
  quality_score: number;
  warmth: number;
  professionalism: number;
  energy: number;
  speed: number;
  expressiveness: number;
  last_used_at: string | null;
}

const PRESET_VOICES: VoiceProfile[] = [
  { id: "v1", name: "Medical Assistant", elevenlabs_voice_id: "EXAVITQu4vr4xnSDxMaL", is_cloned: false, is_default: false, is_business_voice: false, quality_score: 92, warmth: 80, professionalism: 70, energy: 40, speed: 45, expressiveness: 60, last_used_at: "2026-02-07T10:00:00Z" },
  { id: "v2", name: "Corporate Receptionist", elevenlabs_voice_id: "JBFqnCBsd6RMkjVDRZzb", is_cloned: false, is_default: false, is_business_voice: true, quality_score: 95, warmth: 40, professionalism: 90, energy: 50, speed: 55, expressiveness: 35, last_used_at: "2026-02-08T09:00:00Z" },
  { id: "v3", name: "Friendly Concierge", elevenlabs_voice_id: "cgSgspJ2msm6clMCkdW9", is_cloned: false, is_default: false, is_business_voice: false, quality_score: 88, warmth: 90, professionalism: 50, energy: 70, speed: 50, expressiveness: 80, last_used_at: null },
  { id: "v4", name: "Academic Advisor", elevenlabs_voice_id: "onwK4e9ZLuTAKqWW03F9", is_cloned: false, is_default: false, is_business_voice: false, quality_score: 90, warmth: 50, professionalism: 80, energy: 40, speed: 45, expressiveness: 45, last_used_at: "2026-02-06T14:00:00Z" },
  { id: "v5", name: "Calm Support Agent", elevenlabs_voice_id: "pFZP5JQG7iQjIQuC4Bku", is_cloned: false, is_default: true, is_business_voice: false, quality_score: 91, warmth: 75, professionalism: 65, energy: 30, speed: 40, expressiveness: 55, last_used_at: "2026-02-08T08:30:00Z" },
];

const PERSONA_PRESETS = [
  { name: "Medical Assistant", warmth: 80, professionalism: 70, energy: 40, speed: 45, expressiveness: 60 },
  { name: "Corporate Receptionist", warmth: 40, professionalism: 90, energy: 50, speed: 55, expressiveness: 35 },
  { name: "Friendly Concierge", warmth: 90, professionalism: 50, energy: 70, speed: 50, expressiveness: 80 },
  { name: "Academic Advisor", warmth: 50, professionalism: 80, energy: 40, speed: 45, expressiveness: 45 },
  { name: "Calm Support Agent", warmth: 75, professionalism: 65, energy: 30, speed: 40, expressiveness: 55 },
];

const SAMPLE_SCRIPTS = [
  "Hi! I'd be happy to help you schedule an appointment. What day works best for you?",
  "Thank you for calling. Let me check our availability for next Tuesday morning.",
  "I understand your concern. Let me look into that for you right away.",
  "Great news! I've confirmed your appointment for Wednesday at 2 PM.",
];

const filterOptions = ["All", "Default", "Cloned", "Business", "Personal"] as const;

export default function VoiceCloneStudio() {
  const [voices] = useState<VoiceProfile[]>(PRESET_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(PRESET_VOICES[4]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<typeof filterOptions[number]>("All");
  const [playing, setPlaying] = useState(false);
  const [generatingTTS, setGeneratingTTS] = useState(false);
  const [sliders, setSliders] = useState({ warmth: 75, professionalism: 65, energy: 30, speed: 40, expressiveness: 55 });
  const [sampleScript, setSampleScript] = useState(SAMPLE_SCRIPTS[0]);
  const [testText, setTestText] = useState("Hello! I'm your AI scheduling assistant. How can I help you today?");
  const [cloneProgress, setCloneProgress] = useState<number | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [showCloneFlow, setShowCloneFlow] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [cloneMode, setCloneMode] = useState<"upload" | "record">("upload");
  const [recordingLevels, setRecordingLevels] = useState<number[]>(Array(24).fill(4));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { saveVoice } = useVoiceProfiles();

  const MAX_RECORD_SECS = 300; // 5 min
  const MIN_RECORD_SECS = 30;

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);
      setRecordedUrl(null);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t + 1 >= MAX_RECORD_SECS) { stopRecording(); return t; }
          return t + 1;
        });
      }, 1000);

      const updateLevels = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars = Array.from({ length: 24 }, (_, i) => {
          const idx = Math.floor((i / 24) * data.length);
          return Math.max(4, (data[idx] / 255) * 100);
        });
        setRecordingLevels(bars);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    setRecordingLevels(Array(24).fill(4));
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSaveVoice = async (name: string, settings: { warmth: number; speed: number; energy: number; elevenlabs_voice_id: string }) => {
    await saveVoice.mutateAsync({
      name,
      warmth: settings.warmth,
      speed: settings.speed,
      energy: settings.energy,
      elevenlabs_voice_id: settings.elevenlabs_voice_id,
      professionalism: sliders.professionalism,
      expressiveness: sliders.expressiveness,
      is_cloned: true,
      quality_score: 85,
    });
  };

  const filteredVoices = voices.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "All") return matchSearch;
    if (filter === "Default") return matchSearch && !v.is_cloned;
    if (filter === "Cloned") return matchSearch && v.is_cloned;
    if (filter === "Business") return matchSearch && v.is_business_voice;
    return matchSearch && !v.is_business_voice && !v.is_cloned;
  });

  const applyPreset = (preset: typeof PERSONA_PRESETS[0]) => {
    setSliders({ warmth: preset.warmth, professionalism: preset.professionalism, energy: preset.energy, speed: preset.speed, expressiveness: preset.expressiveness });
    toast({ title: `${preset.name} preset applied` });
  };

  const handlePlayPreview = useCallback(async () => {
    if (!selectedVoice.elevenlabs_voice_id) {
      toast({ title: "No voice ID", description: "This voice doesn't have an ElevenLabs ID configured.", variant: "destructive" });
      return;
    }
    setGeneratingTTS(true);
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
          body: JSON.stringify({ text: sampleScript, voiceId: selectedVoice.elevenlabs_voice_id }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setPlaying(true);
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      await audio.play();
    } catch (err) {
      console.error(err);
      toast({ title: "Preview failed", description: "Could not generate voice preview.", variant: "destructive" });
    } finally {
      setGeneratingTTS(false);
    }
  }, [selectedVoice, sampleScript, toast]);

  const handleTestCall = useCallback(async () => {
    if (!selectedVoice.elevenlabs_voice_id || !testText.trim()) return;
    setGeneratingTTS(true);
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
          body: JSON.stringify({ text: testText, voiceId: selectedVoice.elevenlabs_voice_id }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setPlaying(true);
      audio.onended = () => setPlaying(false);
      await audio.play();
    } catch {
      toast({ title: "Test failed", variant: "destructive" });
    } finally {
      setGeneratingTTS(false);
    }
  }, [selectedVoice, testText, toast]);

  const handleCloneStart = () => {
    if (!cloneName.trim()) { toast({ title: "Enter a name", variant: "destructive" }); return; }
    setCloneProgress(0);
    const stages = [10, 30, 55, 75, 90, 100];
    let i = 0;
    const interval = setInterval(() => {
      if (i < stages.length) { setCloneProgress(stages[i]); i++; }
      else { clearInterval(interval); setCloneProgress(null); setShowCloneFlow(false); setCloneName("");
        toast({ title: "Voice cloned!", description: `"${cloneName}" is ready to use.` }); }
    }, 800);
  };

  const getPersonaDescription = () => {
    const { warmth, professionalism, energy, speed, expressiveness } = sliders;
    const tone = warmth > 60 ? "Warm" : warmth > 40 ? "Neutral" : "Cool";
    const style = professionalism > 60 ? "Professional" : "Casual";
    const pace = speed > 60 ? "Brisk" : speed > 40 ? "Moderate" : "Calm";
    return `${tone}, ${style}, ${pace} pace, ${energy > 60 ? "energetic" : "relaxed"}, ${expressiveness > 60 ? "expressive" : "measured"}`;
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Mic className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Voice Clone Studio</h1>
          <p className="text-sm text-muted-foreground">Manage, preview & clone AI voice identities</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* LEFT — Voice Library */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search voices..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="flex gap-1 flex-wrap">
            {filterOptions.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${filter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[500px] overflow-auto">
            {filteredVoices.map((voice) => (
              <GlassPanel key={voice.id}
                className={`cursor-pointer transition-all ${selectedVoice.id === voice.id ? "ring-2 ring-primary/40 shadow-glow" : "hover:shadow-elevated"}`}
                onClick={() => { setSelectedVoice(voice); setSliders({ warmth: voice.warmth, professionalism: voice.professionalism, energy: voice.energy, speed: voice.speed, expressiveness: voice.expressiveness }); }}>
                <GlassPanelContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground text-xs font-bold">
                      {voice.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-card-foreground truncate">{voice.name}</span>
                        {voice.is_default && <Star className="h-3 w-3 text-warning fill-warning" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={`text-[8px] px-1 ${voice.is_cloned ? "bg-info/15 text-info border-info/30" : "bg-muted text-muted-foreground"}`}>
                          {voice.is_cloned ? "Cloned" : "Default"}
                        </Badge>
                        {voice.is_business_voice && <Badge variant="outline" className="text-[8px] px-1 bg-primary/15 text-primary border-primary/30">Brand</Badge>}
                        <span className="text-[9px] text-muted-foreground">Q: {voice.quality_score}%</span>
                      </div>
                    </div>
                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </GlassPanelContent>
              </GlassPanel>
            ))}
          </div>

          {/* Clone New Voice */}
          <Button onClick={() => setShowCloneFlow(!showCloneFlow)} variant="outline" className="w-full gap-2 text-xs">
            <Upload className="h-3.5 w-3.5" /> Clone New Voice
          </Button>

          <AnimatePresence>
            {showCloneFlow && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <GlassPanel>
                  <GlassPanelContent className="space-y-3">
                    <Input placeholder="Voice name..." value={cloneName} onChange={(e) => setCloneName(e.target.value)} className="h-8 text-xs" />

                    {/* Mode Toggle */}
                    <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-muted">
                      <button
                        onClick={() => setCloneMode("upload")}
                        className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-medium transition-all ${cloneMode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Upload className="h-3 w-3" /> Upload File
                      </button>
                      <button
                        onClick={() => setCloneMode("record")}
                        className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-medium transition-all ${cloneMode === "record" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Mic className="h-3 w-3" /> Record Live
                      </button>
                    </div>

                    {/* Upload Mode */}
                    {cloneMode === "upload" && (
                      <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-[10px] text-muted-foreground">Drag & drop audio samples</p>
                        <p className="text-[9px] text-muted-foreground mt-1">WAV, MP3 · 30s–5min · Clear speech</p>
                      </div>
                    )}

                    {/* Record Mode */}
                    {cloneMode === "record" && (
                      <div className="space-y-3">
                        {/* Waveform Visualizer */}
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-end justify-center gap-[3px] h-16">
                            {recordingLevels.map((level, i) => (
                              <motion.div
                                key={i}
                                className={`w-1.5 rounded-full ${isRecording ? "bg-destructive" : recordedBlob ? "bg-primary" : "bg-muted-foreground/30"}`}
                                animate={{ height: `${level}%` }}
                                transition={{ duration: 0.08 }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs font-mono ${isRecording ? "text-destructive" : "text-muted-foreground"}`}>
                              {formatTime(recordingTime)}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {isRecording ? `Max ${formatTime(MAX_RECORD_SECS)}` : recordedBlob ? "Ready" : `Min ${formatTime(MIN_RECORD_SECS)}`}
                            </span>
                          </div>
                          {isRecording && (
                            <Progress value={(recordingTime / MAX_RECORD_SECS) * 100} className="h-1 mt-1.5" />
                          )}
                        </div>

                        {/* Recording Controls */}
                        <div className="flex items-center justify-center gap-3">
                          {!isRecording && !recordedBlob && (
                            <Button size="sm" onClick={startRecording} className="gap-1.5 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              <Mic className="h-3.5 w-3.5" /> Start Recording
                            </Button>
                          )}
                          {isRecording && (
                            <Button size="sm" onClick={stopRecording} variant="outline" className="gap-1.5 text-xs border-destructive text-destructive hover:bg-destructive/10">
                              <Square className="h-3 w-3 fill-current" /> Stop
                            </Button>
                          )}
                          {recordedBlob && !isRecording && (
                            <>
                              <Button size="sm" variant="outline" onClick={resetRecording} className="gap-1.5 text-xs">
                                <RotateCcw className="h-3 w-3" /> Re-record
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                if (recordedUrl) { const a = new Audio(recordedUrl); a.play(); }
                              }} className="gap-1.5 text-xs">
                                <Play className="h-3 w-3" /> Play
                              </Button>
                              {recordedUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a href={recordedUrl} download={`${cloneName || "recording"}.webm`}>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                        <Download className="h-3.5 w-3.5" />
                                      </Button>
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-[10px]">Download recording</TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </div>

                        {recordedBlob && recordingTime < MIN_RECORD_SECS && (
                          <p className="text-[10px] text-destructive text-center">Recording too short — need at least {MIN_RECORD_SECS}s of clear speech.</p>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-muted-foreground space-y-1">
                      <p>✓ Use high-quality microphone</p>
                      <p>✓ Minimize background noise</p>
                      <p>✓ Read diverse content naturally</p>
                    </div>

                    {cloneProgress !== null ? (
                      <div className="space-y-2">
                        <Progress value={cloneProgress} className="h-2" />
                        <p className="text-[10px] text-muted-foreground text-center">
                          {cloneProgress < 30 ? "Uploading..." : cloneProgress < 70 ? "Processing audio..." : cloneProgress < 100 ? "Generating voice model..." : "Complete!"}
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={handleCloneStart}
                        className="w-full text-xs gradient-primary text-primary-foreground border-0"
                        disabled={!cloneName.trim() || (cloneMode === "record" && (!recordedBlob || recordingTime < MIN_RECORD_SECS))}
                      >
                        Clone Voice
                      </Button>
                    )}
                  </GlassPanelContent>
                </GlassPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — Voice Details & Controls */}
        <div className="lg:col-span-8 space-y-4">
          {/* Voice Preview Player */}
          <GlassPanel glow>
            <GlassPanelHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-primary-foreground text-sm font-bold">
                  {selectedVoice.name[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-card-foreground">{selectedVoice.name}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedVoice.is_cloned ? "Cloned Voice" : "Default Voice"} · Q: {selectedVoice.quality_score}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sampleScript} onValueChange={setSampleScript}>
                  <SelectTrigger className="h-7 w-40 text-[10px]"><SelectValue placeholder="Sample script" /></SelectTrigger>
                  <SelectContent>
                    {SAMPLE_SCRIPTS.map((s, i) => (
                      <SelectItem key={i} value={s} className="text-[10px]">{s.slice(0, 40)}...</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 gap-1.5 text-xs gradient-primary text-primary-foreground border-0" onClick={handlePlayPreview} disabled={generatingTTS || playing}>
                  {generatingTTS ? <Loader2 className="h-3 w-3 animate-spin" /> : playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {generatingTTS ? "Generating..." : playing ? "Playing..." : "Preview"}
                </Button>
                <SaveVoiceDialog
                  onSave={handleSaveVoice}
                  voiceId={selectedVoice.elevenlabs_voice_id ?? ""}
                  warmth={sliders.warmth}
                  speed={sliders.speed}
                  energy={sliders.energy}
                  disabled={!selectedVoice.elevenlabs_voice_id}
                />
              </div>
            </GlassPanelHeader>
            <GlassPanelContent>
              {/* Waveform mock */}
              <div className="flex items-center gap-1 h-12">
                {Array.from({ length: 60 }, (_, i) => (
                  <div key={i} className={`flex-1 rounded-full transition-all ${playing ? "gradient-primary" : "bg-muted"}`}
                    style={{ height: `${15 + Math.sin(i * 0.4) * 30 + Math.random() * 20}%`, animationDelay: `${i * 30}ms` }} />
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Speed: {sliders.speed}%</span>
                <span>Latency: ~240ms</span>
              </div>
            </GlassPanelContent>
          </GlassPanel>

          {/* Personality Controls */}
          <GlassPanel>
            <GlassPanelHeader>
              <span className="text-xs font-semibold text-card-foreground">Voice Personality Controls</span>
              <span className="text-[10px] text-muted-foreground italic">{getPersonaDescription()}</span>
            </GlassPanelHeader>
            <GlassPanelContent className="space-y-4">
              {[
                { key: "warmth" as const, label: "Warmth", left: "Cool", right: "Warm" },
                { key: "professionalism" as const, label: "Professionalism", left: "Casual", right: "Formal" },
                { key: "energy" as const, label: "Energy", left: "Relaxed", right: "Energetic" },
                { key: "speed" as const, label: "Speaking Speed", left: "Slow", right: "Fast" },
                { key: "expressiveness" as const, label: "Expressiveness", left: "Measured", right: "Dramatic" },
              ].map((s) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-card-foreground">{s.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{sliders[s.key]}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-muted-foreground w-14 text-right">{s.left}</span>
                    <Slider value={[sliders[s.key]]} onValueChange={([v]) => setSliders({ ...sliders, [s.key]: v })} max={100} step={1} className="flex-1" />
                    <span className="text-[9px] text-muted-foreground w-14">{s.right}</span>
                  </div>
                </div>
              ))}
            </GlassPanelContent>
          </GlassPanel>

          {/* Persona Presets */}
          <div className="grid grid-cols-5 gap-2">
            {PERSONA_PRESETS.map((preset) => (
              <GlassPanel key={preset.name} className="cursor-pointer hover:shadow-elevated transition-all" onClick={() => applyPreset(preset)}>
                <GlassPanelContent className="py-3 px-3 text-center">
                  <p className="text-[10px] font-semibold text-card-foreground">{preset.name}</p>
                </GlassPanelContent>
              </GlassPanel>
            ))}
          </div>

          {/* Active Voice + Business Voice */}
          <div className="grid gap-4 lg:grid-cols-2">
            <GlassPanel>
              <GlassPanelHeader>
                <span className="text-xs font-semibold text-card-foreground">Active Voice for Calls</span>
              </GlassPanelHeader>
              <GlassPanelContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold">
                    {selectedVoice.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">{selectedVoice.name}</p>
                    <p className="text-[10px] text-muted-foreground">Active voice for all outbound calls</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Music className="h-3 w-3" />
                  <span>Fallback: Calm Support Agent (default)</span>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">Change Voice</Button>
              </GlassPanelContent>
            </GlassPanel>

            <GlassPanel>
              <GlassPanelHeader>
                <span className="text-xs font-semibold text-card-foreground">Business Voice Identity</span>
                <Badge variant="outline" className="text-[8px] bg-primary/15 text-primary border-primary/30">Brand Voice</Badge>
              </GlassPanelHeader>
              <GlassPanelContent className="space-y-3">
                <p className="text-[11px] text-muted-foreground">Assign a default voice for all operators in your organization.</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-card-foreground">Apply to all outbound</span>
                  <div className="h-5 w-9 rounded-full bg-primary relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-primary-foreground" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-card-foreground">Allow per-call override</span>
                  <div className="h-5 w-9 rounded-full bg-muted relative cursor-pointer">
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </GlassPanelContent>
            </GlassPanel>
          </div>

          {/* Real-Time Test Panel */}
          <GlassPanel glow>
            <GlassPanelHeader>
              <span className="text-xs font-semibold text-card-foreground flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-primary" /> Real-Time Test
              </span>
            </GlassPanelHeader>
            <GlassPanelContent className="space-y-3">
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Type text to synthesize..."
                className="h-20 text-xs resize-none"
              />
              <Button onClick={handleTestCall} className="w-full gap-2 text-xs gradient-primary text-primary-foreground border-0" disabled={generatingTTS || !testText.trim()}>
                {generatingTTS ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Generate Speech
              </Button>
            </GlassPanelContent>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
