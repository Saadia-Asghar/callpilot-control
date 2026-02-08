import { useState } from "react";
import { Mic, Volume2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { voicePresets, type VoicePreset } from "@/data/agentIntelligenceData";
import { useToast } from "@/hooks/use-toast";

const sliderConfig = [
  { key: "tone" as const, label: "Tone", left: "Warm", right: "Formal" },
  { key: "speed" as const, label: "Speed", left: "Calm", right: "Fast" },
  { key: "empathy" as const, label: "Empathy", left: "Low", right: "High" },
  { key: "verbosity" as const, label: "Verbosity", left: "Concise", right: "Verbose" },
];

export default function VoicePersonaLab() {
  const [activePreset, setActivePreset] = useState<string>("friendly");
  const [values, setValues] = useState({ tone: 20, speed: 50, empathy: 90, verbosity: 65 });
  const [playing, setPlaying] = useState(false);
  const { toast } = useToast();

  const applyPreset = (preset: VoicePreset) => {
    setActivePreset(preset.id);
    setValues({ tone: preset.tone, speed: preset.speed, empathy: preset.empathy, verbosity: preset.verbosity });
  };

  const handlePlay = () => {
    setPlaying(true);
    toast({ title: "Playing sample", description: "\"Hi! I'd be happy to help you schedule an appointment...\"" });
    setTimeout(() => setPlaying(false), 2500);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Mic className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Voice Persona Lab</h1>
          <p className="text-sm text-muted-foreground">Tune agent voice characteristics and personality</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sliders */}
        <div className="lg:col-span-2">
          <GlassPanel glow>
            <GlassPanelHeader>
              <span className="text-xs font-medium text-card-foreground">Voice Parameters</span>
              <Button size="sm" className="h-7 gap-1.5 text-xs gradient-primary text-primary-foreground border-0" onClick={handlePlay} disabled={playing}>
                {playing ? <Volume2 className="h-3 w-3 animate-pulse-soft" /> : <Play className="h-3 w-3" />}
                {playing ? "Playing..." : "Preview"}
              </Button>
            </GlassPanelHeader>
            <GlassPanelContent className="space-y-6">
              {sliderConfig.map((slider) => (
                <div key={slider.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-card-foreground">{slider.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{values[slider.key]}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-12 text-right">{slider.left}</span>
                    <Slider
                      value={[values[slider.key]]}
                      onValueChange={([v]) => setValues({ ...values, [slider.key]: v })}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-[10px] text-muted-foreground w-12">{slider.right}</span>
                  </div>
                </div>
              ))}

              {/* Visual representation */}
              <div className="mt-4 rounded-lg bg-muted/50 p-4">
                <p className="text-[10px] font-semibold text-muted-foreground mb-3">PERSONA SIGNATURE</p>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-info/20 flex items-center justify-center">
                    <div
                      className="rounded-full gradient-primary transition-all duration-500"
                      style={{
                        width: `${30 + values.empathy * 0.5}px`,
                        height: `${30 + values.empathy * 0.5}px`,
                        opacity: 0.4 + values.tone / 200,
                      }}
                    />
                    <Mic className="h-5 w-5 text-primary absolute" />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Tone: <span className="text-card-foreground font-medium">{values.tone < 40 ? "Warm" : values.tone < 60 ? "Neutral" : "Formal"}</span></p>
                    <p>Pace: <span className="text-card-foreground font-medium">{values.speed < 40 ? "Calm" : values.speed < 60 ? "Moderate" : "Brisk"}</span></p>
                    <p>Style: <span className="text-card-foreground font-medium">{values.empathy > 70 ? "Empathetic" : "Professional"}, {values.verbosity > 60 ? "Detailed" : "Concise"}</span></p>
                  </div>
                </div>
              </div>
            </GlassPanelContent>
          </GlassPanel>
        </div>

        {/* Presets */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-card-foreground">Persona Presets</h2>
          {voicePresets.map((preset) => (
            <GlassPanel
              key={preset.id}
              className={`cursor-pointer transition-all ${activePreset === preset.id ? "ring-2 ring-primary/40 shadow-glow" : "hover:shadow-elevated"}`}
              onClick={() => applyPreset(preset)}
            >
              <GlassPanelContent className="py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-card-foreground">{preset.name}</span>
                  {activePreset === preset.id && (
                    <Badge className="text-[9px] gradient-primary text-primary-foreground border-0">Active</Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {(["tone", "speed", "empathy", "verbosity"] as const).map((k) => (
                    <div key={k} className="text-center">
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full gradient-primary" style={{ width: `${preset[k]}%` }} />
                      </div>
                      <span className="text-[8px] text-muted-foreground">{k}</span>
                    </div>
                  ))}
                </div>
              </GlassPanelContent>
            </GlassPanel>
          ))}
        </div>
      </div>
    </div>
  );
}
