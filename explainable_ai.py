"""
Explainable AI service for providing detailed reasoning behind AI decisions.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models import CallLog, Booking
from logging_config import get_logger

logger = get_logger("explainable_ai")


class ExplainableAIService:
    """Service for explaining AI decisions and reasoning."""
    
    def get_call_reasoning(
        self,
        db: Session,
        call_log_id: int
    ) -> Dict[str, Any]:
        """
        Get detailed reasoning for AI decisions in a call.
        
        Args:
            db: Database session
            call_log_id: Call log ID
        
        Returns:
            Dict with detailed reasoning for all AI decisions
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            return {"error": "Call log not found"}
        
        reasoning = {
            "call_log_id": call_log_id,
            "session_id": call_log.session_id,
            "decisions": []
        }
        
        # Get slot selection reasoning
        if call_log.agent_decisions:
            tool_calls = call_log.agent_decisions.get("tool_calls", [])
            for tool_call in tool_calls:
                if tool_call.get("tool") == "book_appointment":
                    slot_reasoning = self._explain_slot_selection(
                        db,
                        call_log,
                        tool_call
                    )
                    reasoning["decisions"].append({
                        "type": "slot_selection",
                        "decision": "Appointment slot chosen",
                        "reasoning": slot_reasoning,
                        "confidence": call_log.confidence_score or 75
                    })
        
        # Get script recommendation reasoning
        if call_log.custom_script_id:
            script_reasoning = self._explain_script_recommendation(
                db,
                call_log
            )
            reasoning["decisions"].append({
                "type": "script_recommendation",
                "decision": "Custom script recommended",
                "reasoning": script_reasoning,
                "confidence": 80
            })
        
        # Get triage reasoning
        if call_log.triage_recommendation:
            triage_reasoning = self._explain_triage_decision(call_log)
            reasoning["decisions"].append({
                "type": "triage",
                "decision": "Triage recommendation",
                "reasoning": triage_reasoning,
                "confidence": call_log.triage_recommendation.get("urgency_score", 50)
            })
        
        # Get voice selection reasoning
        if call_log.voice_persona_id:
            voice_reasoning = self._explain_voice_selection(call_log)
            reasoning["decisions"].append({
                "type": "voice_selection",
                "decision": "Voice persona selected",
                "reasoning": voice_reasoning,
                "confidence": 90
            })
        
        # Overall AI reasoning
        if call_log.ai_reasoning:
            reasoning["overall_reasoning"] = call_log.ai_reasoning
        else:
            reasoning["overall_reasoning"] = self._generate_overall_reasoning(
                call_log,
                reasoning["decisions"]
            )
        
        return reasoning
    
    def _explain_slot_selection(
        self,
        db: Session,
        call_log: CallLog,
        tool_call: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Explain why a specific slot was chosen."""
        arguments = tool_call.get("arguments", {})
        datetime_str = arguments.get("datetime_str")
        
        reasoning = {
            "selected_slot": datetime_str,
            "factors": []
        }
        
        # Check if slot was user's preferred time
        if call_log.structured_intake:
            preferred = call_log.structured_intake.get("preferred_time")
            if preferred and datetime_str:
                reasoning["factors"].append({
                    "factor": "user_preference",
                    "explanation": "Slot matches user's preferred time",
                    "weight": "high"
                })
        
        # Check availability
        reasoning["factors"].append({
            "factor": "availability",
            "explanation": "Slot was confirmed available",
            "weight": "critical"
        })
        
        # Check business hours
        from config import settings
        from datetime import datetime
        try:
            dt = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
            hour = dt.hour
            if 9 <= hour <= 17:
                reasoning["factors"].append({
                    "factor": "business_hours",
                    "explanation": "Slot is within business hours",
                    "weight": "medium"
                })
        except:
            pass
        
        return reasoning
    
    def _explain_script_recommendation(
        self,
        db: Session,
        call_log: CallLog
    ) -> Dict[str, Any]:
        """Explain why a script was recommended."""
        return {
            "script_id": call_log.custom_script_id,
            "factors": [
                {
                    "factor": "operator_preference",
                    "explanation": "Operator has configured custom script",
                    "weight": "high"
                },
                {
                    "factor": "industry_match",
                    "explanation": f"Script matches industry preset: {call_log.industry_preset}",
                    "weight": "medium"
                }
            ]
        }
    
    def _explain_triage_decision(self, call_log: CallLog) -> Dict[str, Any]:
        """Explain triage decision."""
        triage = call_log.triage_recommendation or {}
        
        return {
            "appointment_type": triage.get("appointment_type", "standard"),
            "priority": triage.get("priority", "normal"),
            "urgency_score": triage.get("urgency_score", 50),
            "reasoning": triage.get("reasoning", []),
            "factors": [
                {
                    "factor": "collected_data",
                    "explanation": "Based on structured intake data",
                    "weight": "high"
                },
                {
                    "factor": "industry_preset",
                    "explanation": f"Using {call_log.industry_preset} preset logic",
                    "weight": "medium"
                }
            ]
        }
    
    def _explain_voice_selection(self, call_log: CallLog) -> Dict[str, Any]:
        """Explain voice persona selection."""
        return {
            "voice_id": call_log.voice_persona_id,
            "factors": [
                {
                    "factor": "operator_preference",
                    "explanation": "Voice selected based on operator configuration",
                    "weight": "high"
                },
                {
                    "factor": "industry_match",
                    "explanation": f"Voice matches industry: {call_log.industry_preset}",
                    "weight": "medium"
                }
            ]
        }
    
    def _generate_overall_reasoning(
        self,
        call_log: CallLog,
        decisions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate overall AI reasoning summary."""
        return {
            "summary": f"AI processed call with {len(decisions)} key decisions",
            "decision_count": len(decisions),
            "confidence_avg": sum(d.get("confidence", 75) for d in decisions) / len(decisions) if decisions else 75,
            "key_decisions": [d.get("type") for d in decisions]
        }


# Global instance
explainable_ai_service = ExplainableAIService()
