# CallPilot Extensions

This document describes the extensions added to the CallPilot MVP.

## New Features

### 1. Google Calendar Integration (`calendar_integration.py`)

- **Mock Mode**: Default mode that stores events in memory for testing
- **Real API Mode**: Ready for Google Calendar API integration (requires OAuth setup)
- **Endpoints**:
  - `POST /calendar/sync` - Sync bookings with Google Calendar
  - `GET /calendar/events` - Get calendar events in a date range

**Usage:**
```python
from calendar_integration import calendar_service

# Create event (mock mode)
result = calendar_service.create_event(
    summary="Appointment - John Doe",
    start_datetime=datetime(2024, 2, 12, 14, 0),
    description="Consultation"
)
```

### 2. Web Interface (`static/index.html`)

A modern, responsive web interface for testing the API:
- Real-time chat with the agent
- Quick action buttons for common requests
- Tool call visualization
- Connection status indicator
- Beautiful gradient UI

**Access**: `http://localhost:8000/`

### 3. WebSocket Support

Real-time bidirectional communication for voice interactions:
- `WS /ws/{session_id}` - WebSocket endpoint
- Connection management with session tracking
- Real-time message processing

**Usage:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session-123');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Response:', data.response);
};
ws.send('I need to schedule an appointment');
```

### 4. Logging System (`logging_config.py`)

Comprehensive logging for debugging and monitoring:
- Console and file logging
- Daily log files in `logs/` directory
- Structured log format with timestamps
- Module-specific loggers

**Usage:**
```python
from logging_config import get_logger

logger = get_logger("my_module")
logger.info("Application started")
logger.error("Something went wrong")
```

### 5. Enhanced Error Handling

- Better input validation with Pydantic models
- Improved error messages
- Graceful error recovery in agent responses
- HTTP status codes for different error types

## Updated Files

- `main.py` - Added calendar endpoints, WebSocket support, root endpoint
- `requirements.txt` - Added `websockets` dependency
- `README.md` - Updated with new features and endpoints

## New Files

- `calendar_integration.py` - Google Calendar integration module
- `logging_config.py` - Logging configuration
- `static/index.html` - Web interface
- `EXTENSIONS.md` - This file

## Testing the Extensions

1. **Web Interface**: Start server and visit `http://localhost:8000/`
2. **Calendar Sync**: `POST /calendar/sync` with booking_id or empty body
3. **WebSocket**: Connect to `ws://localhost:8000/ws/test-session`
4. **Logs**: Check `logs/callpilot_YYYYMMDD.log` files

## Next Steps

To enable real Google Calendar integration:
1. Set up Google Cloud project
2. Enable Calendar API
3. Configure OAuth credentials
4. Update `calendar_integration.py` with credentials
5. Set `use_mock=False` in CalendarService initialization
