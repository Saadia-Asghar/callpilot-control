# CallPilot Advanced Features Documentation

## Overview

CallPilot now includes advanced hackathon-ready features for production use:

1. **Missed Call Recovery Agent** - Automatic callback scheduling
2. **Industry Mode Presets** - Pre-configured business profiles
3. **Smart Intake + Structured Output** - Data collection and export
4. **Custom Script Option** - Operator-defined call flows
5. **Call Draft & Conversation Saving** - Draft management system
6. **Real-time Subscriptions** - Live updates via WebSocket
7. **Multi-operator Support** - Authentication and isolation

## Feature 1: Missed Call Recovery Agent

### Overview
Automatically detects missed calls and triggers callback scheduling using the AI agent.

### Endpoints

**POST** `/recovery/detect/{call_log_id}`
- Detect if a call was missed
- Marks call as "missed" if criteria met

**POST** `/recovery/trigger/{call_log_id}`
- Trigger recovery attempt for missed call
- Uses AI agent to schedule callback
- Returns recovery status

**GET** `/recovery/metrics`
- Get recovery metrics for dashboard
- Success rate, attempts, etc.

**POST** `/recovery/{recovery_id}/human_intervention`
- Request human intervention for failed recovery

### Usage Example

```python
# Detect missed call
response = requests.post(f"{API_URL}/recovery/detect/123")

# Trigger recovery
recovery = requests.post(f"{API_URL}/recovery/trigger/123")
# Returns: {"success": True, "callback_scheduled": True, ...}

# Get metrics
metrics = requests.get(f"{API_URL}/recovery/metrics")
# Returns: {"total_attempts": 10, "successful": 7, "success_rate": 70.0, ...}
```

## Feature 2: Industry Mode Presets

### Available Presets

1. **Clinic Mode** (`clinic`)
   - Triage questions
   - Urgency assessment
   - Insurance collection
   - 30-minute slots, 10-minute buffer

2. **Salon Mode** (`salon`)
   - Service type selection
   - Stylist preference
   - 60-minute slots, 5-minute buffer

3. **Tutor Mode** (`tutor`)
   - Subject selection
   - Level assessment
   - Topic focus
   - 60-minute slots

4. **University Office Mode** (`university`)
   - Appointment type
   - Document intake
   - Student ID collection
   - 30-minute slots

### Endpoints

**POST** `/operator/set_industry_preset`
- Set preset for operator
- Query param: `preset_name` (clinic, salon, tutor, university)

**GET** `/operator/current_preset`
- Get operator's current preset configuration

**GET** `/operator/presets`
- List all available presets

### Usage Example

```python
# Set clinic preset
requests.post(
    f"{API_URL}/operator/set_industry_preset",
    params={"preset_name": "clinic"},
    headers={"Authorization": f"Bearer {token}"}
)

# Get current preset
preset = requests.get(
    f"{API_URL}/operator/current_preset",
    headers={"Authorization": f"Bearer {token}"}
)
# Returns full preset configuration with flows and questions
```

## Feature 3: Smart Intake + Structured Output

### Overview
Collects structured data based on industry preset requirements and exports to various formats.

### Endpoints

**POST** `/intake/collect/{call_log_id}`
- Collect structured intake data
- Validates required fields
- Saves to call log

**GET** `/intake/structured/{call_log_id}`
- Get structured JSON output for call

**GET** `/intake/export/csv`
- Export calls to CSV format
- Query param: `call_log_ids` (comma-separated)

**GET** `/intake/export/crm/{call_log_id}`
- Export to CRM-friendly JSON
- Query param: `crm_format` (generic, salesforce, hubspot)

### Usage Example

```python
# Collect intake
intake = requests.post(
    f"{API_URL}/intake/collect/123",
    json={
        "preset_name": "clinic",
        "collected_responses": {
            "reason": "Annual checkup",
            "urgency": "No - routine",
            "insurance": "Blue Cross",
            "preferred_time": "2024-02-15T14:00:00"
        }
    },
    headers={"Authorization": f"Bearer {token}"}
)

# Export to CSV
csv_data = requests.get(
    f"{API_URL}/intake/export/csv",
    params={"call_log_ids": "123,124,125"},
    headers={"Authorization": f"Bearer {token}"}
)
```

## Feature 4: Custom Script Option

### Overview
Operators can define custom call scripts with conditional logic and branching.

### Script Structure

```json
{
  "steps": [
    {
      "type": "greeting",
      "message": "Hello! How can I help?"
    },
    {
      "type": "question",
      "question": "What service do you need?",
      "variable": "service_type",
      "required": true
    },
    {
      "type": "conditional",
      "condition": {
        "variable": "service_type",
        "value": "Salon"
      },
      "then": {
        "type": "question",
        "question": "Which stylist?",
        "variable": "stylist",
        "required": true
      }
    },
    {
      "type": "booking",
      "action": "schedule_appointment"
    }
  ]
}
```

### Endpoints

**POST** `/operator/custom_script/save`
- Save custom script
- Body: `name`, `script_flow`, `is_active`

**GET** `/operator/custom_script/load`
- Load script(s)
- Query param: `script_id` (optional)

**DELETE** `/operator/custom_script`
- Delete script
- Query param: `script_id`

### Usage Example

```python
# Save custom script
script = requests.post(
    f"{API_URL}/operator/custom_script/save",
    json={
        "name": "My Custom Flow",
        "script_flow": {
            "steps": [
                {"type": "question", "question": "What do you need?", "variable": "need"}
            ]
        },
        "is_active": True
    },
    headers={"Authorization": f"Bearer {token}"}
)

# Load active script
active = requests.get(
    f"{API_URL}/operator/custom_script/load",
    headers={"Authorization": f"Bearer {token}"}
)
```

## Feature 5: Call Draft & Conversation Saving

### Overview
Every call is saved as a draft, allowing operators to reopen, edit, and finalize.

### Endpoints

**POST** `/call/save_draft`
- Save or update draft
- Query param: `call_log_id`
- Body: draft data

**GET** `/call/draft/{call_log_id}`
- Get draft by ID

**GET** `/call/list_by_operator`
- List all calls for operator
- Query params: `limit`, `offset`, `include_drafts`

**PUT** `/call/draft/{call_log_id}/update`
- Update draft

**POST** `/call/draft/{call_log_id}/finalize`
- Finalize draft (mark as completed)

**POST** `/call/draft/{call_log_id}/reopen`
- Reopen finalized call as draft

### Usage Example

```python
# Save draft
draft = requests.post(
    f"{API_URL}/call/save_draft",
    params={"call_log_id": 123},
    json={
        "raw_transcript": "Full transcript...",
        "structured_intake": {"field": "value"},
        "call_outcome": "booked"
    },
    headers={"Authorization": f"Bearer {token}"}
)

# List drafts
drafts = requests.get(
    f"{API_URL}/call/list_by_operator",
    params={"include_drafts": True},
    headers={"Authorization": f"Bearer {token}"}
)

# Finalize
finalized = requests.post(
    f"{API_URL}/call/draft/123/finalize",
    params={"call_outcome": "booked"},
    headers={"Authorization": f"Bearer {token}"}
)
```

## Real-time Subscriptions

### WebSocket Endpoint

**WS** `/ws/subscribe/{subscription_id}`

Subscribe to live updates:
- `transcript` - Live transcript streaming
- `tool_calls` - Agent tool call events
- `missed_calls` - Missed call detections
- `recovery_activity` - Recovery attempts
- `call_status` - Call status changes

### Usage Example

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/subscribe/operator-123?types=transcript,tool_calls');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Event:', data.type, data.data);
    
    if (data.type === 'transcript') {
        // Handle transcript update
        updateTranscriptUI(data.data);
    }
    
    if (data.type === 'tool_calls') {
        // Handle tool call
        showToolCall(data.data);
    }
};
```

## Authentication & Multi-operator Support

### Endpoints

**POST** `/auth/register`
- Register new operator
- Body: `email`, `password`, `name`, `business_name`

**POST** `/auth/login`
- Login operator
- Body: `email`, `password`
- Returns: JWT token

**GET** `/auth/me`
- Get current operator info

### Usage Example

```python
# Register
register = requests.post(
    f"{API_URL}/auth/register",
    json={
        "email": "operator@example.com",
        "password": "secure_password",
        "name": "John Doe",
        "business_name": "My Business"
    }
)
token = register.json()["access_token"]

# Login
login = requests.post(
    f"{API_URL}/auth/login",
    json={
        "email": "operator@example.com",
        "password": "secure_password"
    }
)
token = login.json()["access_token"]

# Use token
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{API_URL}/auth/me", headers=headers)
```

## Database Models

### New Tables

- **operators** - Operator accounts with authentication
- **industry_presets** - Pre-configured industry flows
- **custom_scripts** - Operator-defined scripts
- **recovery_logs** - Recovery attempt tracking

### Updated Tables

- **call_logs** - Added fields:
  - `operator_id` - Operator who owns the call
  - `raw_transcript` - Full transcript text
  - `structured_intake` - Collected structured data
  - `agent_decisions` - Tool calls and decisions
  - `voice_persona_id` - Voice used
  - `call_outcome` - Final outcome
  - `is_draft` - Draft flag
  - `recovery_attempts` - Recovery count
  - `missed_call_detected` - Missed call flag
  - `industry_preset` - Preset used
  - `custom_script_id` - Custom script used

## Security

- JWT-based authentication
- Per-operator data isolation
- Password hashing with bcrypt
- Token expiration (30 days)

## Demo & Testing

All endpoints return structured JSON suitable for dashboard integration.

Mock data generators available for testing:
- Sample operators
- Sample calls
- Sample recovery attempts

## Next Steps

1. Configure ElevenLabs API key for voice features
2. Set up industry presets for your business
3. Create custom scripts if needed
4. Configure real-time subscriptions for live dashboard
5. Set up authentication for operators
