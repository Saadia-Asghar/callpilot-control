"""
Call draft and conversation saving service.
Manages draft calls that can be reopened, edited, and finalized.
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from models import CallLog, Transcript, Operator
from logging_config import get_logger

logger = get_logger("draft")


class DraftService:
    """Service for managing call drafts."""
    
    def save_draft(
        self,
        db: Session,
        call_log_id: int,
        raw_transcript: Optional[str] = None,
        structured_intake: Optional[Dict[str, Any]] = None,
        agent_decisions: Optional[Dict[str, Any]] = None,
        voice_persona_id: Optional[str] = None,
        call_outcome: Optional[str] = None
    ) -> CallLog:
        """
        Save or update a call draft.
        
        Args:
            db: Database session
            call_log_id: Call log ID
            raw_transcript: Full transcript text
            structured_intake: Structured intake data
            agent_decisions: Agent tool calls and decisions
            voice_persona_id: Voice persona used
            call_outcome: Call outcome
        
        Returns:
            Updated CallLog object
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            raise ValueError(f"Call log {call_log_id} not found")
        
        # Update draft fields
        call_log.is_draft = True
        
        if raw_transcript is not None:
            call_log.raw_transcript = raw_transcript
        
        if structured_intake is not None:
            call_log.structured_intake = structured_intake
        
        if agent_decisions is not None:
            call_log.agent_decisions = agent_decisions
        
        if voice_persona_id is not None:
            call_log.voice_persona_id = voice_persona_id
        
        if call_outcome is not None:
            call_log.call_outcome = call_outcome
        
        db.commit()
        db.refresh(call_log)
        
        logger.info(f"Saved draft for call {call_log_id}")
        return call_log
    
    def get_draft(
        self,
        db: Session,
        call_log_id: int
    ) -> Optional[CallLog]:
        """
        Get a call draft.
        
        Args:
            db: Database session
            call_log_id: Call log ID
        
        Returns:
            CallLog object or None
        """
        return db.query(CallLog).filter(
            CallLog.id == call_log_id,
            CallLog.is_draft == True
        ).first()
    
    def list_drafts_by_operator(
        self,
        db: Session,
        operator_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[CallLog]:
        """
        List all drafts for an operator.
        
        Args:
            db: Database session
            operator_id: Operator ID
            limit: Maximum number of results
            offset: Offset for pagination
        
        Returns:
            List of CallLog objects
        """
        return db.query(CallLog).filter(
            CallLog.operator_id == operator_id,
            CallLog.is_draft == True
        ).order_by(CallLog.started_at.desc()).limit(limit).offset(offset).all()
    
    def update_draft(
        self,
        db: Session,
        call_log_id: int,
        updates: Dict[str, Any]
    ) -> CallLog:
        """
        Update a draft with new data.
        
        Args:
            db: Database session
            call_log_id: Call log ID
            updates: Dict with fields to update
        
        Returns:
            Updated CallLog object
        
        Raises:
            ValueError: If draft not found
        """
        call_log = self.get_draft(db, call_log_id)
        if not call_log:
            raise ValueError(f"Draft {call_log_id} not found")
        
        # Update allowed fields
        allowed_fields = [
            "raw_transcript", "structured_intake", "agent_decisions",
            "voice_persona_id", "call_outcome", "status"
        ]
        
        for field, value in updates.items():
            if field in allowed_fields and hasattr(call_log, field):
                setattr(call_log, field, value)
        
        db.commit()
        db.refresh(call_log)
        
        logger.info(f"Updated draft {call_log_id}")
        return call_log
    
    def finalize_draft(
        self,
        db: Session,
        call_log_id: int,
        call_outcome: Optional[str] = None
    ) -> CallLog:
        """
        Finalize a draft call (mark as completed, no longer draft).
        
        Args:
            db: Database session
            call_log_id: Call log ID
            call_outcome: Final call outcome
        
        Returns:
            Finalized CallLog object
        
        Raises:
            ValueError: If draft not found
        """
        call_log = self.get_draft(db, call_log_id)
        if not call_log:
            raise ValueError(f"Draft {call_log_id} not found")
        
        call_log.is_draft = False
        call_log.status = "completed"
        
        if call_outcome:
            call_log.call_outcome = call_outcome
        
        if not call_log.ended_at:
            from datetime import datetime
            call_log.ended_at = datetime.utcnow()
        
        db.commit()
        db.refresh(call_log)
        
        logger.info(f"Finalized draft {call_log_id}")
        return call_log
    
    def reopen_draft(
        self,
        db: Session,
        call_log_id: int
    ) -> CallLog:
        """
        Reopen a finalized call as a draft for editing.
        
        Args:
            db: Database session
            call_log_id: Call log ID
        
        Returns:
            Reopened CallLog object
        
        Raises:
            ValueError: If call log not found
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            raise ValueError(f"Call log {call_log_id} not found")
        
        call_log.is_draft = True
        call_log.status = "active"
        
        db.commit()
        db.refresh(call_log)
        
        logger.info(f"Reopened call {call_log_id} as draft")
        return call_log
    
    def get_draft_summary(
        self,
        db: Session,
        call_log_id: int
    ) -> Dict[str, Any]:
        """
        Get a summary of draft data.
        
        Args:
            db: Database session
            call_log_id: Call log ID
        
        Returns:
            Dict with draft summary
        """
        call_log = self.get_draft(db, call_log_id)
        if not call_log:
            return {"error": "Draft not found"}
        
        # Get transcripts
        transcripts = db.query(Transcript).filter(
            Transcript.call_log_id == call_log_id
        ).order_by(Transcript.timestamp).all()
        
        return {
            "call_log_id": call_log_id,
            "session_id": call_log.session_id,
            "operator_id": call_log.operator_id,
            "user_id": call_log.user_id,
            "started_at": call_log.started_at.isoformat() if call_log.started_at else None,
            "status": call_log.status,
            "is_draft": call_log.is_draft,
            "call_outcome": call_log.call_outcome,
            "industry_preset": call_log.industry_preset,
            "voice_persona_id": call_log.voice_persona_id,
            "structured_intake": call_log.structured_intake,
            "agent_decisions": call_log.agent_decisions,
            "transcript_count": len(transcripts),
            "has_transcript": bool(call_log.raw_transcript),
            "has_intake": bool(call_log.structured_intake),
            "has_decisions": bool(call_log.agent_decisions)
        }


# Global instance
draft_service = DraftService()
