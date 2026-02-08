import { useState, useEffect } from "react";
import { FileText, Edit3, CheckCircle2, RotateCcw, Eye, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import api from "@/lib/api";

function DraftDetails({ draft, onFinalize, onReopen }: { draft: any; onFinalize: (id: number) => void; onReopen: (id: number) => void }) {
  const [draftDetails, setDraftDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const details = await api.getDraft(draft.id);
        setDraftDetails(details);
      } catch (error) {
        console.error('Failed to fetch draft details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (draft.id) {
      fetchDetails();
    }
  }, [draft.id]);

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const intake = draftDetails?.structured_intake || draft.structured_intake || {};
  const transcript = draftDetails?.raw_transcript || draft.raw_transcript || '';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-card-foreground mb-2">Session: {draft.session_id || `Call ${draft.id}`}</h3>
        <p className="text-xs text-muted-foreground">Channel: {draft.channel || 'voice'}</p>
        <p className="text-xs text-muted-foreground mt-1">Preset: {draft.industry_preset || 'default'}</p>
        {draft.started_at && (
          <p className="text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 inline mr-1" />
            {new Date(draft.started_at).toLocaleString()}
          </p>
        )}
      </div>
      {transcript && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-card-foreground">Transcript</h4>
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded max-h-32 overflow-y-auto">
            {transcript.substring(0, 200)}{transcript.length > 200 ? '...' : ''}
          </div>
        </div>
      )}
      {Object.keys(intake).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-card-foreground">Structured Intake</h4>
          <div className="space-y-1.5 text-xs">
            {Object.entries(intake).map(([key, value]) => (
              <div key={key}>
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                <span className="text-card-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {draft.is_draft && (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => onFinalize(draft.id)}>
            <CheckCircle2 className="h-3 w-3" /> Finalize
          </Button>
        )}
        {!draft.is_draft && draft.status === 'completed' && (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => onReopen(draft.id)}>
            <RotateCcw className="h-3 w-3" /> Reopen
          </Button>
        )}
      </div>
    </div>
  );
}

const statusConfig = {
  pending: { label: "Pending", class: "bg-warning/15 text-warning border-warning/30" },
  finalized: { label: "Finalized", class: "bg-success/15 text-success border-success/30" },
  editing: { label: "Editing", class: "bg-info/15 text-info border-info/30" },
  draft: { label: "Draft", class: "bg-info/15 text-info border-info/30" },
};

export default function CallDrafts() {
  const [selected, setSelected] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const data = await api.listCallsByOperator(50, 0, true);
        setDrafts(data.calls || []);
      } catch (error) {
        console.error('Failed to fetch drafts:', error);
        toast({ title: "Error", description: "Failed to load call drafts", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, [toast]);

  const selectedDraft = drafts.find((d) => d.id === selected);

  const handleFinalize = async (id: number) => {
    try {
      await api.saveDraft(id, { status: "completed", call_outcome: "booked" });
      toast({ title: "Draft Finalized", description: `Draft ${id} has been marked as finalized.` });
      // Refresh drafts
      const data = await api.listCallsByOperator(50, 0, true);
      setDrafts(data.calls || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to finalize draft", variant: "destructive" });
    }
  };

  const handleReopen = async (id: number) => {
    try {
      await api.saveDraft(id, { status: "draft" });
      toast({ title: "Draft Reopened", description: `Draft ${id} has been reopened for editing.` });
      // Refresh drafts
      const data = await api.listCallsByOperator(50, 0, true);
      setDrafts(data.calls || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reopen draft", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                {mockDrafts.map((draft, i) => (
                  <motion.tr
                    key={draft.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${selected === draft.id ? "bg-accent/50" : ""}`}
                    onClick={() => setSelected(draft.id)}
                  >
                    <td className="p-3">
                      <p className="font-medium text-card-foreground">{draft.caller}</p>
                      <p className="text-xs text-muted-foreground">{draft.date}</p>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge variant="outline" className="text-[10px]">{draft.preset}</Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{draft.operator}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] ${statusConfig[draft.status].class}`}>
                        {statusConfig[draft.status].label}
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
                <p className="text-sm font-medium text-card-foreground">{selectedDraft.caller}</p>
              </div>
              {Object.entries(selectedDraft.intake).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key}</p>
                  <p className="text-sm text-card-foreground">{val}</p>
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
