"""
Demo usage tracking service for per-feature demo limits.
Tracks usage per user per feature and enforces 3-try limits.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from models import DemoUsage, VoiceCloneDemo
from logging_config import get_logger

logger = get_logger("demo_usage")


class DemoUsageService:
    """Service for tracking and managing demo feature usage."""
    
    MAX_TRIES_PER_FEATURE = 3
    VOICE_CLONE_MAX_CHARS = 100
    
    FEATURES = {
        "voice_clone": "Voice Clone Preview",
        "schedule_demo": "Schedule Demo",
        "call_draft": "Call Draft",
        "simulation": "Simulation Run",
        "export": "Export Data"
    }
    
    def get_demo_usage(
        self,
        db: Session,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get demo usage status for all features.
        
        Args:
            db: Database session
            session_id: Session ID (for anonymous users)
            user_id: Optional user ID (for authenticated users)
        
        Returns:
            Dict with usage status per feature
        """
        identifier = str(user_id) if user_id else session_id
        if not identifier:
            # Return default (all features available)
            return {
                "session_id": None,
                "user_id": user_id,
                "features": {
                    feature: {
                        "tries_used": 0,
                        "tries_remaining": self.MAX_TRIES_PER_FEATURE,
                        "available": True,
                        "limit": self.MAX_TRIES_PER_FEATURE
                    }
                    for feature in self.FEATURES.keys()
                },
                "ready_for_frontend": True
            }
        
        # Get usage for each feature
        features_status = {}
        for feature in self.FEATURES.keys():
            usage = db.query(DemoUsage).filter(
                DemoUsage.feature_name == feature,
                (DemoUsage.session_id == identifier) | (DemoUsage.user_id == user_id) if user_id else (DemoUsage.session_id == identifier)
            ).first()
            
            if usage:
                tries_used = usage.tries_used
                tries_remaining = max(0, self.MAX_TRIES_PER_FEATURE - tries_used)
            else:
                tries_used = 0
                tries_remaining = self.MAX_TRIES_PER_FEATURE
            
            features_status[feature] = {
                "tries_used": tries_used,
                "tries_remaining": tries_remaining,
                "available": tries_remaining > 0,
                "limit": self.MAX_TRIES_PER_FEATURE,
                "last_attempt": usage.last_attempt_timestamp.isoformat() if usage and usage.last_attempt_timestamp else None
            }
        
        return {
            "session_id": session_id,
            "user_id": user_id,
            "features": features_status,
            "ready_for_frontend": True
        }
    
    def increment_demo_usage(
        self,
        db: Session,
        feature_name: str,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Increment demo usage for a specific feature.
        
        Args:
            db: Database session
            feature_name: Feature name (voice_clone, schedule_demo, etc.)
            session_id: Session ID
            user_id: Optional user ID
        
        Returns:
            Dict with updated usage status
        
        Raises:
            ValueError: If max tries exceeded
        """
        if feature_name not in self.FEATURES:
            raise ValueError(f"Invalid feature name: {feature_name}")
        
        identifier = str(user_id) if user_id else session_id
        if not identifier:
            raise ValueError("Either session_id or user_id must be provided")
        
        # Get or create usage record
        usage = db.query(DemoUsage).filter(
            DemoUsage.feature_name == feature_name,
            (DemoUsage.session_id == identifier) | (DemoUsage.user_id == user_id) if user_id else (DemoUsage.session_id == identifier)
        ).first()
        
        if usage:
            # Check if limit exceeded
            if usage.tries_used >= self.MAX_TRIES_PER_FEATURE:
                raise ValueError(f"Maximum {self.MAX_TRIES_PER_FEATURE} tries exceeded for {feature_name}")
            
            usage.tries_used += 1
            usage.last_attempt_timestamp = datetime.utcnow()
        else:
            usage = DemoUsage(
                session_id=identifier,
                user_id=user_id,
                feature_name=feature_name,
                tries_used=1,
                last_attempt_timestamp=datetime.utcnow()
            )
            db.add(usage)
        
        db.commit()
        db.refresh(usage)
        
        tries_remaining = max(0, self.MAX_TRIES_PER_FEATURE - usage.tries_used)
        
        logger.info(f"Demo usage incremented: {feature_name} - {identifier} - {usage.tries_used}/{self.MAX_TRIES_PER_FEATURE}")
        
        return {
            "success": True,
            "feature_name": feature_name,
            "tries_used": usage.tries_used,
            "tries_remaining": tries_remaining,
            "available": tries_remaining > 0,
            "limit": self.MAX_TRIES_PER_FEATURE,
            "ready_for_frontend": True
        }
    
    def check_feature_availability(
        self,
        db: Session,
        feature_name: str,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> bool:
        """
        Check if a feature is available (has remaining tries).
        
        Args:
            db: Database session
            feature_name: Feature name
            session_id: Session ID
            user_id: Optional user ID
        
        Returns:
            True if available, False otherwise
        """
        identifier = str(user_id) if user_id else session_id
        if not identifier:
            return True  # Default to available if no identifier
        
        usage = db.query(DemoUsage).filter(
            DemoUsage.feature_name == feature_name,
            (DemoUsage.session_id == identifier) | (DemoUsage.user_id == user_id) if user_id else (DemoUsage.session_id == identifier)
        ).first()
        
        if not usage:
            return True
        
        return usage.tries_used < self.MAX_TRIES_PER_FEATURE
    
    def validate_voice_clone_input(self, text: str) -> Dict[str, Any]:
        """
        Validate voice clone input text (max 100 characters).
        
        Args:
            text: Input text to validate
        
        Returns:
            Dict with validation result
        """
        if not text:
            return {
                "valid": False,
                "error": "Text cannot be empty",
                "char_count": 0,
                "max_chars": self.VOICE_CLONE_MAX_CHARS
            }
        
        char_count = len(text)
        if char_count > self.VOICE_CLONE_MAX_CHARS:
            return {
                "valid": False,
                "error": f"Text exceeds {self.VOICE_CLONE_MAX_CHARS} character limit",
                "char_count": char_count,
                "max_chars": self.VOICE_CLONE_MAX_CHARS
            }
        
        return {
            "valid": True,
            "char_count": char_count,
            "max_chars": self.VOICE_CLONE_MAX_CHARS
        }


# Global instance
demo_usage_service = DemoUsageService()
