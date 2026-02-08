import { useState } from "react";
import { PhoneMissed, PhoneForwarded, ToggleLeft, ToggleRight, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const missedCalls = [
  { id: "m1", caller: "+1 (650) 555-0198", time: "11:02 AM", recovered: false, attempts: 0 },
  { id: "m2", caller: "+1 (415) 555-0244", time: "10:30 AM", recovered: true, attempts: 1 },
  { id: "m3", caller: "+1 (510) 555-0177", time: "9:45 AM", recovered: true, attempts: 2 },
  { id: "m4", caller: "+1 (408) 555-0331", time: "Yesterday", recovered: false, attempts: 0 },
];

export default function MissedCallRecovery() {
  const [autoRecovery, setAutoRecovery] = useState(true);
  const { toast } = useToast();

  const totalMissed = missedCalls.length;
  const recovered = missedCalls.filter((c) => c.recovered).length;
  const recoveryRate = Math.round((recovered / totalMissed) * 100);

  const handleRecover = (caller: string) => {
    toast({ title: "📞 Recovery Initiated", description: `Calling back ${caller}…` });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 shadow-glow">
            <PhoneMissed className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Missed Call Recovery</h1>
            <p className="text-sm text-muted-foreground">Recover missed calls automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-card">
          <span className="text-xs font-medium text-card-foreground">Auto-Recovery</span>
          <Switch checked={autoRecovery} onCheckedChange={setAutoRecovery} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs text-muted-foreground">Total Missed</p>
          <p className="text-3xl font-bold text-card-foreground mt-1">{totalMissed}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Last 24 hours</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs text-muted-foreground">Recovered</p>
          <p className="text-3xl font-bold text-success mt-1">{recovered}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-success" />
            <p className="text-[10px] text-success">{recoveryRate}% recovery rate</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs text-muted-foreground">Recovery Rate</p>
          <div className="mt-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Progress value={recoveryRate} className="h-3" />
            </motion.div>
            <p className="text-2xl font-bold text-card-foreground mt-2">{recoveryRate}%</p>
          </div>
        </div>
      </div>

      {/* Call List */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-card-foreground">Recent Missed Calls</h3>
        </div>
        <div className="divide-y divide-border">
          {missedCalls.map((call, i) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${call.recovered ? "bg-success/15" : "bg-destructive/15"}`}>
                  {call.recovered ? <CheckCircle2 className="h-4 w-4 text-success" /> : <PhoneMissed className="h-4 w-4 text-destructive" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{call.caller}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {call.time}
                    {call.attempts > 0 && <> · {call.attempts} attempt{call.attempts > 1 ? "s" : ""}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {call.recovered ? (
                  <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Recovered</Badge>
                ) : (
                  <Button size="sm" className="gap-1.5 text-xs gradient-primary text-primary-foreground border-0" onClick={() => handleRecover(call.caller)}>
                    <PhoneForwarded className="h-3.5 w-3.5" /> Recover
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
