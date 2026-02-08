import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

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

function mapSavedToProfile(s: any): VoiceProfile {
  return {
    id: s.saved_voice_id ?? s.id ?? s.voice_id,
    name: s.voice_name ?? s.name ?? "Saved Voice",
    elevenlabs_voice_id: s.voice_id ?? null,
    is_cloned: true,
    warmth: s.tone ?? 50,
    professionalism: 50,
    energy: s.energy ?? 50,
    speed: s.speed ?? 50,
    expressiveness: (s.style ?? 0) * 100,
  };
}

export function useVoiceProfiles() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["voice_profiles"],
    queryFn: async () => {
      try {
        const [savedRes, listRes] = await Promise.all([
          api.getSavedVoices().catch(() => ({ saved_voices: [] })),
          api.listVoices(undefined, undefined, undefined, true).catch(() => ({ voices: [] })),
        ]);
        const saved = (savedRes as any)?.saved_voices ?? savedRes ?? [];
        const list = (listRes as any)?.voices ?? listRes ?? [];
        const fromSaved = Array.isArray(saved) ? saved.map(mapSavedToProfile) : [];
        const fromList = Array.isArray(list) ? list.map((v: any) => ({
          id: v.voice_id ?? v.id,
          name: v.name ?? v.voice_name ?? "Voice",
          elevenlabs_voice_id: v.voice_id ?? v.elevenlabs_voice_id ?? null,
          is_cloned: v.is_cloned ?? false,
          warmth: v.tone ?? v.warmth ?? 50,
          energy: v.energy ?? 50,
          speed: v.speed ?? 50,
          expressiveness: (v.style ?? 0) * 100,
          professionalism: 50,
        })) : [];
        const combined = [...fromSaved, ...fromList];
        if (combined.length === 0) return DEFAULT_VOICES;
        const seen = new Set<string>();
        const out: VoiceProfile[] = [];
        combined.forEach((v) => {
          const id = v.id ?? v.elevenlabs_voice_id;
          if (id && !seen.has(id)) {
            seen.add(id);
            out.push(v);
          }
        });
        return out.length ? out : DEFAULT_VOICES;
      } catch {
        return DEFAULT_VOICES;
      }
    },
    enabled: true,
  });

  const saveVoice = useMutation({
    mutationFn: async (profile: Partial<VoiceProfile> & { elevenlabs_voice_id: string; name: string }) => {
      await api.saveVoice({
        voice_id: profile.elevenlabs_voice_id,
        voice_name: profile.name,
        tone: profile.warmth ?? 50,
        speed: profile.speed ?? 50,
        energy: profile.energy ?? 50,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voice_profiles"] }),
  });

  const deleteVoice = useMutation({
    mutationFn: async (_id: string) => {
      // Backend delete could be added; no-op for now
      await Promise.resolve();
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
