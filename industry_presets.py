"""
Industry preset definitions and management service.
Pre-configured business profiles with flows, questions, and settings.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models import IndustryPreset, Operator
from logging_config import get_logger

logger = get_logger("industry_presets")


# Default industry presets
DEFAULT_PRESETS = {
    "clinic": {
        "name": "clinic",
        "display_name": "Medical Clinic",
        "slot_duration_minutes": 30,
        "buffer_time_minutes": 10,
        "call_script_flow": {
            "steps": [
                {
                    "type": "greeting",
                    "message": "Hello, thank you for calling. I'm here to help schedule your appointment."
                },
                {
                    "type": "question",
                    "question": "What is the reason for your visit today?",
                    "variable": "reason",
                    "required": True
                },
                {
                    "type": "question",
                    "question": "Are you experiencing any urgent symptoms that need immediate attention?",
                    "variable": "urgency",
                    "options": ["Yes - urgent", "No - routine"],
                    "required": True
                },
                {
                    "type": "question",
                    "question": "Do you have insurance? If yes, what's your insurance provider?",
                    "variable": "insurance",
                    "required": False
                },
                {
                    "type": "question",
                    "question": "What's your preferred date and time?",
                    "variable": "preferred_time",
                    "required": True
                },
                {
                    "type": "booking",
                    "action": "schedule_appointment"
                }
            ]
        },
        "intake_fields": {
            "reason": {"type": "text", "required": True, "label": "Reason for visit"},
            "urgency": {"type": "select", "required": True, "label": "Urgency level"},
            "insurance": {"type": "text", "required": False, "label": "Insurance provider"},
            "symptoms": {"type": "textarea", "required": False, "label": "Symptoms"},
            "preferred_time": {"type": "datetime", "required": True, "label": "Preferred time"}
        },
        "questions": [
            "What is the reason for your visit?",
            "Are you experiencing urgent symptoms?",
            "Do you have insurance?",
            "What's your preferred date and time?"
        ]
    },
    "salon": {
        "name": "salon",
        "display_name": "Hair Salon",
        "slot_duration_minutes": 60,
        "buffer_time_minutes": 5,
        "call_script_flow": {
            "steps": [
                {
                    "type": "greeting",
                    "message": "Hello! Welcome to our salon. How can I help you today?"
                },
                {
                    "type": "question",
                    "question": "What service would you like? (Haircut, Color, Styling, etc.)",
                    "variable": "service_type",
                    "required": True
                },
                {
                    "type": "question",
                    "question": "Do you have a preferred stylist?",
                    "variable": "stylist_preference",
                    "options": ["Yes", "No"],
                    "required": True
                },
                {
                    "type": "conditional",
                    "condition": {"variable": "stylist_preference", "value": "Yes"},
                    "then": {
                        "type": "question",
                        "question": "Which stylist would you prefer?",
                        "variable": "stylist_name",
                        "required": True
                    }
                },
                {
                    "type": "question",
                    "question": "What's your preferred date and time?",
                    "variable": "preferred_time",
                    "required": True
                },
                {
                    "type": "booking",
                    "action": "schedule_appointment"
                }
            ]
        },
        "intake_fields": {
            "service_type": {"type": "select", "required": True, "label": "Service type"},
            "stylist_preference": {"type": "select", "required": True, "label": "Stylist preference"},
            "stylist_name": {"type": "text", "required": False, "label": "Preferred stylist"},
            "preferred_time": {"type": "datetime", "required": True, "label": "Preferred time"}
        },
        "questions": [
            "What service would you like?",
            "Do you have a preferred stylist?",
            "What's your preferred date and time?"
        ]
    },
    "tutor": {
        "name": "tutor",
        "display_name": "Tutoring Service",
        "slot_duration_minutes": 60,
        "buffer_time_minutes": 5,
        "call_script_flow": {
            "steps": [
                {
                    "type": "greeting",
                    "message": "Hello! I'm here to help you schedule a tutoring session."
                },
                {
                    "type": "question",
                    "question": "What subject do you need help with?",
                    "variable": "subject",
                    "required": True
                },
                {
                    "type": "question",
                    "question": "What's your current level? (Elementary, Middle School, High School, College)",
                    "variable": "level",
                    "required": True
                },
                {
                    "type": "question",
                    "question": "What specific topic or area do you want to focus on?",
                    "variable": "topic",
                    "required": True
                },
                {
                    "type": "question",
                    "question": "What's your preferred date and time?",
                    "variable": "preferred_time",
                    "required": True
                },
                {
                    "type": "booking",
                    "action": "schedule_appointment"
                }
            ]
        },
        "intake_fields": {
            "subject": {"type": "text", "required": True, "label": "Subject"},
            "level": {"type": "select", "required": True, "label": "Level"},
            "topic": {"type": "text", "required": True, "label": "Topic"},
            "preferred_time": {"type": "datetime", "required": True, "label": "Preferred time"}
        },
        "questions": [
            "What subject do you need help with?",
            "What's your current level?",
            "What specific topic do you want to focus on?",
            "What's your preferred date and time?"
        ]
    },
    "university": {
        "name": "university",
        "display_name": "University Office",
        "slot_duration_minutes": 30,
        "buffer_time_minutes": 5,
        "call_script_flow": {
            "steps": [
                {
                    "type": "greeting",
                    "message": "Hello! Thank you for calling the university office. How can I assist you?"
                },
                {
                    "type": "question",
                    "question": "What type of appointment do you need? (Academic advising, Financial aid, Registration, etc.)",
                    "variable": "appointment_type",
                    "required": True
                },
                {
                    "type": "question",
                    "question": "Do you need to bring any documents? If yes, please list them.",
                    "variable": "documents",
                    "required": False
                },
                {
                    "type": "question",
                    "question": "What's your student ID number?",
                    "variable": "student_id",
                    "required": True
                },
                {
                    "type": "question",
                    "question": "What's your preferred date and time?",
                    "variable": "preferred_time",
                    "required": True
                },
                {
                    "type": "booking",
                    "action": "schedule_appointment"
                }
            ]
        },
        "intake_fields": {
            "appointment_type": {"type": "select", "required": True, "label": "Appointment type"},
            "documents": {"type": "textarea", "required": False, "label": "Required documents"},
            "student_id": {"type": "text", "required": True, "label": "Student ID"},
            "preferred_time": {"type": "datetime", "required": True, "label": "Preferred time"}
        },
        "questions": [
            "What type of appointment do you need?",
            "Do you need to bring any documents?",
            "What's your student ID number?",
            "What's your preferred date and time?"
        ]
    }
}


class IndustryPresetService:
    """Service for managing industry presets."""
    
    def __init__(self):
        """Initialize the service and ensure default presets exist."""
        self.presets = DEFAULT_PRESETS
    
    def initialize_presets(self, db: Session):
        """
        Initialize default presets in the database.
        
        Args:
            db: Database session
        """
        for preset_name, preset_data in self.presets.items():
            existing = db.query(IndustryPreset).filter(
                IndustryPreset.name == preset_name
            ).first()
            
            if not existing:
                preset = IndustryPreset(**preset_data)
                db.add(preset)
                logger.info(f"Created default preset: {preset_name}")
        
        db.commit()
    
    def get_preset(self, db: Session, preset_name: str) -> Optional[IndustryPreset]:
        """
        Get a preset by name.
        
        Args:
            db: Database session
            preset_name: Name of the preset
        
        Returns:
            IndustryPreset object or None
        """
        return db.query(IndustryPreset).filter(
            IndustryPreset.name == preset_name
        ).first()
    
    def get_all_presets(self, db: Session) -> List[IndustryPreset]:
        """
        Get all available presets.
        
        Args:
            db: Database session
        
        Returns:
            List of IndustryPreset objects
        """
        return db.query(IndustryPreset).all()
    
    def set_operator_preset(
        self,
        db: Session,
        operator_id: int,
        preset_name: str
    ) -> Operator:
        """
        Set an operator's industry preset.
        
        Args:
            db: Database session
            operator_id: Operator ID
            preset_name: Name of the preset to set
        
        Returns:
            Updated Operator object
        
        Raises:
            ValueError: If preset not found
        """
        preset = self.get_preset(db, preset_name)
        if not preset:
            raise ValueError(f"Preset '{preset_name}' not found")
        
        operator = db.query(Operator).filter(Operator.id == operator_id).first()
        if not operator:
            raise ValueError(f"Operator {operator_id} not found")
        
        operator.industry_preset = preset_name
        db.commit()
        db.refresh(operator)
        
        logger.info(f"Set preset '{preset_name}' for operator {operator_id}")
        return operator
    
    def get_operator_preset(self, db: Session, operator_id: int) -> Optional[Dict[str, Any]]:
        """
        Get an operator's current preset configuration.
        
        Args:
            db: Database session
            operator_id: Operator ID
        
        Returns:
            Dict with preset configuration or None
        """
        operator = db.query(Operator).filter(Operator.id == operator_id).first()
        if not operator or not operator.industry_preset:
            return None
        
        preset = self.get_preset(db, operator.industry_preset)
        if not preset:
            return None
        
        return {
            "name": preset.name,
            "display_name": preset.display_name,
            "slot_duration_minutes": preset.slot_duration_minutes,
            "buffer_time_minutes": preset.buffer_time_minutes,
            "call_script_flow": preset.call_script_flow,
            "intake_fields": preset.intake_fields,
            "questions": preset.questions,
            "settings": preset.settings
        }


# Global instance
industry_preset_service = IndustryPresetService()
