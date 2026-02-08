import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUserPreferences, updateUserPreferenceTags } from "@/lib/dataService";
import { useToast } from "@/hooks/use-toast";

const tagColors = [
  "bg-primary/15 text-primary border-primary/30",
  "bg-success/15 text-success border-success/30",
  "bg-warning/15 text-warning border-warning/30",
  "bg-info/15 text-info border-info/30",
];

export default function PreferencesMemory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState<{ userId: string; value: string } | null>(null);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["user_preferences"],
    queryFn: fetchUserPreferences,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => updateUserPreferenceTags(id, tags),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_preferences"] }),
    onError: () => toast({ title: "Error", description: "Failed to update preferences", variant: "destructive" }),
  });

  const removeTag = (userId: string, tag: string) => {
    const user = prefs?.find((u: any) => u.id === userId);
    if (!user) return;
    updateMutation.mutate({ id: userId, tags: user.preferences.filter((p: string) => p !== tag) });
  };

  const addTag = (userId: string) => {
    if (!newTag || !newTag.value.trim()) return;
    const user = prefs?.find((u: any) => u.id === userId);
    if (!user) return;
    updateMutation.mutate({ id: userId, tags: [...user.preferences, newTag.value.trim()] });
    setNewTag(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!prefs?.length) {
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
        <div className="rounded-xl border border-border bg-card p-12 shadow-card text-center">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No user preferences learned yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Preferences will appear here as the agent interacts with callers.</p>
        </div>
      </div>
    );
  }

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
        {prefs.map((user: any) => (
          <div key={user.id} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
            <div>
              <p className="text-sm font-semibold text-card-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">Last contact: {user.last_contact}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.preferences.map((tag: string, i: number) => (
                <Badge key={tag} variant="outline" className={`text-[11px] gap-1 ${tagColors[i % tagColors.length]}`}>
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
