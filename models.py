"""
Database models for CallPilot application.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """User model for storing user information."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    bookings = relationship("Booking", back_populates="user")
    preferences = relationship("Preference", back_populates="user")
    call_logs = relationship("CallLog", back_populates="user")


class Booking(Base):
    """Booking model for storing appointment bookings."""
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_datetime = Column(DateTime(timezone=True), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String, default="confirmed")  # confirmed, cancelled, rescheduled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="bookings")


class Preference(Base):
    """User preference model for storing user preferences."""
    __tablename__ = "preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="preferences")


class VoicePreference(Base):
    """Voice preference model for storing user and business voice settings."""
    __tablename__ = "voice_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # None = business default
    voice_id = Column(String, nullable=False)  # ElevenLabs voice ID
    voice_name = Column(String, nullable=True)  # Friendly name
    voice_category = Column(String, nullable=True)  # default, cloned, custom
    is_default = Column(Boolean, default=False)  # Is this the default voice?
    settings = Column(JSON, nullable=True)  # Voice settings (stability, style, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="voice_preferences_rel")


class ClonedVoice(Base):
    """Model for storing cloned voice metadata."""
    __tablename__ = "cloned_voices"
    
    id = Column(Integer, primary_key=True, index=True)
    voice_id = Column(String, unique=True, nullable=False, index=True)  # ElevenLabs voice ID
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    audio_samples = Column(JSON, nullable=True)  # List of sample file paths used
    metadata = Column(JSON, nullable=True)  # Additional metadata from ElevenLabs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", backref="cloned_voices")


class Operator(Base):
    """Operator model for multi-user support and authentication."""
    __tablename__ = "operators"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)  # Hashed password
    name = Column(String, nullable=True)
    business_name = Column(String, nullable=True)
    industry_preset = Column(String, nullable=True)  # clinic, salon, tutor, university, custom
    voice_persona_id = Column(String, nullable=True)  # ElevenLabs voice ID
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Password reset fields
    reset_password_token = Column(String, nullable=True)   # Hashed token stored
    reset_password_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    call_logs = relationship("CallLog", back_populates="operator")
    custom_scripts = relationship("CustomScript", back_populates="operator")
    recovery_logs = relationship("RecoveryLog", back_populates="operator")


class IndustryPreset(Base):
    """Industry preset model for pre-configured business profiles."""
    __tablename__ = "industry_presets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # clinic, salon, tutor, university
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    slot_duration_minutes = Column(Integer, default=30)
    buffer_time_minutes = Column(Integer, default=5)
    call_script_flow = Column(JSON, nullable=False)  # Question flow structure
    intake_fields = Column(JSON, nullable=False)  # Required intake fields
    default_questions = Column(JSON, nullable=True)  # Default questions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CustomScript(Base):
    """Custom script model for operator-defined call flows."""
    __tablename__ = "custom_scripts"
    
    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=False)
    name = Column(String, nullable=False)
    script_content = Column(JSON, nullable=False)  # Script structure with conditional flows
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    operator = relationship("Operator", back_populates="custom_scripts")


class CallLog(Base):
    """Call log model for storing call session information."""
    __tablename__ = "call_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="active")  # active, completed, abandoned, missed, draft
    summary = Column(JSON, nullable=True)
    transcript = Column(Text, nullable=True)  # Full transcript text
    structured_intake = Column(JSON, nullable=True)  # Collected structured data
    agent_decisions = Column(JSON, nullable=True)  # Tool calls and decisions
    voice_persona_id = Column(String, nullable=True)  # Voice used for call
    call_outcome = Column(String, nullable=True)  # booked, cancelled, no_show, rescheduled, failed
    is_draft = Column(Boolean, default=False)  # Is this a draft call?
    recovery_attempts = Column(Integer, default=0)  # Number of recovery attempts
    missed_call_detected = Column(Boolean, default=False)  # Was this a missed call?
    
    # Multi-channel support
    channel = Column(String, default="voice")  # voice, chat, whatsapp, form
    channel_metadata = Column(JSON, nullable=True)  # Channel-specific metadata
    
    # AI reasoning and triage
    ai_reasoning = Column(JSON, nullable=True)  # Detailed AI reasoning
    triage_recommendation = Column(JSON, nullable=True)  # Auto-triage results
    confidence_score = Column(Integer, nullable=True)  # AI confidence (0-100)
    
    # Relationships
    operator = relationship("Operator", back_populates="call_logs")
    user = relationship("User", back_populates="call_logs")
    transcripts = relationship("Transcript", back_populates="call_log")
    recovery_logs = relationship("RecoveryLog", back_populates="call_log")


class Transcript(Base):
    """Transcript model for storing conversation transcripts."""
    __tablename__ = "transcripts"
    
    id = Column(Integer, primary_key=True, index=True)
    call_log_id = Column(Integer, ForeignKey("call_logs.id"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    metadata = Column(JSON, nullable=True)  # Store tool calls, etc.
    
    # Relationships
    call_log = relationship("CallLog", back_populates="transcripts")


class RecoveryLog(Base):
    """Recovery log model for tracking missed call recovery attempts."""
    __tablename__ = "recovery_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    call_log_id = Column(Integer, ForeignKey("call_logs.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    recovery_type = Column(String, nullable=False)  # callback, reschedule, follow_up
    status = Column(String, default="pending")  # pending, success, failed, cancelled
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    recovery_notes = Column(Text, nullable=True)
    callback_scheduled = Column(Boolean, default=False)
    callback_datetime = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    call_log = relationship("CallLog", back_populates="recovery_logs")
    operator = relationship("Operator", back_populates="recovery_logs")


class CallHistory(Base):
    """Call history model for storing past calls per client for context-aware suggestions."""
    __tablename__ = "call_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    call_log_id = Column(Integer, ForeignKey("call_logs.id"), nullable=False)
    call_type = Column(String, nullable=True)  # booking, inquiry, reschedule, cancellation
    call_outcome = Column(String, nullable=True)  # booked, cancelled, no_show, completed
    industry_preset = Column(String, nullable=True)
    structured_intake = Column(JSON, nullable=True)
    call_duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="call_history")
    operator = relationship("Operator", backref="call_history")
    call_log = relationship("CallLog", foreign_keys=[call_log_id])


class ClientProfile(Base):
    """Client profile model for storing relevant info for triage and follow-up."""
    __tablename__ = "client_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    total_calls = Column(Integer, default=0)
    total_bookings = Column(Integer, default=0)
    cancellations = Column(Integer, default=0)
    no_shows = Column(Integer, default=0)
    preferred_times = Column(JSON, nullable=True)  # Preferred time slots
    preferred_services = Column(JSON, nullable=True)  # Preferred services/types
    risk_score = Column(Integer, default=0)  # No-show risk score (0-100)
    last_call_at = Column(DateTime(timezone=True), nullable=True)
    profile_data = Column(JSON, nullable=True)  # Additional profile data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="client_profile")
    operator = relationship("Operator", backref="client_profiles")


class DemoUsage(Base):
    """Demo usage model for tracking demo calls for first-time users."""
    __tablename__ = "demo_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)  # Anonymous session or user_id
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Optional user ID
    feature_name = Column(String, nullable=False, index=True)  # voice_clone, schedule_demo, call_draft, etc.
    tries_used = Column(Integer, default=1)
    last_attempt_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    demo_call_number = Column(Integer, default=1)  # Legacy: 1, 2, or 3
    demo_type = Column(String, nullable=True)  # clinic, salon, tutor, university
    call_log_id = Column(Integer, ForeignKey("call_logs.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    call_log = relationship("CallLog", foreign_keys=[call_log_id])
    user = relationship("User", backref="demo_usage")


class VoiceCloneDemo(Base):
    """Voice clone demo model for tracking voice clone previews and exports."""
    __tablename__ = "voice_clone_demo"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    voice_id = Column(String, nullable=False)
    input_text = Column(String, nullable=False)  # Limited to 100 chars
    playback_url = Column(String, nullable=True)
    exported_flag = Column(Boolean, default=False)
    demo_tries_remaining = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    exported_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="voice_clone_demos")


class Feedback(Base):
    """Feedback model for tracking AI response ratings and comments."""
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=False)
    call_log_id = Column(Integer, ForeignKey("call_logs.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    feedback_type = Column(String, nullable=True)  # ai_response, scheduling, recovery, overall
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    operator = relationship("Operator", backref="feedback")
    call_log = relationship("CallLog", foreign_keys=[call_log_id])


class RecoveryMetrics(Base):
    """Recovery metrics model for tracking missed call recovery success."""
    __tablename__ = "recovery_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    total_missed_calls = Column(Integer, default=0)
    recovery_attempts = Column(Integer, default=0)
    successful_recoveries = Column(Integer, default=0)
    failed_recoveries = Column(Integer, default=0)
    success_rate = Column(Integer, default=0)  # Percentage
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    operator = relationship("Operator", backref="recovery_metrics")


class VoiceCloneSettings(Base):
    """Voice clone settings model for per-user voice parameters."""
    __tablename__ = "voice_clone_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    voice_id = Column(String, nullable=False)  # ElevenLabs voice ID
    tone = Column(Integer, default=50)  # 0-100 slider
    speed = Column(Integer, default=50)  # 0-100 slider
    energy = Column(Integer, default=50)  # 0-100 slider
    stability = Column(Float, default=0.5)  # 0.0-1.0
    similarity_boost = Column(Float, default=0.75)  # 0.0-1.0
    style = Column(Float, default=0.0)  # 0.0-1.0
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="voice_clone_settings")
    operator = relationship("Operator", backref="voice_clone_settings")


class SavedVoice(Base):
    """Saved voice clone model for storing and reusing cloned voices."""
    __tablename__ = "saved_voices"
    
    id = Column(Integer, primary_key=True, index=True)
    saved_voice_id = Column(String, unique=True, nullable=False, index=True)  # Unique ID for this saved voice
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    session_id = Column(String, index=True, nullable=True)  # For demo users
    voice_id = Column(String, nullable=False)  # ElevenLabs voice ID
    voice_name = Column(String, nullable=False)  # Friendly name
    audio_sample_paths = Column(JSON, nullable=True)  # List of audio sample paths used
    cloned_voice_reference = Column(String, nullable=True)  # Reference to ClonedVoice if exists
    tone = Column(Integer, default=50)  # 0-100 slider
    speed = Column(Integer, default=50)  # 0-100 slider
    energy = Column(Integer, default=50)  # 0-100 slider
    stability = Column(Float, default=0.5)  # 0.0-1.0
    similarity_boost = Column(Float, default=0.75)  # 0.0-1.0
    style = Column(Float, default=0.0)  # 0.0-1.0
    is_demo = Column(Boolean, default=False)  # True for demo/temporary voices
    is_active = Column(Boolean, default=True)  # False if deleted/expired
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # For demo voices
    
    # Relationships
    user = relationship("User", backref="saved_voices")
    operator = relationship("Operator", backref="saved_voices")


class SimulationMetrics(Base):
    """Simulation metrics model for tracking per-user simulation results."""
    __tablename__ = "simulation_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=False)
    simulation_id = Column(String, nullable=False, index=True)
    total_calls = Column(Integer, default=0)
    successful_calls = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    average_transcript_length = Column(Integer, default=0)
    average_tool_calls = Column(Float, default=0.0)
    bookings_created = Column(Integer, default=0)
    metrics_data = Column(JSON, nullable=True)  # Additional metrics
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    operator = relationship("Operator", backref="simulation_metrics")
