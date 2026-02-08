export const dashboardStats = {
  totalBookingsToday: 24,
  upcomingAppointments: 8,
  callSuccessRate: 92,
  totalCalls: 156,
};

export const recentActivity = [
  { id: 1, type: "booking" as const, message: "New appointment booked with Sarah Chen", time: "2 min ago", status: "success" as const },
  { id: 2, type: "call" as const, message: "Inbound call from +1 (415) 555-0132", time: "5 min ago", status: "active" as const },
  { id: 3, type: "reschedule" as const, message: "James Park rescheduled to Friday 3pm", time: "12 min ago", status: "warning" as const },
  { id: 4, type: "booking" as const, message: "New appointment booked with Maria Lopez", time: "18 min ago", status: "success" as const },
  { id: 5, type: "cancel" as const, message: "Tom Wilson cancelled Thursday appointment", time: "25 min ago", status: "error" as const },
  { id: 6, type: "call" as const, message: "Missed call from +1 (650) 555-0198", time: "32 min ago", status: "error" as const },
  { id: 7, type: "booking" as const, message: "Follow-up booked with Alex Rivera", time: "45 min ago", status: "success" as const },
];

export const liveTranscript = [
  { speaker: "caller" as const, text: "Hi, I'd like to schedule an appointment for next week.", timestamp: "0:02" },
  { speaker: "agent" as const, text: "Of course! I'd be happy to help you schedule an appointment. Could you tell me your preferred day and time?", timestamp: "0:05" },
  { speaker: "caller" as const, text: "I was thinking Tuesday or Wednesday, preferably in the morning.", timestamp: "0:12" },
  { speaker: "agent" as const, text: "Let me check our availability for Tuesday and Wednesday mornings...", timestamp: "0:16" },
  { speaker: "agent" as const, text: "I have openings on Tuesday at 9:00 AM and 10:30 AM, and Wednesday at 9:30 AM. Which works best for you?", timestamp: "0:20" },
  { speaker: "caller" as const, text: "Tuesday at 10:30 AM sounds perfect.", timestamp: "0:26" },
];

export const agentReasoningSteps = [
  { step: 1, action: "Parse intent", detail: "Detected: appointment scheduling request", status: "complete" as const },
  { step: 2, action: "Extract preferences", detail: "Days: Tue/Wed, Time: morning", status: "complete" as const },
  { step: 3, action: "Check calendar", detail: "Querying available slots...", status: "complete" as const },
  { step: 4, action: "Present options", detail: "3 slots offered to caller", status: "complete" as const },
  { step: 5, action: "Confirm booking", detail: "Tue 10:30 AM selected", status: "active" as const },
];

export const toolCalls = [
  { name: "calendar.getSlots", status: "success" as const },
  { name: "user.getPreferences", status: "success" as const },
  { name: "calendar.bookSlot", status: "pending" as const },
  { name: "notification.send", status: "queued" as const },
];

export const calendarEvents = [
  { id: 1, title: "Sarah Chen", time: "9:00 AM", duration: 30, day: 1, status: "confirmed" as const },
  { id: 2, title: "James Park", time: "10:30 AM", duration: 45, day: 1, status: "confirmed" as const },
  { id: 3, title: "Maria Lopez", time: "2:00 PM", duration: 30, day: 1, status: "pending" as const },
  { id: 4, title: "Available", time: "11:30 AM", duration: 30, day: 1, status: "available" as const },
  { id: 5, title: "Alex Rivera", time: "9:30 AM", duration: 30, day: 2, status: "confirmed" as const },
  { id: 6, title: "Available", time: "10:00 AM", duration: 30, day: 2, status: "available" as const },
  { id: 7, title: "Available", time: "1:00 PM", duration: 30, day: 2, status: "available" as const },
  { id: 8, title: "Emily Zhang", time: "3:00 PM", duration: 45, day: 3, status: "confirmed" as const },
  { id: 9, title: "Available", time: "9:00 AM", duration: 30, day: 3, status: "available" as const },
  { id: 10, title: "David Kim", time: "11:00 AM", duration: 30, day: 4, status: "confirmed" as const },
  { id: 11, title: "Available", time: "2:00 PM", duration: 30, day: 4, status: "available" as const },
  { id: 12, title: "Lisa Wang", time: "10:00 AM", duration: 30, day: 5, status: "confirmed" as const },
];

export const callLogs = [
  { id: 1, callerName: "Sarah Chen", intent: "New Booking", outcome: "Booked", duration: "2:34", status: "success" as const, date: "Today, 9:02 AM", summary: "Caller requested morning appointment. Agent found available slot on Tuesday at 9 AM. Booking confirmed with email notification sent.", transcript: "Agent: Good morning! How can I help you today?\nCaller: Hi, I need to book an appointment...\nAgent: I'd be happy to help! What day works best?\nCaller: Tuesday morning if possible.\nAgent: I have 9 AM available on Tuesday. Shall I book that?\nCaller: Yes, perfect!\nAgent: Great, you're all set for Tuesday at 9 AM." },
  { id: 2, callerName: "James Park", intent: "Reschedule", outcome: "Rescheduled", duration: "3:12", status: "success" as const, date: "Today, 9:15 AM", summary: "Caller needed to move Thursday appointment to Friday. Agent found 3 PM slot on Friday. Rescheduled successfully.", transcript: "Agent: Hello! How can I assist you?\nCaller: I need to reschedule my Thursday appointment.\nAgent: Of course. When would you like to move it to?\nCaller: Friday afternoon if possible.\nAgent: I have 3 PM on Friday. Does that work?\nCaller: That's great, thanks!" },
  { id: 3, callerName: "Tom Wilson", intent: "Cancel", outcome: "Cancelled", duration: "1:45", status: "warning" as const, date: "Today, 9:30 AM", summary: "Caller requested cancellation of Thursday appointment. Agent confirmed cancellation and offered to rebook in the future.", transcript: "Agent: Hi there! What can I do for you?\nCaller: I need to cancel my appointment on Thursday.\nAgent: I understand. May I ask the reason?\nCaller: Something came up at work.\nAgent: No problem. Your Thursday appointment is cancelled. Feel free to call back when you'd like to reschedule." },
  { id: 4, callerName: "Maria Lopez", intent: "New Booking", outcome: "Booked", duration: "4:01", status: "success" as const, date: "Today, 10:05 AM", summary: "Caller wanted afternoon appointment. Agent suggested 2 PM slot. Caller confirmed. Pending confirmation email.", transcript: "..." },
  { id: 5, callerName: "Unknown Caller", intent: "Inquiry", outcome: "No Action", duration: "0:52", status: "neutral" as const, date: "Today, 10:20 AM", summary: "Caller asked about business hours. Agent provided information. No booking made.", transcript: "..." },
  { id: 6, callerName: "Alex Rivera", intent: "Follow-up", outcome: "Booked", duration: "2:18", status: "success" as const, date: "Today, 10:45 AM", summary: "Returning caller booked follow-up appointment for Wednesday morning.", transcript: "..." },
  { id: 7, callerName: "+1 (650) 555-0198", intent: "Unknown", outcome: "Missed", duration: "0:00", status: "error" as const, date: "Today, 11:02 AM", summary: "Missed inbound call. No voicemail left.", transcript: "" },
];

export const userPreferences = [
  { id: 1, name: "Sarah Chen", preferences: ["prefers morning", "prefers in-person", "prefers tuesday"], lastContact: "Today" },
  { id: 2, name: "James Park", preferences: ["prefers afternoon", "prefers online", "prefers friday"], lastContact: "Today" },
  { id: 3, name: "Maria Lopez", preferences: ["prefers morning", "prefers online", "flexible schedule"], lastContact: "Today" },
  { id: 4, name: "Alex Rivera", preferences: ["prefers morning", "prefers wednesday", "needs follow-up"], lastContact: "Today" },
  { id: 5, name: "Emily Zhang", preferences: ["prefers afternoon", "prefers in-person", "prefers thursday"], lastContact: "Yesterday" },
  { id: 6, name: "David Kim", preferences: ["prefers morning", "prefers online", "prefers monday"], lastContact: "2 days ago" },
];

export const agentSettings = {
  businessHours: { start: "09:00", end: "17:00" },
  slotDuration: 30,
  bufferTime: 15,
  voicePersona: "Professional & Friendly",
  autoConfirm: true,
  timezone: "America/Los_Angeles",
};
