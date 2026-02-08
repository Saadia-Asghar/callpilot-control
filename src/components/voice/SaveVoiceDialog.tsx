import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface SaveVoiceDialogProps {
  onSave: (name: string, settings: { warmth: number; speed: number; energy: number; elevenlabs_voice_id: string }) => Promise<void>;
  voiceId: string;
  warmth: number;
  speed: number;
  energy: number;
  disabled?: boolean;
}

export function SaveVoiceDialog({ onSave, voiceId, warmth, speed, energy, disabled }: SaveVoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), { warmth, speed, energy, elevenlabs_voice_id: voiceId });
      toast({ title: "✅ Voice Saved!", description: `"${name}" is now available in your voice library.` });
      setOpen(false);
      setName("");
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={disabled}>
          <Save className="h-3.5 w-3.5" /> Save Voice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Save Voice Profile</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Your voice will be saved and available on any script or call draft page.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="e.g. My Professional Voice"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-sm"
          autoFocus
        />
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="gap-1.5 gradient-primary text-primary-foreground border-0 text-xs">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save Voice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
