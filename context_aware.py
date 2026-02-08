"""
Context-aware call service for providing follow-up suggestions based on call history.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import CallHistory, CallLog, ClientProfile, User
from agent import conversation_agent
from logging_config import get_logger

logger = get_logger("context_aware")


class ContextAwareService:
    """Service for context-aware call suggestions."""
    
    def get_call_context(
        self,
        db: Session,
        user_id: int,
        operator_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get call context for a client including history and suggestions.
        
        Args:
            db: Database session
            user_id: User/client ID
            operator_id: Optional operator ID
        
        Returns:
            Dict with call context, history, and AI suggestions
        """
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        # Get call history
        query = db.query(CallHistory).filter(CallHistory.user_id == user_id)
        if operator_id:
            query = query.filter(CallHistory.operator_id == operator_id)
        
        call_history = query.order_by(desc(CallHistory.created_at)).limit(10).all()
        
        # Get client profile
        profile = db.query(ClientProfile).filter(
            ClientProfile.user_id == user_id
        ).first()
        
        # Get recent call log
        recent_call_query = db.query(CallLog).filter(CallLog.user_id == user_id)
        if operator_id:
            recent_call_query = recent_call_query.filter(
                CallLog.operator_id == operator_id
            )
        
        recent_call = recent_call_query.order_by(
            desc(CallLog.started_at)
        ).first()
        
        # Generate AI suggestions
        suggestions = self._generate_suggestions(
            db,
            user_id,
            call_history,
            profile,
            recent_call,
            operator_id
        )
        
        return {
            "user_id": user_id,
            "user_name": user.name,
            "call_history": [
                {
                    "call_id": ch.id,
                    "call_type": ch.call_type,
                    "call_outcome": ch.call_outcome,
                    "industry_preset": ch.industry_preset,
                    "created_at": ch.created_at.isoformat() if ch.created_at else None
                }
                for ch in call_history
            ],
            "total_calls": len(call_history),
            "client_profile": {
                "total_bookings": profile.total_bookings if profile else 0,
                "cancellations": profile.cancellations if profile else 0,
                "no_shows": profile.no_shows if profile else 0,
                "risk_score": profile.risk_score if profile else 0,
                "preferred_times": profile.preferred_times if profile else None
            } if profile else None,
            "recent_call": {
                "call_log_id": recent_call.id,
                "status": recent_call.status,
                "call_outcome": recent_call.call_outcome,
                "industry_preset": recent_call.industry_preset,
                "started_at": recent_call.started_at.isoformat() if recent_call.started_at else None
            } if recent_call else None,
            "ai_suggestions": suggestions
        }
    
    def _generate_suggestions(
        self,
        db: Session,
        user_id: int,
        call_history: List[CallHistory],
        profile: Optional[ClientProfile],
        recent_call: Optional[CallLog],
        operator_id: Optional[int]
    ) -> Dict[str, Any]:
        """
        Generate AI-based follow-up suggestions.
        
        Returns:
            Dict with recommended questions and actions
        """
        suggestions = {
            "recommended_questions": [],
            "recommended_actions": [],
            "context_notes": []
        }
        
        if not call_history:
            suggestions["recommended_questions"] = [
                "What brings you in today?",
                "Is this your first time scheduling with us?",
                "What's your preferred date and time?"
            ]
            suggestions["recommended_actions"] = [
                "Collect basic information",
                "Explain services available",
                "Schedule initial appointment"
            ]
            return suggestions
        
        # Analyze last call
        last_call = call_history[0] if call_history else None
        
        if last_call:
            # Follow-up based on call type
            if last_call.call_type == "booking":
                if last_call.call_outcome == "booked":
                    suggestions["recommended_questions"] = [
                        "How can I help you today?",
                        "Are you calling about your upcoming appointment?",
                        "Would you like to reschedule or make changes?"
                    ]
                    suggestions["recommended_actions"] = [
                        "Check existing booking status",
                        "Offer rescheduling if needed",
                        "Confirm appointment details"
                    ]
                elif last_call.call_outcome == "cancelled":
                    suggestions["recommended_questions"] = [
                        "I see you cancelled your last appointment. Would you like to reschedule?",
                        "What would be a better time for you?",
                        "Is there anything we can do to accommodate your schedule?"
                    ]
                    suggestions["recommended_actions"] = [
                        "Offer alternative time slots",
                        "Understand cancellation reason",
                        "Schedule new appointment"
                    ]
            
            elif last_call.call_type == "inquiry":
                suggestions["recommended_questions"] = [
                    "Are you ready to schedule today?",
                    "Do you have any questions about our services?",
                    "What's your preferred date and time?"
                ]
                suggestions["recommended_actions"] = [
                    "Convert inquiry to booking",
                    "Provide additional information",
                    "Schedule appointment"
                ]
        
        # Industry-specific suggestions
        if recent_call and recent_call.industry_preset:
            industry_suggestions = self._get_industry_suggestions(
                recent_call.industry_preset,
                profile
            )
            suggestions["recommended_questions"].extend(
                industry_suggestions.get("questions", [])
            )
            suggestions["recommended_actions"].extend(
                industry_suggestions.get("actions", [])
            )
        
        # Risk-based suggestions
        if profile and profile.risk_score > 70:
            suggestions["context_notes"].append(
                "High no-show risk detected. Consider sending reminder."
            )
            suggestions["recommended_actions"].append(
                "Send confirmation and reminder"
            )
        
        # Remove duplicates
        suggestions["recommended_questions"] = list(set(suggestions["recommended_questions"]))
        suggestions["recommended_actions"] = list(set(suggestions["recommended_actions"]))
        
        # Add confidence scores for each suggestion
        suggestions["recommended_questions_with_confidence"] = [
            {
                "question": q,
                "confidence": self._calculate_question_confidence(q, call_history, profile)
            }
            for q in suggestions["recommended_questions"]
        ]
        
        suggestions["recommended_actions_with_confidence"] = [
            {
                "action": a,
                "confidence": self._calculate_action_confidence(a, call_history, profile)
            }
            for a in suggestions["recommended_actions"]
        ]
        
        return suggestions
    
    def _calculate_question_confidence(
        self,
        question: str,
        call_history: List[CallHistory],
        profile: Optional[ClientProfile]
    ) -> int:
        """Calculate confidence score (0-100) for a question suggestion."""
        base_confidence = 70
        
        # Increase confidence if question matches last call context
        if call_history and question.lower() in str(call_history[0].structured_intake).lower():
            base_confidence += 15
        
        # Increase confidence based on profile data
        if profile and profile.total_calls > 0:
            base_confidence += min(10, profile.total_calls)
        
        return min(100, base_confidence)
    
    def _calculate_action_confidence(
        self,
        action: str,
        call_history: List[CallHistory],
        profile: Optional[ClientProfile]
    ) -> int:
        """Calculate confidence score (0-100) for an action suggestion."""
        base_confidence = 75
        
        # Increase confidence if action matches call outcome pattern
        if call_history:
            last_outcome = call_history[0].call_outcome
            if "booking" in action.lower() and last_outcome == "booked":
                base_confidence += 10
            elif "reschedule" in action.lower() and last_outcome == "cancelled":
                base_confidence += 15
        
        return min(100, base_confidence)
    
    def _get_industry_suggestions(
        self,
        industry_preset: str,
        profile: Optional[ClientProfile]
    ) -> Dict[str, List[str]]:
        """Get industry-specific suggestions."""
        suggestions = {
            "questions": [],
            "actions": []
        }
        
        if industry_preset == "clinic":
            suggestions["questions"] = [
                "How are you feeling today?",
                "Are you experiencing any symptoms?",
                "Is this a follow-up or new concern?"
            ]
            suggestions["actions"] = [
                "Assess urgency",
                "Collect insurance information",
                "Schedule appropriate appointment type"
            ]
        
        elif industry_preset == "salon":
            suggestions["questions"] = [
                "What service are you interested in?",
                "Do you have a preferred stylist?",
                "Is this for a special occasion?"
            ]
            suggestions["actions"] = [
                "Match service with stylist availability",
                "Suggest add-on services",
                "Schedule appointment"
            ]
        
        elif industry_preset == "tutor":
            suggestions["questions"] = [
                "What subject do you need help with?",
                "What's your current level?",
                "What specific topics are you struggling with?"
            ]
            suggestions["actions"] = [
                "Match with appropriate tutor",
                "Schedule regular sessions",
                "Set learning goals"
            ]
        
        elif industry_preset == "university":
            suggestions["questions"] = [
                "What type of appointment do you need?",
                "Do you have your student ID?",
                "What documents do you need to bring?"
            ]
            suggestions["actions"] = [
                "Verify student status",
                "Collect required documents list",
                "Schedule appointment"
            ]
        
        return suggestions
    
    def update_client_profile(
        self,
        db: Session,
        user_id: int,
        call_log: CallLog
    ):
        """
        Update client profile based on call outcome.
        
        Args:
            db: Database session
            user_id: User ID
            call_log: Call log to process
        """
        profile = db.query(ClientProfile).filter(
            ClientProfile.user_id == user_id
        ).first()
        
        if not profile:
            profile = ClientProfile(
                user_id=user_id,
                operator_id=call_log.operator_id
            )
            db.add(profile)
        
        # Update statistics
        profile.total_calls += 1
        profile.last_call_at = call_log.started_at
        
        if call_log.call_outcome == "booked":
            profile.total_bookings += 1
        elif call_log.call_outcome == "cancelled":
            profile.cancellations += 1
        elif call_log.call_outcome == "no_show":
            profile.no_shows += 1
        
        # Calculate risk score
        total_completed = profile.total_bookings
        if total_completed > 0:
            no_show_rate = profile.no_shows / total_completed
            cancellation_rate = profile.cancellations / total_completed
            profile.risk_score = int((no_show_rate + cancellation_rate) * 50)
        
        # Update preferred times
        if call_log.structured_intake and "preferred_time" in call_log.structured_intake:
            preferred_time = call_log.structured_intake["preferred_time"]
            if isinstance(preferred_time, dict) and "value" in preferred_time:
                try:
                    dt = datetime.fromisoformat(preferred_time["value"])
                    hour = dt.hour
                    if not profile.preferred_times:
                        profile.preferred_times = {"hours": []}
                    if hour not in profile.preferred_times["hours"]:
                        profile.preferred_times["hours"].append(hour)
                except:
                    pass
        
        db.commit()
        logger.info(f"Updated client profile for user {user_id}")


# Global instance
context_aware_service = ContextAwareService()
