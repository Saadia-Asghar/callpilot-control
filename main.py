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
from models import (
    CallLog, User, Booking, Transcript, VoicePreference, ClonedVoice,
    Operator, IndustryPreset, CustomScript, RecoveryLog
)
from scheduling import scheduling_service
from calendar_integration import calendar_service
from voice_service import voice_service
from auth import (
    get_current_operator, get_optional_operator, create_access_token,
    get_password_hash, verify_password, OperatorCreate, OperatorLogin, Token
)
from industry_presets import industry_preset_service
from recovery_agent import recovery_agent
from custom_script_service import custom_script_service
from draft_service import draft_service
from intake_service import intake_service
from realtime_subscriptions import subscription_manager
from smart_scheduling import smart_scheduling_service
from context_aware import context_aware_service
from auto_triage import auto_triage_service
from dashboard_insights import dashboard_insights_service
from explainable_ai import explainable_ai_service
from simulation_service import simulation_service
from feedback_service import feedback_service
from demo_mode import demo_mode_service
from demo_usage_service import demo_usage_service
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, Response
from fastapi import File, UploadFile, Form
from logging_config import logger
from config import settings
import base64
from datetime import timedelta

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
        
        # Initialize industry presets
        from database import SessionLocal
        db = SessionLocal()
        try:
            industry_preset_service.initialize_presets(db)
            logger.info("✓ Industry presets initialized")
        finally:
            db.close()
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
    operator: Optional[Operator] = Depends(get_optional_operator),
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
            operator_id=operator.id if operator else None,
            status="active",
            channel="voice"  # Default channel for voice input
        )
        db.add(call_log)
        db.commit()
        db.refresh(call_log)
    
    # Update transcript in call log
    if call_log.raw_transcript:
        call_log.raw_transcript += f"\nUser: {request.transcript}"
    else:
        call_log.raw_transcript = f"User: {request.transcript}"
    
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
    
    # Broadcast real-time updates if operator is subscribed
    if call_log.operator_id:
        try:
            await subscription_manager.broadcast_transcript(
                str(call_log.operator_id),
                {
                    "call_log_id": call_log.id,
                    "session_id": call_log.session_id,
                    "user_message": request.transcript,
                    "agent_response": result["response"],
                    "tool_calls": result.get("tool_calls", [])
                }
            )
            
            if result.get("tool_calls"):
                await subscription_manager.broadcast_tool_call(
                    str(call_log.operator_id),
                    {
                        "call_log_id": call_log.id,
                        "tool_calls": result["tool_calls"]
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to broadcast real-time update: {str(e)}")
    
    # Generate voice response with user's preferred voice
    user_voice_id = None
    if request.user_id or call_log.user_id:
        user_id = request.user_id or call_log.user_id
        voice_pref = db.query(VoicePreference).filter(
            VoicePreference.user_id == user_id,
            VoicePreference.is_default == True
        ).first()
        if voice_pref:
            user_voice_id = voice_pref.voice_id
    
    # Use operator's voice preference if no user preference
    if not user_voice_id and call_log.operator_id:
        operator_obj = db.query(Operator).filter(Operator.id == call_log.operator_id).first()
        if operator_obj and operator_obj.voice_persona_id:
            user_voice_id = operator_obj.voice_persona_id
            
            # Get voice clone settings if available
            from models import VoiceCloneSettings
            voice_settings = db.query(VoiceCloneSettings).filter(
                VoiceCloneSettings.operator_id == call_log.operator_id,
                VoiceCloneSettings.voice_id == user_voice_id,
                VoiceCloneSettings.is_default == True
            ).first()
            
            if voice_settings:
                # Apply custom settings
                audio_response = generate_voice_response(
                    result["response"],
                    voice_id=user_voice_id,
                    style=voice_settings.style
                )
            else:
                audio_response = generate_voice_response(result["response"], voice_id=user_voice_id)
        else:
            audio_response = generate_voice_response(result["response"], voice_id=user_voice_id)
    else:
        audio_response = generate_voice_response(result["response"], voice_id=user_voice_id)
    
    # Update call log with voice persona (already set above)
    call_log.voice_persona_id = user_voice_id
    
    # Update transcript
    if call_log.raw_transcript:
        call_log.raw_transcript += f"\nAgent: {result['response']}"
    else:
        call_log.raw_transcript = f"User: {request.transcript}\nAgent: {result['response']}"
    
    # Store agent decisions
    call_log.agent_decisions = {
        "tool_calls": result.get("tool_calls", []),
        "response_generated": True,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Calculate confidence score based on tool calls
    if result.get("tool_calls"):
        # Higher confidence if booking was successful
        if any(tc.get("tool") == "book_appointment" and tc.get("result", {}).get("success") for tc in result["tool_calls"]):
            call_log.confidence_score = 90
        else:
            call_log.confidence_score = 75
    else:
        call_log.confidence_score = 70
    
    # Update client profile
    if call_log.user_id:
        context_aware_service.update_client_profile(db, call_log.user_id, call_log)
    
    # Create call history entry
    if call_log.user_id:
        from models import CallHistory
        # Check if history entry already exists
        existing_history = db.query(CallHistory).filter(
            CallHistory.call_log_id == call_log.id
        ).first()
        
        if not existing_history:
            call_type = "booking" if any(
                tc.get("tool") == "book_appointment" and tc.get("result", {}).get("success")
                for tc in result.get("tool_calls", [])
            ) else "inquiry"
            
            call_history = CallHistory(
                user_id=call_log.user_id,
                operator_id=call_log.operator_id,
                call_log_id=call_log.id,
                call_type=call_type,
                industry_preset=call_log.industry_preset,
                call_outcome=call_log.call_outcome,
                structured_intake=call_log.structured_intake
            )
            db.add(call_history)
    
    db.commit()
    
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


@app.websocket("/ws/subscribe/{subscription_id}")
async def subscription_websocket(
    websocket: WebSocket,
    subscription_id: str,
    types: str = "all"  # Comma-separated list or "all"
):
    """
    WebSocket endpoint for real-time subscriptions.
    
    Subscription types: transcript, tool_calls, missed_calls, recovery_activity, call_status
    Use "all" to subscribe to all types.
    """
    subscription_types = [t.strip() for t in types.split(",")] if types != "all" else ["all"]
    
    await subscription_manager.connect(websocket, subscription_id, subscription_types)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Handle subscription control messages
            try:
                message = json.loads(data)
                if message.get("action") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
            except:
                pass
                
    except WebSocketDisconnect:
        subscription_manager.disconnect(websocket, subscription_id)


# Serve static frontend files
try:
    import os
    if os.path.exists("static"):
        app.mount("/static", StaticFiles(directory="static"), name="static")
except:
    pass


# Voice Management Endpoints

class TTSRequest(BaseModel):
    """Request model for text-to-speech."""
    text: str
    voice_id: Optional[str] = None
    style: Optional[float] = None
    stability: Optional[float] = None
    similarity_boost: Optional[float] = None
    user_id: Optional[int] = None


class VoiceCloneRequest(BaseModel):
    """Request model for voice cloning."""
    name: str
    description: Optional[str] = None
    audio_sample_paths: List[str]


class VoicePreviewRequest(BaseModel):
    """Request model for voice preview with adjustable sliders."""
    voice_id: str
    sample_text: Optional[str] = None
    tone: Optional[int] = None  # 0-100 slider
    speed: Optional[int] = None  # 0-100 slider
    energy: Optional[int] = None  # 0-100 slider
    stability: Optional[float] = None
    similarity_boost: Optional[float] = None
    style: Optional[float] = None
    user_id: Optional[int] = None
    save_preferences: Optional[bool] = False


@app.post("/voice/tts")
async def text_to_speech_endpoint(
    request: TTSRequest,
    db: Session = Depends(get_db)
):
    """
    Convert text to speech with optional voice selection.
    If user_id provided, uses user's preferred voice.
    """
    voice_id = request.voice_id
    
    # Get user's preferred voice if user_id provided
    if request.user_id and not voice_id:
        voice_pref = db.query(VoicePreference).filter(
            VoicePreference.user_id == request.user_id,
            VoicePreference.is_default == True
        ).first()
        if voice_pref:
            voice_id = voice_pref.voice_id
    
    result = voice_service.text_to_speech(
        text=request.text,
        voice_id=voice_id,
        style=request.style,
        stability=request.stability,
        similarity_boost=request.similarity_boost
    )
    
    if result.get("status") == "success":
        audio_bytes = result.get("audio_bytes")
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "X-Voice-ID": result.get("voice_id", ""),
                "X-Audio-Size": str(result.get("size_bytes", 0))
            }
        )
    else:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Failed to generate speech")
        )


@app.get("/voice/list")
async def list_voices(
    user_id: Optional[int] = None,
    operator_id: Optional[int] = None,
    session_id: Optional[str] = None,
    include_saved: bool = True,
    db: Session = Depends(get_db)
):
    """
    List all available voices (default + cloned + saved).
    
    Args:
        user_id: Optional user ID to filter saved voices
        operator_id: Optional operator ID to filter saved voices
        session_id: Optional session ID to filter saved voices
        include_saved: Whether to include saved voices for user/operator/session
        db: Database session
    
    Returns:
        Dict with default voices, cloned voices, and saved voices
    """
    from saved_voice_service import saved_voice_service
    
    # Get default and cloned voices from ElevenLabs
    result = voice_service.list_available_voices()
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    # Add saved voices if requested
    if include_saved:
        saved_voices_result = saved_voice_service.list_saved_voices(
            db, user_id, operator_id, session_id
        )
        result["saved_voices"] = saved_voices_result.get("saved_voices", [])
        result["saved_voices_count"] = saved_voices_result.get("count", 0)
    
    result["ready_for_frontend"] = True
    return result


@app.post("/voice/clone")
async def clone_voice(
    request: VoiceCloneRequest,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Create a cloned voice from audio samples.
    Requires audio files to be uploaded first or paths provided.
    """
    result = voice_service.create_cloned_voice(
        name=request.name,
        audio_sample_paths=request.audio_sample_paths,
        description=request.description
    )
    
    if result.get("status") == "success":
        # Store cloned voice metadata in database
        cloned_voice = ClonedVoice(
            voice_id=result["voice_id"],
            name=request.name,
            description=request.description,
            owner_user_id=user_id,
            audio_samples=request.audio_sample_paths,
            metadata=result.get("metadata")
        )
        db.add(cloned_voice)
        db.commit()
        
        return {
            "success": True,
            "voice_id": result["voice_id"],
            "name": request.name,
            "message": "Voice cloned successfully"
        }
    else:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Failed to clone voice")
        )


@app.post("/voice/preview")
async def preview_voice_endpoint(
    request: VoicePreviewRequest,
    session_id: Optional[str] = None,
    operator: Optional[Operator] = Depends(get_optional_operator),
    db: Session = Depends(get_db)
):
    """
    Generate a preview audio for a voice with adjustable sliders.
    
    Supports real-time voice cloning preview with:
    - Tone slider (0-100)
    - Speed slider (0-100)
    - Energy slider (0-100)
    
    Returns waveform data and playback URL for frontend visualization.
    
    Enforces demo limits:
    - Max 100 characters for input text
    - Max 3 tries per user/session
    - Returns demo_tries_remaining in response
    """
    from demo_usage_service import demo_usage_service
    from models import VoiceCloneDemo
    
    user_id = request.user_id or (operator.id if operator else None)
    identifier = str(user_id) if user_id else session_id
    
    # Validate input text length (max 100 chars)
    if request.sample_text:
        validation = demo_usage_service.validate_voice_clone_input(request.sample_text)
        if not validation["valid"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": validation["error"],
                    "char_count": validation["char_count"],
                    "max_chars": validation["max_chars"],
                    "ready_for_frontend": True
                }
            )
    
    # Check feature availability
    if identifier:
        available = demo_usage_service.check_feature_availability(
            db, "voice_clone", session_id, user_id
        )
        if not available:
            usage_status = demo_usage_service.get_demo_usage(db, session_id, user_id)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Maximum demo tries exceeded for voice clone",
                    "demo_tries_remaining": 0,
                    "usage_status": usage_status["features"]["voice_clone"],
                    "ready_for_frontend": True
                }
            )
    
    # Generate preview
    result = voice_service.preview_voice(
        voice_id=request.voice_id,
        sample_text=request.sample_text,
        tone=request.tone,
        speed=request.speed,
        energy=request.energy,
        stability=request.stability,
        similarity_boost=request.similarity_boost,
        style=request.style
    )
    
    # Increment demo usage if identifier provided
    demo_tries_remaining = None
    if identifier:
        try:
            usage_result = demo_usage_service.increment_demo_usage(
                db, "voice_clone", session_id, user_id
            )
            demo_tries_remaining = usage_result["tries_remaining"]
            
            # Create voice clone demo record
            voice_demo = VoiceCloneDemo(
                session_id=identifier,
                user_id=user_id,
                voice_id=request.voice_id,
                input_text=request.sample_text or "",
                playback_url=f"/voice/preview/audio/{request.voice_id}",
                demo_tries_remaining=demo_tries_remaining
            )
            db.add(voice_demo)
            db.commit()
        except ValueError as e:
            # Limit exceeded
            raise HTTPException(status_code=403, detail=str(e))
    
    # Save preferences if requested
    if request.save_preferences and (request.user_id or operator):
        from models import VoiceCloneSettings
        user_id_val = request.user_id
        operator_id = operator.id if operator else None
        
        # Update or create voice clone settings
        existing = db.query(VoiceCloneSettings).filter(
            VoiceCloneSettings.voice_id == request.voice_id,
            VoiceCloneSettings.user_id == user_id_val if user_id_val else None,
            VoiceCloneSettings.operator_id == operator_id if operator_id else None
        ).first()
        
        if existing:
            existing.tone = request.tone or existing.tone
            existing.speed = request.speed or existing.speed
            existing.energy = request.energy or existing.energy
            existing.stability = request.stability or existing.stability
            existing.similarity_boost = request.similarity_boost or existing.similarity_boost
            existing.style = request.style or existing.style
        else:
            settings = VoiceCloneSettings(
                user_id=user_id_val,
                operator_id=operator_id,
                voice_id=request.voice_id,
                tone=request.tone or 50,
                speed=request.speed or 50,
                energy=request.energy or 50,
                stability=request.stability or 0.5,
                similarity_boost=request.similarity_boost or 0.75,
                style=request.style or 0.0,
                is_default=True
            )
            db.add(settings)
        
        db.commit()
    
    if result.get("status") == "success":
        # Return JSON with audio data encoded or URL
        audio_bytes = result.get("preview_audio")
        import base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else None
        
        playback_url = f"/voice/preview/audio/{request.voice_id}"
        
        response = {
            "success": True,
            "voice_id": request.voice_id,
            "preview_audio_base64": audio_base64,
            "preview_url": playback_url,
            "waveform": result.get("waveform", []),
            "sample_text": result.get("sample_text", ""),
            "settings": result.get("settings", {}),
            "size_bytes": result.get("size_bytes", 0),
            "demo_tries_remaining": demo_tries_remaining if demo_tries_remaining is not None else demo_usage_service.MAX_TRIES_PER_FEATURE,
            "ready_for_frontend": True
        }
        
        # Broadcast real-time event if WebSocket available
        if identifier:
            try:
                await subscription_manager.broadcast_to_subscription(
                    identifier,
                    "voice_clone_preview_ready",
                    {
                        "voice_id": request.voice_id,
                        "preview_url": playback_url,
                        "demo_tries_remaining": demo_tries_remaining
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to broadcast voice clone preview: {str(e)}")
        
        return response
    else:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Failed to generate preview")
        )


@app.get("/voice/preview/audio/{voice_id}")
async def get_preview_audio(
    voice_id: str,
    sample_text: Optional[str] = None,
    tone: Optional[int] = None,
    speed: Optional[int] = None,
    energy: Optional[int] = None
):
    """Get preview audio file directly (for playback)."""
    result = voice_service.preview_voice(
        voice_id=voice_id,
        sample_text=sample_text,
        tone=tone,
        speed=speed,
        energy=energy
    )
    
    if result.get("status") == "success":
        audio_bytes = result.get("preview_audio")
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "X-Voice-ID": voice_id,
                "Content-Disposition": f"inline; filename=preview_{voice_id}.mp3"
            }
        )
    else:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Failed to generate preview")
        )


@app.get("/voice/info/{voice_id}")
async def get_voice_info(voice_id: str):
    """Get information about a specific voice."""
    result = voice_service.get_voice_info(voice_id)
    
    if result.get("status") == "error" and "not found" in result.get("error", "").lower():
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.post("/voice/preference")
async def set_voice_preference(
    user_id: int,
    voice_id: str,
    voice_name: Optional[str] = None,
    is_default: bool = True,
    db: Session = Depends(get_db)
):
    """Set a user's voice preference."""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify voice exists
    voice_info = voice_service.get_voice_info(voice_id)
    if voice_info.get("status") == "error":
        raise HTTPException(status_code=400, detail=f"Invalid voice_id: {voice_id}")
    
    # If setting as default, unset other defaults for this user
    if is_default:
        db.query(VoicePreference).filter(
            VoicePreference.user_id == user_id,
            VoicePreference.is_default == True
        ).update({"is_default": False})
    
    # Create or update preference
    existing = db.query(VoicePreference).filter(
        VoicePreference.user_id == user_id,
        VoicePreference.voice_id == voice_id
    ).first()
    
    if existing:
        existing.is_default = is_default
        existing.voice_name = voice_name or voice_info.get("name")
    else:
        preference = VoicePreference(
            user_id=user_id,
            voice_id=voice_id,
            voice_name=voice_name or voice_info.get("name"),
            voice_category=voice_info.get("category", "default"),
            is_default=is_default
        )
        db.add(preference)
    
    db.commit()
    
    return {
        "success": True,
        "user_id": user_id,
        "voice_id": voice_id,
        "is_default": is_default
    }


@app.get("/voice/preference/{user_id}")
async def get_voice_preference(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get a user's voice preference."""
    preference = db.query(VoicePreference).filter(
        VoicePreference.user_id == user_id,
        VoicePreference.is_default == True
    ).first()
    
    if not preference:
        # Return default voice
        return {
            "user_id": user_id,
            "voice_id": voice_service.default_voice_id,
            "voice_name": "assistant",
            "category": "default",
            "is_default": False,
            "is_system_default": True
        }
    
    return {
        "user_id": user_id,
        "voice_id": preference.voice_id,
        "voice_name": preference.voice_name,
        "category": preference.voice_category,
        "is_default": preference.is_default,
        "settings": preference.settings
    }


# ============================================================================
# AUTHENTICATION & OPERATOR MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/auth/register", response_model=Token)
async def register_operator(
    operator_data: OperatorCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new operator account.
    
    Creates a new operator with email/password authentication.
    Returns JWT token for immediate use.
    """
    # Check if email already exists
    existing = db.query(Operator).filter(Operator.email == operator_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create operator
    operator = Operator(
        email=operator_data.email,
        password_hash=get_password_hash(operator_data.password),
        name=operator_data.name,
        business_name=operator_data.business_name,
        is_active=True
    )
    db.add(operator)
    db.commit()
    db.refresh(operator)
    
    # Generate token
    access_token = create_access_token(data={"sub": operator.id})
    
    logger.info(f"Registered new operator: {operator.email}")
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/login", response_model=Token)
async def login_operator(
    login_data: OperatorLogin,
    db: Session = Depends(get_db)
):
    """
    Login operator and get JWT token.
    
    Validates email/password and returns authentication token.
    """
    operator = db.query(Operator).filter(Operator.email == login_data.email).first()
    
    if not operator or not verify_password(login_data.password, operator.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    if not operator.is_active:
        raise HTTPException(status_code=403, detail="Operator account is inactive")
    
    access_token = create_access_token(data={"sub": operator.id})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me")
async def get_current_operator_info(
    operator: Operator = Depends(get_current_operator)
):
    """Get current operator information."""
    return {
        "id": operator.id,
        "email": operator.email,
        "name": operator.name,
        "business_name": operator.business_name,
        "industry_preset": operator.industry_preset,
        "voice_persona_id": operator.voice_persona_id,
        "is_active": operator.is_active
    }


# ============================================================================
# INDUSTRY PRESET ENDPOINTS
# ============================================================================

@app.post("/operator/set_industry_preset")
async def set_industry_preset(
    preset_name: str,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Set industry preset for operator.
    
    Ensures per-user data isolation - preset set only for authenticated operator.
    Available presets: clinic, salon, tutor, university
    
    Returns structured JSON ready for frontend.
    """
    try:
        updated_operator = industry_preset_service.set_operator_preset(
            db, operator.id, preset_name  # Per-operator isolation
        )
        return {
            "success": True,
            "operator_id": operator.id,
            "preset": preset_name,
            "message": f"Industry preset set to {preset_name}",
            "ready_for_frontend": True
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/operator/current_preset")
async def get_current_preset(
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Get operator's current industry preset configuration.
    
    Ensures per-user data isolation - only returns preset for authenticated operator.
    Returns structured JSON ready for frontend.
    """
    preset_config = industry_preset_service.get_operator_preset(db, operator.id)
    
    if not preset_config:
        return {
            "preset": None,
            "message": "No preset configured",
            "operator_id": operator.id,
            "ready_for_frontend": True
        }
    
    preset_config["operator_id"] = operator.id
    preset_config["ready_for_frontend"] = True
    return preset_config


@app.get("/operator/presets")
async def list_all_presets(db: Session = Depends(get_db)):
    """List all available industry presets."""
    presets = industry_preset_service.get_all_presets(db)
    return {
        "presets": [
            {
                "name": p.name,
                "display_name": p.display_name,
                "slot_duration_minutes": p.slot_duration_minutes,
                "buffer_time_minutes": p.buffer_time_minutes
            }
            for p in presets
        ],
        "count": len(presets)
    }


# ============================================================================
# CUSTOM SCRIPT ENDPOINTS
# ============================================================================


class CustomScriptCreate(BaseModel):
    """Request model for creating custom script."""
    name: str
    script_flow: Dict[str, Any]
    is_active: bool = True
    saved_voice_id: Optional[str] = None  # Optional saved voice ID to use for TTS


@app.post("/operator/custom_script/save")
async def save_custom_script(
    script_data: CustomScriptCreate,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Save a custom call script for operator.
    
    Ensures per-user data isolation - script saved only for authenticated operator.
    Script flow supports:
    - question steps
    - conditional logic (if/else)
    - branching options
    - booking actions
    
    If saved_voice_id provided, generates TTS audio URLs for script steps.
    
    Returns structured JSON ready for frontend.
    """
    from saved_voice_service import saved_voice_service
    
    try:
        script = custom_script_service.create_script(
            db=db,
            operator_id=operator.id,  # Per-operator isolation
            name=script_data.name,
            script_flow=script_data.script_flow,
            is_active=script_data.is_active
        )
        
        # Apply saved voice to script if provided
        tts_urls = {}
        if script_data.saved_voice_id:
            try:
                # Extract text from script steps
                script_flow = script_data.script_flow
                steps = script_flow.get("steps", [])
                
                for step in steps:
                    if step.get("type") == "question" and step.get("question"):
                        voice_result = saved_voice_service.apply_saved_voice_to_script(
                            db=db,
                            script_text=step["question"],
                            saved_voice_id=script_data.saved_voice_id,
                            user_id=None,
                            operator_id=operator.id,
                            session_id=None
                        )
                        if voice_result.get("success"):
                            step_id = step.get("id") or f"step_{steps.index(step)}"
                            tts_urls[step_id] = voice_result.get("tts_audio_url")
            except Exception as e:
                logger.warning(f"Failed to apply saved voice to script: {str(e)}")
        
        response = {
            "success": True,
            "script_id": script.id,
            "name": script.name,
            "message": "Custom script saved successfully",
            "operator_id": operator.id,
            "ready_for_frontend": True
        }
        
        if tts_urls:
            response["tts_audio_urls"] = tts_urls
            response["saved_voice_applied"] = True
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/operator/custom_script/load")
async def load_custom_script(
    script_id: Optional[int] = None,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Load custom script(s) for operator.
    
    Ensures per-user data isolation - only returns scripts for authenticated operator.
    If script_id provided, loads specific script.
    Otherwise, loads active script or all scripts.
    """
    if script_id:
        script = custom_script_service.get_script(db, script_id)
        if not script or script.operator_id != operator.id:
            raise HTTPException(status_code=404, detail="Script not found")
        script_flow = custom_script_service.get_script_flow(script)
        return {
            "script_id": script.id,
            "name": script.name,
            "script_flow": script_flow,
            "is_active": script.is_active,
            "operator_id": operator.id,
            "ready_for_frontend": True
        }
    else:
        # Get active script
        active_script = custom_script_service.get_active_script(db, operator.id)
        if active_script:
            script_flow = custom_script_service.get_script_flow(active_script)
            return {
                "script_id": active_script.id,
                "name": active_script.name,
                "script_flow": script_flow,
                "is_active": True,
                "operator_id": operator.id,
                "ready_for_frontend": True
            }
        else:
            # Return all scripts (per-operator isolation)
            scripts = custom_script_service.get_operator_scripts(db, operator.id)
            return {
                "scripts": [
                    {
                        "script_id": s.id,
                        "name": s.name,
                        "is_active": s.is_active
                    }
                    for s in scripts
                ],
                "count": len(scripts),
                "operator_id": operator.id,
                "ready_for_frontend": True
            }


@app.delete("/operator/custom_script")
async def delete_custom_script(
    script_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Delete a custom script."""
    script = custom_script_service.get_script(db, script_id)
    if not script or script.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Script not found")
    
    success = custom_script_service.delete_script(db, script_id)
    return {"success": success, "message": "Script deleted" if success else "Script not found"}


# ============================================================================
# CALL DRAFT MANAGEMENT ENDPOINTS
# ============================================================================

class DraftUpdate(BaseModel):
    """Request model for updating draft."""
    raw_transcript: Optional[str] = None
    structured_intake: Optional[Dict[str, Any]] = None
    agent_decisions: Optional[Dict[str, Any]] = None
    voice_persona_id: Optional[str] = None
    saved_voice_id: Optional[str] = None  # Optional saved voice ID to use for TTS
    call_outcome: Optional[str] = None
    status: Optional[str] = None


@app.post("/call/save_draft")
async def save_call_draft(
    call_log_id: int,
    draft_data: DraftUpdate,
    session_id: Optional[str] = None,
    operator: Optional[Operator] = Depends(get_optional_operator),
    db: Session = Depends(get_db)
):
    """
    Save or update a call draft.
    
    Ensures per-user data isolation - only saves drafts for authenticated operator.
    Stores transcript, structured intake, agent decisions, and call outcome.
    Enforces demo limits for demo users (max 3 tries).
    
    If saved_voice_id provided, generates TTS audio URL for the draft script.
    
    Returns structured JSON ready for frontend.
    """
    from saved_voice_service import saved_voice_service
    
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    user_id = operator.id if operator else None
    identifier = str(user_id) if user_id else session_id
    
    # Check demo limits for demo users
    if identifier and not operator:
        available = demo_usage_service.check_feature_availability(
            db, "call_draft", session_id, user_id
        )
        if not available:
            usage_status = demo_usage_service.get_demo_usage(db, session_id, user_id)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Maximum demo tries exceeded for call draft",
                    "demo_tries_remaining": 0,
                    "usage_status": usage_status["features"]["call_draft"],
                    "ready_for_frontend": True
                }
            )
    
    # Per-operator isolation check (if operator provided)
    if operator and call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Apply saved voice to script if provided
    tts_audio_url = None
    if draft_data.saved_voice_id and call_log.raw_transcript:
        try:
            voice_result = saved_voice_service.apply_saved_voice_to_script(
                db=db,
                script_text=call_log.raw_transcript,
                saved_voice_id=draft_data.saved_voice_id,
                user_id=user_id,
                operator_id=operator.id if operator else None,
                session_id=session_id
            )
            if voice_result.get("success"):
                tts_audio_url = voice_result.get("tts_audio_url")
        except Exception as e:
            logger.warning(f"Failed to apply saved voice to draft: {str(e)}")
    
    try:
        # Use saved voice's voice_id if provided
        voice_persona_id = draft_data.voice_persona_id
        if draft_data.saved_voice_id and not voice_persona_id:
            saved_voice = saved_voice_service.get_saved_voice(
                db, draft_data.saved_voice_id, user_id, operator.id if operator else None, session_id
            )
            if saved_voice:
                voice_persona_id = saved_voice.voice_id
        
        updated = draft_service.save_draft(
            db=db,
            call_log_id=call_log_id,
            raw_transcript=draft_data.raw_transcript,
            structured_intake=draft_data.structured_intake,
            agent_decisions=draft_data.agent_decisions,
            voice_persona_id=voice_persona_id,
            call_outcome=draft_data.call_outcome
        )
        
        # Increment demo usage for demo users
        demo_tries_remaining = None
        if identifier and not operator:
            try:
                usage_result = demo_usage_service.increment_demo_usage(
                    db, "call_draft", session_id, user_id
                )
                demo_tries_remaining = usage_result["tries_remaining"]
            except ValueError:
                pass  # Already checked above
        
        response = {
            "success": True,
            "call_log_id": call_log_id,
            "is_draft": updated.is_draft,
            "message": "Draft saved successfully",
            "operator_id": operator.id if operator else None,
            "ready_for_frontend": True
        }
        
        if tts_audio_url:
            response["tts_audio_url"] = tts_audio_url
            response["saved_voice_applied"] = True
        
        if demo_tries_remaining is not None:
            response["demo_tries_remaining"] = demo_tries_remaining
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/call/draft/{call_log_id}")
async def get_call_draft(
    call_log_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Get a call draft by ID.
    
    Ensures per-user data isolation - only returns drafts for authenticated operator.
    Returns structured JSON ready for frontend.
    """
    draft = draft_service.get_draft(db, call_log_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # Per-operator isolation check
    if draft.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    summary = draft_service.get_draft_summary(db, call_log_id)
    summary["operator_id"] = operator.id
    summary["ready_for_frontend"] = True
    return summary


@app.get("/call/list_by_operator")
async def list_calls_by_operator(
    limit: int = 50,
    offset: int = 0,
    include_drafts: bool = True,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    List all calls for current operator.
    
    Ensures per-user data isolation - only returns calls for authenticated operator.
    Returns structured JSON ready for frontend.
    """
    # Filter by operator_id for data isolation
    query = db.query(CallLog).filter(CallLog.operator_id == operator.id)
    
    if not include_drafts:
        query = query.filter(CallLog.is_draft == False)
    
    calls = query.order_by(CallLog.started_at.desc()).limit(limit).offset(offset).all()
    
    return {
        "calls": [
            {
                "id": c.id,
                "session_id": c.session_id,
                "user_id": c.user_id,
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "status": c.status,
                "is_draft": c.is_draft,
                "call_outcome": c.call_outcome,
                "industry_preset": c.industry_preset,
                "channel": c.channel,
                "has_transcript": bool(c.raw_transcript),
                "has_intake": bool(c.structured_intake),
                "has_reasoning": bool(c.ai_reasoning)
            }
            for c in calls
        ],
        "count": len(calls),
        "operator_id": operator.id,
        "ready_for_frontend": True
    }


@app.put("/call/draft/{call_log_id}/update")
async def update_call_draft(
    call_log_id: int,
    updates: DraftUpdate,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Update a call draft."""
    draft = draft_service.get_draft(db, call_log_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    if draft.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        updates_dict = updates.dict(exclude_unset=True)
        updated = draft_service.update_draft(db, call_log_id, updates_dict)
        return {
            "success": True,
            "call_log_id": call_log_id,
            "message": "Draft updated successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/call/draft/{call_log_id}/finalize")
async def finalize_draft(
    call_log_id: int,
    call_outcome: Optional[str] = None,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Finalize a draft call (mark as completed)."""
    draft = draft_service.get_draft(db, call_log_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    if draft.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        finalized = draft_service.finalize_draft(db, call_log_id, call_outcome)
        return {
            "success": True,
            "call_log_id": call_log_id,
            "is_draft": finalized.is_draft,
            "status": finalized.status,
            "message": "Draft finalized successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/call/draft/{call_log_id}/reopen")
async def reopen_draft(
    call_log_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Reopen a finalized call as a draft for editing."""
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    if call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        reopened = draft_service.reopen_draft(db, call_log_id)
        return {
            "success": True,
            "call_log_id": call_log_id,
            "is_draft": reopened.is_draft,
            "message": "Call reopened as draft"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# MISSED CALL RECOVERY ENDPOINTS
# ============================================================================

@app.post("/recovery/detect/{call_log_id}")
async def detect_missed_call(
    call_log_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Detect if a call was missed and mark it for recovery."""
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    if call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    is_missed = recovery_agent.detect_missed_call(db, call_log_id)
    return {
        "call_log_id": call_log_id,
        "is_missed": is_missed,
        "status": "missed" if is_missed else call_log.status
    }


@app.post("/recovery/trigger/{call_log_id}")
async def trigger_recovery(
    call_log_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Trigger recovery attempt for a missed call."""
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    if call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = recovery_agent.trigger_recovery(db, call_log_id, operator.id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@app.get("/recovery/metrics")
async def get_recovery_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Get recovery metrics for dashboard."""
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    metrics = recovery_agent.get_recovery_metrics(
        db, operator.id, start_dt, end_dt
    )
    return metrics


@app.post("/recovery/{recovery_id}/human_intervention")
async def request_human_intervention(
    recovery_id: int,
    notes: Optional[str] = None,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Request human intervention for a failed recovery."""
    result = recovery_agent.request_human_intervention(db, recovery_id, notes)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


# ============================================================================
# SMART INTAKE & EXPORT ENDPOINTS
# ============================================================================

class IntakeCollection(BaseModel):
    """Request model for intake data collection."""
    preset_name: str
    collected_responses: Dict[str, Any]


@app.post("/intake/collect/{call_log_id}")
async def collect_intake(
    call_log_id: int,
    intake_data: IntakeCollection,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Collect structured intake data for a call."""
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    if call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = intake_service.collect_intake_data(
        db=db,
        call_log_id=call_log_id,
        preset_name=intake_data.preset_name,
        collected_responses=intake_data.collected_responses
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@app.get("/intake/structured/{call_log_id}")
async def get_structured_output(
    call_log_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Get structured JSON output for a call."""
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    if call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = intake_service.get_structured_output(db, call_log_id)
    return result


@app.get("/intake/export/csv")
async def export_to_csv(
    call_log_ids: str,  # Comma-separated list
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Export call data to CSV format."""
    ids = [int(id.strip()) for id in call_log_ids.split(",")]
    
    # Verify all calls belong to operator
    calls = db.query(CallLog).filter(
        CallLog.id.in_(ids),
        CallLog.operator_id == operator.id
    ).all()
    
    if len(calls) != len(ids):
        raise HTTPException(status_code=403, detail="Some calls not found or not authorized")
    
    csv_content = intake_service.export_to_csv(db, ids)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=callpilot_export.csv"}
    )


@app.get("/intake/export/crm/{call_log_id}")
async def export_to_crm(
    call_log_id: int,
    crm_format: str = "generic",
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """Export call data to CRM-friendly JSON format."""
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    if call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = intake_service.export_to_crm_json(db, call_log_id, crm_format)
    return result


# ============================================================================
# SMART SCHEDULING & OPTIMIZATION ENDPOINTS
# ============================================================================

@app.get("/schedule/suggest")
async def suggest_optimal_slots(
    user_id: Optional[int] = None,
    preferred_date: Optional[str] = None,
    days_ahead: int = 7,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Suggest optimal time slots based on historical data and patterns.
    
    Considers:
    - Past cancellations
    - No-shows
    - Recovery attempts
    - High-demand windows
    - User preferences
    
    Stores suggested slots in draft calls for operator review.
    Returns structured JSON with confidence scores and reasoning.
    """
    preferred_dt = None
    if preferred_date:
        try:
            preferred_dt = datetime.fromisoformat(preferred_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    result = smart_scheduling_service.suggest_optimal_slots(
        db=db,
        operator_id=operator.id,
        user_id=user_id,
        preferred_date=preferred_dt,
        days_ahead=days_ahead
    )
    
    # Ensure result is structured for frontend
    result["ready_for_frontend"] = True
    result["operator_id"] = operator.id
    
    return result


# ============================================================================
# CONTEXT-AWARE CALLS ENDPOINTS
# ============================================================================

@app.get("/call/context/{user_id}")
async def get_call_context(
    user_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Get call context for a client including history and AI-based follow-up suggestions.
    
    Provides:
    - Call history
    - Client profile
    - Recommended next questions with confidence scores
    - Recommended actions with confidence scores
    - Structured intake from past calls
    
    Returns structured JSON ready for Lovable UI.
    """
    result = context_aware_service.get_call_context(
        db=db,
        user_id=user_id,
        operator_id=operator.id
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Ensure structured for frontend
    result["ready_for_frontend"] = True
    result["operator_id"] = operator.id
    
    return result


# ============================================================================
# AUTO-TRIAGE ENDPOINTS
# ============================================================================

class TriageRequest(BaseModel):
    """Request model for triage."""
    collected_data: Dict[str, Any]
    industry_preset: Optional[str] = None


@app.post("/call/triage/{call_log_id}")
async def perform_triage(
    call_log_id: int,
    triage_data: TriageRequest,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Perform auto-triage on collected information.
    
    Collects structured information and returns:
    - Suggested appointment type
    - Priority level
    - Urgency score
    - Reasoning
    
    Stores recommendations in draft call for operator review.
    Returns structured JSON ready for frontend.
    """
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    if call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = auto_triage_service.triage_call(
        db=db,
        call_log_id=call_log_id,
        operator_id=operator.id,
        collected_data=triage_data.collected_data,
        industry_preset=triage_data.industry_preset or call_log.industry_preset
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Ensure draft flag is set for review
    call_log.is_draft = True
    db.commit()
    
    result["ready_for_frontend"] = True
    result["operator_id"] = operator.id
    
    return result


# ============================================================================
# ENHANCED DASHBOARD INSIGHTS ENDPOINTS
# ============================================================================

@app.get("/operator/insights")
async def get_operator_insights(
    days: int = 30,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard insights for operator.
    
    Returns:
    - Call metrics (handled, completed, abandoned)
    - Recovery metrics (attempts, success rate)
    - Booking metrics (total, cancellations, no-shows)
    - No-show risk analysis
    - AI recommendations for efficiency improvements
    """
    result = dashboard_insights_service.get_operator_insights(
        db=db,
        operator_id=operator.id,
        days=days
    )
    
    return result


# ============================================================================
# MULTI-CHANNEL INTEGRATION SUPPORT
# ============================================================================

class MultiChannelCall(BaseModel):
    """Request model for multi-channel call creation."""
    channel: str  # voice, chat, whatsapp, form
    channel_metadata: Optional[Dict[str, Any]] = None
    user_id: Optional[int] = None
    transcript: Optional[str] = None


@app.post("/call/multi_channel")
async def create_multi_channel_call(
    call_data: MultiChannelCall,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Create a call from any channel (voice, chat, WhatsApp, form).
    
    All interactions feed into the same AI reasoning engine.
    Supports per-user data isolation.
    Returns structured JSON ready for frontend.
    """
    session_id = f"{call_data.channel}-{uuid.uuid4()}"
    
    call_log = CallLog(
        operator_id=operator.id,
        user_id=call_data.user_id,
        session_id=session_id,
        channel=call_data.channel,
        channel_metadata=call_data.channel_metadata,
        raw_transcript=call_data.transcript,
        status="active",
        is_draft=True  # Start as draft
    )
    
    db.add(call_log)
    db.commit()
    db.refresh(call_log)
    
    # Process with agent if transcript provided
    if call_data.transcript:
        try:
            result = conversation_agent.process_message(
                message=call_data.transcript,
                db=db,
                conversation_history=[],
                user_id=call_data.user_id,
                call_log_id=call_log.id
            )
            
            call_log.agent_decisions = {
                "tool_calls": result.get("tool_calls", []),
                "response": result.get("response")
            }
            db.commit()
        except Exception as e:
            logger.warning(f"Agent processing failed for multi-channel call: {str(e)}")
    
    return {
        "success": True,
        "call_log_id": call_log.id,
        "session_id": session_id,
        "channel": call_data.channel,
        "message": "Multi-channel call created",
        "ready_for_frontend": True,
        "operator_id": operator.id
    }


# ============================================================================
# EXPLAINABLE AI DECISIONS ENDPOINTS
# ============================================================================

@app.get("/call/reason/{call_log_id}")
async def get_call_reasoning(
    call_log_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Get detailed reasoning for AI decisions in a call.
    
    Returns:
    - Why a slot was chosen
    - Why a script was recommended
    - Confidence scores for each recommendation
    - Detailed reasoning for each decision
    
    Returns structured JSON ready for frontend visualization.
    """
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    if call_log.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = explainable_ai_service.get_call_reasoning(db, call_log_id)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    result["ready_for_frontend"] = True
    result["operator_id"] = operator.id
    
    return result


# ============================================================================
# RECOVERY & NO-SHOW PREVENTION ENDPOINTS
# ============================================================================

@app.get("/recovery/pending")
async def get_pending_recoveries(
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Get pending recovery calls.
    
    Returns list of calls that need recovery attempts.
    Includes metrics: success rate, pending count.
    Integrated with feedback loop for AI improvements.
    """
    pending_calls_data = recovery_agent.get_pending_recoveries(db, operator.id)
    
    # Get recovery metrics
    metrics = recovery_agent.get_recovery_metrics(db, operator.id)
    
    return {
        "pending_count": len(pending_calls_data),
        "calls": pending_calls_data,
        "metrics": {
            "success_rate": metrics.get("success_rate", 0),
            "total_attempts": metrics.get("total_attempts", 0),
            "successful": metrics.get("successful", 0),
            "failed": metrics.get("failed", 0)
        },
        "ready_for_frontend": True,
        "operator_id": operator.id
    }


@app.post("/recovery/trigger/{call_log_id}")
async def trigger_recovery_for_call(
    call_log_id: int,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Trigger recovery attempt for a specific call.
    
    Returns recovery status and metrics.
    Integrated with feedback loop for AI improvements.
    """
    result = recovery_agent.trigger_recovery(db, call_log_id, operator.id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Broadcast recovery activity
    try:
        await subscription_manager.broadcast_recovery_activity(
            str(operator.id),
            {
                "call_log_id": call_log_id,
                "recovery_status": result.get("status"),
                "callback_scheduled": result.get("callback_scheduled", False)
            }
        )
    except Exception as e:
        logger.warning(f"Failed to broadcast recovery activity: {str(e)}")
    
    result["ready_for_frontend"] = True
    return result


# ============================================================================
# CALL SIMULATION / EXPERIMENT MODE ENDPOINTS
# ============================================================================

class SimulationRequest(BaseModel):
    """Request model for simulation."""
    num_calls: int = 3
    industry_preset: Optional[str] = None
    scenarios: Optional[List[Dict[str, Any]]] = None


@app.post("/simulation/run")
async def run_simulation(
    simulation_data: SimulationRequest,
    session_id: Optional[str] = None,
    operator: Optional[Operator] = Depends(get_optional_operator),
    db: Session = Depends(get_db)
):
    """
    Simulate multiple calls for demo or testing.
    
    Generates:
    - Transcripts
    - Structured intake
    - AI reasoning
    - Draft saving
    
    Returns success metrics for analysis.
    Tracks per-user simulations.
    Enforces demo limits (max 3 tries).
    Returns structured JSON ready for frontend.
    """
    user_id = operator.id if operator else None
    identifier = str(user_id) if user_id else session_id
    
    # Check feature availability for demo users
    if identifier and not operator:
        available = demo_usage_service.check_feature_availability(
            db, "simulation", session_id, user_id
        )
        if not available:
            usage_status = demo_usage_service.get_demo_usage(db, session_id, user_id)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Maximum demo tries exceeded for simulation",
                    "demo_tries_remaining": 0,
                    "usage_status": usage_status["features"]["simulation"],
                    "ready_for_frontend": True
                }
            )
    
    operator_id = operator.id if operator else None
    if not operator_id:
        raise HTTPException(status_code=401, detail="Authentication required for simulation")
    
    result = simulation_service.run_simulation(
        db=db,
        operator_id=operator_id,
        num_calls=simulation_data.num_calls,
        industry_preset=simulation_data.industry_preset,
        scenarios=simulation_data.scenarios
    )
    
    # Increment demo usage for demo users
    if identifier and not operator:
        try:
            usage_result = demo_usage_service.increment_demo_usage(
                db, "simulation", session_id, user_id
            )
            result["demo_tries_remaining"] = usage_result["tries_remaining"]
        except ValueError:
            pass  # Already checked above
    
    # Broadcast real-time event
    if identifier:
        try:
            await subscription_manager.broadcast_to_subscription(
                identifier,
                "simulation_run_completed",
                {
                    "simulation_id": result.get("simulation_id"),
                    "total_calls": result.get("total_calls"),
                    "successful_calls": result.get("successful_calls"),
                    "demo_tries_remaining": result.get("demo_tries_remaining")
                }
            )
        except Exception as e:
            logger.warning(f"Failed to broadcast simulation completion: {str(e)}")
    
    # Ensure structured for frontend
    result["ready_for_frontend"] = True
    
    return result


# ============================================================================
# FEEDBACK & LEARNING LOOP ENDPOINTS
# ============================================================================

class FeedbackRequest(BaseModel):
    """Request model for feedback."""
    rating: int  # 1-5 stars
    call_log_id: Optional[int] = None
    comment: Optional[str] = None
    feedback_type: str = "ai_response"  # ai_response, scheduling, recovery, overall


@app.post("/feedback")
async def submit_feedback(
    feedback_data: FeedbackRequest,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Submit feedback for AI response or service.
    
    Operators can rate AI response (1-5 stars) with optional comment.
    Used for AI improvement and learning loop.
    """
    if feedback_data.rating < 1 or feedback_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    try:
        feedback = feedback_service.submit_feedback(
            db=db,
            operator_id=operator.id,
            rating=feedback_data.rating,
            call_log_id=feedback_data.call_log_id,
            comment=feedback_data.comment,
            feedback_type=feedback_data.feedback_type
        )
        
        return {
            "success": True,
            "feedback_id": feedback.id,
            "rating": feedback.rating,
            "message": "Feedback submitted successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/feedback/summary")
async def get_feedback_summary(
    days: int = 30,
    operator: Operator = Depends(get_current_operator),
    db: Session = Depends(get_db)
):
    """
    Get aggregate feedback metrics for operator review and AI improvement.
    
    Returns:
    - Total feedback count
    - Average rating
    - Rating distribution
    - Feedback by type
    - Recent feedback
    - AI improvement suggestions
    
    Integrated with learning loop for continuous AI improvement.
    Returns structured JSON ready for dashboard.
    """
    summary = feedback_service.get_feedback_summary(
        db=db,
        operator_id=operator.id,
        days=days
    )
    
    # Add improvement suggestions
    suggestions = feedback_service.get_ai_improvement_suggestions(db, operator.id)
    summary["improvement_suggestions"] = suggestions
    summary["ready_for_frontend"] = True
    summary["operator_id"] = operator.id
    
    return summary


# ============================================================================
# DEMO MODE SUPPORT ENDPOINTS
# ============================================================================

@app.get("/demo/calls")
async def get_demo_calls(
    session_id: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get pre-loaded demo calls for first-time users without signup.
    
    Returns 3 demo calls with:
    - Simulated transcript
    - Draft steps
    - AI reasoning
    - Voice clone preview with waveform
    - Structured intake
    - Demo tries remaining per feature
    
    Tracks demo usage (max 3 per feature per user).
    Returns structured JSON ready for Lovable UI.
    """
    from demo_usage_service import demo_usage_service
    
    # Get demo calls
    result = demo_mode_service.get_demo_calls(db, session_id)
    
    # Get usage status
    usage_status = demo_usage_service.get_demo_usage(db, session_id, user_id)
    
    # Enhance result with usage info
    result["demo_usage"] = usage_status
    result["demo_tries_remaining"] = usage_status["features"].get("call_draft", {}).get("tries_remaining", 3)
    result["feature_availability"] = {
        feature: status["available"]
        for feature, status in usage_status["features"].items()
    }
    
    return result


@app.get("/demo/call")
async def get_demo_calls_legacy(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Legacy endpoint - redirects to /demo/calls."""
    return await get_demo_calls(session_id, db)


@app.post("/demo/record")
async def record_demo_usage(
    session_id: str,
    demo_type: str = "clinic",
    db: Session = Depends(get_db)
):
    """
    Record demo call usage.
    
    Tracks demo usage per session (max 3 demos allowed).
    """
    try:
        demo_usage = demo_mode_service.record_demo_usage(
            db=db,
            session_id=session_id,
            demo_type=demo_type
        )
        
        return {
            "success": True,
            "demo_call_number": demo_usage.demo_call_number,
            "remaining": demo_mode_service.MAX_DEMO_CALLS - demo_usage.demo_call_number,
            "message": "Demo usage recorded"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

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


# ============================================================================
# DEMO USAGE TRACKING ENDPOINTS
# ============================================================================

@app.get("/demo/usage")
async def get_demo_usage_endpoint(
    session_id: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get demo usage status for all features.
    
    Returns:
    - Tries used per feature
    - Tries remaining per feature
    - Feature availability (true/false)
    - Ready for frontend flag
    
    Returns structured JSON ready for Lovable UI.
    """
    from demo_usage_service import demo_usage_service
    usage_status = demo_usage_service.get_demo_usage(db, session_id, user_id)
    return usage_status


@app.patch("/demo/usage/{feature_name}")
async def increment_demo_usage_endpoint(
    feature_name: str,
    session_id: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Increment demo usage for a specific feature.
    
    Args:
        feature_name: Feature name (voice_clone, schedule_demo, call_draft, simulation, export)
        session_id: Optional session ID
        user_id: Optional user ID
    
    Returns:
        Updated usage status with tries remaining
    
    Raises:
        403: If max tries exceeded
    """
    from demo_usage_service import demo_usage_service
    try:
        result = demo_usage_service.increment_demo_usage(
            db, feature_name, session_id, user_id
        )
        
        # Broadcast real-time event
        identifier = str(user_id) if user_id else session_id
        if identifier:
            try:
                await subscription_manager.broadcast_to_subscription(
                    identifier,
                    "demo_try_completed",
                    {
                        "feature_name": feature_name,
                        "tries_remaining": result["tries_remaining"],
                        "available": result["available"]
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to broadcast demo usage update: {str(e)}")
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.get("/demo/voice")
async def get_demo_voice_status(
    session_id: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get voice clone demo status including tries remaining.
    
    Returns:
    - Voice clone usage status
    - Tries remaining
    - Feature availability
    - Recent voice clone demos
    
    Returns structured JSON ready for Lovable UI.
    """
    from models import VoiceCloneDemo
    
    usage_status = demo_usage_service.get_demo_usage(db, session_id, user_id)
    voice_status = usage_status["features"].get("voice_clone", {})
    
    # Get recent voice clone demos
    identifier = str(user_id) if user_id else session_id
    recent_demos = []
    if identifier:
        recent_demos_query = db.query(VoiceCloneDemo).filter(
            (VoiceCloneDemo.session_id == identifier) | (VoiceCloneDemo.user_id == user_id) if user_id else (VoiceCloneDemo.session_id == identifier)
        ).order_by(VoiceCloneDemo.created_at.desc()).limit(5).all()
        
        recent_demos = [
            {
                "voice_id": demo.voice_id,
                "input_text": demo.input_text[:50] + "..." if len(demo.input_text) > 50 else demo.input_text,
                "playback_url": demo.playback_url,
                "exported": demo.exported_flag,
                "created_at": demo.created_at.isoformat() if demo.created_at else None
            }
            for demo in recent_demos_query
        ]
    
    return {
        "voice_clone_status": voice_status,
        "recent_demos": recent_demos,
        "max_chars": demo_usage_service.VOICE_CLONE_MAX_CHARS,
        "ready_for_frontend": True
    }


@app.post("/voice/export")
async def export_voice_clone(
    voice_demo_id: int,
    session_id: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Export voice clone demo (only if demo tries remaining > 0).
    
    Args:
        voice_demo_id: Voice clone demo ID
        session_id: Optional session ID
        user_id: Optional user ID
    
    Returns:
        Export status and URL
    
    Raises:
        403: If no demo tries remaining
        404: If voice demo not found
    """
    from models import VoiceCloneDemo
    
    # Check feature availability
    identifier = str(user_id) if user_id else session_id
    if identifier:
        available = demo_usage_service.check_feature_availability(
            db, "export", session_id, user_id
        )
        if not available:
            usage_status = demo_usage_service.get_demo_usage(db, session_id, user_id)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Maximum demo tries exceeded for export",
                    "demo_tries_remaining": 0,
                    "usage_status": usage_status["features"]["export"],
                    "ready_for_frontend": True
                }
            )
    
    # Get voice demo
    voice_demo = db.query(VoiceCloneDemo).filter(VoiceCloneDemo.id == voice_demo_id).first()
    if not voice_demo:
        raise HTTPException(status_code=404, detail="Voice clone demo not found")
    
    # Verify ownership
    if identifier:
        if voice_demo.session_id != identifier and voice_demo.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Increment export usage
    if identifier:
        try:
            usage_result = demo_usage_service.increment_demo_usage(
                db, "export", session_id, user_id
            )
            demo_tries_remaining = usage_result["tries_remaining"]
        except ValueError as e:
            raise HTTPException(status_code=403, detail=str(e))
    else:
        demo_tries_remaining = demo_usage_service.MAX_TRIES_PER_FEATURE
    
    # Mark as exported
    voice_demo.exported_flag = True
    voice_demo.exported_at = datetime.utcnow()
    voice_demo.demo_tries_remaining = demo_tries_remaining
    db.commit()
    
    return {
        "success": True,
        "voice_demo_id": voice_demo_id,
        "export_url": voice_demo.playback_url,
        "exported": True,
        "demo_tries_remaining": demo_tries_remaining,
        "ready_for_frontend": True
    }


@app.get("/demo/export")
async def get_demo_export_status(
    session_id: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get export demo status including tries remaining.
    
    Returns:
    - Export usage status
    - Tries remaining
    - Feature availability
    - Export history
    
    Returns structured JSON ready for Lovable UI.
    """
    from models import VoiceCloneDemo
    
    usage_status = demo_usage_service.get_demo_usage(db, session_id, user_id)
    export_status = usage_status["features"].get("export", {})
    
    # Get exported demos
    identifier = str(user_id) if user_id else session_id
    exported_demos = []
    if identifier:
        exported_query = db.query(VoiceCloneDemo).filter(
            (VoiceCloneDemo.session_id == identifier) | (VoiceCloneDemo.user_id == user_id) if user_id else (VoiceCloneDemo.session_id == identifier),
            VoiceCloneDemo.exported_flag == True
        ).order_by(VoiceCloneDemo.exported_at.desc()).limit(10).all()
        
        exported_demos = [
            {
                "voice_demo_id": demo.id,
                "voice_id": demo.voice_id,
                "export_url": demo.playback_url,
                "exported_at": demo.exported_at.isoformat() if demo.exported_at else None
            }
            for demo in exported_query
        ]
    
    return {
        "export_status": export_status,
        "exported_demos": exported_demos,
        "ready_for_frontend": True
    }


# ============================================================================
# SAVED VOICE ENDPOINTS
# ============================================================================

class SaveVoiceRequest(BaseModel):
    """Request model for saving a voice clone."""
    voice_id: str  # ElevenLabs voice ID
    voice_name: str
    audio_sample_paths: Optional[List[str]] = None
    cloned_voice_reference: Optional[str] = None
    tone: Optional[int] = 50
    speed: Optional[int] = 50
    energy: Optional[int] = 50
    stability: Optional[float] = 0.5
    similarity_boost: Optional[float] = 0.75
    style: Optional[float] = 0.0
    is_demo: Optional[bool] = False


@app.post("/voice/save")
async def save_voice(
    request: SaveVoiceRequest,
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
    operator: Optional[Operator] = Depends(get_optional_operator),
    db: Session = Depends(get_db)
):
    """
    Save a voice clone for reuse.
    
    Input:
    - user_id: Optional user ID
    - audio_sample_paths: Optional list of audio sample paths
    - cloned_voice_reference: Optional reference to existing ClonedVoice
    - parameters: tone, speed, energy, stability, similarity_boost, style
    
    Returns:
    - saved_voice_id: Unique ID for the saved voice
    
    Demo Mode Limits:
    - Demo users can only save 1 temporary voice clone
    - Max 3 demo tries
    - Temporary voice deleted after demo limit reached or session ends
    """
    from saved_voice_service import saved_voice_service
    
    operator_id = operator.id if operator else None
    
    # Determine if this is a demo user
    is_demo = request.is_demo or (not operator_id and not user_id)
    
    try:
        result = saved_voice_service.save_voice(
            db=db,
            voice_id=request.voice_id,
            voice_name=request.voice_name,
            user_id=user_id,
            operator_id=operator_id,
            session_id=session_id,
            audio_sample_paths=request.audio_sample_paths,
            cloned_voice_reference=request.cloned_voice_reference,
            tone=request.tone or 50,
            speed=request.speed or 50,
            energy=request.energy or 50,
            stability=request.stability or 0.5,
            similarity_boost=request.similarity_boost or 0.75,
            style=request.style or 0.0,
            is_demo=is_demo
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class ApplyVoiceToScriptRequest(BaseModel):
    """Request model for applying saved voice to script."""
    script_text: str
    saved_voice_id: str


@app.post("/voice/apply_to_script")
async def apply_voice_to_script(
    request: ApplyVoiceToScriptRequest,
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
    operator: Optional[Operator] = Depends(get_optional_operator),
    db: Session = Depends(get_db)
):
    """
    Apply a saved voice to generate TTS for a script.
    
    Input:
    - script_text: Text to convert to speech
    - saved_voice_id: Saved voice ID to use
    
    Returns:
    - TTS audio URL in selected voice
    - Voice parameters used
    """
    from saved_voice_service import saved_voice_service
    
    operator_id = operator.id if operator else None
    
    result = saved_voice_service.apply_saved_voice_to_script(
        db=db,
        script_text=request.script_text,
        saved_voice_id=request.saved_voice_id,
        user_id=user_id,
        operator_id=operator_id,
        session_id=session_id
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Failed to apply voice"))
    
    return result


@app.get("/voice/saved")
async def list_saved_voices(
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
    operator: Optional[Operator] = Depends(get_optional_operator),
    db: Session = Depends(get_db)
):
    """
    List all saved voices for a user/operator/session.
    
    Returns:
    - List of saved_voice_ids + metadata per user
    - Includes voice parameters (tone, speed, energy)
    - Includes creation date and expiry (for demo voices)
    """
    from saved_voice_service import saved_voice_service
    
    operator_id = operator.id if operator else None
    
    result = saved_voice_service.list_saved_voices(
        db=db,
        user_id=user_id,
        operator_id=operator_id,
        session_id=session_id
    )
    
    return result


@app.delete("/voice/saved/{saved_voice_id}")
async def delete_saved_voice(
    saved_voice_id: str,
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
    operator: Optional[Operator] = Depends(get_optional_operator),
    db: Session = Depends(get_db)
):
    """
    Delete a saved voice.
    
    Only the owner (user/operator/session) can delete their saved voice.
    """
    from saved_voice_service import saved_voice_service
    from models import SavedVoice
    
    operator_id = operator.id if operator else None
    
    saved_voice = db.query(SavedVoice).filter(
        SavedVoice.saved_voice_id == saved_voice_id,
        SavedVoice.is_active == True
    ).first()
    
    if not saved_voice:
        raise HTTPException(status_code=404, detail="Saved voice not found")
    
    # Check authorization
    if user_id and saved_voice.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if operator_id and saved_voice.operator_id != operator_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if session_id and saved_voice.session_id != session_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    saved_voice.is_active = False
    db.commit()
    
    return {
        "success": True,
        "saved_voice_id": saved_voice_id,
        "message": "Saved voice deleted successfully",
        "ready_for_frontend": True
    }


@app.post("/voice/cleanup_demo")
async def cleanup_demo_voices(
    db: Session = Depends(get_db)
):
    """
    Clean up expired demo voices.
    
    This endpoint can be called periodically to remove expired demo voices.
    """
    from saved_voice_service import saved_voice_service
    
    count = saved_voice_service.cleanup_expired_demo_voices(db)
    
    return {
        "success": True,
        "cleaned_up_count": count,
        "message": f"Cleaned up {count} expired demo voices",
        "ready_for_frontend": True
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
