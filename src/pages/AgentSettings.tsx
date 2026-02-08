import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { agentSettings } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export default function AgentSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(agentSettings);

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Your agent configuration has been updated." });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your AI scheduling agent</p>
        </div>
        <Button onClick={handleSave} className="gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Hours */}
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

        {/* Scheduling */}
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

        {/* Voice */}
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

        {/* Auto-confirm */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Automation</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-card-foreground">Auto-confirm bookings</p>
              <p className="text-xs text-muted-foreground">Automatically confirm appointments without manual review</p>
            </div>
            <Switch checked={settings.autoConfirm} onCheckedChange={(v) => setSettings({ ...settings, autoConfirm: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}
