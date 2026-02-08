import { useState } from "react";
import { X, Plus, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { userPreferences } from "@/data/mockData";

const tagColors = [
  "bg-primary/15 text-primary border-primary/30",
  "bg-success/15 text-success border-success/30",
  "bg-warning/15 text-warning border-warning/30",
  "bg-info/15 text-info border-info/30",
];

export default function PreferencesMemory() {
  const [prefs, setPrefs] = useState(userPreferences);
  const [newTag, setNewTag] = useState<{ userId: number; value: string } | null>(null);

  const removeTag = (userId: number, tag: string) => {
    setPrefs(prefs.map((u) => u.id === userId ? { ...u, preferences: u.preferences.filter((p) => p !== tag) } : u));
  };

  const addTag = (userId: number) => {
    if (!newTag || !newTag.value.trim()) return;
    setPrefs(prefs.map((u) => u.id === userId ? { ...u, preferences: [...u.preferences, newTag.value.trim()] } : u));
    setNewTag(null);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Preferences Memory</h1>
          <p className="text-sm text-muted-foreground">Stored user preferences learned by the agent</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prefs.map((user) => (
          <div key={user.id} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-card-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">Last contact: {user.lastContact}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.preferences.map((tag, i) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-[11px] gap-1 ${tagColors[i % tagColors.length]}`}
                >
                  {tag}
                  <button onClick={() => removeTag(user.id, tag)} className="ml-0.5 hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {newTag?.userId === user.id ? (
                <Input
                  autoFocus
                  className="h-6 w-32 text-xs"
                  value={newTag.value}
                  onChange={(e) => setNewTag({ ...newTag, value: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addTag(user.id)}
                  onBlur={() => setNewTag(null)}
                  placeholder="new tag..."
                />
              ) : (
                <button
                  onClick={() => setNewTag({ userId: user.id, value: "" })}
                  className="flex h-6 items-center gap-1 rounded-md border border-dashed border-border px-2 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
