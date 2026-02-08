import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones, Building2, Mic, FileText, ClipboardList, Radio,
  ArrowRight, CheckCircle2, Sparkles, Play, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const steps = [
  {
    id: 1,
    title: "Set Industry Preset",
    description: "Choose Clinic, Salon, Tutor, or University to auto-configure your agent.",
    icon: Building2,
    link: "/presets",
    color: "bg-chart-1/15 text-chart-1",
  },
  {
    id: 2,
    title: "Configure Voice Persona",
    description: "Pick or clone a voice with ElevenLabs for natural conversations.",
    icon: Mic,
    link: "/voice-lab",
    color: "bg-chart-2/15 text-chart-2",
  },
  {
    id: 3,
    title: "Define Call Scripts",
    description: "Create custom scripts or use AI-suggested templates.",
    icon: FileText,
    link: "/scripts",
    color: "bg-chart-3/15 text-chart-3",
  },
  {
    id: 4,
    title: "Review Draft Calls",
    description: "Check structured intake and finalize before going live.",
    icon: ClipboardList,
    link: "/drafts",
    color: "bg-chart-4/15 text-chart-4",
  },
  {
    id: 5,
    title: "Monitor Live Calls",
    description: "Watch calls in real-time from the Command Center.",
    icon: Radio,
    link: "/live-call",
    color: "bg-primary/15 text-primary",
  },
];

const quickTips = [
  "💡 Start with an industry preset — it pre-fills scripts, questions, and slot durations.",
  "🎙️ Clone your own voice or pick from 20+ ElevenLabs personas.",
  "📞 Use the Demo Call button below to hear your agent in action instantly.",
  "🔄 Missed calls are auto-recovered — toggle this in Recovery settings.",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeTip, setActiveTip] = useState(0);

  const handleDemoCall = () => {
    toast({
      title: "🎙️ Demo Call Launched",
      description: "Simulating a booking call with your agent…",
    });
    navigate("/simulation");
  };

  return (
    <div className="space-y-8 animate-slide-in max-w-5xl mx-auto">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-primary p-8 md:p-12 shadow-glow"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 h-40 w-40 rounded-full bg-background/20 blur-3xl" />
          <div className="absolute bottom-4 left-4 h-32 w-32 rounded-full bg-background/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-background/20 backdrop-blur-sm">
            <Headphones className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground tracking-tight">
              Welcome to CallPilot
            </h1>
            <p className="mt-2 text-primary-foreground/80 text-lg">
              Autonomous Voice Scheduling, Ready to Launch
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleDemoCall}
            className="bg-background text-foreground hover:bg-background/90 gap-2 shadow-elevated"
          >
            <Play className="h-4 w-4" /> Demo Call
          </Button>
        </div>
      </motion.div>

      {/* Setup Steps */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Getting Started
        </h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-elevated cursor-pointer ${
                completedSteps.includes(step.id) ? "opacity-70" : ""
              }`}
              onClick={() => navigate(step.link)}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${step.color}`}>
                {completedSteps.includes(step.id) ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Step {step.id}
                  </Badge>
                  <h3 className="text-sm font-semibold text-card-foreground">{step.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Quick Tips</h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={activeTip}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-muted-foreground"
          >
            {quickTips[activeTip]}
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-1.5 mt-3">
          {quickTips.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTip(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeTip ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Voice Studio", icon: Mic, to: "/voice-lab" },
          { label: "Scripts", icon: FileText, to: "/scripts" },
          { label: "Recovery", icon: ArrowRight, to: "/recovery" },
          { label: "Live Call", icon: Radio, to: "/live-call" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.to)}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-elevated hover:border-primary/30 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-accent group-hover:shadow-glow transition-shadow">
              <item.icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xs font-medium text-card-foreground">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
