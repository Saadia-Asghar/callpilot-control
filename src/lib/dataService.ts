/**
 * Data service - uses CallPilot backend API where available,
 * mock data otherwise so app works without Supabase.
 */
import api from "@/lib/api";

// ── Call Logs (backend) ──
export async function fetchCallLogs() {
  try {
    const data = await api.listCallsByOperator(100, 0, true);
    const list = Array.isArray(data) ? data : ((data as any)?.calls ?? (data as any)?.items ?? []);
    return list.map((c: any) => ({
      id: c.id ?? c.call_log_id,
      caller_name: c.caller_name ?? c.caller ?? "Caller",
      intent: c.intent ?? c.summary ?? "—",
      created_at: c.created_at ?? c.timestamp,
      status: c.status ?? "completed",
      duration_seconds: c.duration_seconds,
      raw_transcript: c.raw_transcript,
    }));
  } catch {
    return [];
  }
}

// ── Appointments / Calendar (backend) ──
export async function fetchAppointments() {
  try {
    const start = new Date();
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 2);
    const res = await api.getCalendarEvents(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
    const events = (res as any)?.events ?? [];
    // Map to format expected by CalendarView: day (1-5), time, title, duration, status, id
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const hours = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
    return events.map((e: any, i: number) => {
      const startStr = e.start?.dateTime ?? e.start ?? e.start_time ?? "";
      const d = startStr ? new Date(startStr) : new Date();
      const dayName = days[d.getDay() - 1] ?? days[i % 5];
      const dayIndex = days.indexOf(dayName) + 1;
      const hour = hours[Math.floor(i / 5) % hours.length];
      return {
        id: e.id ?? `ev-${i}`,
        day: dayIndex,
        time: hour,
        title: e.summary ?? e.title ?? "Appointment",
        duration: e.duration ?? 30,
        status: e.status ?? (i % 3 === 0 ? "confirmed" : "pending"),
      };
    });
  } catch {
    // Fallback mock week for demo
    const days = [1, 2, 3, 4, 5];
    const hours = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
    const out: any[] = [];
    days.forEach((day, di) => {
      hours.slice(0, 4).forEach((time, ti) => {
        if (di === 1 && ti === 2) return;
        out.push({
          id: `mock-${day}-${ti}`,
          day: day + 2,
          time,
          title: "Slot",
          duration: 30,
          status: ti % 2 === 0 ? "confirmed" : "pending",
        });
      });
    });
    return out;
  }
}

// ── User Preferences (mock until backend) ──
export async function fetchUserPreferences() {
  return [
    { id: "1", name: "Language", preferences: ["English"] },
    { id: "2", name: "Contact time", preferences: ["Morning"] },
  ];
}

export async function updateUserPreferenceTags(id: string, preferences: string[]) {
  await Promise.resolve({ id, preferences });
}

// ── Agent Settings (mock until backend) ──
export async function fetchAgentSettings() {
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

export async function upsertAgentSettings(settings: {
  business_hours_start: string;
  business_hours_end: string;
  slot_duration: number;
  buffer_time: number;
  voice_persona: string;
  auto_confirm: boolean;
  timezone: string;
}) {
  await Promise.resolve(settings);
}
