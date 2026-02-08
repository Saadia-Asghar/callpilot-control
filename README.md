# CallPilot — Agentic Voice AI for Autonomous Appointment Scheduling

A production-style hackathon MVP for an autonomous appointment scheduling system powered by LLM agents with tool/function calling capabilities.

## Project Structure

This repository contains both the **backend API** (Python/FastAPI) and **frontend dashboard** (React/TypeScript).

### Backend (Python/FastAPI)
- 🤖 **LLM-Powered Agent**: Autonomous scheduling agent using OpenAI or Gemini with function calling
- 📅 **Smart Scheduling**: Business hours management, conflict detection, and AI-optimized slot suggestions
- 🗄️ **SQLite Database**: Persistent storage for users, bookings, preferences, and call logs
- 🎤 **Voice Integration**: ElevenLabs TTS with voice cloning and dynamic persona support
- 📊 **Call Summaries**: Structured JSON and human-readable summaries after each call
- 🔧 **Tool Functions**: Agent can call availability checks, booking, rescheduling, and preference management
- 📅 **Google Calendar Integration**: Sync appointments with Google Calendar (with mock mode)
- 🌐 **Web Interface**: Simple HTML frontend for testing and interaction
- 🔌 **WebSocket Support**: Real-time communication for voice interactions
- 📝 **Logging**: Comprehensive logging system for debugging and monitoring

### Advanced Features (New!)
- 🎯 **Smart Scheduling Optimization**: AI-powered slot suggestions based on historical patterns
- 🧠 **Context-Aware Calls**: Call history tracking and AI follow-up suggestions
- 🏥 **Auto-Triage**: Structured intake with AI appointment type/priority recommendations
- 📈 **Dashboard Insights**: Comprehensive metrics and AI efficiency recommendations
- 📱 **Multi-Channel Support**: Voice, chat, WhatsApp, and form submissions
- 🔍 **Explainable AI**: Detailed reasoning for all AI decisions
- 🔄 **Recovery & No-Show Prevention**: Automated recovery tracking and prevention
- 🧪 **Call Simulation**: Test and demo mode with simulated calls
- ⭐ **Feedback Loop**: Rate AI responses and track improvement metrics
- 🎬 **Demo Mode**: Pre-loaded demo calls for first-time users (max 3)

### Frontend (React/TypeScript)
- Modern dashboard built with Vite, React, TypeScript, and shadcn-ui
- Real-time call monitoring and management
- Calendar view for appointments
- Agent settings and configuration
- Call logs and analytics

## Tech Stack

### Backend
- **Framework**: FastAPI
- **LLM**: OpenAI GPT-4 or Google Gemini (with function calling)
- **Database**: SQLite with SQLAlchemy ORM
- **Voice**: Placeholder hooks for ElevenLabs (TTS) and Whisper (STT)

### Frontend
- **Framework**: Vite + React + TypeScript
- **UI**: shadcn-ui + Tailwind CSS
- **State Management**: React Hooks

## Quick Start

### Backend Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run setup script:**
```bash
python setup.py
```

3. **Configure environment variables** (`.env`):
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=17:00
SLOT_DURATION_MINUTES=30
TIMEZONE=America/New_York
```

4. **Start the backend server:**
```bash
python main.py
# or
python start.py
```

Backend API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173` (or the port shown in terminal)

## Backend API Endpoints

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

### Voice Input (Simulated STT)
```bash
curl -X POST "http://localhost:8000/voice/input" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hi, I need to schedule an appointment for next Monday at 2pm",
    "session_id": "test-session-123"
  }'
```

### Create Booking
```bash
curl -X POST "http://localhost:8000/booking/create" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "appointment_datetime": "2024-02-12T14:00:00-05:00",
    "reason": "Consultation"
  }'
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

## Development

### Backend Development
- See `QUICKSTART.md` for detailed backend setup
- See `EXTENSIONS.md` for advanced features
- Run `python validate_config.py` to check configuration

### Frontend Development
- Edit files in `src/` directory
- Components use shadcn-ui for consistent styling
- Hot reload is enabled in development mode

## Deployment

### Backend
The FastAPI backend can be deployed to any platform supporting Python:
- Railway
- Render
- Heroku
- AWS/GCP/Azure

### Frontend
Deploy via Lovable or any static hosting:
- Vercel
- Netlify
- GitHub Pages

Or use Lovable's built-in deployment:
1. Open [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
2. Click Share -> Publish

## License

MIT License - Hackathon MVP
