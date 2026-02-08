// === Agent Reasoning Stream Data ===
export interface ReasoningNode {
  id: string;
  timestamp: string;
  type: 'intent' | 'constraint' | 'tool_consider' | 'tool_select' | 'rejection' | 'decision' | 'negotiation';
  label: string;
  detail: string;
  confidence?: number;
  expandable?: boolean;
  children?: ReasoningNode[];
  status: 'complete' | 'active' | 'pending';
}

export const reasoningStream: ReasoningNode[] = [
  {
    id: 'r1', timestamp: '0:02', type: 'intent', label: 'Intent Detected',
    detail: 'appointment_scheduling (confidence: 0.96)', confidence: 0.96, status: 'complete',
    children: [
      { id: 'r1a', timestamp: '0:02', type: 'intent', label: 'Secondary Intent', detail: 'preference_expression (0.72)', confidence: 0.72, status: 'complete' },
    ]
  },
  {
    id: 'r2', timestamp: '0:03', type: 'constraint', label: 'Constraints Extracted',
    detail: 'date: next week | time: morning | days: Tue/Wed', status: 'complete',
    children: [
      { id: 'r2a', timestamp: '0:03', type: 'constraint', label: 'Hard Constraint', detail: 'date_range: Feb 10-14, 2026', status: 'complete' },
      { id: 'r2b', timestamp: '0:03', type: 'constraint', label: 'Soft Constraint', detail: 'time_preference: before 12:00 PM', status: 'complete' },
      { id: 'r2c', timestamp: '0:03', type: 'constraint', label: 'Memory Match', detail: 'User prefers morning (historical: 87%)', confidence: 0.87, status: 'complete' },
    ]
  },
  {
    id: 'r3', timestamp: '0:04', type: 'tool_consider', label: 'Tools Considered',
    detail: '4 tools evaluated for slot lookup', status: 'complete',
    children: [
      { id: 'r3a', timestamp: '0:04', type: 'tool_select', label: 'calendar.getSlots', detail: 'Selected — best fit for availability query', status: 'complete' },
      { id: 'r3b', timestamp: '0:04', type: 'rejection', label: 'calendar.getSlotsRange', detail: 'Rejected — overkill for 2-day window', status: 'complete' },
      { id: 'r3c', timestamp: '0:04', type: 'rejection', label: 'user.checkHistory', detail: 'Rejected — no prior booking to reference', status: 'complete' },
      { id: 'r3d', timestamp: '0:04', type: 'rejection', label: 'external.googleCalendar', detail: 'Rejected — not configured for this user', status: 'complete' },
    ]
  },
  {
    id: 'r4', timestamp: '0:16', type: 'tool_select', label: 'Tool Executed',
    detail: 'calendar.getSlots({days: ["Tue", "Wed"], time: "AM"}) → 3 results', status: 'complete',
  },
  {
    id: 'r5', timestamp: '0:20', type: 'decision', label: 'Response Composed',
    detail: 'Presenting 3 options ranked by preference match score', status: 'complete',
    children: [
      { id: 'r5a', timestamp: '0:20', type: 'decision', label: 'Tue 10:30 AM', detail: 'Score: 0.94 — matches morning + Tue pref', confidence: 0.94, status: 'complete' },
      { id: 'r5b', timestamp: '0:20', type: 'decision', label: 'Wed 9:30 AM', detail: 'Score: 0.88 — morning match, secondary day', confidence: 0.88, status: 'complete' },
      { id: 'r5c', timestamp: '0:20', type: 'decision', label: 'Tue 9:00 AM', detail: 'Score: 0.82 — early, may conflict with pattern', confidence: 0.82, status: 'complete' },
    ]
  },
  {
    id: 'r6', timestamp: '0:26', type: 'negotiation', label: 'User Selection',
    detail: 'Caller chose Tue 10:30 AM — highest-ranked option', status: 'complete',
  },
  {
    id: 'r7', timestamp: '0:28', type: 'tool_select', label: 'Booking Confirmation',
    detail: 'calendar.bookSlot() — awaiting final verification', status: 'active',
  },
];

// === Decision Graph Data ===
export interface GraphNode {
  id: string;
  label: string;
  type: 'start' | 'decision' | 'tool' | 'response' | 'outcome' | 'rejected';
  x: number;
  y: number;
  chosen?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  chosen?: boolean;
}

export const decisionGraphNodes: GraphNode[] = [
  { id: 'start', label: 'Call Received', type: 'start', x: 300, y: 30, chosen: true },
  { id: 'intent', label: 'Detect Intent', type: 'decision', x: 300, y: 100, chosen: true },
  { id: 'extract', label: 'Extract Constraints', type: 'decision', x: 300, y: 170, chosen: true },
  { id: 'tool1', label: 'calendar.getSlots', type: 'tool', x: 200, y: 240, chosen: true },
  { id: 'tool2', label: 'user.checkHistory', type: 'tool', x: 400, y: 240, chosen: false },
  { id: 'present', label: 'Present 3 Options', type: 'response', x: 200, y: 310, chosen: true },
  { id: 'negotiate', label: 'Negotiate Slot', type: 'decision', x: 400, y: 310, chosen: false },
  { id: 'opt1', label: 'Tue 10:30 AM', type: 'outcome', x: 100, y: 380, chosen: true },
  { id: 'opt2', label: 'Wed 9:30 AM', type: 'rejected', x: 250, y: 380, chosen: false },
  { id: 'opt3', label: 'Tue 9:00 AM', type: 'rejected', x: 400, y: 380, chosen: false },
  { id: 'confirm', label: 'Book & Confirm', type: 'outcome', x: 100, y: 450, chosen: true },
];

export const decisionGraphEdges: GraphEdge[] = [
  { from: 'start', to: 'intent', chosen: true },
  { from: 'intent', to: 'extract', chosen: true },
  { from: 'extract', to: 'tool1', label: 'primary', chosen: true },
  { from: 'extract', to: 'tool2', label: 'alt', chosen: false },
  { from: 'tool1', to: 'present', chosen: true },
  { from: 'tool2', to: 'negotiate', chosen: false },
  { from: 'present', to: 'opt1', label: 'selected', chosen: true },
  { from: 'present', to: 'opt2', label: 'passed', chosen: false },
  { from: 'present', to: 'opt3', label: 'passed', chosen: false },
  { from: 'opt1', to: 'confirm', chosen: true },
];

// === Negotiation Simulator Data ===
export interface SimulatorScenario {
  id: string;
  type: 'objection' | 'conflict' | 'preference';
  label: string;
  injection: string;
  agentResponse: string;
  adaptations: string[];
}

export const simulatorScenarios: SimulatorScenario[] = [
  {
    id: 's1', type: 'objection', label: 'Too early',
    injection: 'That\'s too early for me, I can\'t do anything before 11.',
    agentResponse: 'I understand! Let me check for later slots. I have Wednesday at 11:30 AM — would that work?',
    adaptations: ['Constraint updated: time ≥ 11:00', 'Re-queried calendar API', 'Shifted to secondary day preference'],
  },
  {
    id: 's2', type: 'conflict', label: 'Calendar conflict',
    injection: '[System] Slot Tue 10:30 AM just got booked by another caller.',
    agentResponse: 'I apologize — that Tuesday slot just became unavailable. I can offer Tuesday at 2:00 PM or Wednesday at 9:30 AM instead.',
    adaptations: ['Real-time conflict detected', 'Invalidated option #1', 'Fetched next-best alternatives', 'Maintained conversation flow'],
  },
  {
    id: 's3', type: 'preference', label: 'Switch to online',
    injection: 'Actually, can we do this online instead of in-person?',
    agentResponse: 'Absolutely! I\'ll set this up as a virtual appointment. You\'ll receive a video link via email after booking.',
    adaptations: ['Preference updated: format → online', 'Checked virtual slot availability', 'Updated memory: user now prefers online'],
  },
];

// === Trust & Safety Data ===
export interface TrustIndicator {
  id: string;
  label: string;
  status: 'verified' | 'warning' | 'pass' | 'pending';
  detail: string;
  icon: string;
}

export const trustIndicators: TrustIndicator[] = [
  { id: 't1', label: 'Slot Verification', status: 'verified', detail: 'Confirmed available via live calendar API query', icon: '🔒' },
  { id: 't2', label: 'Hallucination Risk', status: 'pass', detail: 'All facts grounded in API responses — risk: LOW', icon: '🧠' },
  { id: 't3', label: 'Tool Verification', status: 'verified', detail: 'calendar.getSlots returned validated response', icon: '🔧' },
  { id: 't4', label: 'Confirmation Checkpoint', status: 'pending', detail: 'Awaiting user verbal confirmation before booking', icon: '✅' },
  { id: 't5', label: 'Policy Compliance', status: 'pass', detail: 'Booking within business hours, buffer respected', icon: '📋' },
  { id: 't6', label: 'Data Privacy', status: 'verified', detail: 'No PII shared externally, logs encrypted', icon: '🛡️' },
];

// === Voice Persona Lab Data ===
export interface VoicePreset {
  id: string;
  name: string;
  tone: number;
  speed: number;
  empathy: number;
  verbosity: number;
  description: string;
}

export const voicePresets: VoicePreset[] = [
  { id: 'medical', name: 'Medical', tone: 35, speed: 40, empathy: 85, verbosity: 60, description: 'Warm, patient, clear medical terminology' },
  { id: 'academic', name: 'Academic', tone: 60, speed: 45, empathy: 50, verbosity: 75, description: 'Precise, knowledgeable, structured' },
  { id: 'corporate', name: 'Corporate', tone: 70, speed: 55, empathy: 40, verbosity: 45, description: 'Efficient, professional, concise' },
  { id: 'friendly', name: 'Friendly', tone: 20, speed: 50, empathy: 90, verbosity: 65, description: 'Casual, warm, conversational' },
];

// === Replay Studio Data ===
export interface ReplayEvent {
  id: string;
  timestamp: string;
  seconds: number;
  type: 'transcript_user' | 'transcript_agent' | 'tool_call' | 'decision' | 'negotiation';
  content: string;
  detail?: string;
}

export const replayEvents: ReplayEvent[] = [
  { id: 'e1', timestamp: '0:02', seconds: 2, type: 'transcript_user', content: 'Hi, I\'d like to schedule an appointment for next week.' },
  { id: 'e2', timestamp: '0:03', seconds: 3, type: 'decision', content: 'Intent: appointment_scheduling (0.96)', detail: 'High confidence scheduling intent detected' },
  { id: 'e3', timestamp: '0:05', seconds: 5, type: 'transcript_agent', content: 'Of course! I\'d be happy to help. Could you tell me your preferred day and time?' },
  { id: 'e4', timestamp: '0:12', seconds: 12, type: 'transcript_user', content: 'I was thinking Tuesday or Wednesday, preferably in the morning.' },
  { id: 'e5', timestamp: '0:13', seconds: 13, type: 'decision', content: 'Constraints: Tue/Wed, AM', detail: 'Extracted hard constraint on days, soft on time' },
  { id: 'e6', timestamp: '0:14', seconds: 14, type: 'tool_call', content: 'calendar.getSlots({days: ["Tue","Wed"], time: "AM"})', detail: 'Returned 3 available slots' },
  { id: 'e7', timestamp: '0:16', seconds: 16, type: 'tool_call', content: 'user.getPreferences("caller_id")', detail: 'prefers morning, prefers tuesday' },
  { id: 'e8', timestamp: '0:20', seconds: 20, type: 'transcript_agent', content: 'I have Tue 9 AM, Tue 10:30 AM, and Wed 9:30 AM. Which works best?' },
  { id: 'e9', timestamp: '0:21', seconds: 21, type: 'decision', content: 'Ranked options by preference match', detail: 'Tue 10:30 scored highest (0.94)' },
  { id: 'e10', timestamp: '0:26', seconds: 26, type: 'transcript_user', content: 'Tuesday at 10:30 AM sounds perfect.' },
  { id: 'e11', timestamp: '0:27', seconds: 27, type: 'negotiation', content: 'User selected top-ranked option', detail: 'No negotiation needed — first offer accepted' },
  { id: 'e12', timestamp: '0:28', seconds: 28, type: 'tool_call', content: 'calendar.bookSlot({date: "Tue", time: "10:30"})', detail: 'Booking in progress...' },
];

// === Agent Memory Map Data ===
export interface MemoryNode {
  id: string;
  type: 'user' | 'preference' | 'booking';
  label: string;
  confidence?: number;
  decay?: number; // 0-100, 100 = fresh
  x: number;
  y: number;
}

export interface MemoryEdge {
  from: string;
  to: string;
}

export const memoryMapNodes: MemoryNode[] = [
  { id: 'u1', type: 'user', label: 'Sarah Chen', x: 300, y: 200 },
  { id: 'p1', type: 'preference', label: 'prefers morning', confidence: 0.92, decay: 95, x: 150, y: 100 },
  { id: 'p2', type: 'preference', label: 'prefers in-person', confidence: 0.85, decay: 80, x: 450, y: 100 },
  { id: 'p3', type: 'preference', label: 'prefers tuesday', confidence: 0.78, decay: 70, x: 150, y: 300 },
  { id: 'b1', type: 'booking', label: 'Tue 9 AM (Jan 28)', confidence: 1.0, decay: 60, x: 450, y: 300 },
  { id: 'b2', type: 'booking', label: 'Tue 10:30 AM (Feb 4)', confidence: 1.0, decay: 95, x: 300, y: 380 },
  
  { id: 'u2', type: 'user', label: 'James Park', x: 700, y: 200 },
  { id: 'p4', type: 'preference', label: 'prefers afternoon', confidence: 0.88, decay: 85, x: 600, y: 100 },
  { id: 'p5', type: 'preference', label: 'prefers friday', confidence: 0.75, decay: 55, x: 800, y: 100 },
  { id: 'b3', type: 'booking', label: 'Fri 3 PM (Feb 7)', confidence: 1.0, decay: 90, x: 700, y: 350 },
];

export const memoryMapEdges: MemoryEdge[] = [
  { from: 'u1', to: 'p1' }, { from: 'u1', to: 'p2' }, { from: 'u1', to: 'p3' },
  { from: 'u1', to: 'b1' }, { from: 'u1', to: 'b2' },
  { from: 'p1', to: 'b1' }, { from: 'p1', to: 'b2' }, { from: 'p3', to: 'b1' },
  { from: 'u2', to: 'p4' }, { from: 'u2', to: 'p5' }, { from: 'u2', to: 'b3' },
  { from: 'p5', to: 'b3' },
];

// === Failure Forensics Data ===
export interface FailureCase {
  id: string;
  callerName: string;
  date: string;
  intent: string;
  failurePoint: string;
  missingConstraints: string[];
  reasoningBreakdown: string;
  suggestedFix: string;
  severity: 'critical' | 'moderate' | 'low';
}

export const failureCases: FailureCase[] = [
  {
    id: 'f1', callerName: 'Unknown Caller', date: 'Today, 10:20 AM', intent: 'New Booking',
    failurePoint: 'Intent classification',
    missingConstraints: ['No day specified', 'No time preference', 'No name provided'],
    reasoningBreakdown: 'Agent classified as "inquiry" instead of "booking attempt". Caller said "I might need an appointment" — hedging language confused classifier.',
    suggestedFix: 'Lower intent threshold for scheduling-adjacent phrases. Add "might need", "thinking about" to booking triggers.',
    severity: 'moderate',
  },
  {
    id: 'f2', callerName: '+1 (650) 555-0198', date: 'Today, 11:02 AM', intent: 'Unknown',
    failurePoint: 'Call handling',
    missingConstraints: ['Missed call — no data captured'],
    reasoningBreakdown: 'Ring timeout exceeded 4 rings. Auto-attendant failed to pick up. No voicemail fallback configured.',
    suggestedFix: 'Reduce ring count to 2. Enable voicemail transcription. Add callback scheduling for missed calls.',
    severity: 'critical',
  },
  {
    id: 'f3', callerName: 'Emily Zhang', date: 'Yesterday, 4:45 PM', intent: 'Reschedule',
    failurePoint: 'Constraint resolution',
    missingConstraints: ['Conflicting time preferences', 'Buffer time violated'],
    reasoningBreakdown: 'Agent offered 4:30 PM slot but 15-min buffer would push past 5 PM close. Booking was rejected by validation layer after user agreed.',
    suggestedFix: 'Pre-filter slots that violate buffer + business hours constraints before presenting to caller.',
    severity: 'moderate',
  },
];

// === Experiment Mode Data ===
export interface ExperimentStrategy {
  id: string;
  name: string;
  description: string;
  outcome: 'booked' | 'failed' | 'escalated';
  turns: number;
  latencyMs: number;
  successRate: number;
  reasoning: string[];
}

export const experimentStrategies: ExperimentStrategy[] = [
  {
    id: 'e1', name: 'Default (Balanced)', description: 'Standard reasoning with preference matching',
    outcome: 'booked', turns: 4, latencyMs: 1200, successRate: 92,
    reasoning: ['Detected intent → extracted constraints → queried calendar → presented 3 options → user selected → booked'],
  },
  {
    id: 'e2', name: 'Aggressive (Minimal Turns)', description: 'Skip preference check, offer best slot immediately',
    outcome: 'booked', turns: 2, latencyMs: 800, successRate: 78,
    reasoning: ['Detected intent → offered single best slot → user accepted → booked', 'Risk: lower satisfaction if slot doesn\'t match preference'],
  },
  {
    id: 'e3', name: 'Cautious (Max Validation)', description: 'Full preference check, confirm every constraint',
    outcome: 'booked', turns: 7, latencyMs: 2400, successRate: 97,
    reasoning: ['Detected intent → confirmed day → confirmed time → confirmed format → queried calendar → presented options → confirmed selection → booked', 'Higher latency but near-perfect accuracy'],
  },
];
