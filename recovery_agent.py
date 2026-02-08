"""
Missed call recovery agent service.
Automatically triggers callback scheduling when calls are missed.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import CallLog, RecoveryLog, Operator, Booking
from agent import conversation_agent
from scheduling import scheduling_service
from logging_config import get_logger

logger = get_logger("recovery_agent")


class RecoveryAgent:
    """Service for handling missed call recovery."""
    
    def __init__(self):
        """Initialize the recovery agent."""
        self.max_recovery_attempts = 3
        self.recovery_delay_hours = 1  # Wait 1 hour before first recovery attempt
    
    def detect_missed_call(
        self,
        db: Session,
        call_log_id: int
    ) -> bool:
        """
        Detect if a call was missed and mark it for recovery.
        
        A call is considered missed if:
        - Status is 'missed' or 'abandoned'
        - No booking was created
        - Call duration was very short (< 30 seconds)
        
        Args:
            db: Database session
            call_log_id: Call log ID to check
        
        Returns:
            True if call is missed, False otherwise
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            return False
        
        # Check if already marked as missed
        if call_log.status == "missed":
            return True
        
        # Check if call was very short (likely missed)
        if call_log.ended_at and call_log.started_at:
            duration = (call_log.ended_at - call_log.started_at).total_seconds()
            if duration < 30:  # Less than 30 seconds
                call_log.status = "missed"
                db.commit()
                logger.info(f"Detected missed call: {call_log_id} (duration: {duration}s)")
                return True
        
        # Check if abandoned without booking
        if call_log.status == "abandoned":
            # Check if any booking was created
            bookings = db.query(Booking).filter(
                Booking.user_id == call_log.user_id,
                Booking.created_at >= call_log.started_at,
                Booking.created_at <= (call_log.ended_at or datetime.utcnow())
            ).count()
            
            if bookings == 0:
                call_log.status = "missed"
                db.commit()
                logger.info(f"Detected missed call: {call_log_id} (abandoned without booking)")
                return True
        
        return False
    
    def trigger_recovery(
        self,
        db: Session,
        call_log_id: int,
        operator_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Trigger recovery attempt for a missed call.
        
        Args:
            db: Database session
            call_log_id: Missed call log ID
            operator_id: Optional operator ID (uses call log's operator if not provided)
        
        Returns:
            Dict with recovery attempt details
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            return {"error": "Call log not found"}
        
        if call_log.status != "missed":
            return {"error": "Call is not marked as missed"}
        
        # Get operator
        operator_id = operator_id or call_log.operator_id
        if not operator_id:
            return {"error": "No operator associated with call"}
        
        # Check recovery attempts
        existing_recoveries = db.query(RecoveryLog).filter(
            RecoveryLog.missed_call_id == call_log_id
        ).order_by(RecoveryLog.recovery_attempt_number.desc()).first()
        
        attempt_number = (existing_recoveries.recovery_attempt_number + 1) if existing_recoveries else 1
        
        if attempt_number > self.max_recovery_attempts:
            return {
                "error": "Maximum recovery attempts reached",
                "max_attempts": self.max_recovery_attempts,
                "attempts": attempt_number - 1
            }
        
        # Create recovery log
        recovery_log = RecoveryLog(
            operator_id=operator_id,
            missed_call_id=call_log_id,
            recovery_attempt_number=attempt_number,
            recovery_status="pending"
        )
        db.add(recovery_log)
        db.commit()
        
        # Attempt to schedule callback
        try:
            result = self._attempt_callback_scheduling(db, call_log, recovery_log)
            
            recovery_log.recovery_status = result.get("status", "failed")
            recovery_log.recovery_notes = result.get("message", "")
            recovery_log.callback_scheduled = result.get("callback_scheduled", False)
            recovery_log.callback_datetime = result.get("callback_datetime")
            
            db.commit()
            
            # Update call log recovery attempts
            call_log.recovery_attempts = attempt_number
            db.commit()
            
            logger.info(f"Recovery attempt {attempt_number} for call {call_log_id}: {recovery_log.recovery_status}")
            
            return {
                "success": recovery_log.recovery_status == "successful",
                "recovery_id": recovery_log.id,
                "attempt_number": attempt_number,
                "status": recovery_log.recovery_status,
                "callback_scheduled": recovery_log.callback_scheduled,
                "callback_datetime": recovery_log.callback_datetime.isoformat() if recovery_log.callback_datetime else None,
                "message": recovery_log.recovery_notes
            }
        
        except Exception as e:
            logger.error(f"Recovery attempt failed: {str(e)}")
            recovery_log.recovery_status = "failed"
            recovery_log.recovery_notes = f"Error: {str(e)}"
            db.commit()
            
            return {
                "success": False,
                "error": str(e),
                "recovery_id": recovery_log.id,
                "attempt_number": attempt_number
            }
    
    def _attempt_callback_scheduling(
        self,
        db: Session,
        call_log: CallLog,
        recovery_log: RecoveryLog
    ) -> Dict[str, Any]:
        """
        Attempt to schedule a callback using the AI agent.
        
        Args:
            db: Database session
            call_log: Missed call log
            recovery_log: Recovery log entry
        
        Returns:
            Dict with scheduling result
        """
        if not call_log.user_id:
            return {
                "status": "failed",
                "message": "No user associated with call",
                "callback_scheduled": False
            }
        
        # Generate callback message
        callback_message = (
            f"Hello, we noticed we missed your call earlier. "
            f"We'd like to schedule a callback at your convenience. "
            f"When would be a good time for us to call you back?"
        )
        
        # Use agent to schedule callback
        conversation_history = []
        result = conversation_agent.process_message(
            message=callback_message,
            db=db,
            conversation_history=conversation_history,
            user_id=call_log.user_id,
            call_log_id=call_log.id
        )
        
        # Check if booking was created
        bookings = db.query(Booking).filter(
            Booking.user_id == call_log.user_id,
            Booking.created_at >= datetime.utcnow() - timedelta(minutes=5)
        ).order_by(Booking.created_at.desc()).first()
        
        if bookings:
            return {
                "status": "successful",
                "message": "Callback scheduled successfully",
                "callback_scheduled": True,
                "callback_datetime": bookings.appointment_datetime,
                "booking_id": bookings.id
            }
        else:
            # Check if agent response suggests scheduling
            agent_response = result.get("response", "").lower()
            if any(keyword in agent_response for keyword in ["schedule", "appointment", "time", "available"]):
                return {
                    "status": "attempted",
                    "message": "Recovery attempted but no booking confirmed",
                    "callback_scheduled": False
                }
            else:
                return {
                    "status": "failed",
                    "message": "Recovery attempt did not result in scheduling",
                    "callback_scheduled": False
                }
    
    def get_pending_recoveries(
        self,
        db: Session,
        operator_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get pending recovery calls.
        
        Args:
            db: Database session
            operator_id: Optional operator ID to filter by
        
        Returns:
            List of pending recovery calls
        """
        query = db.query(CallLog).filter(
            CallLog.missed_call_detected == True,
            CallLog.status == "missed"
        )
        
        if operator_id:
            query = query.filter(CallLog.operator_id == operator_id)
        
        # Get calls with pending or no recovery attempts
        pending_calls = []
        for call_log in query.all():
            recovery_logs = db.query(RecoveryLog).filter(
                RecoveryLog.missed_call_id == call_log.id
            ).all()
            
            # Check if has pending recovery or no recovery yet
            has_pending = any(r.status == "pending" for r in recovery_logs)
            max_attempts_reached = len(recovery_logs) >= self.max_recovery_attempts
            
            if (has_pending or len(recovery_logs) == 0) and not max_attempts_reached:
                pending_calls.append({
                    "call_log_id": call_log.id,
                    "session_id": call_log.session_id,
                    "user_id": call_log.user_id,
                    "missed_at": call_log.started_at.isoformat() if call_log.started_at else None,
                    "recovery_attempts": call_log.recovery_attempts,
                    "status": "pending"
                })
        
        return pending_calls
    
    def get_recovery_metrics(
        self,
        db: Session,
        operator_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get recovery metrics for dashboard.
        
        Args:
            db: Database session
            operator_id: Optional operator ID to filter by
            start_date: Optional start date
            end_date: Optional end date
        
        Returns:
            Dict with recovery metrics
        """
        query = db.query(RecoveryLog)
        
        if operator_id:
            query = query.filter(RecoveryLog.operator_id == operator_id)
        
        if start_date:
            query = query.filter(RecoveryLog.created_at >= start_date)
        
        if end_date:
            query = query.filter(RecoveryLog.created_at <= end_date)
        
        all_recoveries = query.all()
        
        total_attempts = len(all_recoveries)
        successful = len([r for r in all_recoveries if r.recovery_status == "successful"])
        failed = len([r for r in all_recoveries if r.recovery_status == "failed"])
        pending = len([r for r in all_recoveries if r.recovery_status == "pending"])
        human_intervention = len([r for r in all_recoveries if r.recovery_status == "human_intervention"])
        
        success_rate = (successful / total_attempts * 100) if total_attempts > 0 else 0
        
        return {
            "total_attempts": total_attempts,
            "successful": successful,
            "failed": failed,
            "pending": pending,
            "human_intervention": human_intervention,
            "success_rate": round(success_rate, 2),
            "recoveries": [
                {
                    "id": r.id,
                    "missed_call_id": r.missed_call_id,
                    "attempt_number": r.recovery_attempt_number,
                    "status": r.recovery_status,
                    "callback_scheduled": r.callback_scheduled,
                    "created_at": r.created_at.isoformat()
                }
                for r in all_recoveries[:10]  # Last 10 recoveries
            ]
        }
    
    def request_human_intervention(
        self,
        db: Session,
        recovery_id: int,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Request human intervention for a failed recovery.
        
        Args:
            db: Database session
            recovery_id: Recovery log ID
            notes: Optional notes for human operator
        
        Returns:
            Dict with intervention request details
        """
        recovery = db.query(RecoveryLog).filter(RecoveryLog.id == recovery_id).first()
        if not recovery:
            return {"error": "Recovery log not found"}
        
        recovery.recovery_status = "human_intervention"
        recovery.recovery_notes = notes or "Human intervention requested"
        db.commit()
        
        logger.info(f"Human intervention requested for recovery {recovery_id}")
        
        return {
            "success": True,
            "recovery_id": recovery_id,
            "status": "human_intervention",
            "message": "Human intervention requested"
        }


# Global instance
recovery_agent = RecoveryAgent()
