import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { FileText, GripVertical, Play, CheckCircle2, Plus, Trash2, Download, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

interface DraftStep {
  id: string;
  label: string;
  type: "greeting" | "question" | "action" | "closing";
}

const INITIAL_STEPS: DraftStep[] = [
  { id: "s1", label: "Greet caller warmly", type: "greeting" },
  { id: "s2", label: "Ask reason for appointment", type: "question" },
  { id: "s3", label: "Check preferred time slot", type: "question" },
  { id: "s4", label: "Confirm booking details", type: "action" },
  { id: "s5", label: "Send confirmation & close", type: "closing" },
];

const typeColors: Record<string, string> = {
  greeting: "bg-success/15 text-success border-success/30",
  question: "bg-info/15 text-info border-info/30",
  action: "bg-warning/15 text-warning border-warning/30",
  closing: "bg-primary/15 text-primary border-primary/30",
};

interface Props {
  onDemoUsed: () => void | Promise<void>;
  remaining: number;
  sessionId?: string;
}

export function DemoDraftEditor({ onDemoUsed, remaining }: Props) {
  const [steps, setSteps] = useState<DraftStep[]>(INITIAL_STEPS);
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(-1);
  const [newStep, setNewStep] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const addStep = () => {
    if (!newStep.trim()) return;
    setSteps((prev) => [
      ...prev,
      { id: `s${Date.now()}`, label: newStep.trim(), type: "action" },
    ]);
    setNewStep("");
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const simulate = () => {
    if (remaining <= 0) return;
    setSimulating(true);
    setSimStep(0);
    steps.forEach((_, i) => {
      setTimeout(() => {
        setSimStep(i);
        if (i === steps.length - 1) {
          setTimeout(() => {
            setSimulating(false);
            setSimStep(-1);
            onDemoUsed();
            toast({ title: "✅ Script executed!", description: "All steps completed successfully." });
          }, 800);
        }
      }, (i + 1) * 600);
    });
  };

  const exportDraft = (format: "json" | "csv") => {
    const data = steps.map((s, i) => ({ order: i + 1, type: s.type, step: s.label }));
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = "callpilot-draft.json";
      mimeType = "application/json";
    } else {
      const header = "Order,Type,Step\n";
      const rows = data.map(d => `${d.order},${d.type},"${d.step}"`).join("\n");
      content = header + rows;
      filename = "callpilot-draft.csv";
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: `Draft saved as ${format.toUpperCase()}.` });
  };

  // Exhausted state
  if (remaining <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">Draft Editor Demo Complete</p>
          <p className="text-xs text-muted-foreground mt-1">You've used all 3 free draft simulations.</p>
        </div>
        <Button className="gap-2 gradient-primary text-primary-foreground border-0" onClick={() => navigate("/auth")}>
          Sign Up for Unlimited Access <ArrowRight className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportDraft("json")}>
            <Download className="h-3 w-3" /> Export JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportDraft("csv")}>
            <Download className="h-3 w-3" /> Export CSV
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-card-foreground">Draft Call Editor</span>
        <Badge variant="outline" className="ml-auto text-[10px]">{remaining} tries left</Badge>
      </div>

      {/* Reorderable steps */}
      <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="space-y-1.5">
        {steps.map((step, i) => (
          <Reorder.Item key={step.id} value={step}>
            <motion.div
              className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all cursor-grab active:cursor-grabbing ${
                simStep === i
                  ? "border-primary bg-accent shadow-glow"
                  : simStep > i && simulating
                  ? "border-success/30 bg-success/5"
                  : "border-border bg-card hover:border-primary/20"
              }`}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Badge variant="outline" className={`text-[9px] px-1.5 shrink-0 ${typeColors[step.type]}`}>
                {step.type}
              </Badge>
              <span className="flex-1 text-xs text-card-foreground truncate">{step.label}</span>
              {simStep > i && simulating && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
              {simStep === i && simulating && <div className="h-3 w-3 rounded-full border-2 border-primary animate-pulse shrink-0" />}
              {!simulating && (
                <button onClick={() => removeStep(step.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Add step */}
      <div className="flex gap-2">
        <Input
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          placeholder="Add a script step..."
          className="text-xs h-8"
          onKeyDown={(e) => e.key === "Enter" && addStep()}
        />
        <Button size="sm" variant="outline" className="h-8 px-2" onClick={addStep} disabled={!newStep.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Actions row */}
      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2 gradient-primary text-primary-foreground border-0"
          onClick={simulate}
          disabled={simulating || steps.length === 0}
        >
          <Play className="h-4 w-4" />
          {simulating ? "Simulating..." : "Run Script Preview"}
        </Button>
        <Button variant="outline" size="icon" onClick={() => exportDraft("json")} title="Export JSON">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Drag steps to reorder · Add custom steps · Export as JSON or CSV
      </p>
    </div>
  );
}
