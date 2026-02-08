"""
Smart intake service for collecting structured data based on industry presets.
Generates structured JSON output and supports CSV/CRM export.
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from models import CallLog, IndustryPreset
from industry_presets import industry_preset_service
from logging_config import get_logger
import json
import csv
from io import StringIO

logger = get_logger("intake")


class IntakeService:
    """Service for managing structured intake data collection."""
    
    def collect_intake_data(
        self,
        db: Session,
        call_log_id: int,
        preset_name: str,
        collected_responses: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Collect and validate intake data based on preset requirements.
        
        Args:
            db: Database session
            call_log_id: Call log ID
            preset_name: Industry preset name
            collected_responses: Responses collected during call
        
        Returns:
            Dict with structured intake data
        """
        preset = industry_preset_service.get_preset(db, preset_name)
        if not preset:
            return {"error": f"Preset '{preset_name}' not found"}
        
        intake_fields = preset.intake_fields
        structured_data = {}
        missing_fields = []
        
        # Validate and structure collected data
        for field_name, field_config in intake_fields.items():
            field_value = collected_responses.get(field_name)
            
            if field_config.get("required", False) and not field_value:
                missing_fields.append(field_name)
            else:
                structured_data[field_name] = {
                    "value": field_value,
                    "label": field_config.get("label", field_name),
                    "type": field_config.get("type", "text")
                }
        
        # Save to call log
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if call_log:
            call_log.structured_intake = structured_data
            call_log.industry_preset = preset_name
            db.commit()
        
        result = {
            "call_log_id": call_log_id,
            "preset": preset_name,
            "structured_data": structured_data,
            "complete": len(missing_fields) == 0,
            "missing_fields": missing_fields
        }
        
        if len(missing_fields) == 0:
            logger.info(f"Intake data collected for call {call_log_id}")
        else:
            logger.warning(f"Intake incomplete for call {call_log_id}: missing {missing_fields}")
        
        return result
    
    def get_structured_output(
        self,
        db: Session,
        call_log_id: int
    ) -> Dict[str, Any]:
        """
        Get structured JSON output for a call.
        
        Args:
            db: Database session
            call_log_id: Call log ID
        
        Returns:
            Dict with structured output
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            return {"error": "Call log not found"}
        
        return {
            "call_log_id": call_log_id,
            "session_id": call_log.session_id,
            "operator_id": call_log.operator_id,
            "user_id": call_log.user_id,
            "started_at": call_log.started_at.isoformat() if call_log.started_at else None,
            "ended_at": call_log.ended_at.isoformat() if call_log.ended_at else None,
            "status": call_log.status,
            "call_outcome": call_log.call_outcome,
            "industry_preset": call_log.industry_preset,
            "structured_intake": call_log.structured_intake,
            "agent_decisions": call_log.agent_decisions,
            "voice_persona_id": call_log.voice_persona_id,
            "transcript": call_log.raw_transcript,
            "summary": call_log.summary
        }
    
    def export_to_csv(
        self,
        db: Session,
        call_log_ids: List[int],
        output_path: Optional[str] = None
    ) -> str:
        """
        Export call data to CSV format.
        
        Args:
            db: Database session
            call_log_ids: List of call log IDs to export
            output_path: Optional file path (returns CSV string if not provided)
        
        Returns:
            CSV content as string
        """
        call_logs = db.query(CallLog).filter(CallLog.id.in_(call_log_ids)).all()
        
        if not call_logs:
            return ""
        
        # Prepare CSV data
        csv_rows = []
        for call_log in call_logs:
            intake = call_log.structured_intake or {}
            
            row = {
                "call_log_id": call_log.id,
                "session_id": call_log.session_id,
                "operator_id": call_log.operator_id,
                "user_id": call_log.user_id,
                "started_at": call_log.started_at.isoformat() if call_log.started_at else "",
                "ended_at": call_log.ended_at.isoformat() if call_log.ended_at else "",
                "status": call_log.status,
                "call_outcome": call_log.call_outcome or "",
                "industry_preset": call_log.industry_preset or "",
            }
            
            # Add intake fields as columns
            if intake:
                for field_name, field_data in intake.items():
                    if isinstance(field_data, dict):
                        row[f"intake_{field_name}"] = field_data.get("value", "")
                    else:
                        row[f"intake_{field_name}"] = str(field_data)
            
            csv_rows.append(row)
        
        # Generate CSV
        if not csv_rows:
            return ""
        
        output = StringIO()
        fieldnames = csv_rows[0].keys()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)
        
        csv_content = output.getvalue()
        output.close()
        
        # Write to file if path provided
        if output_path:
            with open(output_path, "w", newline="", encoding="utf-8") as f:
                f.write(csv_content)
            logger.info(f"Exported {len(call_logs)} calls to {output_path}")
        
        return csv_content
    
    def export_to_crm_json(
        self,
        db: Session,
        call_log_id: int,
        crm_format: str = "generic"
    ) -> Dict[str, Any]:
        """
        Export call data to CRM-friendly JSON format.
        
        Args:
            db: Database session
            call_log_id: Call log ID
            crm_format: CRM format (generic, salesforce, hubspot)
        
        Returns:
            Dict with CRM-formatted data
        """
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log:
            return {"error": "Call log not found"}
        
        intake = call_log.structured_intake or {}
        
        # Generic CRM format
        crm_data = {
            "contact_id": call_log.user_id,
            "call_id": call_log.id,
            "session_id": call_log.session_id,
            "call_date": call_log.started_at.isoformat() if call_log.started_at else None,
            "duration_seconds": (
                (call_log.ended_at - call_log.started_at).total_seconds()
                if call_log.ended_at and call_log.started_at else None
            ),
            "outcome": call_log.call_outcome,
            "status": call_log.status,
            "transcript": call_log.raw_transcript,
            "custom_fields": {}
        }
        
        # Add intake data as custom fields
        if intake:
            for field_name, field_data in intake.items():
                if isinstance(field_data, dict):
                    crm_data["custom_fields"][field_name] = field_data.get("value")
                else:
                    crm_data["custom_fields"][field_name] = field_data
        
        # Format-specific adjustments
        if crm_format == "salesforce":
            crm_data["Type"] = "Call"
            crm_data["Subject"] = f"Call - {call_log.call_outcome or 'Unknown'}"
        
        elif crm_format == "hubspot":
            crm_data["hs_call_title"] = f"Call - {call_log.call_outcome or 'Unknown'}"
            crm_data["hs_call_status"] = call_log.status
        
        return crm_data


# Global instance
intake_service = IntakeService()
