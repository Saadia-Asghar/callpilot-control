# CallPilot — Agentic Voice AI for Autonomous Appointment Scheduling

A production-style hackathon MVP for an autonomous appointment scheduling system powered by LLM agents with tool/function calling capabilities.

## Features

- 🤖 **LLM-Powered Agent**: Autonomous scheduling agent using OpenAI or Gemini with function calling
- 📅 **Smart Scheduling**: Business hours management, conflict detection, and alternative slot suggestions
- 🗄️ **SQLite Database**: Persistent storage for users, bookings, preferences, and call logs
- 🎤 **Voice Integration Hooks**: Placeholder functions for ElevenLabs TTS and Whisper STT
- 📊 **Call Summaries**: Structured JSON and human-readable summaries after each call
- 🔧 **Tool Functions**: Agent can call availability checks, booking, rescheduling, and preference management
- 📅 **Google Calendar Integration**: Sync appointments with Google Calendar (with mock mode)
- 🌐 **Web Interface**: Simple HTML frontend for testing and interaction
- 🔌 **WebSocket Support**: Real-time communication for voice interactions
- 📝 **Logging**: Comprehensive logging system for debugging and monitoring

## Tech Stack

- **Backend**: FastAPI
- **LLM**: OpenAI GPT-4 or Google Gemini (with function calling)
- **Database**: SQLite with SQLAlchemy ORM
- **Voice**: Placeholder hooks for ElevenLabs (TTS) and Whisper (STT)

## Project Structure

```
.
├── main.py              # FastAPI application and endpoints
├── agent.py             # Conversation agent with LLM integration
├── tools.py             # Tool functions for agent to call
├── scheduling.py        # Scheduling logic and availability management
├── models.py            # Database models (Users, Bookings, Preferences, etc.)
├── database.py          # Database setup and session management
├── voice_hooks.py       # Voice integration placeholders
├── summary.py           # Call summary generator
├── config.py            # Configuration management
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
└── README.md            # This file
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Setup Script (Recommended)

The setup script will:
- Create `.env` file from `.env.example` if it doesn't exist
- Validate API keys
- Initialize database
- Create sample data for testing

```bash
python setup.py
```

### 3. Configure Environment Variables

If you didn't use the setup script, manually configure:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
LLM_PROVIDER=openai  # or "gemini"
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here  # if using Gemini

# Business Configuration
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=17:00
SLOT_DURATION_MINUTES=30
TIMEZONE=America/New_York
```

### 4. Validate Configuration (Optional)

Quick validation check:

```bash
python validate_config.py
```

### 5. Run the Application

```bash
python main.py
```

Or use the start script:

```bash
python start.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

## API Endpoints

### Voice & Agent

- `POST /voice/input` - Accept text transcript and return agent response
- `POST /agent/respond` - Process message and return agent response with tool actions

### Bookings

- `POST /booking/create` - Create a new appointment booking
- `POST /booking/reschedule` - Reschedule an existing booking

### Calendar

- `GET /calendar/day?day=2024-02-10` - Get available slots for a day
- `POST /calendar/sync` - Sync bookings with Google Calendar
- `GET /calendar/events?start=2024-02-10&end=2024-02-17` - Get calendar events in date range

### Call Management

- `GET /call/logs` - Get call logs (optional filters: session_id, user_id)
- `GET /call/summary/{call_log_id}` - Get comprehensive call summary

### WebSocket

- `WS /ws/{session_id}` - WebSocket endpoint for real-time communication

### Health

- `GET /health` - Health check endpoint

### Web Interface

- `GET /` - Web-based chat interface for testing

## Usage Examples

### Example 1: Voice Input (Simulated STT)

```bash
curl -X POST "http://localhost:8000/voice/input" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hi, I need to schedule an appointment for next Monday at 2pm",
    "session_id": "test-session-123"
  }'
```

### Example 2: Create Booking Directly

```bash
curl -X POST "http://localhost:8000/booking/create" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "appointment_datetime": "2024-02-12T14:00:00-05:00",
    "reason": "Consultation"
  }'
```

### Example 3: Get Available Slots

```bash
curl "http://localhost:8000/calendar/day?day=2024-02-10"
```

### Example 4: Get Call Summary

```bash
curl "http://localhost:8000/call/summary/1"
```

## Agent System Prompt

The agent is configured with a system prompt that defines:
- Autonomous scheduling capabilities
- Mandatory availability verification before booking
- Never inventing time slots
- Always confirming before booking
- Graceful negotiation for unavailable slots

See `agent.py` for the full system prompt.

## Tool Functions

The agent can call these tools:

1. **check_availability** - Verify if a time slot is available
2. **get_free_slots** - Get all available slots for a day
3. **book_appointment** - Book an appointment (checks availability first)
4. **reschedule_appointment** - Reschedule existing booking
5. **cancel_appointment** - Cancel a booking
6. **save_user_preference** - Save user preferences
7. **get_user_preferences** - Retrieve user preferences

## Voice Integration

The system includes placeholder functions in `voice_hooks.py`:

- `text_to_speech(text)` - Placeholder for ElevenLabs integration
- `speech_to_text(audio_data)` - Placeholder for Whisper integration

To integrate:
1. Uncomment and configure the API calls in `voice_hooks.py`
2. Add your API keys to `.env`
3. Update the `/voice/input` endpoint to accept audio bytes

## Google Calendar Integration

The system includes Google Calendar integration with a mock mode for testing:

- **Mock Mode (Default)**: Stores events in memory for testing
- **Real API Mode**: Requires Google Calendar API credentials and OAuth setup

To enable real Google Calendar integration:
1. Set up Google Cloud project and enable Calendar API
2. Configure OAuth credentials
3. Update `calendar_integration.py` with your credentials
4. Set `use_mock=False` in the CalendarService initialization

## Web Interface

A simple HTML frontend is included at `static/index.html`. Access it at:
- `http://localhost:8000/` - Web chat interface

Features:
- Real-time chat with the agent
- Quick action buttons for common requests
- Tool call visualization
- Connection status indicator

## WebSocket Support

Real-time communication is available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session-123');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Response:', data.response);
};
ws.send('I need to schedule an appointment');
```

## Database Models

- **Users**: User information (name, phone, email)
- **Bookings**: Appointment bookings with datetime and status
- **Preferences**: User preferences (key-value pairs)
- **CallLogs**: Call session tracking
- **Transcripts**: Conversation transcripts with role and metadata

## Scheduling Logic

- Business hours: Configurable start/end times
- Slot duration: Configurable (default 30 minutes)
- Weekday-only: Only Monday-Friday slots
- Conflict detection: Prevents double-booking
- Alternative suggestions: Suggests nearby available slots

## Call Summaries

After each call, the system generates:
- **Structured JSON**: Machine-readable summary with bookings, tool calls, outcomes
- **Human-readable**: Formatted text summary
- **Transcript**: Full conversation log

## Development Notes

- The system uses SQLite for simplicity but can be easily switched to PostgreSQL
- Voice hooks are placeholders - integrate with actual services for production
- Google Calendar integration can be added using the Google Calendar API
- The agent supports both OpenAI and Gemini - configure via environment variables

## License

MIT License - Hackathon MVP
