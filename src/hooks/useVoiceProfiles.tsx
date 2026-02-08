import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type VoiceProfile = Tables<"voice_profiles">;

export function useVoiceProfiles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["voice_profiles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_profiles")
        .select("*")
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VoiceProfile[];
    },
    enabled: !!user,
  });

  const saveVoice = useMutation({
    mutationFn: async (profile: Omit<TablesInsert<"voice_profiles">, "user_id">) => {
      const { data, error } = await supabase
        .from("voice_profiles")
        .insert({ ...profile, user_id: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voice_profiles"] }),
  });

  const deleteVoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("voice_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voice_profiles"] }),
  });

  return {
    voices: query.data ?? [],
    isLoading: query.isLoading,
    saveVoice,
    deleteVoice,
  };
}
