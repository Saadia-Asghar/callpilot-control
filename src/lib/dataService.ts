/**
 * Data service - uses Supabase where available,
 * mock data otherwise so app works standalone.
 */
import { supabase } from "@/integrations/supabase/client";
import { callLogs as mockCallLogs, calendarEvents as mockCalendarEvents } from "@/data/mockData";

// ── Call Logs ──
export async function fetchCallLogs() {
  try {
    const { data, error } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data?.length) throw error;

    return data.map((c) => ({
      id: c.id,
      caller_name: c.caller_name,
      intent: c.intent,
      outcome: c.outcome,
      status: c.status,
      duration: c.duration,
      date: c.date,
      summary: c.summary,
      transcript: c.transcript,
      created_at: c.created_at,
    }));
  } catch {
    // Fallback to mock data
    return mockCallLogs.map((c) => ({
      id: String(c.id),
      caller_name: c.callerName,
      intent: c.intent,
      outcome: c.outcome,
      status: c.status,
      duration: c.duration,
      date: c.date,
      summary: c.summary,
      transcript: c.transcript,
      created_at: c.date,
    }));
  }
}

// ── Appointments / Calendar ──
export async function fetchAppointments() {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data?.length) throw error;

    return data.map((e) => ({
      id: e.id,
      day: e.day,
      time: e.time,
      title: e.title,
      duration: e.duration,
      status: e.status,
    }));
  } catch {
    return mockCalendarEvents;
  }
}

// ── User Preferences ──
export async function fetchUserPreferences() {
  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data?.length) throw error;

    return data.map((p) => ({
      id: p.id,
      name: p.name,
      preferences: p.preferences,
      last_contact: p.last_contact,
    }));
  } catch {
    // Return mock data
    return [
      { id: "1", name: "Sarah Chen", preferences: ["prefers morning", "prefers tuesday"], last_contact: "Today" },
      { id: "2", name: "James Park", preferences: ["prefers afternoon", "prefers friday"], last_contact: "Today" },
      { id: "3", name: "Maria Lopez", preferences: ["prefers morning", "flexible schedule"], last_contact: "Today" },
    ];
  }
}

export async function updateUserPreferenceTags(id: string, preferences: string[]) {
  try {
    const { error } = await supabase
      .from("user_preferences")
      .update({ preferences })
      .eq("id", id);
    if (error) throw error;
  } catch {
    // Silently fail for mock data
    await Promise.resolve();
  }
}

// ── Agent Settings ──
export async function fetchAgentSettings() {
  try {
    const { data, error } = await supabase
      .from("agent_settings")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) throw error;
    return data;
  } catch {
    return {
      id: "1",
      business_hours_start: "09:00",
      business_hours_end: "17:00",
      slot_duration: 30,
      buffer_time: 5,
      voice_persona: "professional",
      auto_confirm: false,
      timezone: "America/New_York",
      updated_at: new Date().toISOString(),
    };
  }
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
  try {
    const { error } = await supabase
      .from("agent_settings")
      .upsert(settings);
    if (error) throw error;
  } catch {
    await Promise.resolve();
  }
}
