import { useState } from "react";
import { Save } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAgentSettings, upsertAgentSettings } from "@/lib/dataService";
import { useToast } from "@/hooks/use-toast";

export default function AgentSettings() {
  const { toast } = useToast();

  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ["agent_settings"],
    queryFn: fetchAgentSettings,
  });

  const [settings, setSettings] = useState({
    businessHours: { start: "09:00", end: "17:00" },
    slotDuration: 30,
    bufferTime: 15,
    voicePersona: "Professional & Friendly",
    autoConfirm: true,
    timezone: "America/Los_Angeles",
  });

  // Sync from DB when loaded
  const [synced, setSynced] = useState(false);
  if (dbSettings && !synced) {
    setSettings({
      businessHours: { start: dbSettings.business_hours_start, end: dbSettings.business_hours_end },
      slotDuration: dbSettings.slot_duration,
      bufferTime: dbSettings.buffer_time,
      voicePersona: dbSettings.voice_persona,
      autoConfirm: dbSettings.auto_confirm,
      timezone: dbSettings.timezone,
    });
    setSynced(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => upsertAgentSettings({
      business_hours_start: settings.businessHours.start,
      business_hours_end: settings.businessHours.end,
      slot_duration: settings.slotDuration,
      buffer_time: settings.bufferTime,
      voice_persona: settings.voicePersona,
      auto_confirm: settings.autoConfirm,
      timezone: settings.timezone,
    }),
    onSuccess: () => toast({ title: "Settings saved", description: "Your agent configuration has been updated." }),
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your AI scheduling agent</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90">
          <Save className="h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Business Hours</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Start Time</Label>
              <Input type="time" value={settings.businessHours.start} onChange={(e) => setSettings({ ...settings, businessHours: { ...settings.businessHours, start: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">End Time</Label>
              <Input type="time" value={settings.businessHours.end} onChange={(e) => setSettings({ ...settings, businessHours: { ...settings.businessHours, end: e.target.value } })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Timezone</Label>
            <Select value={settings.timezone} onValueChange={(v) => setSettings({ ...settings, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="Europe/London">GMT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Scheduling</h3>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Slot Duration</Label>
            <Select value={String(settings.slotDuration)} onValueChange={(v) => setSettings({ ...settings, slotDuration: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Buffer Between Appointments</Label>
            <Select value={String(settings.bufferTime)} onValueChange={(v) => setSettings({ ...settings, bufferTime: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Voice Persona</h3>
          <Select value={settings.voicePersona} onValueChange={(v) => setSettings({ ...settings, voicePersona: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Professional & Friendly">Professional & Friendly</SelectItem>
              <SelectItem value="Warm & Casual">Warm & Casual</SelectItem>
              <SelectItem value="Concise & Direct">Concise & Direct</SelectItem>
              <SelectItem value="Empathetic & Patient">Empathetic & Patient</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Automation</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-card-foreground">Auto-confirm bookings</p>
              <p className="text-xs text-muted-foreground">Automatically confirm without manual review</p>
            </div>
            <Switch checked={settings.autoConfirm} onCheckedChange={(v) => setSettings({ ...settings, autoConfirm: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}
