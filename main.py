"""
Main FastAPI application for CallPilot.
"""
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import json

from database import get_db, init_db
from agent import conversation_agent
from voice_hooks import process_voice_input, generate_voice_response
from summary import summary_generator
from models import CallLog, User, Booking, Transcript
from scheduling import scheduling_service
from calendar_integration import calendar_service
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

# Initialize FastAPI app
app = FastAPI(
    title="CallPilot API",
    description="Agentic Voice AI for Autonomous Appointment Scheduling",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    logger.info("Starting CallPilot API...")
    
    # Validate API keys
    errors, warnings = settings.validate_api_keys()
    if errors:
        logger.error("API key validation failed:")
        for error in errors:
            logger.error(f"  - {error}")
        logger.error("Please configure your API keys in .env file")
        logger.error("Run 'python setup.py' to validate configuration")
        # Don't exit - allow server to start but agent will fail gracefully
    
    # Initialize database
    try:
        init_db()
        logger.info("✓ Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise
    
    # Log service status
    logger.info(f"Calendar service: {'Mock mode' if calendar_service.use_mock else 'Google Calendar API'}")
    logger.info(f"LLM Provider: {settings.llm_provider}")
    
    # Test agent initialization
    try:
        # This will fail if API keys are invalid, but we catch it
        logger.info("Testing agent initialization...")
        # Agent is initialized at module level, so this is just a check
        logger.info("✓ Agent ready")
    except Exception as e:
        logger.warning(f"Agent initialization warning: {str(e)}")
        logger.warning("Agent may not work properly without valid API keys")


# Pydantic models for request/response
class VoiceInputRequest(BaseModel):
    """Request model for voice input."""
    transcript: str  # Simulated STT - in production, this would be audio bytes
    session_id: Optional[str] = None
    user_id: Optional[int] = None


class AgentResponse(BaseModel):
    """Response model for agent."""
    response: str
    tool_calls: List[Dict[str, Any]] = []
    session_id: str
    audio_response: Optional[Dict[str, Any]] = None


class BookingCreateRequest(BaseModel):
    """Request model for creating booking."""
    user_id: int
    appointment_datetime: str  # ISO format
    reason: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": 1,
                "appointment_datetime": "2024-02-12T14:00:00-05:00",
                "reason": "Consultation"
            }
        }


class BookingRescheduleRequest(BaseModel):
    """Request model for rescheduling booking."""
    booking_id: int
    new_datetime: str  # ISO format


class CalendarDayRequest(BaseModel):
    """Request model for getting calendar day."""
    day: str  # ISO format date


# API Endpoints

@app.post("/voice/input", response_model=AgentResponse)
async def voice_input(
    request: VoiceInputRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Accept voice input (text transcript) and return agent response.
    
    In production, this would accept audio bytes and use speech_to_text.
    """
    logger.info(f"Voice input received: session_id={request.session_id}, transcript_length={len(request.transcript)}")
    # Get or create call log
    call_log = None
    if request.session_id:
        call_log = db.query(CallLog).filter(CallLog.session_id == request.session_id).first()
    
    if not call_log:
        session_id = request.session_id or str(uuid.uuid4())
        call_log = CallLog(
            session_id=session_id,
            user_id=request.user_id,
            status="active"
        )
        db.add(call_log)
        db.commit()
        db.refresh(call_log)
    
    # Process message with agent
    conversation_history = []
    # Load previous conversation from transcripts
    previous_transcripts = db.query(Transcript).filter(
        Transcript.call_log_id == call_log.id
    ).order_by(Transcript.timestamp).all()
    
    for transcript in previous_transcripts:
        conversation_history.append({
            "role": transcript.role,
            "content": transcript.content
        })
    
    result = conversation_agent.process_message(
        message=request.transcript,
        db=db,
        conversation_history=conversation_history,
        user_id=request.user_id or call_log.user_id,
        call_log_id=call_log.id
    )
    
    # Generate voice response (placeholder)
    audio_response = generate_voice_response(result["response"])
    
    return AgentResponse(
        response=result["response"],
        tool_calls=result["tool_calls"],
        session_id=call_log.session_id,
        audio_response=audio_response
    )


@app.post("/agent/respond", response_model=AgentResponse)
async def agent_respond(
    request: VoiceInputRequest,
    db: Session = Depends(get_db)
):
    """
    Process a message and return agent response with tool actions.
    Similar to /voice/input but more explicit for agent interactions.
    """
    return await voice_input(request, BackgroundTasks(), db)


@app.post("/booking/create")
async def create_booking(
    request: BookingCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new booking."""
    try:
        appointment_dt = datetime.fromisoformat(request.appointment_datetime.replace("Z", "+00:00"))
        
        # Check availability
        if not scheduling_service.check_availability(db, appointment_dt):
            raise HTTPException(
                status_code=400,
                detail="Time slot not available"
            )
        
        # Verify user exists
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create booking
        booking = Booking(
            user_id=request.user_id,
            appointment_datetime=appointment_dt,
            reason=request.reason,
            status="confirmed"
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        
        return {
            "success": True,
            "booking_id": booking.id,
            "appointment_datetime": booking.appointment_datetime.isoformat(),
            "status": booking.status
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/booking/reschedule")
async def reschedule_booking(
    request: BookingRescheduleRequest,
    db: Session = Depends(get_db)
):
    """Reschedule an existing booking."""
    try:
        booking = db.query(Booking).filter(Booking.id == request.booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        new_dt = datetime.fromisoformat(request.new_datetime.replace("Z", "+00:00"))
        
        # Check availability
        if not scheduling_service.check_availability(db, new_dt):
            alternatives = scheduling_service.suggest_alternative_slots(db, new_dt)
            raise HTTPException(
                status_code=400,
                detail="New time slot not available",
                headers={"X-Alternative-Slots": str(alternatives)}
            )
        
        booking.appointment_datetime = new_dt
        booking.status = "rescheduled"
        db.commit()
        
        return {
            "success": True,
            "booking_id": booking.id,
            "new_datetime": booking.appointment_datetime.isoformat(),
            "status": booking.status
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/calendar/day")
async def get_calendar_day(
    day: str,
    db: Session = Depends(get_db)
):
    """Get available slots for a specific day."""
    try:
        day_dt = datetime.fromisoformat(day.replace("Z", "+00:00"))
        slots = scheduling_service.get_free_slots(db, day_dt)
        
        return {
            "day": day,
            "available_slots": [s.isoformat() for s in slots],
            "count": len(slots)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")


@app.get("/call/logs")
async def get_call_logs(
    session_id: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get call logs with optional filtering."""
    query = db.query(CallLog)
    
    if session_id:
        query = query.filter(CallLog.session_id == session_id)
    if user_id:
        query = query.filter(CallLog.user_id == user_id)
    
    logs = query.order_by(CallLog.started_at.desc()).limit(limit).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "session_id": log.session_id,
                "user_id": log.user_id,
                "started_at": log.started_at.isoformat(),
                "ended_at": log.ended_at.isoformat() if log.ended_at else None,
                "status": log.status,
                "summary": log.summary
            }
            for log in logs
        ],
        "count": len(logs)
    }


@app.get("/call/summary/{call_log_id}")
async def get_call_summary(
    call_log_id: int,
    db: Session = Depends(get_db)
):
    """Get comprehensive summary for a call."""
    summary = summary_generator.generate_summary(db, call_log_id)
    
    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary["error"])
    
    return summary


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "CallPilot API"}


# Calendar Integration Endpoints

@app.post("/calendar/sync")
async def sync_calendar(
    booking_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Sync bookings with Google Calendar."""
    if booking_id:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        user = db.query(User).filter(User.id == booking.user_id).first()
        result = calendar_service.create_event(
            summary=f"Appointment - {user.name if user else 'Guest'}",
            start_datetime=booking.appointment_datetime,
            description=booking.reason
        )
        
        if result.get("success"):
            # Store calendar event ID in booking metadata if needed
            return result
        else:
            raise HTTPException(status_code=500, detail="Failed to create calendar event")
    else:
        # Sync all confirmed bookings
        bookings = db.query(Booking).filter(Booking.status == "confirmed").all()
        booking_dicts = [
            {
                "id": b.id,
                "appointment_datetime": b.appointment_datetime.isoformat(),
                "reason": b.reason,
                "status": b.status,
                "name": db.query(User).filter(User.id == b.user_id).first().name if b.user_id else "Guest"
            }
            for b in bookings
        ]
        result = calendar_service.sync_with_bookings(booking_dicts)
        return result


@app.get("/calendar/events")
async def get_calendar_events(
    start: str,
    end: str,
    db: Session = Depends(get_db)
):
    """Get calendar events in a date range."""
    try:
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
        
        events = calendar_service.get_events(start_dt, end_dt)
        return {
            "events": events,
            "count": len(events),
            "start": start,
            "end": end
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")


# WebSocket Support for Real-time Communication

class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
    
    async def send_personal_message(self, message: str, session_id: str):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time voice communication."""
    await manager.connect(websocket, session_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # Process the message (could be text transcript or audio data indicator)
            # For now, treat as text transcript
            db = next(get_db())
            try:
                result = conversation_agent.process_message(
                    message=data,
                    db=db,
                    conversation_history=[],
                    call_log_id=None
                )
                
                # Send response back
                response = {
                    "response": result["response"],
                    "tool_calls": result.get("tool_calls", [])
                }
                await manager.send_personal_message(
                    json.dumps(response),
                    session_id
                )
            finally:
                db.close()
                
    except WebSocketDisconnect:
        manager.disconnect(session_id)


# Serve static frontend files
try:
    import os
    if os.path.exists("static"):
        app.mount("/static", StaticFiles(directory="static"), name="static")
except:
    pass


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the frontend interface."""
    try:
        with open("static/index.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(
            content="""
            <html>
                <head><title>CallPilot API</title></head>
                <body style="font-family: Arial; padding: 40px; text-align: center;">
                    <h1>🎤 CallPilot API</h1>
                    <p>API is running successfully!</p>
                    <p>Visit <a href="/docs">/docs</a> for API documentation.</p>
                    <p>To use the web interface, ensure static/index.html exists.</p>
                </body>
            </html>
            """
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
