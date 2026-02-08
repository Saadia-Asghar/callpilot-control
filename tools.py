"""
Tool functions that the agent can call for scheduling operations.
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models import Booking, User, Preference
from scheduling import scheduling_service


def check_availability(date_range: Dict[str, str]) -> Dict[str, Any]:
    """
    Check availability for a given date range.
    
    Args:
        date_range: Dict with 'start' and 'end' ISO format datetime strings
    
    Returns:
        Dict with 'available' boolean and 'message'
    """
    try:
        start_dt = datetime.fromisoformat(date_range["start"].replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(date_range.get("end", date_range["start"]).replace("Z", "+00:00"))
        
        # This would need db session - handled in agent
        return {
            "available": None,  # Will be set by agent
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


def get_free_slots(day: str) -> Dict[str, Any]:
    """
    Get all free slots for a given day.
    
    Args:
        day: ISO format date string
    
    Returns:
        Dict with 'slots' list
    """
    try:
        day_dt = datetime.fromisoformat(day.replace("Z", "+00:00"))
        return {
            "day": day_dt.isoformat(),
            "slots": []  # Will be populated by agent
        }
    except Exception as e:
        return {"error": str(e)}


def book_appointment(name: str, datetime_str: str, reason: Optional[str] = None) -> Dict[str, Any]:
    """
    Book an appointment.
    
    Args:
        name: User's name
        datetime_str: ISO format datetime string
        reason: Optional reason for appointment
    
    Returns:
        Dict with booking details
    """
    try:
        appointment_dt = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
        return {
            "name": name,
            "datetime": appointment_dt.isoformat(),
            "reason": reason,
            "status": "pending"  # Will be confirmed by agent
        }
    except Exception as e:
        return {"error": str(e)}


def reschedule_appointment(booking_id: int, new_time: str) -> Dict[str, Any]:
    """
    Reschedule an existing appointment.
    
    Args:
        booking_id: ID of the booking to reschedule
        new_time: ISO format datetime string for new time
    
    Returns:
        Dict with rescheduling details
    """
    try:
        new_dt = datetime.fromisoformat(new_time.replace("Z", "+00:00"))
        return {
            "booking_id": booking_id,
            "new_datetime": new_dt.isoformat(),
            "status": "pending"
        }
    except Exception as e:
        return {"error": str(e)}


def cancel_appointment(booking_id: int) -> Dict[str, Any]:
    """
    Cancel an appointment.
    
    Args:
        booking_id: ID of the booking to cancel
    
    Returns:
        Dict with cancellation details
    """
    return {
        "booking_id": booking_id,
        "status": "cancelled"
    }


def save_user_preference(user_id: int, key: str, value: str) -> Dict[str, Any]:
    """
    Save a user preference.
    
    Args:
        user_id: User ID
        key: Preference key
        value: Preference value
    
    Returns:
        Dict with preference details
    """
    return {
        "user_id": user_id,
        "key": key,
        "value": value,
        "saved": True
    }


def get_user_preferences(user_id: int) -> Dict[str, Any]:
    """
    Get all preferences for a user.
    
    Args:
        user_id: User ID
    
    Returns:
        Dict with preferences
    """
    return {
        "user_id": user_id,
        "preferences": {}
    }


# Tool definitions for LLM function calling
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": "Check if a specific time slot is available for booking. Use this before booking to verify availability.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date_range": {
                        "type": "object",
                        "properties": {
                            "start": {
                                "type": "string",
                                "description": "Start datetime in ISO 8601 format (e.g., '2024-02-10T14:00:00-05:00')"
                            },
                            "end": {
                                "type": "string",
                                "description": "End datetime in ISO 8601 format (optional, defaults to start + slot duration)"
                            }
                        },
                        "required": ["start"]
                    }
                },
                "required": ["date_range"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_free_slots",
            "description": "Get all available time slots for a specific day. Use this when the user asks about availability or needs alternative times.",
            "parameters": {
                "type": "object",
                "properties": {
                    "day": {
                        "type": "string",
                        "description": "Date in ISO 8601 format (e.g., '2024-02-10') or datetime"
                    }
                },
                "required": ["day"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Book an appointment at a specific date and time. ALWAYS check availability first using check_availability before booking.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the person booking the appointment"
                    },
                    "datetime_str": {
                        "type": "string",
                        "description": "Appointment datetime in ISO 8601 format (e.g., '2024-02-10T14:00:00-05:00')"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Reason for the appointment (optional)"
                    }
                },
                "required": ["name", "datetime_str"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "reschedule_appointment",
            "description": "Reschedule an existing appointment to a new time. Check availability for the new time first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {
                        "type": "integer",
                        "description": "ID of the booking to reschedule"
                    },
                    "new_time": {
                        "type": "string",
                        "description": "New datetime in ISO 8601 format"
                    }
                },
                "required": ["booking_id", "new_time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_appointment",
            "description": "Cancel an existing appointment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {
                        "type": "integer",
                        "description": "ID of the booking to cancel"
                    }
                },
                "required": ["booking_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_user_preference",
            "description": "Save a user preference (e.g., preferred time, contact method, etc.)",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "integer",
                        "description": "User ID"
                    },
                    "key": {
                        "type": "string",
                        "description": "Preference key (e.g., 'preferred_time', 'contact_method')"
                    },
                    "value": {
                        "type": "string",
                        "description": "Preference value"
                    }
                },
                "required": ["user_id", "key", "value"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_preferences",
            "description": "Get all preferences for a user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "integer",
                        "description": "User ID"
                    }
                },
                "required": ["user_id"]
            }
        }
    }
]
