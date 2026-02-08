# Saved Voice Features - Complete ✅

## Overview
Enhanced CallPilot backend to allow saving and reusing cloned voices with demo mode limits.

---

## ✅ 1. Save Voice Clone

### Endpoint: `POST /voice/save`

**Input:**
```json
{
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "voice_name": "My Custom Voice",
  "audio_sample_paths": ["/path/to/sample1.mp3"],
  "cloned_voice_reference": "cv_abc123",
  "tone": 60,
  "speed": 50,
  "energy": 70,
  "stability": 0.5,
  "similarity_boost": 0.75,
  "style": 0.0,
  "is_demo": false
}
```

**Query Parameters:**
- `user_id` (optional): User ID
- `session_id` (optional): Session ID for demo users
- `operator` (optional): Authenticated operator

**Returns:**
```json
{
  "success": true,
  "saved_voice_id": "sv_abc123def456",
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "voice_name": "My Custom Voice",
  "is_demo": false,
  "expires_at": null,
  "ready_for_frontend": true
}
```

**Database Storage:**
- `saved_voice_id`: Unique ID for the saved voice
- `voice_id`: ElevenLabs voice ID
- `user_id`: User ID (optional)
- `operator_id`: Operator ID (optional)
- `session_id`: Session ID (for demo users)
- `creation_date`: Timestamp
- `parameters`: tone, speed, energy, stability, similarity_boost, style
- `is_demo`: Boolean flag for demo voices
- `expires_at`: Expiry timestamp for demo voices (24 hours)

---

## ✅ 2. List Saved Voices

### Endpoint: `GET /voice/list`

**Query Parameters:**
- `user_id` (optional): Filter by user ID
- `operator_id` (optional): Filter by operator ID
- `session_id` (optional): Filter by session ID
- `include_saved` (default: true): Include saved voices

**Returns:**
```json
{
  "voices": [...],  // Default ElevenLabs voices
  "cloned_voices": [...],  // Cloned voices from ElevenLabs
  "saved_voices": [
    {
      "saved_voice_id": "sv_abc123def456",
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "voice_name": "My Custom Voice",
      "tone": 60,
      "speed": 50,
      "energy": 70,
      "stability": 0.5,
      "similarity_boost": 0.75,
      "style": 0.0,
      "is_demo": false,
      "created_at": "2026-02-08T10:00:00Z",
      "expires_at": null
    }
  ],
  "saved_voices_count": 1,
  "ready_for_frontend": true
}
```

### Endpoint: `GET /voice/saved`

**Query Parameters:**
- `user_id` (optional)
- `session_id` (optional)
- `operator` (optional): Authenticated operator

**Returns:**
```json
{
  "saved_voices": [...],
  "count": 1,
  "ready_for_frontend": true
}
```

---

## ✅ 3. Apply Saved Voice to Scripts

### Endpoint: `POST /voice/apply_to_script`

**Input:**
```json
{
  "script_text": "Hello, how can I help you today?",
  "saved_voice_id": "sv_abc123def456"
}
```

**Query Parameters:**
- `user_id` (optional)
- `session_id` (optional)
- `operator` (optional): Authenticated operator

**Returns:**
```json
{
  "success": true,
  "saved_voice_id": "sv_abc123def456",
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "voice_name": "My Custom Voice",
  "tts_audio_url": "/voice/tts/audio/sv_abc123def456",
  "script_text": "Hello, how can I help you today?",
  "parameters": {
    "tone": 60,
    "speed": 50,
    "energy": 70,
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0
  },
  "ready_for_frontend": true
}
```

### Integration with Call Drafts

**Endpoint: `POST /call/save_draft`**

When saving a draft, you can provide `saved_voice_id`:

```json
{
  "raw_transcript": "Full transcript text...",
  "saved_voice_id": "sv_abc123def456",
  "structured_intake": {...},
  "call_outcome": "booked"
}
```

**Response includes:**
```json
{
  "success": true,
  "call_log_id": 123,
  "tts_audio_url": "/voice/tts/audio/sv_abc123def456",
  "saved_voice_applied": true,
  ...
}
```

### Integration with Custom Scripts

**Endpoint: `POST /operator/custom_script/save`**

When saving a custom script, you can provide `saved_voice_id`:

```json
{
  "name": "My Custom Flow",
  "script_flow": {
    "steps": [
      {"type": "question", "question": "What do you need?", "id": "step1"}
    ]
  },
  "saved_voice_id": "sv_abc123def456"
}
```

**Response includes:**
```json
{
  "success": true,
  "script_id": 456,
  "tts_audio_urls": {
    "step1": "/voice/tts/audio/sv_abc123def456"
  },
  "saved_voice_applied": true,
  ...
}
```

---

## ✅ 4. Demo Mode Limits

### Demo User Restrictions

1. **Only 1 Temporary Voice Clone**
   - Demo users can save maximum 1 temporary voice clone
   - Additional saves will raise error: "Demo users can only save 1 temporary voice clone"

2. **Max 3 Demo Tries**
   - Each voice clone save counts as 1 demo try
   - Enforced via `demo_usage_service`
   - Returns error if limit exceeded

3. **Temporary Voice Deletion**
   - Demo voices expire after 24 hours
   - Automatically marked as inactive after expiry
   - Cleanup endpoint: `POST /voice/cleanup_demo`

### Demo Voice Expiry

- Demo voices have `expires_at` timestamp (24 hours from creation)
- Expired voices are automatically filtered out in list queries
- Can be manually cleaned up via cleanup endpoint

### Endpoint: `POST /voice/cleanup_demo`

Cleans up expired demo voices.

**Returns:**
```json
{
  "success": true,
  "cleaned_up_count": 5,
  "message": "Cleaned up 5 expired demo voices",
  "ready_for_frontend": true
}
```

---

## 📊 Database Model

### SavedVoice Model

```python
class SavedVoice(Base):
    saved_voice_id: String (unique, indexed)
    voice_id: String (ElevenLabs voice ID)
    voice_name: String
    user_id: Integer (optional, FK to users)
    operator_id: Integer (optional, FK to operators)
    session_id: String (optional, indexed, for demo users)
    audio_sample_paths: JSON (optional)
    cloned_voice_reference: String (optional)
    tone: Integer (0-100)
    speed: Integer (0-100)
    energy: Integer (0-100)
    stability: Float (0.0-1.0)
    similarity_boost: Float (0.0-1.0)
    style: Float (0.0-1.0)
    is_demo: Boolean
    is_active: Boolean
    created_at: DateTime
    updated_at: DateTime
    expires_at: DateTime (optional, for demo voices)
```

---

## 🚀 Usage Examples

### Save a Voice Clone

```bash
curl -X POST "http://localhost:8000/voice/save" \
  -H "Content-Type: application/json" \
  -d '{
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "voice_name": "My Professional Voice",
    "tone": 60,
    "speed": 50,
    "energy": 70
  }' \
  -H "Authorization: Bearer TOKEN"
```

### List Saved Voices

```bash
curl "http://localhost:8000/voice/saved?user_id=123" \
  -H "Authorization: Bearer TOKEN"
```

### Apply to Script

```bash
curl -X POST "http://localhost:8000/voice/apply_to_script" \
  -H "Content-Type: application/json" \
  -d '{
    "script_text": "Hello, welcome to our service!",
    "saved_voice_id": "sv_abc123def456"
  }' \
  -H "Authorization: Bearer TOKEN"
```

### Save Draft with Saved Voice

```bash
curl -X POST "http://localhost:8000/call/save_draft?call_log_id=123" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_transcript": "Full transcript...",
    "saved_voice_id": "sv_abc123def456"
  }' \
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Status: COMPLETE

All features implemented:
- ✅ Save voice clone endpoint
- ✅ List saved voices endpoint
- ✅ Apply saved voice to scripts
- ✅ Integration with call drafts
- ✅ Integration with custom scripts
- ✅ Demo mode limits (1 voice, 3 tries, 24h expiry)
- ✅ Automatic cleanup of expired demo voices
- ✅ Per-user/operator/session isolation
- ✅ Structured JSON responses for frontend

The backend is fully ready for saving and reusing cloned voices with complete demo mode support!
