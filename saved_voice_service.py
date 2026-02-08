"""
Saved voice service for managing saved and reusable cloned voices.
Handles saving, listing, and applying saved voices to scripts.
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from models import SavedVoice, ClonedVoice, User, Operator
from demo_usage_service import demo_usage_service
from logging_config import get_logger

logger = get_logger("saved_voice")


class SavedVoiceService:
    """Service for managing saved voice clones."""
    
    DEMO_VOICE_EXPIRY_HOURS = 24  # Demo voices expire after 24 hours
    MAX_DEMO_VOICES = 1  # Only 1 temporary voice clone for demo users
    
    def save_voice(
        self,
        db: Session,
        voice_id: str,
        voice_name: str,
        user_id: Optional[int] = None,
        operator_id: Optional[int] = None,
        session_id: Optional[str] = None,
        audio_sample_paths: Optional[List[str]] = None,
        cloned_voice_reference: Optional[str] = None,
        tone: int = 50,
        speed: int = 50,
        energy: int = 50,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0,
        is_demo: bool = False
    ) -> Dict[str, Any]:
        """
        Save a voice clone for reuse.
        
        Args:
            db: Database session
            voice_id: ElevenLabs voice ID
            voice_name: Friendly name for the voice
            user_id: Optional user ID
            operator_id: Optional operator ID
            session_id: Optional session ID (for demo users)
            audio_sample_paths: List of audio sample paths used
            cloned_voice_reference: Reference to ClonedVoice if exists
            tone: Tone parameter (0-100)
            speed: Speed parameter (0-100)
            energy: Energy parameter (0-100)
            stability: Stability parameter (0.0-1.0)
            similarity_boost: Similarity boost (0.0-1.0)
            style: Style parameter (0.0-1.0)
            is_demo: True if this is a demo/temporary voice
        
        Returns:
            Dict with saved_voice_id and metadata
        
        Raises:
            ValueError: If demo limit exceeded
        """
        # Check demo limits for demo users
        if is_demo and session_id:
            # Check if user already has a demo voice
            existing_demo_voices = db.query(SavedVoice).filter(
                SavedVoice.session_id == session_id,
                SavedVoice.is_demo == True,
                SavedVoice.is_active == True
            ).count()
            
            if existing_demo_voices >= self.MAX_DEMO_VOICES:
                raise ValueError(f"Demo users can only save {self.MAX_DEMO_VOICES} temporary voice clone")
            
            # Check demo usage
            available = demo_usage_service.check_feature_availability(
                db, "voice_clone", session_id, None
            )
            if not available:
                raise ValueError("Maximum demo tries exceeded for voice clone")
            
            # Increment demo usage
            demo_usage_service.increment_demo_usage(db, "voice_clone", session_id, None)
        
        # Generate unique saved_voice_id
        saved_voice_id = f"sv_{uuid.uuid4().hex[:12]}"
        
        # Set expiry for demo voices
        expires_at = None
        if is_demo:
            expires_at = datetime.utcnow() + timedelta(hours=self.DEMO_VOICE_EXPIRY_HOURS)
        
        # Create saved voice record
        saved_voice = SavedVoice(
            saved_voice_id=saved_voice_id,
            voice_id=voice_id,
            voice_name=voice_name,
            user_id=user_id,
            operator_id=operator_id,
            session_id=session_id,
            audio_sample_paths=audio_sample_paths or [],
            cloned_voice_reference=cloned_voice_reference,
            tone=tone,
            speed=speed,
            energy=energy,
            stability=stability,
            similarity_boost=similarity_boost,
            style=style,
            is_demo=is_demo,
            expires_at=expires_at
        )
        
        db.add(saved_voice)
        db.commit()
        db.refresh(saved_voice)
        
        logger.info(f"Saved voice: {saved_voice_id} - {voice_name} (demo: {is_demo})")
        
        return {
            "success": True,
            "saved_voice_id": saved_voice_id,
            "voice_id": voice_id,
            "voice_name": voice_name,
            "is_demo": is_demo,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "ready_for_frontend": True
        }
    
    def list_saved_voices(
        self,
        db: Session,
        user_id: Optional[int] = None,
        operator_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List all saved voices for a user/operator/session.
        
        Args:
            db: Database session
            user_id: Optional user ID
            operator_id: Optional operator ID
            session_id: Optional session ID
        
        Returns:
            Dict with list of saved voices and metadata
        """
        query = db.query(SavedVoice).filter(SavedVoice.is_active == True)
        
        # Filter by user/operator/session
        if user_id:
            query = query.filter(SavedVoice.user_id == user_id)
        elif operator_id:
            query = query.filter(SavedVoice.operator_id == operator_id)
        elif session_id:
            query = query.filter(SavedVoice.session_id == session_id)
        else:
            # Return empty if no identifier
            return {
                "saved_voices": [],
                "count": 0,
                "ready_for_frontend": True
            }
        
        # Filter out expired demo voices
        now = datetime.utcnow()
        saved_voices = query.filter(
            (SavedVoice.expires_at.is_(None)) | (SavedVoice.expires_at > now)
        ).order_by(SavedVoice.created_at.desc()).all()
        
        # Clean up expired demo voices
        expired_count = 0
        for voice in saved_voices:
            if voice.is_demo and voice.expires_at and voice.expires_at <= now:
                voice.is_active = False
                expired_count += 1
        
        if expired_count > 0:
            db.commit()
            # Re-query after cleanup
            saved_voices = query.filter(
                (SavedVoice.expires_at.is_(None)) | (SavedVoice.expires_at > now)
            ).order_by(SavedVoice.created_at.desc()).all()
        
        voices_list = [
            {
                "saved_voice_id": sv.saved_voice_id,
                "voice_id": sv.voice_id,
                "voice_name": sv.voice_name,
                "tone": sv.tone,
                "speed": sv.speed,
                "energy": sv.energy,
                "stability": sv.stability,
                "similarity_boost": sv.similarity_boost,
                "style": sv.style,
                "is_demo": sv.is_demo,
                "created_at": sv.created_at.isoformat() if sv.created_at else None,
                "expires_at": sv.expires_at.isoformat() if sv.expires_at else None
            }
            for sv in saved_voices
        ]
        
        return {
            "saved_voices": voices_list,
            "count": len(voices_list),
            "ready_for_frontend": True
        }
    
    def get_saved_voice(
        self,
        db: Session,
        saved_voice_id: str,
        user_id: Optional[int] = None,
        operator_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Optional[SavedVoice]:
        """
        Get a specific saved voice by ID.
        
        Args:
            db: Database session
            saved_voice_id: Saved voice ID
            user_id: Optional user ID (for authorization)
            operator_id: Optional operator ID (for authorization)
            session_id: Optional session ID (for authorization)
        
        Returns:
            SavedVoice object or None if not found
        """
        saved_voice = db.query(SavedVoice).filter(
            SavedVoice.saved_voice_id == saved_voice_id,
            SavedVoice.is_active == True
        ).first()
        
        if not saved_voice:
            return None
        
        # Check expiry
        if saved_voice.expires_at and saved_voice.expires_at <= datetime.utcnow():
            saved_voice.is_active = False
            db.commit()
            return None
        
        # Check authorization
        if user_id and saved_voice.user_id != user_id:
            return None
        if operator_id and saved_voice.operator_id != operator_id:
            return None
        if session_id and saved_voice.session_id != session_id:
            return None
        
        return saved_voice
    
    def apply_saved_voice_to_script(
        self,
        db: Session,
        script_text: str,
        saved_voice_id: str,
        user_id: Optional[int] = None,
        operator_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Apply a saved voice to generate TTS for a script.
        
        Args:
            db: Database session
            script_text: Text to convert to speech
            saved_voice_id: Saved voice ID to use
            user_id: Optional user ID
            operator_id: Optional operator ID
            session_id: Optional session ID
        
        Returns:
            Dict with TTS audio URL and metadata
        """
        from voice_service import voice_service
        
        # Get saved voice
        saved_voice = self.get_saved_voice(db, saved_voice_id, user_id, operator_id, session_id)
        if not saved_voice:
            return {
                "success": False,
                "error": "Saved voice not found or expired",
                "ready_for_frontend": True
            }
        
        # Generate TTS with saved voice parameters
        result = voice_service.text_to_speech(
            text=script_text,
            voice_id=saved_voice.voice_id,
            style=saved_voice.style,
            stability=saved_voice.stability,
            similarity_boost=saved_voice.similarity_boost
        )
        
        if result.get("status") == "success":
            audio_url = f"/voice/tts/audio/{saved_voice.saved_voice_id}"
            
            return {
                "success": True,
                "saved_voice_id": saved_voice_id,
                "voice_id": saved_voice.voice_id,
                "voice_name": saved_voice.voice_name,
                "tts_audio_url": audio_url,
                "script_text": script_text,
                "parameters": {
                    "tone": saved_voice.tone,
                    "speed": saved_voice.speed,
                    "energy": saved_voice.energy,
                    "stability": saved_voice.stability,
                    "similarity_boost": saved_voice.similarity_boost,
                    "style": saved_voice.style
                },
                "ready_for_frontend": True
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Failed to generate TTS"),
                "ready_for_frontend": True
            }
    
    def cleanup_expired_demo_voices(self, db: Session) -> int:
        """
        Clean up expired demo voices.
        
        Args:
            db: Database session
        
        Returns:
            Number of voices cleaned up
        """
        now = datetime.utcnow()
        expired_voices = db.query(SavedVoice).filter(
            SavedVoice.is_demo == True,
            SavedVoice.is_active == True,
            SavedVoice.expires_at <= now
        ).all()
        
        count = len(expired_voices)
        for voice in expired_voices:
            voice.is_active = False
        
        if count > 0:
            db.commit()
            logger.info(f"Cleaned up {count} expired demo voices")
        
        return count


# Global instance
saved_voice_service = SavedVoiceService()
