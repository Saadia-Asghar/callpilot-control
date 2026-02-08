"""
Auto-triage service for collecting structured information and AI-based recommendations.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models import CallLog, IndustryPreset
from industry_presets import industry_preset_service
from agent import conversation_agent
from logging_config import get_logger

logger = get_logger("auto_triage")


class AutoTriageService:
    """Service for automatic triage and appointment type recommendations."""
    
    def triage_call(
        self,
        db: Session,
        call_log_id: int,
        operator_id: int,
        collected_data: Dict[str, Any],
        industry_preset: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform auto-triage on collected information.
        
        Args:
            db: Database session
            call_log_id: Call log ID
            operator_id: Operator ID
            collected_data: Structured data collected during call
            industry_preset: Industry preset name
        
        Returns:
            Dict with triage recommendation, priority, and reasoning
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            return {"error": "Call log not found"}
        
        # Get industry preset if not provided
        if not industry_preset:
            industry_preset = call_log.industry_preset
        
        if not industry_preset:
            # Try to get from operator
            from models import Operator
            operator = db.query(Operator).filter(Operator.id == operator_id).first()
            if operator:
                industry_preset = operator.industry_preset
        
        # Generate AI-based triage recommendation
        recommendation = self._generate_triage_recommendation(
            db,
            collected_data,
            industry_preset
        )
        
        # Store recommendation in call log
        call_log.triage_recommendation = recommendation
        call_log.is_draft = True  # Keep as draft for operator review
        db.commit()
        
        logger.info(f"Triage completed for call {call_log_id}: {recommendation.get('appointment_type')}")
        
        return {
            "call_log_id": call_log_id,
            "triage_recommendation": recommendation,
            "status": "pending_review"
        }
    
    def _generate_triage_recommendation(
        self,
        db: Session,
        collected_data: Dict[str, Any],
        industry_preset: Optional[str]
    ) -> Dict[str, Any]:
        """
        Generate triage recommendation using AI and preset logic.
        
        Returns:
            Dict with appointment_type, priority, and reasoning
        """
        recommendation = {
            "appointment_type": "standard",
            "priority": "normal",
            "urgency_score": 50,
            "reasoning": [],
            "suggested_duration": 30,
            "suggested_buffer": 5
        }
        
        # Industry-specific triage logic
        if industry_preset == "clinic":
            recommendation = self._triage_clinic(collected_data)
        elif industry_preset == "salon":
            recommendation = self._triage_salon(collected_data)
        elif industry_preset == "tutor":
            recommendation = self._triage_tutor(collected_data)
        elif industry_preset == "university":
            recommendation = self._triage_university(collected_data)
        else:
            recommendation = self._triage_generic(collected_data)
        
        return recommendation
    
    def _triage_clinic(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Triage logic for clinic appointments."""
        recommendation = {
            "appointment_type": "routine",
            "priority": "normal",
            "urgency_score": 50,
            "reasoning": [],
            "suggested_duration": 30,
            "suggested_buffer": 10
        }
        
        # Check urgency
        urgency = data.get("urgency", "").lower()
        if "urgent" in urgency or "emergency" in urgency:
            recommendation["appointment_type"] = "urgent"
            recommendation["priority"] = "high"
            recommendation["urgency_score"] = 90
            recommendation["reasoning"].append("Patient reported urgent symptoms")
            recommendation["suggested_duration"] = 45
        elif "routine" in urgency or "checkup" in urgency.lower():
            recommendation["appointment_type"] = "routine"
            recommendation["priority"] = "low"
            recommendation["urgency_score"] = 30
            recommendation["reasoning"].append("Routine checkup")
        
        # Check reason
        reason = data.get("reason", "").lower()
        if "follow" in reason or "follow-up" in reason:
            recommendation["appointment_type"] = "follow_up"
            recommendation["suggested_duration"] = 20
            recommendation["reasoning"].append("Follow-up appointment")
        
        return recommendation
    
    def _triage_salon(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Triage logic for salon appointments."""
        recommendation = {
            "appointment_type": "standard",
            "priority": "normal",
            "urgency_score": 50,
            "reasoning": [],
            "suggested_duration": 60,
            "suggested_buffer": 5
        }
        
        service_type = data.get("service_type", "").lower()
        
        if "color" in service_type or "dye" in service_type:
            recommendation["appointment_type"] = "color_service"
            recommendation["suggested_duration"] = 120
            recommendation["reasoning"].append("Color service requires longer duration")
        elif "cut" in service_type:
            recommendation["appointment_type"] = "haircut"
            recommendation["suggested_duration"] = 45
            recommendation["reasoning"].append("Standard haircut")
        elif "styling" in service_type:
            recommendation["appointment_type"] = "styling"
            recommendation["suggested_duration"] = 60
            recommendation["reasoning"].append("Styling service")
        
        # Check for special occasion
        if "occasion" in data or "event" in str(data).lower():
            recommendation["priority"] = "high"
            recommendation["urgency_score"] = 70
            recommendation["reasoning"].append("Special occasion - prioritize scheduling")
        
        return recommendation
    
    def _triage_tutor(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Triage logic for tutoring appointments."""
        recommendation = {
            "appointment_type": "standard",
            "priority": "normal",
            "urgency_score": 50,
            "reasoning": [],
            "suggested_duration": 60,
            "suggested_buffer": 5
        }
        
        level = data.get("level", "").lower()
        subject = data.get("subject", "").lower()
        
        if "college" in level or "university" in level:
            recommendation["appointment_type"] = "advanced"
            recommendation["suggested_duration"] = 90
            recommendation["reasoning"].append("Advanced level requires longer session")
        elif "elementary" in level:
            recommendation["appointment_type"] = "elementary"
            recommendation["suggested_duration"] = 45
            recommendation["reasoning"].append("Elementary level - shorter session")
        
        # Check for exam prep
        if "exam" in subject.lower() or "test" in subject.lower():
            recommendation["priority"] = "high"
            recommendation["urgency_score"] = 75
            recommendation["reasoning"].append("Exam preparation - prioritize scheduling")
        
        return recommendation
    
    def _triage_university(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Triage logic for university office appointments."""
        recommendation = {
            "appointment_type": "standard",
            "priority": "normal",
            "urgency_score": 50,
            "reasoning": [],
            "suggested_duration": 30,
            "suggested_buffer": 5
        }
        
        appointment_type = data.get("appointment_type", "").lower()
        
        if "financial" in appointment_type or "aid" in appointment_type:
            recommendation["appointment_type"] = "financial_aid"
            recommendation["suggested_duration"] = 45
            recommendation["reasoning"].append("Financial aid appointments require more time")
        elif "academic" in appointment_type or "advising" in appointment_type:
            recommendation["appointment_type"] = "academic_advising"
            recommendation["suggested_duration"] = 30
            recommendation["reasoning"].append("Academic advising")
        elif "registration" in appointment_type:
            recommendation["appointment_type"] = "registration"
            recommendation["suggested_duration"] = 20
            recommendation["reasoning"].append("Registration assistance")
        
        # Check for deadline urgency
        if "deadline" in str(data).lower() or "urgent" in str(data).lower():
            recommendation["priority"] = "high"
            recommendation["urgency_score"] = 80
            recommendation["reasoning"].append("Deadline approaching - high priority")
        
        return recommendation
    
    def _triage_generic(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generic triage logic for unknown industry."""
        recommendation = {
            "appointment_type": "standard",
            "priority": "normal",
            "urgency_score": 50,
            "reasoning": ["Standard appointment"],
            "suggested_duration": 30,
            "suggested_buffer": 5
        }
        
        # Check for urgency keywords
        urgency_keywords = ["urgent", "asap", "emergency", "immediate"]
        data_str = str(data).lower()
        
        if any(keyword in data_str for keyword in urgency_keywords):
            recommendation["priority"] = "high"
            recommendation["urgency_score"] = 75
            recommendation["reasoning"].append("Urgency detected in request")
        
        return recommendation


# Global instance
auto_triage_service = AutoTriageService()
