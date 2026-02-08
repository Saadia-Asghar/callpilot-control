import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, CheckCircle2, Clock, Loader2, Sparkles, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const MOCK_SLOTS = [
  { time: "9:00 AM", day: "Tuesday", score: 96, reason: "Best match — low conflict, preferred morning" },
  { time: "10:30 AM", day: "Tuesday", score: 88, reason: "Good fit — slight overlap risk" },
  { time: "2:00 PM", day: "Wednesday", score: 82, reason: "Alternate day — afternoon availability" },
  { time: "11:00 AM", day: "Thursday", score: 75, reason: "Backup slot — moderate demand" },
];

const AI_STEPS = [
  "Analyzing caller preferences...",
  "Checking calendar conflicts...",
  "Scoring available slots...",
  "Ranking by optimization criteria...",
];

interface Props {
  onDemoUsed: () => void | Promise<void>;
  remaining: number;
  sessionId?: string;
}

export function DemoScheduler({ onDemoUsed, remaining }: Props) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [showSlots, setShowSlots] = useState(false);
  const [booked, setBooked] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const runSchedule = useCallback(() => {
    if (remaining <= 0) return;
    setRunning(true);
    setShowSlots(false);
    setBooked(null);
    setStep(0);

    AI_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setStep(i);
        if (i === AI_STEPS.length - 1) {
          setTimeout(() => {
            setShowSlots(true);
            setRunning(false);
          }, 600);
        }
      }, (i + 1) * 700);
    });
  }, [remaining]);

  const bookSlot = (slot: typeof MOCK_SLOTS[0]) => {
    setBooked(`${slot.day} ${slot.time}`);
    onDemoUsed();
    toast({ title: "✅ Slot Booked!", description: `${slot.day} at ${slot.time} — AI-optimized.` });
  };

  // Exhausted state
  if (remaining <= 0 && !booked && !showSlots) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">Scheduling Demo Complete</p>
          <p className="text-xs text-muted-foreground mt-1">You've used all 3 free scheduling demos.</p>
        </div>
        <Button className="gap-2 gradient-primary text-primary-foreground border-0" onClick={() => navigate("/auth")}>
          Sign Up for Unlimited Access <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <CalendarCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-card-foreground">AI Scheduling</span>
        <Badge variant="outline" className="ml-auto text-[10px]">{remaining} tries left</Badge>
      </div>

      {!showSlots && !booked && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3" />
          <p className="text-xs text-muted-foreground mb-4">AI will analyze preferences and suggest optimal time slots</p>
          <Button
            className="gap-2 gradient-primary text-primary-foreground border-0"
            onClick={runSchedule}
            disabled={running}
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
            {running ? "Analyzing..." : "Find Best Slots"}
          </Button>
        </div>
      )}

      {/* AI reasoning steps */}
      {running && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          {AI_STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= step ? 1 : 0.25, x: 0 }}
              className="flex items-center gap-2 text-xs"
            >
              {i < step ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              ) : i === step ? (
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
              )}
              <span className={i <= step ? "text-card-foreground" : "text-muted-foreground"}>{s}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Slot results */}
      <AnimatePresence>
        {showSlots && !booked && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {MOCK_SLOTS.map((slot, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-elevated transition-shadow cursor-pointer group"
                onClick={() => bookSlot(slot)}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${i === 0 ? "gradient-primary" : "bg-muted"}`}>
                  <Clock className={`h-4 w-4 ${i === 0 ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-card-foreground">{slot.day}, {slot.time}</span>
                    {i === 0 && <Badge className="bg-success/15 text-success border-success/30 text-[9px]">Best Match</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{slot.reason}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${i === 0 ? "text-success" : "text-muted-foreground"}`}>{slot.score}%</span>
                  <p className="text-[9px] text-muted-foreground">match</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booked confirmation */}
      {booked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-success/30 bg-success/10 p-5 text-center"
        >
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-sm font-semibold text-card-foreground">Booked: {booked}</p>
          <p className="text-[10px] text-muted-foreground mt-1">AI-optimized slot confirmed</p>
          {remaining > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => { setBooked(null); setShowSlots(false); }}
            >
              Try Again
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
