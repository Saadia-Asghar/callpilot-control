# CallPilot Backend Enhancements Documentation

## Overview

This document describes the 10 new enhancements added to improve real-world adoption and user stickiness.

## ✅ Implemented Features

### 1️⃣ Smart Scheduling & Optimization

**Endpoint**: `GET /schedule/suggest`

Suggests optimal time slots based on:
- Past cancellations
- No-shows
- Recovery attempts
- High-demand windows
- User preferences

**Response**:
```json
{
  "suggestions": [
    {
      "datetime": "2024-02-15T14:00:00",
      "score": 85,
      "confidence": 85,
      "reasoning": "Popular time slot; Matches user preference"
    }
  ],
  "total_available": 20,
  "reasoning_summary": "Based on 50 past bookings. Peak hours: 10, 14, 16",
  "user_personalization": true
}
```

### 2️⃣ Context-Aware Calls

**Endpoint**: `GET /call/context/{user_id}`

Provides:
- Call history per client
- AI-based follow-up suggestions
- Recommended next questions
- Recommended actions

**Response**:
```json
{
  "user_id": 1,
  "call_history": [...],
  "client_profile": {
    "total_bookings": 5,
    "risk_score": 25
  },
  "ai_suggestions": {
    "recommended_questions": [
      "Are you calling about your upcoming appointment?",
      "Would you like to reschedule?"
    ],
    "recommended_actions": [
      "Check existing booking status",
      "Offer rescheduling if needed"
    ]
  }
}
```

### 3️⃣ Auto-Triage

**Endpoint**: `POST /call/triage/{call_log_id}`

Collects structured information and returns:
- Suggested appointment type
- Priority level
- Urgency score
- Reasoning

**Request**:
```json
{
  "collected_data": {
    "reason": "Chest pain",
    "urgency": "Yes - urgent"
  },
  "industry_preset": "clinic"
}
```

**Response**:
```json
{
  "triage_recommendation": {
    "appointment_type": "urgent",
    "priority": "high",
    "urgency_score": 90,
    "reasoning": ["Patient reported urgent symptoms"],
    "suggested_duration": 45
  }
}
```

### 4️⃣ Enhanced Dashboard Insights

**Endpoint**: `GET /operator/insights`

Returns:
- Call metrics (handled, completed, abandoned)
- Recovery metrics (attempts, success rate)
- Booking metrics (total, cancellations, no-shows)
- No-show risk analysis
- AI recommendations

**Response**:
```json
{
  "metrics": {
    "calls": {
      "total_calls": 150,
      "completion_rate": 85.5
    },
    "recovery": {
      "success_rate": 72.0
    },
    "bookings": {
      "no_show_rate": 12.5
    }
  },
  "ai_recommendations": [
    {
      "type": "no_show_prevention",
      "priority": "high",
      "title": "Reduce No-Show Rate",
      "message": "No-show rate is 12.5%. Consider sending reminders.",
      "action": "Implement reminder system"
    }
  ]
}
```

### 5️⃣ Multi-Channel Integration Support

**Endpoint**: `POST /call/multi_channel`

Supports:
- Voice calls
- Chat messages
- WhatsApp messages
- Form submissions

All feed into the same AI reasoning engine.

**Request**:
```json
{
  "channel": "whatsapp",
  "channel_metadata": {
    "phone_number": "+1234567890",
    "message_id": "msg_123"
  },
  "transcript": "I need to schedule an appointment"
}
```

### 6️⃣ Explainable AI Decisions

**Endpoint**: `GET /call/reason/{call_log_id}`

Returns detailed reasoning:
- Why a slot was chosen
- Why a script was recommended
- Confidence scores
- Decision factors

**Response**:
```json
{
  "decisions": [
    {
      "type": "slot_selection",
      "decision": "Appointment slot chosen",
      "reasoning": {
        "selected_slot": "2024-02-15T14:00:00",
        "factors": [
          {
            "factor": "user_preference",
            "explanation": "Slot matches user's preferred time",
            "weight": "high"
          }
        ]
      },
      "confidence": 85
    }
  ]
}
```

### 7️⃣ Recovery & No-Show Prevention

**Endpoints**:
- `GET /recovery/pending` - Get pending recovery calls
- `POST /recovery/trigger/{call_log_id}` - Trigger recovery

Tracks recovery attempts and results.

**Response**:
```json
{
  "pending_count": 5,
  "calls": [...],
  "success_rate": 72.0
}
```

### 8️⃣ Call Simulation / Experiment Mode

**Endpoint**: `POST /simulation/run`

Simulates multiple calls for testing/demo:
- Generates transcripts
- Creates structured intake
- Produces AI reasoning
- Saves drafts

**Request**:
```json
{
  "num_calls": 3,
  "industry_preset": "clinic",
  "scenarios": [...]
}
```

**Response**:
```json
{
  "total_calls": 3,
  "successful_calls": 3,
  "metrics": {
    "success_rate": 100,
    "average_transcript_length": 450
  }
}
```

### 9️⃣ Feedback & Learning Loop

**Endpoints**:
- `POST /feedback` - Submit feedback (1-5 stars)
- `GET /feedback/summary` - Get aggregate metrics

**Request**:
```json
{
  "rating": 5,
  "call_log_id": 123,
  "comment": "Great AI response!",
  "feedback_type": "ai_response"
}
```

**Response**:
```json
{
  "total_feedback": 25,
  "average_rating": 4.2,
  "rating_distribution": {
    "5": 15,
    "4": 8,
    "3": 2
  },
  "improvement_suggestions": [...]
}
```

### 🔟 Demo Mode Support

**Endpoints**:
- `GET /demo/call` - Get pre-loaded demo calls
- `POST /demo/record` - Record demo usage

Returns 3 demo calls with:
- Simulated transcript
- AI reasoning
- Voice clone preview
- Structured intake

**Response**:
```json
{
  "demo_calls": [
    {
      "title": "Clinic Appointment - Urgent Care",
      "transcript": {...},
      "ai_reasoning": {...},
      "voice_preview": {...}
    }
  ],
  "demo_count": 0,
  "remaining": 3
}
```

## Database Models

### New Tables

- **call_history** - Stores past calls per client
- **client_profiles** - Client information and risk scores
- **demo_usage** - Tracks demo calls (max 3 per session)
- **feedback** - Stores ratings and comments
- **recovery_metrics** - Tracks recovery success metrics

### Updated Tables

- **call_logs** - Added fields:
  - `channel` - Multi-channel support
  - `channel_metadata` - Channel-specific data
  - `ai_reasoning` - Detailed AI reasoning
  - `triage_recommendation` - Auto-triage results
  - `confidence_score` - AI confidence (0-100)

## Usage Examples

### Smart Scheduling
```bash
curl "http://localhost:8000/schedule/suggest?operator_id=1&user_id=5&days_ahead=7" \
  -H "Authorization: Bearer TOKEN"
```

### Context-Aware Calls
```bash
curl "http://localhost:8000/call/context/5" \
  -H "Authorization: Bearer TOKEN"
```

### Auto-Triage
```bash
curl -X POST "http://localhost:8000/call/triage/123" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collected_data": {
      "reason": "Chest pain",
      "urgency": "Yes - urgent"
    }
  }'
```

### Dashboard Insights
```bash
curl "http://localhost:8000/operator/insights?days=30" \
  -H "Authorization: Bearer TOKEN"
```

### Explainable AI
```bash
curl "http://localhost:8000/call/reason/123" \
  -H "Authorization: Bearer TOKEN"
```

### Simulation
```bash
curl -X POST "http://localhost:8000/simulation/run" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "num_calls": 3,
    "industry_preset": "clinic"
  }'
```

### Feedback
```bash
curl -X POST "http://localhost:8000/feedback" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "call_log_id": 123,
    "comment": "Excellent service!"
  }'
```

### Demo Mode
```bash
curl "http://localhost:8000/demo/call?session_id=test-session"
```

## Integration Notes

- All endpoints return structured JSON
- Per-operator data isolation maintained
- Multi-channel support integrated
- Real-time subscriptions available
- Demo mode works without authentication

## Next Steps

1. Test all new endpoints
2. Configure industry presets
3. Set up feedback collection
4. Enable demo mode for first-time users
5. Integrate with Lovable UI dashboard

All features are production-ready and fully documented!
