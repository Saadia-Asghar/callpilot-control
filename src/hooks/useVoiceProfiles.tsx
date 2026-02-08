import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VoiceProfile {
  id: string;
  name: string;
  elevenlabs_voice_id: string | null;
  is_cloned?: boolean;
  is_default?: boolean;
  is_business_voice?: boolean;
  quality_score?: number;
  warmth?: number;
  professionalism?: number;
  energy?: number;
  speed?: number;
  expressiveness?: number;
  last_used_at?: string | null;
}

const DEFAULT_VOICES: VoiceProfile[] = [
  { id: "v1", name: "Medical Assistant", elevenlabs_voice_id: "EXAVITQu4vr4xnSDxMaL", is_cloned: false, warmth: 80, professionalism: 70, energy: 40, speed: 45, expressiveness: 60 },
  { id: "v2", name: "Corporate Receptionist", elevenlabs_voice_id: "JBFqnCBsd6RMkjVDRZzb", is_cloned: false, warmth: 40, professionalism: 90, energy: 50, speed: 55, expressiveness: 35 },
  { id: "v3", name: "Friendly Concierge", elevenlabs_voice_id: "cgSgspJ2msm6clMCkdW9", is_cloned: false, warmth: 90, professionalism: 50, energy: 70, speed: 50, expressiveness: 80 },
  { id: "v4", name: "Academic Advisor", elevenlabs_voice_id: "onwK4e9ZLuTAKqWW03F9", is_cloned: false, warmth: 50, professionalism: 80, energy: 40, speed: 45, expressiveness: 45 },
  { id: "v5", name: "Calm Support Agent", elevenlabs_voice_id: "pFZP5JQG7iQjIQuC4Bku", is_cloned: false, is_default: true, warmth: 75, professionalism: 65, energy: 30, speed: 40, expressiveness: 55 },
];

export function useVoiceProfiles() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["voice_profiles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("voice_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error || !data?.length) return DEFAULT_VOICES;

        return data.map((v): VoiceProfile => ({
          id: v.id,
          name: v.name,
          elevenlabs_voice_id: v.elevenlabs_voice_id,
          is_cloned: v.is_cloned,
          is_default: v.is_default,
          is_business_voice: v.is_business_voice,
          quality_score: v.quality_score,
          warmth: v.warmth,
          professionalism: v.professionalism,
          energy: v.energy,
          speed: v.speed,
          expressiveness: v.expressiveness,
          last_used_at: v.last_used_at,
        }));
      } catch {
        return DEFAULT_VOICES;
      }
    },
  });

  const saveVoice = useMutation({
    mutationFn: async (profile: Partial<VoiceProfile> & { elevenlabs_voice_id: string; name: string }) => {
      const { error } = await supabase.from("voice_profiles").insert({
        name: profile.name,
        elevenlabs_voice_id: profile.elevenlabs_voice_id,
        warmth: profile.warmth ?? 50,
        speed: profile.speed ?? 50,
        energy: profile.energy ?? 50,
        professionalism: profile.professionalism ?? 50,
        expressiveness: profile.expressiveness ?? 50,
        is_cloned: profile.is_cloned ?? false,
      });
      if (error) throw error;
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
    voices: query.data ?? DEFAULT_VOICES,
    isLoading: query.isLoading,
    saveVoice,
    deleteVoice,
  };
}
