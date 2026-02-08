"""
Custom script service for operator-defined call flows.
Supports conditional logic, branching, and custom question flows.
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from models import CustomScript, Operator
from logging_config import get_logger

logger = get_logger("custom_script")


class CustomScriptService:
    """Service for managing custom call scripts."""
    
    def create_script(
        self,
        db: Session,
        operator_id: int,
        name: str,
        script_flow: Dict[str, Any],
        is_active: bool = True
    ) -> CustomScript:
        """
        Create a new custom script.
        
        Args:
            db: Database session
            operator_id: Operator ID
            name: Script name
            script_flow: JSON flow definition
            is_active: Whether script is active
        
        Returns:
            Created CustomScript object
        
        Raises:
            ValueError: If operator not found or script invalid
        """
        operator = db.query(Operator).filter(Operator.id == operator_id).first()
        if not operator:
            raise ValueError(f"Operator {operator_id} not found")
        
        # Validate script flow structure
        if not self._validate_script_flow(script_flow):
            raise ValueError("Invalid script flow structure")
        
        script = CustomScript(
            operator_id=operator_id,
            name=name,
            script_content=script_flow,  # Model uses script_content
            is_active=is_active
        )
        
        db.add(script)
        db.commit()
        db.refresh(script)
        
        logger.info(f"Created custom script '{name}' for operator {operator_id}")
        return script
    
    def get_script(
        self,
        db: Session,
        script_id: int
    ) -> Optional[CustomScript]:
        """
        Get a script by ID.
        
        Args:
            db: Database session
            script_id: Script ID
        
        Returns:
            CustomScript object or None
        """
        return db.query(CustomScript).filter(CustomScript.id == script_id).first()
    
    def get_operator_scripts(
        self,
        db: Session,
        operator_id: int,
        active_only: bool = False
    ) -> List[CustomScript]:
        """
        Get all scripts for an operator.
        
        Args:
            db: Database session
            operator_id: Operator ID
            active_only: Only return active scripts
        
        Returns:
            List of CustomScript objects
        """
        query = db.query(CustomScript).filter(CustomScript.operator_id == operator_id)
        
        if active_only:
            query = query.filter(CustomScript.is_active == True)
        
        return query.all()
    
    def get_active_script(
        self,
        db: Session,
        operator_id: int
    ) -> Optional[CustomScript]:
        """
        Get the active script for an operator.
        
        Args:
            db: Database session
            operator_id: Operator ID
        
        Returns:
            Active CustomScript or None
        """
        script = db.query(CustomScript).filter(
            CustomScript.operator_id == operator_id,
            CustomScript.is_active == True
        ).first()
        return script
    
    def get_script_flow(self, script: CustomScript) -> Dict[str, Any]:
        """Get script flow from CustomScript object (handles field name difference)."""
        return script.script_content if hasattr(script, 'script_content') else script.script_flow
    
    def update_script(
        self,
        db: Session,
        script_id: int,
        name: Optional[str] = None,
        script_flow: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None
    ) -> CustomScript:
        """
        Update a script.
        
        Args:
            db: Database session
            script_id: Script ID
            name: Optional new name
            script_flow: Optional new flow
            is_active: Optional active status
        
        Returns:
            Updated CustomScript object
        
        Raises:
            ValueError: If script not found or flow invalid
        """
        script = self.get_script(db, script_id)
        if not script:
            raise ValueError(f"Script {script_id} not found")
        
        if name is not None:
            script.name = name
        
        if script_flow is not None:
            if not self._validate_script_flow(script_flow):
                raise ValueError("Invalid script flow structure")
            script.script_content = script_flow  # Model uses script_content
        
        if is_active is not None:
            script.is_active = is_active
        
        db.commit()
        db.refresh(script)
        
        logger.info(f"Updated script {script_id}")
        return script
    
    def delete_script(
        self,
        db: Session,
        script_id: int
    ) -> bool:
        """
        Delete a script.
        
        Args:
            db: Database session
            script_id: Script ID
        
        Returns:
            True if deleted, False if not found
        """
        script = self.get_script(db, script_id)
        if not script:
            return False
        
        db.delete(script)
        db.commit()
        
        logger.info(f"Deleted script {script_id}")
        return True
    
    def execute_script_step(
        self,
        script_flow: Dict[str, Any],
        current_step: int,
        collected_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a script step based on current state and collected data.
        
        Args:
            script_flow: Script flow definition
            current_step: Current step index
            collected_data: Data collected so far
        
        Returns:
            Dict with next step information
        """
        steps = script_flow.get("steps", [])
        
        if current_step >= len(steps):
            return {
                "completed": True,
                "next_step": None,
                "action": "complete"
            }
        
        step = steps[current_step]
        step_type = step.get("type")
        
        if step_type == "question":
            return {
                "type": "question",
                "question": step.get("question"),
                "variable": step.get("variable"),
                "required": step.get("required", False),
                "options": step.get("options"),
                "next_step": current_step + 1
            }
        
        elif step_type == "conditional":
            condition = step.get("condition", {})
            condition_var = condition.get("variable")
            condition_value = condition.get("value")
            
            # Check condition
            if collected_data.get(condition_var) == condition_value:
                # Execute "then" branch
                then_step = step.get("then", {})
                if then_step.get("type") == "question":
                    return {
                        "type": "question",
                        "question": then_step.get("question"),
                        "variable": then_step.get("variable"),
                        "required": then_step.get("required", False),
                        "next_step": current_step + 1
                    }
            else:
                # Execute "else" branch if exists
                else_step = step.get("else")
                if else_step:
                    return self.execute_script_step(
                        script_flow,
                        current_step + 1,
                        collected_data
                    )
            
            return {
                "type": "conditional",
                "next_step": current_step + 1
            }
        
        elif step_type == "booking":
            return {
                "type": "booking",
                "action": step.get("action", "schedule_appointment"),
                "next_step": current_step + 1
            }
        
        elif step_type == "greeting":
            return {
                "type": "greeting",
                "message": step.get("message"),
                "next_step": current_step + 1
            }
        
        return {
            "type": "unknown",
            "next_step": current_step + 1
        }
    
    def _validate_script_flow(self, script_flow: Dict[str, Any]) -> bool:
        """
        Validate script flow structure.
        
        Args:
            script_flow: Script flow to validate
        
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(script_flow, dict):
            return False
        
        if "steps" not in script_flow:
            return False
        
        steps = script_flow.get("steps", [])
        if not isinstance(steps, list) or len(steps) == 0:
            return False
        
        # Validate each step
        for step in steps:
            if not isinstance(step, dict):
                return False
            
            step_type = step.get("type")
            if step_type not in ["question", "conditional", "booking", "greeting"]:
                return False
            
            # Validate question step
            if step_type == "question":
                if "question" not in step or "variable" not in step:
                    return False
            
            # Validate conditional step
            if step_type == "conditional":
                condition = step.get("condition", {})
                if "variable" not in condition or "value" not in condition:
                    return False
        
        return True


# Global instance
custom_script_service = CustomScriptService()
