import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, FileText, Trash2, Plus, Loader2, Video, Phone as PhoneIcon, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const platformLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  phone: { label: "Phone", icon: <PhoneIcon className="h-3 w-3" /> },
  google_meet: { label: "Google Meet", icon: <Video className="h-3 w-3" /> },
  teams: { label: "Teams", icon: <Monitor className="h-3 w-3" /> },
  zoom: { label: "Zoom", icon: <Video className="h-3 w-3" /> },
  other: { label: "Other", icon: <Video className="h-3 w-3" /> },
};

export default function MeetingBookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingScript, setEditingScript] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState("");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["meeting_bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_bookings")
        .select("*")
        .order("meeting_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meeting_bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting_bookings"] });
      toast({ title: "Deleted", description: "Booking removed." });
    },
  });

  const scriptMutation = useMutation({
    mutationFn: async ({ id, script }: { id: string; script: string }) => {
      const { error } = await supabase
        .from("meeting_bookings")
        .update({ script_content: script })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting_bookings"] });
      setEditingScript(null);
      toast({ title: "Script Saved", description: "Agent will follow this script for the meeting." });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-slide-in">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Meeting Bookings</h1>
        <p className="text-sm text-muted-foreground">
          All meetings booked via voice conversations — with notes, scripts, and scheduling details.
        </p>
      </div>

      {(!bookings || bookings.length === 0) ? (
        <GlassPanel>
          <GlassPanelContent className="py-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No meetings booked yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a live call and book a meeting — it will be saved here automatically.
            </p>
          </GlassPanelContent>
        </GlassPanel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bookings.map((b) => (
            <GlassPanel key={b.id}>
              <GlassPanelHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-card-foreground truncate">{b.meeting_title}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusColors[b.status] || ""}`}>
                  {b.status}
                </Badge>
              </GlassPanelHeader>
              <GlassPanelContent className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {b.meeting_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {b.meeting_time}
                  </span>
                  <span>{b.duration_minutes}min</span>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-card-foreground">Caller: {b.caller_name}</p>
                  {(() => {
                    const platform = platformLabels[(b as any).call_platform] || platformLabels.phone;
                    return (
                      <Badge variant="outline" className="text-[10px] gap-1 flex items-center">
                        {platform.icon} {platform.label}
                      </Badge>
                    );
                  })()}
                </div>

                {(b as any).meeting_link && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                    <a href={(b as any).meeting_link} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline break-all">
                      {(b as any).meeting_link}
                    </a>
                  </div>
                )}

                {b.notes && (
                  <div className="rounded-lg bg-accent/50 p-2">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-xs text-card-foreground">{b.notes}</p>
                  </div>
                )}

                {b.transcript_summary && (
                  <div className="rounded-lg bg-accent/50 p-2">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">Summary</p>
                    <p className="text-xs text-card-foreground">{b.transcript_summary}</p>
                  </div>
                )}

                {/* Script section */}
                {editingScript === b.id ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter the script the agent should follow for this meeting..."
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      className="text-xs min-h-[80px]"
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="text-[10px] h-7 gradient-primary text-primary-foreground border-0"
                        onClick={() => scriptMutation.mutate({ id: b.id, script: scriptText })}
                        disabled={scriptMutation.isPending}
                      >
                        {scriptMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Script"}
                      </Button>
                      <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => setEditingScript(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : b.script_content ? (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                    <p className="text-[10px] font-medium text-primary mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Agent Script
                    </p>
                    <p className="text-xs text-card-foreground">{b.script_content}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 mt-1 px-2"
                      onClick={() => { setEditingScript(b.id); setScriptText(b.script_content || ""); }}
                    >
                      Edit Script
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 gap-1"
                    onClick={() => { setEditingScript(b.id); setScriptText(""); }}
                  >
                    <Plus className="h-3 w-3" /> Assign Script
                  </Button>
                )}

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[10px] h-7 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(b.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </GlassPanelContent>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
