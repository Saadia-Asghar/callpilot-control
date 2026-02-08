import { useState } from "react";
import { Code2, Plus, Play, Search, Trash2, Copy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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

export default function CustomScripts() {
  const [scripts] = useState<Script[]>(mockScripts);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = scripts.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.operator.toLowerCase().includes(search.toLowerCase())
  );

  const handleTest = (name: string) => {
    toast({ title: "🧪 Test Run", description: `Simulating script: ${name}` });
  };

  const handleAiSuggest = () => {
    toast({ title: "✨ AI Suggestion", description: "Generating optimized script based on call history…" });
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
