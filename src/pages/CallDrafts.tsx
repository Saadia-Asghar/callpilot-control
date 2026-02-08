import { useState } from "react";
import { FileText, Edit3, CheckCircle2, RotateCcw, Eye, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const MOCK_DRAFTS = [
  { id: 1, caller_name: "Sarah Chen", status: "draft", industry_preset: "healthcare", operator: "Agent A", created_at: new Date().toISOString(), structured_intake: { reason: "Follow-up check", preferred_time: "Morning" } },
  { id: 2, caller_name: "James Park", status: "completed", industry_preset: "legal", operator: "Agent B", created_at: new Date(Date.now() - 3600000).toISOString(), structured_intake: { reason: "Contract review", preferred_time: "Afternoon" } },
  { id: 3, caller_name: "Maria Lopez", status: "draft", industry_preset: "dental", operator: "Agent A", created_at: new Date(Date.now() - 7200000).toISOString(), structured_intake: { reason: "New patient intake", preferred_time: "Flexible" } },
];

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-warning/15 text-warning border-warning/30" },
  finalized: { label: "Finalized", class: "bg-success/15 text-success border-success/30" },
  completed: { label: "Completed", class: "bg-success/15 text-success border-success/30" },
  editing: { label: "Editing", class: "bg-info/15 text-info border-info/30" },
  draft: { label: "Draft", class: "bg-info/15 text-info border-info/30" },
};

export default function CallDrafts() {
  const [selected, setSelected] = useState<number | null>(null);
  const [drafts, setDrafts] = useState(MOCK_DRAFTS);
  const { toast } = useToast();

  const selectedDraft = drafts.find((d) => d.id === selected);

  const handleFinalize = (id: number) => {
    setDrafts((prev) => prev.map((d) => d.id === id ? { ...d, status: "completed" } : d));
    toast({ title: "Draft Finalized", description: `Draft ${id} has been marked as finalized.` });
  };

  const handleReopen = (id: number) => {
    setDrafts((prev) => prev.map((d) => d.id === id ? { ...d, status: "draft" } : d));
    toast({ title: "Draft Reopened", description: `Draft ${id} has been reopened for editing.` });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <FileText className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Call Drafts</h1>
          <p className="text-sm text-muted-foreground">Review, edit, and finalize draft calls</p>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-3 font-medium text-muted-foreground">Caller</th>
                  <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Preset</th>
                  <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">Operator</th>
                  <th className="p-3 font-medium text-muted-foreground">Status</th>
                  <th className="p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drafts.map((draft, i) => (
                  <motion.tr
                    key={draft.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${selected === draft.id ? "bg-accent/50" : ""}`}
                    onClick={() => setSelected(draft.id)}
                  >
                    <td className="p-3">
                      <p className="font-medium text-card-foreground">{draft.caller_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(draft.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge variant="outline" className="text-[10px]">{draft.industry_preset}</Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{draft.operator}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] ${(statusConfig[draft.status] ?? statusConfig.draft).class}`}>
                        {(statusConfig[draft.status] ?? statusConfig.draft).label}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleFinalize(draft.id); }}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleReopen(draft.id); }}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedDraft && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80 shrink-0 rounded-xl border border-border bg-card shadow-card"
          >
            <div className="border-b border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Intake Preview
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Caller</p>
                <p className="text-sm font-medium text-card-foreground">{selectedDraft.caller_name}</p>
              </div>
              {Object.entries(selectedDraft.structured_intake ?? {}).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-card-foreground">{String(val)}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1 gradient-primary text-primary-foreground border-0 text-xs">
                  <Edit3 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleFinalize(selectedDraft.id)}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Finalize
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
