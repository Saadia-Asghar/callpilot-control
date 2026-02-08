import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Headphones, Phone, Mic, FileText, PhoneMissed, Sparkles,
  CalendarCheck, ArrowRight, Zap, Shield, Clock, FlaskConical,
  Volume2, Brain, BarChart3, Building2, Scissors, GraduationCap,
  Briefcase, Users, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { DemoVoiceClone } from "@/components/demo/DemoVoiceClone";
import { DemoScheduler } from "@/components/demo/DemoScheduler";
import { DemoDraftEditor } from "@/components/demo/DemoDraftEditor";
import { LiveVoiceDemo } from "@/components/demo/LiveVoiceDemo";


const DEMO_LIMIT = 3;

const features = [
  {
    icon: CalendarCheck,
    title: "Smart Scheduling",
    why: "AI finds the best time slots for clients & operators, saving you hours of manual planning.",
    description: "Analyzes preferences, detects conflicts, and ranks time slots — operators save 3+ hours daily on booking logistics.",
    color: "from-primary to-info",
  },
  {
    icon: Mic,
    title: "Voice Clone Studio",
    why: "Clone your voice instantly for calls or messages, set tone, speed, and energy. It makes communication effortless and professional.",
    description: "Pick from professional personas or create your own. Adjust warmth, speed, and expressiveness for the perfect caller experience.",
    color: "from-chart-3 to-chart-1",
  },
  {
    icon: FileText,
    title: "Draft Calls & Scripts",
    why: "Create, edit, and save structured call scripts in seconds. AI guides you for perfect flow.",
    description: "Structured intake forms auto-generated from conversations. Reorder, test, and export scripts before going live.",
    color: "from-chart-2 to-primary",
  },
  {
    icon: PhoneMissed,
    title: "Recovery & No-Show Prevention",
    why: "AI automatically follows up on missed calls, reducing stress and missed opportunities.",
    description: "Detect missed calls and trigger smart callbacks — recovering 94% of no-shows without manual effort.",
    color: "from-destructive to-chart-3",
  },
];

const stats = [
  { label: "Calls Handled", value: "10K+", icon: Phone },
  { label: "Recovery Rate", value: "94%", icon: PhoneMissed },
  { label: "Avg Response", value: "<2s", icon: Clock },
  { label: "Uptime", value: "99.9%", icon: Zap },
];

const audiences = [
  { icon: Building2, label: "Clinics & Healthcare", desc: "Automate patient booking, reminders, and no-show recovery" },
  { icon: Scissors, label: "Salons & Spas", desc: "Fill appointment gaps with AI-optimized scheduling" },
  { icon: GraduationCap, label: "Tutors & Universities", desc: "Coordinate sessions, office hours, and group bookings" },
  { icon: Briefcase, label: "Agencies & Teams", desc: "Manage multi-operator call flows and intake scripts" },
  { icon: Users, label: "Busy Operators", desc: "Save hours daily on manual scheduling and follow-ups" },
  { icon: Mic, label: "Voice-Forward Brands", desc: "Professional AI voice cloning for engaging calls" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    const stored = sessionStorage.getItem('demo_session_id');
    if (stored) return stored;
    const newId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('demo_session_id', newId);
    return newId;
  });
  const getDemoUsage = () => {
    const stored = sessionStorage.getItem(`demo_usage_${sessionId}`);
    return stored ? JSON.parse(stored) : { voice_clone: 0, schedule_demo: 0, call_draft: 0 };
  };
  const [demoUsage, setDemoUsage] = useState(getDemoUsage);

  const incrementUsage = (feature: string) => {
    const usage = getDemoUsage();
    usage[feature] = (usage[feature] ?? 0) + 1;
    sessionStorage.setItem(`demo_usage_${sessionId}`, JSON.stringify(usage));
    setDemoUsage({ ...usage });
  };

  const voiceRemaining = DEMO_LIMIT - (demoUsage.voice_clone ?? 0);
  const scheduleRemaining = DEMO_LIMIT - (demoUsage.schedule_demo ?? 0);
  const draftRemaining = DEMO_LIMIT - (demoUsage.call_draft ?? 0);
  const totalRemaining = voiceRemaining + scheduleRemaining + draftRemaining;

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
          <div className="absolute bottom-10 right-1/3 h-64 w-64 rounded-full bg-info/5 blur-3xl" />
          <div className="absolute top-40 right-1/4 h-48 w-48 rounded-full bg-chart-3/5 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-5 text-xs px-3 py-1 border-primary/30 text-primary">
              <Sparkles className="h-3 w-3 mr-1" /> 3 free tries per feature — no signup needed
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Autonomous AI Scheduling
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">
                & Voice Cloning — Try It Live!
              </span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              CallPilot automates calls, recovers no-shows, optimizes schedules, and lets you clone your own voice — all in real-time. Experience 3 free demo interactions per feature before signing up!
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 gap-2" onClick={() => navigate("/auth")}>
                Sign Up for Full Access <ArrowRight className="h-4 w-4" />
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href="#demo" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> or scroll down to try the demo ↓
                  </a>
                </TooltipTrigger>
                <TooltipContent>3 free tries per feature — voice clone, scheduling, draft editing</TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
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

      {/* Interactive Demo Panel */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-3 text-[10px] px-2 py-0.5 border-chart-3/30 text-chart-3">
            <Zap className="h-3 w-3 mr-1" /> Live Demo · {totalRemaining} total interactions remaining
          </Badge>
          <h2 className="text-3xl font-bold text-foreground">Try CallPilot Right Now</h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Clone a voice, schedule a call, or edit a draft — 3 tries each, no signup required.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="talk" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="talk" className="gap-1.5 text-xs">
                <Phone className="h-3.5 w-3.5" /> Talk Live
              </TabsTrigger>
              <TabsTrigger value="voice" className="gap-1.5 text-xs">
                <Volume2 className="h-3.5 w-3.5" /> Voice Clone
                {voiceRemaining > 0 && <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">{voiceRemaining}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-1.5 text-xs">
                <CalendarCheck className="h-3.5 w-3.5" /> AI Schedule
                {scheduleRemaining > 0 && <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">{scheduleRemaining}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="draft" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Draft Editor
                {draftRemaining > 0 && <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">{draftRemaining}</Badge>}
              </TabsTrigger>
            </TabsList>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
              <TabsContent value="talk" className="mt-0">
                <LiveVoiceDemo title="🎙️ Talk to CallPilot's AI Scheduling Agent" />
              </TabsContent>
              <TabsContent value="voice" className="mt-0">
                <DemoVoiceClone 
                  onDemoUsed={() => incrementUsage('voice_clone')} 
                  remaining={voiceRemaining}
                  sessionId={sessionId}
                />
              </TabsContent>
              <TabsContent value="schedule" className="mt-0">
                <DemoScheduler 
                  onDemoUsed={() => incrementUsage('schedule_demo')} 
                  remaining={scheduleRemaining}
                  sessionId={sessionId}
                />
              </TabsContent>
              <TabsContent value="draft" className="mt-0">
                <DemoDraftEditor 
                  onDemoUsed={() => incrementUsage('call_draft')} 
                  remaining={draftRemaining}
                  sessionId={sessionId}
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Guided tooltip */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <Brain className="h-3 w-3" />
            Try: schedule a call → preview AI draft → clone your voice → save voice → apply to script → export recording
          </div>
        </div>
      </section>

      {/* Why Each Feature Matters */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Why Each Feature Matters</h2>
          <p className="mt-3 text-muted-foreground">See how AI saves your time, reduces no-shows, and gives a professional touch.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:border-primary/20"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground mb-1">{f.title}</h3>
              <p className="text-xs font-medium text-primary mb-2">{f.why}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who Can Use It */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Built for Professionals Who Schedule</h2>
          <p className="mt-3 text-muted-foreground">From clinics to agencies — anyone who needs smarter calls benefits.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {audiences.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <a.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl gradient-primary p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 h-40 w-40 rounded-full bg-background/30 blur-3xl" />
            <div className="absolute bottom-4 left-8 h-32 w-32 rounded-full bg-background/20 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">Ready to Automate Your Calls?</h2>
            <p className="mt-3 text-primary-foreground/80 max-w-md mx-auto">
              Join operators worldwide. Start scheduling with AI in under 2 minutes.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 gap-2 shadow-elevated" onClick={() => navigate("/auth")}>
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/auth")}>
                Learn More
              </Button>
            </div>
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
