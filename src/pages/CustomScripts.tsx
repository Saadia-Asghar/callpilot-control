import { useState, useRef, useCallback, useEffect } from "react";
import { Code2, Plus, Play, Search, Trash2, Copy, Sparkles, Download, Loader2, Pause, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useVoiceProfiles, type VoiceProfile } from "@/hooks/useVoiceProfiles";
import { VoiceSelector } from "@/components/voice/VoiceSelector";
import api from "@/lib/api";

interface Script {
  id: string;
  name: string;
  operator: string;
  type: "greeting" | "intake" | "closing" | "custom";
  content: string;
  lastEdited: string;
}

const mockScripts: Script[] = [
  { id: "s1", name: "Clinic Greeting", operator: "All", type: "greeting", content: '{"greeting": "Thank you for calling. How may I help you today?", "followUp": "Would you like to schedule an appointment?"}', lastEdited: "2h ago" },
  { id: "s2", name: "Salon Intake", operator: "Maria", type: "intake", content: '{"questions": ["What service?", "Preferred stylist?", "Any allergies?"]}', lastEdited: "1d ago" },
  { id: "s3", name: "Tutor Close", operator: "Prof. Lee", type: "closing", content: '{"closing": "Your session is confirmed. See you then!", "reminder": true}', lastEdited: "3d ago" },
];

const typeColors: Record<string, string> = {
  greeting: "bg-success/15 text-success border-success/30",
  intake: "bg-info/15 text-info border-info/30",
  closing: "bg-warning/15 text-warning border-warning/30",
  custom: "bg-primary/15 text-primary border-primary/30",
};

const TEXT_LIMIT = 500;

export default function CustomScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile | null>(null);
  const [selectedSavedVoiceId, setSelectedSavedVoiceId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { voices, isLoading: voicesLoading } = useVoiceProfiles();

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const data = await api.loadCustomScript();
        if (data.scripts) {
          setScripts(data.scripts.map((s: any) => ({
            id: s.script_id.toString(),
            name: s.name,
            operator: 'Current',
            type: 'custom' as const,
            content: JSON.stringify(s.script_flow || {}),
            lastEdited: 'Recently'
          })));
        } else if (data.script_flow) {
          // Single active script
          setScripts([{
            id: data.script_id.toString(),
            name: data.name,
            operator: 'Current',
            type: 'custom' as const,
            content: JSON.stringify(data.script_flow),
            lastEdited: 'Recently'
          }]);
        }
      } catch (error) {
        console.error('Failed to fetch scripts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchScripts();
  }, []);

  const filtered = scripts.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.operator.toLowerCase().includes(search.toLowerCase())
  );

  const handleTest = (name: string) => {
    toast({ title: "🧪 Test Run", description: `Simulating script: ${name}` });
  };

  const handleAiSuggest = () => {
    toast({ title: "✨ AI Suggestion", description: "Generating optimized script based on call history…" });
  };

  const handleGenerateTTS = useCallback(async () => {
    if (!selectedVoice?.elevenlabs_voice_id || !ttsText.trim()) return;
    setGenerating(true);
    try {
      // Use backend API for TTS generation
      const response = await api.previewVoice({
        voice_id: selectedVoice.elevenlabs_voice_id,
        sample_text: ttsText,
        tone: selectedVoice.warmth || 50,
        speed: selectedVoice.speed || 50,
        energy: selectedVoice.energy || 50,
      }) as any;
      
      // Backend returns preview_audio_base64
      if (response.preview_audio_base64) {
        // Convert base64 to blob
        const byteCharacters = atob(response.preview_audio_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        
        const url = URL.createObjectURL(blob);
        if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
        setLastBlobUrl(url);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setPlaying(true);
        audio.onended = () => setPlaying(false);
        audio.onpause = () => setPlaying(false);
        await audio.play();
      } else if (response.preview_url) {
        // Fallback: fetch from URL if base64 not available
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const audioResponse = await fetch(`${apiUrl}${response.preview_url}`);
        if (!audioResponse.ok) throw new Error("Failed to fetch audio");
        const audioBlob = await audioResponse.blob();
        const url = URL.createObjectURL(audioBlob);
        if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
        setLastBlobUrl(url);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setPlaying(true);
        audio.onended = () => setPlaying(false);
        audio.onpause = () => setPlaying(false);
        await audio.play();
      } else {
        throw new Error("No audio data received");
      }
    } catch (error: any) {
      console.error("TTS generation error:", error);
      toast({ 
        title: "TTS failed", 
        description: error.message || "Could not generate speech.", 
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  }, [selectedVoice, ttsText, toast, lastBlobUrl]);

  const handleExport = () => {
    if (!lastBlobUrl) return;
    const a = document.createElement("a");
    a.href = lastBlobUrl;
    a.download = `script-audio-${selectedVoice?.name?.toLowerCase().replace(/\s+/g, "-") ?? "voice"}.mp3`;
    a.click();
    toast({ title: "Downloaded!", description: "Script audio exported." });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Custom Scripts</h1>
            <p className="text-sm text-muted-foreground">Create, edit, and assign call scripts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleAiSuggest}>
            <Sparkles className="h-3.5 w-3.5" /> AI Suggest
          </Button>
          <Button size="sm" className="gap-1.5 text-xs gradient-primary text-primary-foreground border-0">
            <Plus className="h-3.5 w-3.5" /> New Script
          </Button>
        </div>
      </div>

      {/* Voice TTS Panel */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-card-foreground">Generate Script Audio</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] text-muted-foreground cursor-help">ⓘ</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs">
              Select a saved voice from your Voice Clone Studio, type or paste your script, and generate TTS audio instantly.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <VoiceSelector
            voices={voices}
            selectedId={selectedVoice?.id ?? null}
            onSelect={setSelectedVoice}
            isLoading={voicesLoading}
          />
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Script Text</label>
            <Textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value.slice(0, TEXT_LIMIT))}
              placeholder="Type or paste your script text here..."
              className="text-xs min-h-[60px] resize-none"
              maxLength={TEXT_LIMIT}
            />
            <span className={`text-[10px] ${ttsText.length >= TEXT_LIMIT ? "text-destructive" : "text-muted-foreground"}`}>
              {ttsText.length}/{TEXT_LIMIT}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="gap-2 gradient-primary text-primary-foreground border-0 text-xs"
            onClick={handleGenerateTTS}
            disabled={generating || !selectedVoice?.elevenlabs_voice_id || !ttsText.trim()}
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {generating ? "Generating..." : "Generate Speech"}
          </Button>
          {playing && (
            <Button variant="outline" size="sm" onClick={() => audioRef.current?.pause()} className="gap-1.5 text-xs">
              <Pause className="h-3.5 w-3.5" /> Stop
            </Button>
          )}
          {lastBlobUrl && !playing && (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export Audio
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search scripts…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map((script, i) => (
          <motion.div
            key={script.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-card-foreground">{script.name}</h3>
                  <Badge variant="outline" className={`text-[10px] ${typeColors[script.type]}`}>{script.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned to: {script.operator} · Edited {script.lastEdited}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleTest(script.name)}>
                  <Play className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground overflow-auto max-h-24">
              {script.content}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
