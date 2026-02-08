"""
Demo mode service for first-time users without signup.
Provides pre-loaded demo calls with simulated data.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from models import DemoUsage, CallLog, User
from logging_config import get_logger

logger = get_logger("demo_mode")


class DemoModeService:
    """Service for managing demo calls for first-time users."""
    
    MAX_DEMO_CALLS = 3
    
    def get_demo_calls(
        self,
        db: Session,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get pre-loaded demo calls for first-time users.
        
        Returns structured JSON ready for Lovable UI with:
        - Transcript
        - Draft steps
        - AI reasoning
        - Voice clone preview
        
        Args:
            db: Database session
            session_id: Optional session ID to track usage
        
        Returns:
            Dict with demo calls data
        """
        # Check if session has already used demos
        demo_count = 0
        if session_id:
            demo_count = db.query(DemoUsage).filter(
                DemoUsage.session_id == session_id
            ).count()
        
        # Generate demo calls with full structure
        demo_calls = self._generate_demo_calls()
        
        # Enhance with draft steps and AI reasoning
        enhanced_calls = []
        for demo_call in demo_calls:
            enhanced = {
                **demo_call,
                "draft_steps": self._generate_draft_steps(demo_call),
                "ai_reasoning": demo_call.get("ai_reasoning", {}),
                "voice_preview": demo_call.get("voice_preview", {}),
                "structured_intake": demo_call.get("structured_intake", {}),
                "ready_for_frontend": True
            }
            enhanced_calls.append(enhanced)
        
        return {
            "demo_calls": enhanced_calls,
            "demo_count": demo_count,
            "max_demos": self.MAX_DEMO_CALLS,
            "remaining": max(0, self.MAX_DEMO_CALLS - demo_count),
            "session_id": session_id or str(uuid.uuid4()),
            "status": "available" if demo_count < self.MAX_DEMO_CALLS else "limit_reached"
        }
    
    def _generate_draft_steps(self, demo_call: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate draft steps for demo call."""
        steps = []
        
        # Step 1: Initial greeting
        steps.append({
            "step_number": 1,
            "type": "greeting",
            "content": demo_call.get("transcript", {}).get("agent", [""])[0] if demo_call.get("transcript", {}).get("agent") else "Hello! How can I help you?",
            "timestamp": "00:00"
        })
        
        # Step 2: User response
        if demo_call.get("transcript", {}).get("user"):
            steps.append({
                "step_number": 2,
                "type": "user_input",
                "content": demo_call.get("transcript", {}).get("user", [""])[0],
                "timestamp": "00:05"
            })
        
        # Step 3: Agent processing
        steps.append({
            "step_number": 3,
            "type": "agent_processing",
            "content": "Processing request and checking availability...",
            "timestamp": "00:10",
            "tool_calls": ["check_availability", "get_free_slots"]
        })
        
        # Step 4: Booking confirmation
        if demo_call.get("outcome") == "booked":
            steps.append({
                "step_number": 4,
                "type": "booking_confirmation",
                "content": demo_call.get("transcript", {}).get("agent", [""])[-1] if demo_call.get("transcript", {}).get("agent") else "Appointment confirmed!",
                "timestamp": "00:15",
                "booking_details": {
                    "status": "confirmed",
                    "appointment_type": demo_call.get("ai_reasoning", {}).get("triage", {}).get("appointment_type", "standard")
                }
            })
        
        return steps
    
    def record_demo_usage(
        self,
        db: Session,
        session_id: str,
        demo_type: str = "clinic"
    ) -> DemoUsage:
        """
        Record demo call usage.
        
        Args:
            db: Database session
            session_id: Session ID
            demo_type: Type of demo
        
        Returns:
            Created DemoUsage object
        
        Raises:
            ValueError: If max demos exceeded
        """
        # Check current usage
        current_count = db.query(DemoUsage).filter(
            DemoUsage.session_id == session_id
        ).count()
        
        if current_count >= self.MAX_DEMO_CALLS:
            raise ValueError(f"Maximum {self.MAX_DEMO_CALLS} demo calls allowed")
        
        demo_usage = DemoUsage(
            session_id=session_id,
            demo_call_number=current_count + 1,
            demo_type=demo_type
        )
        
        db.add(demo_usage)
        db.commit()
        db.refresh(demo_usage)
        
        logger.info(f"Demo usage recorded: {session_id} - call {demo_usage.demo_call_number}")
        return demo_usage
    
    def _generate_demo_calls(self) -> List[Dict[str, Any]]:
        """Generate pre-loaded demo calls."""
        return [
            {
                "demo_id": 1,
                "title": "Clinic Appointment - Urgent Care",
                "industry": "clinic",
                "scenario": "Patient with urgent symptoms",
                "transcript": {
                    "user": [
                        "Hi, I need to see a doctor urgently",
                        "I'm experiencing chest pain and shortness of breath"
                    ],
                    "agent": [
                        "I understand this is urgent. Let me help you schedule an appointment right away.",
                        "I can get you in today at 2:00 PM. Does that work for you?"
                    ]
                },
                "structured_intake": {
                    "reason": "Chest pain and shortness of breath",
                    "urgency": "Yes - urgent",
                    "insurance": "Blue Cross Blue Shield"
                },
                "ai_reasoning": {
                    "slot_selection": {
                        "reasoning": "Selected earliest available slot due to urgent symptoms",
                        "confidence": 95
                    },
                    "triage": {
                        "appointment_type": "urgent",
                        "priority": "high",
                        "urgency_score": 90
                    }
                },
                "voice_preview": {
                    "voice_id": "21m00Tcm4TlvDq8ikWAM",
                    "sample_text": "I understand this is urgent. Let me help you schedule an appointment right away.",
                    "tone": 60,
                    "speed": 50,
                    "energy": 70,
                    "waveform": [0.1, 0.3, 0.5, 0.7, 0.5, 0.3, 0.1]  # Mock waveform
                },
                "outcome": "booked"
            },
            {
                "demo_id": 2,
                "title": "Salon Appointment - Haircut & Styling",
                "industry": "salon",
                "scenario": "Customer booking haircut with preferred stylist",
                "transcript": {
                    "user": [
                        "I'd like to book a haircut",
                        "Do you have availability with Sarah this weekend?"
                    ],
                    "agent": [
                        "Absolutely! I can help you book with Sarah.",
                        "Sarah has availability Saturday at 3:00 PM. Would that work?"
                    ]
                },
                "structured_intake": {
                    "service_type": "Haircut",
                    "stylist_preference": "Yes",
                    "stylist_name": "Sarah"
                },
                "ai_reasoning": {
                    "slot_selection": {
                        "reasoning": "Matched user's preferred stylist and weekend preference",
                        "confidence": 88
                    },
                    "script_recommendation": {
                        "reasoning": "Used salon preset script for service and stylist matching",
                        "confidence": 85
                    }
                },
                "voice_preview": {
                    "voice_id": "EXAVITQu4vr4xnSDxMaL",
                    "sample_text": "Absolutely! I can help you book with Sarah.",
                    "tone": 70,
                    "speed": 55,
                    "energy": 65,
                    "waveform": [0.2, 0.4, 0.6, 0.8, 0.6, 0.4, 0.2]
                },
                "outcome": "booked"
            },
            {
                "demo_id": 3,
                "title": "Tutoring Session - Math Help",
                "industry": "tutor",
                "scenario": "Student scheduling tutoring session",
                "transcript": {
                    "user": [
                        "I need help with calculus",
                        "I'm preparing for my final exam next week"
                    ],
                    "agent": [
                        "I can help you schedule a tutoring session for calculus.",
                        "Given your exam is next week, I recommend a 90-minute session. Available tomorrow at 4 PM?"
                    ]
                },
                "structured_intake": {
                    "subject": "Calculus",
                    "level": "College",
                    "topic": "Final exam preparation"
                },
                "ai_reasoning": {
                    "slot_selection": {
                        "reasoning": "Selected longer session due to exam preparation urgency",
                        "confidence": 90
                    },
                    "triage": {
                        "appointment_type": "advanced",
                        "priority": "high",
                        "urgency_score": 75
                    }
                },
                "voice_preview": {
                    "voice_id": "pNInz6obpgDQGcFmaJgB",
                    "sample_text": "I can help you schedule a tutoring session for calculus.",
                    "tone": 50,
                    "speed": 45,
                    "energy": 60,
                    "waveform": [0.15, 0.35, 0.55, 0.75, 0.55, 0.35, 0.15]
                },
                "outcome": "booked"
            }
        ]


# Global instance
demo_mode_service = DemoModeService()
