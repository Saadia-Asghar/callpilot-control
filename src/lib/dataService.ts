import { supabase } from "@/integrations/supabase/client";

// ── Call Logs ──
export async function fetchCallLogs() {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ── Appointments ──
export async function fetchAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("day", { ascending: true });
  if (error) throw error;
  return data;
}

// ── User Preferences ──
export async function fetchUserPreferences() {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateUserPreferenceTags(id: string, preferences: string[]) {
  const { error } = await supabase
    .from("user_preferences")
    .update({ preferences })
    .eq("id", id);
  if (error) throw error;
}

// ── Agent Settings ──
export async function fetchAgentSettings() {
  const { data, error } = await supabase
    .from("agent_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertAgentSettings(settings: {
  business_hours_start: string;
  business_hours_end: string;
  slot_duration: number;
  buffer_time: number;
  voice_persona: string;
  auto_confirm: boolean;
  timezone: string;
}) {
  // Get existing
  const existing = await fetchAgentSettings();
  if (existing) {
    const { error } = await supabase
      .from("agent_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("agent_settings")
      .insert(settings);
    if (error) throw error;
  }
}
