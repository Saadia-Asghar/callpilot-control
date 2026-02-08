import { useState } from "react";
import { Sparkles, Mic, Clock, FileText, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const suggestions = [
  {
    id: "ai1",
    type: "script" as const,
    icon: FileText,
    title: "Optimized Clinic Greeting",
    description: "Based on 42 successful calls, this greeting increases booking rate by ~12%.",
    preview: '"Good morning! I see you\'re calling about an appointment. I have morning slots available this week — shall I check for you?"',
    confidence: 94,
  },
  {
    id: "ai2",
    type: "timing" as const,
    icon: Clock,
    title: "Shift Peak Hours Window",
    description: "Data shows 73% of bookings happen 9–11 AM. Recommend extending morning slots.",
    preview: "Open slots at 8:30 AM to capture early callers.",
    confidence: 88,
  },
  {
    id: "ai3",
    type: "voice" as const,
    icon: Mic,
    title: "Increase Warmth +15%",
    description: "Callers aged 45+ respond better to warmer tones. Adjust voice persona settings.",
    preview: "Current warmth: 60 → Suggested: 75",
    confidence: 82,
  },
  {
    id: "ai4",
    type: "script" as const,
    icon: Zap,
    title: "Recovery Follow-up Script",
    description: "Auto-generated script for missed call callbacks with 3x higher pickup rate.",
    preview: '"Hi, this is CallPilot calling back from earlier. Do you still need to schedule?"',
    confidence: 91,
  },
];

const typeColors = {
  script: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  timing: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  voice: "bg-chart-2/15 text-chart-2 border-chart-2/30",
};

export default function AISuggestions() {
  const [applied, setApplied] = useState<string[]>([]);
  const { toast } = useToast();

  const handleApply = (id: string, title: string) => {
    setApplied((prev) => [...prev, id]);
    toast({ title: "✅ Applied", description: `"${title}" has been applied to your configuration.` });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Suggestions</h1>
          <p className="text-sm text-muted-foreground">Smart recommendations based on your call data</p>
        </div>
      </div>

      <div className="space-y-4">
        {suggestions.map((sug, i) => (
          <motion.div
            key={sug.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border bg-card p-5 shadow-card transition-all hover:shadow-elevated ${
              applied.includes(sug.id) ? "border-success/30 opacity-70" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeColors[sug.type]}`}>
                  <sug.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-card-foreground">{sug.title}</h3>
                    <Badge variant="outline" className="text-[10px]">{sug.confidence}% confidence</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{sug.description}</p>
                  <p className="text-xs text-card-foreground mt-2 italic bg-muted rounded-lg px-3 py-2">
                    {sug.preview}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                disabled={applied.includes(sug.id)}
                className={`shrink-0 text-xs gap-1 ${
                  applied.includes(sug.id) ? "bg-success/15 text-success border-success/30" : "gradient-primary text-primary-foreground border-0"
                }`}
                variant={applied.includes(sug.id) ? "outline" : "default"}
                onClick={() => handleApply(sug.id, sug.title)}
              >
                {applied.includes(sug.id) ? <><Check className="h-3 w-3" /> Applied</> : <><Zap className="h-3 w-3" /> Apply</>}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
