import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones, Phone, Mic, FileText, PhoneMissed, Sparkles,
  CalendarCheck, Play, ArrowRight, CheckCircle2, Zap, Shield, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const features = [
  {
    icon: CalendarCheck,
    title: "Smart Scheduling",
    description: "AI handles bookings, rescheduling, and conflict resolution autonomously.",
    color: "from-primary to-info",
  },
  {
    icon: FileText,
    title: "Call Drafts & Intake",
    description: "Structured intake forms auto-generated from every call conversation.",
    color: "from-chart-2 to-primary",
  },
  {
    icon: Mic,
    title: "Voice Cloning",
    description: "Clone any voice with ElevenLabs — or pick from 20+ professional personas.",
    color: "from-chart-3 to-chart-1",
  },
  {
    icon: PhoneMissed,
    title: "Missed Call Recovery",
    description: "Automatically detect and recover missed calls with smart callbacks.",
    color: "from-destructive to-chart-3",
  },
  {
    icon: Sparkles,
    title: "AI Suggestions",
    description: "Get optimized scripts, time slots, and persona recommendations.",
    color: "from-chart-4 to-primary",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Real-time confidence scoring and human override controls.",
    color: "from-chart-2 to-chart-4",
  },
];

const demoSteps = [
  "Scheduling a demo appointment...",
  "AI analyzing caller intent...",
  "Checking calendar availability...",
  "Suggesting optimal time slot...",
  "Booking confirmed! ✅",
];

const stats = [
  { label: "Calls Handled", value: "10K+", icon: Phone },
  { label: "Recovery Rate", value: "94%", icon: PhoneMissed },
  { label: "Avg Response", value: "<2s", icon: Clock },
  { label: "Uptime", value: "99.9%", icon: Zap },
];

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoProgress, setDemoProgress] = useState(0);

  const runDemo = () => {
    setDemoRunning(true);
    setDemoStep(0);
    setDemoProgress(0);
    demoSteps.forEach((_, i) => {
      setTimeout(() => {
        setDemoStep(i);
        setDemoProgress(((i + 1) / demoSteps.length) * 100);
        if (i === demoSteps.length - 1) {
          setTimeout(() => {
            setDemoRunning(false);
            toast({ title: "🎉 Demo Complete!", description: "Sign up for full access to all features." });
          }, 1200);
        }
      }, (i + 1) * 1000);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Headphones className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">CallPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Log In</Button>
            <Button size="sm" className="gradient-primary text-primary-foreground border-0" onClick={() => navigate("/auth")}>
              Sign Up Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-64 w-64 rounded-full bg-info/5 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-6 text-xs px-3 py-1 border-primary/30 text-primary">
              <Sparkles className="h-3 w-3 mr-1" /> Hackathon Demo Ready
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Autonomous Voice
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">
                Scheduling Agent
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              CallPilot schedules, recovers, optimizes, and personalizes calls automatically.
              See AI in action — no signup required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 gap-2 shadow-glow" onClick={runDemo} disabled={demoRunning}>
                <Play className="h-4 w-4" /> {demoRunning ? "Running Demo..." : "Try Live Demo"}
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate("/auth")}>
                Sign Up for Full Access <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Demo Panel */}
          <AnimatePresence>
            {demoRunning && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-10 max-w-lg mx-auto rounded-2xl border border-border bg-card p-6 shadow-elevated"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-success">Live Demo</span>
                </div>
                <Progress value={demoProgress} className="h-1.5 mb-4" />
                <div className="space-y-2">
                  {demoSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i <= demoStep ? 1 : 0.3, x: 0 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      {i < demoStep ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : i === demoStep ? (
                        <div className="h-4 w-4 rounded-full border-2 border-primary animate-pulse shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                      )}
                      <span className={i <= demoStep ? "text-card-foreground" : "text-muted-foreground"}>{step}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
          <p className="mt-3 text-muted-foreground">A complete AI operations console for voice scheduling</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:border-primary/20"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-4`}>
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl gradient-primary p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 h-40 w-40 rounded-full bg-background/30 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">Ready to Automate Your Calls?</h2>
            <p className="mt-3 text-primary-foreground/80">Start scheduling with AI in under 2 minutes.</p>
            <Button size="lg" className="mt-6 bg-background text-foreground hover:bg-background/90 gap-2 shadow-elevated" onClick={() => navigate("/auth")}>
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Headphones className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">CallPilot</span>
        </div>
        <p className="text-xs text-muted-foreground">AI-powered voice scheduling · Built for operators worldwide</p>
      </footer>
    </div>
  );
}
