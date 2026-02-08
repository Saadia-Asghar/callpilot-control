import { Mic } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { VoiceProfile } from "@/hooks/useVoiceProfiles";

interface VoiceSelectorProps {
  voices: VoiceProfile[];
  selectedId: string | null;
  onSelect: (voice: VoiceProfile) => void;
  isLoading?: boolean;
}

export function VoiceSelector({ voices, selectedId, onSelect, isLoading }: VoiceSelectorProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
        <Mic className="h-3 w-3" /> Saved Voice
      </label>
      <Select
        value={selectedId ?? ""}
        onValueChange={(id) => {
          const v = voices.find((v) => v.id === id);
          if (v) onSelect(v);
        }}
        disabled={isLoading}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={isLoading ? "Loading voices..." : "Select a saved voice"} />
        </SelectTrigger>
        <SelectContent>
          {voices.map((v) => (
            <SelectItem key={v.id} value={v.id} className="text-xs">
              <span className="flex items-center gap-2">
                {v.name}
                {v.is_cloned && (
                  <Badge variant="outline" className="text-[8px] px-1 bg-info/15 text-info border-info/30">Cloned</Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
