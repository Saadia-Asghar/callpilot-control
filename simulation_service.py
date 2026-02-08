"""
Call simulation service for testing and demo purposes.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from models import CallLog, User, Operator, Transcript
from agent import conversation_agent
from draft_service import draft_service
from intake_service import intake_service
from auto_triage import auto_triage_service
from explainable_ai import explainable_ai_service
from logging_config import get_logger

logger = get_logger("simulation")


class SimulationService:
    """Service for simulating calls for testing and demos."""
    
    def run_simulation(
        self,
        db: Session,
        operator_id: int,
        num_calls: int = 3,
        industry_preset: Optional[str] = None,
        scenarios: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Simulate multiple calls for demo or testing.
        
        Args:
            db: Database session
            operator_id: Operator ID
            num_calls: Number of calls to simulate
            industry_preset: Industry preset to use
            scenarios: Optional predefined scenarios
        
        Returns:
            Dict with simulation results and metrics
        """
        results = []
        
        # Default scenarios if not provided
        if not scenarios:
            scenarios = self._get_default_scenarios(num_calls, industry_preset)
        
        for i, scenario in enumerate(scenarios[:num_calls]):
            try:
                result = self._simulate_single_call(
                    db,
                    operator_id,
                    scenario,
                    i + 1
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Simulation call {i+1} failed: {str(e)}")
                results.append({
                    "call_number": i + 1,
                    "success": False,
                    "error": str(e)
                })
        
        # Calculate metrics
        metrics = self._calculate_simulation_metrics(results)
        
        simulation_id = str(uuid.uuid4())
        
        # Store simulation metrics
        from models import SimulationMetrics
        sim_metrics = SimulationMetrics(
            operator_id=operator_id,
            simulation_id=simulation_id,
            total_calls=len(results),
            successful_calls=len([r for r in results if r.get("success")]),
            success_rate=metrics.get("success_rate", 0),
            average_transcript_length=int(metrics.get("average_transcript_length", 0)),
            average_tool_calls=metrics.get("average_tool_calls", 0),
            bookings_created=metrics.get("bookings_created", 0),
            metrics_data=metrics
        )
        db.add(sim_metrics)
        db.commit()
        
        return {
            "simulation_id": simulation_id,
            "operator_id": operator_id,
            "total_calls": len(results),
            "successful_calls": len([r for r in results if r.get("success")]),
            "results": results,
            "metrics": metrics,
            "generated_at": datetime.utcnow().isoformat(),
            "ready_for_frontend": True
        }
    
    def _simulate_single_call(
        self,
        db: Session,
        operator_id: int,
        scenario: Dict[str, Any],
        call_number: int
    ) -> Dict[str, Any]:
        """Simulate a single call."""
        # Create test user
        user = User(
            name=scenario.get("user_name", f"Test User {call_number}"),
            email=f"test{call_number}@example.com"
        )
        db.add(user)
        db.flush()
        
        # Create call log
        session_id = f"sim-{uuid.uuid4()}"
        call_log = CallLog(
            operator_id=operator_id,
            user_id=user.id,
            session_id=session_id,
            status="completed",
            industry_preset=scenario.get("industry_preset"),
            channel=scenario.get("channel", "voice"),
            is_draft=True
        )
        db.add(call_log)
        db.flush()
        
        # Simulate conversation
        conversation = scenario.get("conversation", [])
        transcript_parts = []
        tool_calls_all = []
        
        for turn in conversation:
            user_message = turn.get("user", "")
            if user_message:
                # Process with agent
                result = conversation_agent.process_message(
                    message=user_message,
                    db=db,
                    conversation_history=[],
                    user_id=user.id,
                    call_log_id=call_log.id
                )
                
                transcript_parts.append(f"User: {user_message}")
                transcript_parts.append(f"Agent: {result['response']}")
                
                if result.get("tool_calls"):
                    tool_calls_all.extend(result["tool_calls"])
        
        # Build full transcript
        full_transcript = "\n".join(transcript_parts)
        call_log.raw_transcript = full_transcript
        call_log.agent_decisions = {"tool_calls": tool_calls_all}
        
        # Collect intake if provided
        if scenario.get("structured_intake"):
            intake_result = intake_service.collect_intake_data(
                db=db,
                call_log_id=call_log.id,
                preset_name=scenario.get("industry_preset", "clinic"),
                collected_responses=scenario["structured_intake"]
            )
            call_log.structured_intake = intake_result.get("structured_data")
        
        # Perform triage
        if scenario.get("structured_intake"):
            triage_result = auto_triage_service.triage_call(
                db=db,
                call_log_id=call_log.id,
                operator_id=operator_id,
                collected_data=scenario["structured_intake"],
                industry_preset=scenario.get("industry_preset")
            )
            call_log.triage_recommendation = triage_result.get("triage_recommendation")
        
        # Get AI reasoning
        reasoning = explainable_ai_service.get_call_reasoning(db, call_log.id)
        call_log.ai_reasoning = reasoning
        
        # Set outcome
        call_log.call_outcome = scenario.get("outcome", "booked")
        call_log.status = "completed"
        call_log.is_draft = False
        
        db.commit()
        
        return {
            "call_number": call_number,
            "success": True,
            "call_log_id": call_log.id,
            "session_id": session_id,
            "user_id": user.id,
            "transcript_length": len(full_transcript),
            "tool_calls_count": len(tool_calls_all),
            "has_intake": bool(call_log.structured_intake),
            "has_triage": bool(call_log.triage_recommendation),
            "outcome": call_log.call_outcome
        }
    
    def _get_default_scenarios(
        self,
        num_calls: int,
        industry_preset: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Get default simulation scenarios."""
        preset = industry_preset or "clinic"
        
        scenarios = []
        
        if preset == "clinic":
            scenarios = [
                {
                    "user_name": "John Doe",
                    "industry_preset": "clinic",
                    "channel": "voice",
                    "conversation": [
                        {"user": "Hi, I need to schedule an appointment"},
                        {"user": "I'm having some chest pain"}
                    ],
                    "structured_intake": {
                        "reason": "Chest pain",
                        "urgency": "Yes - urgent",
                        "preferred_time": "2024-02-15T10:00:00"
                    },
                    "outcome": "booked"
                },
                {
                    "user_name": "Jane Smith",
                    "industry_preset": "clinic",
                    "channel": "chat",
                    "conversation": [
                        {"user": "I need a routine checkup"},
                        {"user": "Next week would work"}
                    ],
                    "structured_intake": {
                        "reason": "Routine checkup",
                        "urgency": "No - routine",
                        "preferred_time": "2024-02-20T14:00:00"
                    },
                    "outcome": "booked"
                }
            ]
        elif preset == "salon":
            scenarios = [
                {
                    "user_name": "Sarah Johnson",
                    "industry_preset": "salon",
                    "channel": "voice",
                    "conversation": [
                        {"user": "I need a haircut"},
                        {"user": "Do you have availability this weekend?"}
                    ],
                    "structured_intake": {
                        "service_type": "Haircut",
                        "stylist_preference": "No",
                        "preferred_time": "2024-02-17T15:00:00"
                    },
                    "outcome": "booked"
                }
            ]
        
        # Pad with generic scenarios if needed
        while len(scenarios) < num_calls:
            scenarios.append({
                "user_name": f"Test User {len(scenarios) + 1}",
                "industry_preset": preset,
                "channel": "voice",
                "conversation": [
                    {"user": "I need to schedule an appointment"}
                ],
                "structured_intake": {
                    "preferred_time": "2024-02-15T10:00:00"
                },
                "outcome": "booked"
            })
        
        return scenarios[:num_calls]
    
    def _calculate_simulation_metrics(
        self,
        results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate simulation metrics."""
        successful = [r for r in results if r.get("success")]
        
        if not successful:
            return {
                "success_rate": 0,
                "average_transcript_length": 0,
                "average_tool_calls": 0
            }
        
        return {
            "success_rate": len(successful) / len(results) * 100,
            "average_transcript_length": sum(
                r.get("transcript_length", 0) for r in successful
            ) / len(successful),
            "average_tool_calls": sum(
                r.get("tool_calls_count", 0) for r in successful
            ) / len(successful),
            "bookings_created": len([r for r in successful if r.get("outcome") == "booked"])
        }


# Global instance
simulation_service = SimulationService()
