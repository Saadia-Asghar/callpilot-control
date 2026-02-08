"""
Call summary generator module for creating structured summaries after calls.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from models import CallLog, Transcript, Booking, User
import json


class CallSummaryGenerator:
    """Generator for call summaries and transcripts."""
    
    def generate_summary(
        self,
        db: Session,
        call_log_id: int
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive summary for a call session.
        
        Args:
            db: Database session
            call_log_id: ID of the call log to summarize
        
        Returns:
            Dict with structured summary, human-readable summary, and transcript
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            return {"error": "Call log not found"}
        
        # Get all transcripts for this call
        transcripts = db.query(Transcript).filter(
            Transcript.call_log_id == call_log_id
        ).order_by(Transcript.timestamp).all()
        
        # Extract conversation flow
        conversation = [
            {
                "role": t.role,
                "content": t.content,
                "timestamp": t.timestamp.isoformat(),
                "metadata": t.metadata
            }
            for t in transcripts
        ]
        
        # Extract key information
        bookings_created = []
        bookings_modified = []
        user_info = {}
        
        if call_log.user_id:
            user = db.query(User).filter(User.id == call_log.user_id).first()
            if user:
                user_info = {
                    "id": user.id,
                    "name": user.name,
                    "phone": user.phone_number,
                    "email": user.email
                }
            
            # Find bookings created during this call
            bookings = db.query(Booking).filter(
                Booking.user_id == call_log.user_id,
                Booking.created_at >= call_log.started_at
            ).all()
            
            for booking in bookings:
                bookings_created.append({
                    "id": booking.id,
                    "datetime": booking.appointment_datetime.isoformat(),
                    "reason": booking.reason,
                    "status": booking.status
                })
        
        # Detect tool calls from transcripts
        tool_calls = []
        for transcript in transcripts:
            if transcript.metadata and "tool_calls" in transcript.metadata:
                tool_calls.extend(transcript.metadata["tool_calls"])
        
        # Generate structured summary
        structured_summary = {
            "call_log_id": call_log_id,
            "session_id": call_log.session_id,
            "started_at": call_log.started_at.isoformat(),
            "ended_at": call_log.ended_at.isoformat() if call_log.ended_at else None,
            "duration_seconds": (
                (call_log.ended_at - call_log.started_at).total_seconds()
                if call_log.ended_at else None
            ),
            "status": call_log.status,
            "user": user_info,
            "bookings_created": bookings_created,
            "bookings_modified": bookings_modified,
            "tool_calls": tool_calls,
            "message_count": len(conversation),
            "outcome": self._determine_outcome(bookings_created, tool_calls)
        }
        
        # Generate human-readable summary
        human_readable = self._generate_human_readable_summary(
            structured_summary,
            conversation
        )
        
        # Update call log with summary
        call_log.summary = structured_summary
        call_log.status = "completed"
        if not call_log.ended_at:
            call_log.ended_at = datetime.utcnow()
        db.commit()
        
        return {
            "structured": structured_summary,
            "human_readable": human_readable,
            "transcript": conversation
        }
    
    def _determine_outcome(
        self,
        bookings_created: List[Dict],
        tool_calls: List[Dict]
    ) -> str:
        """Determine the outcome of the call."""
        if bookings_created:
            return "appointment_booked"
        elif any(tc.get("tool") == "cancel_appointment" for tc in tool_calls):
            return "appointment_cancelled"
        elif any(tc.get("tool") == "reschedule_appointment" for tc in tool_calls):
            return "appointment_rescheduled"
        elif any(tc.get("tool") == "check_availability" for tc in tool_calls):
            return "availability_checked"
        else:
            return "information_gathering"
    
    def _generate_human_readable_summary(
        self,
        structured: Dict[str, Any],
        conversation: List[Dict[str, Any]]
    ) -> str:
        """Generate a human-readable summary text."""
        lines = []
        
        lines.append("=" * 60)
        lines.append("CALL SUMMARY")
        lines.append("=" * 60)
        lines.append("")
        
        if structured.get("user", {}).get("name"):
            lines.append(f"Caller: {structured['user']['name']}")
        
        lines.append(f"Session ID: {structured['session_id']}")
        lines.append(f"Started: {structured['started_at']}")
        if structured.get("ended_at"):
            lines.append(f"Ended: {structured['ended_at']}")
            if structured.get("duration_seconds"):
                duration_min = int(structured['duration_seconds'] / 60)
                duration_sec = int(structured['duration_seconds'] % 60)
                lines.append(f"Duration: {duration_min}m {duration_sec}s")
        
        lines.append("")
        lines.append("OUTCOME:")
        outcome = structured.get("outcome", "unknown")
        outcome_map = {
            "appointment_booked": "✓ Appointment successfully booked",
            "appointment_cancelled": "✗ Appointment cancelled",
            "appointment_rescheduled": "↻ Appointment rescheduled",
            "availability_checked": "ℹ Availability checked",
            "information_gathering": "ℹ Information gathering"
        }
        lines.append(outcome_map.get(outcome, outcome))
        
        if structured.get("bookings_created"):
            lines.append("")
            lines.append("BOOKINGS CREATED:")
            for booking in structured["bookings_created"]:
                lines.append(f"  - Booking #{booking['id']}")
                lines.append(f"    Date/Time: {booking['datetime']}")
                if booking.get("reason"):
                    lines.append(f"    Reason: {booking['reason']}")
                lines.append(f"    Status: {booking['status']}")
        
        lines.append("")
        lines.append(f"Total Messages: {structured.get('message_count', 0)}")
        lines.append(f"Tool Calls: {len(structured.get('tool_calls', []))}")
        
        lines.append("")
        lines.append("=" * 60)
        
        return "\n".join(lines)


# Global instance
summary_generator = CallSummaryGenerator()
