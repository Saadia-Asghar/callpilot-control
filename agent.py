"""
Conversation agent module with LLM integration and tool calling.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import json

from config import settings
from tools import TOOL_DEFINITIONS
from scheduling import scheduling_service
from models import User, Booking, Preference, CallLog, Transcript


# System prompt for the agent
AGENT_SYSTEM_PROMPT = """You are CallPilot, an autonomous appointment scheduling voice agent.

Rules:
- You must use tools to check availability before offering times.
- Never invent time slots.
- If requested time unavailable, propose nearest alternatives.
- Always confirm booking details before finalizing.
- Remember and use user preferences when available.
- Handle rescheduling and cancellations.
- Keep responses short and natural for voice.
- Ask clarifying questions when constraints are missing.
- Your goal is successful scheduling completion.

Voice persona:
- Friendly, calm, confident scheduling assistant.
- Speaks clearly and professionally.
- Handles interruptions politely.
- Confirms details before final booking.
- Uses natural conversational phrasing.

Core responsibilities:
1. You are an autonomous scheduling agent - you can make decisions and take actions on behalf of users
2. You MUST verify availability using the check_availability tool before booking any appointment
3. NEVER invent or assume time slots - always use tools to check real availability
4. Always confirm appointment details with the user before finalizing a booking
5. If a requested time slot is unavailable, use get_free_slots to find alternatives and suggest them proactively
6. Extract key information: user name, preferred date/time, reason for appointment
7. Use get_user_preferences to recall user preferences and apply them when making suggestions
8. Handle rescheduling and cancellations gracefully - verify bookings exist before modifying

When booking:
- Always check availability first using check_availability tool
- Confirm the date, time, and reason with the user before finalizing
- Provide clear confirmation details after booking

When rescheduling or canceling:
- Verify the booking exists
- Confirm the action with the user
- Provide clear next steps

Communication style:
- Keep responses concise and natural for voice interaction
- Ask clarifying questions when date/time constraints are missing or unclear
- Be friendly, calm, and confident
- Handle interruptions politely and redirect conversation back to scheduling
- Use conversational phrasing - avoid robotic or overly formal language"""


class ConversationAgent:
    """LLM-based conversation agent with tool calling capabilities."""
    
    def __init__(self):
        """Initialize the conversation agent."""
        self.llm_provider = settings.llm_provider
        self._initialize_llm_client()
    
    def _initialize_llm_client(self):
        """Initialize the LLM client based on provider."""
        if self.llm_provider == "openai":
            try:
                from openai import OpenAI
                
                # Validate API key
                if not settings.openai_api_key or settings.openai_api_key in ["", "your_openai_api_key_here"]:
                    raise ValueError(
                        "OpenAI API key is not configured. "
                        "Please set OPENAI_API_KEY in your .env file. "
                        "Run 'python setup.py' to validate configuration."
                    )
                
                self.client = OpenAI(api_key=settings.openai_api_key)
                self.model = "gpt-4-turbo-preview"
                
                # Test API key with a simple request (optional, can be removed for faster startup)
                # This is commented out to avoid unnecessary API calls on startup
                # try:
                #     self.client.models.list()
                # except Exception as e:
                #     raise ValueError(f"OpenAI API key validation failed: {str(e)}")
                
            except ImportError:
                raise ImportError("OpenAI package not installed. Install with: pip install openai")
        elif self.llm_provider == "gemini":
            try:
                import google.generativeai as genai
                
                # Validate API key
                if not settings.gemini_api_key or settings.gemini_api_key in ["", "your_gemini_api_key_here"]:
                    raise ValueError(
                        "Gemini API key is not configured. "
                        "Please set GEMINI_API_KEY in your .env file. "
                        "Run 'python setup.py' to validate configuration."
                    )
                
                genai.configure(api_key=settings.gemini_api_key)
                self.model = genai.GenerativeModel("gemini-pro")
                
            except ImportError:
                raise ImportError("Google Generative AI package not installed. Install with: pip install google-generativeai")
        else:
            raise ValueError(f"Unsupported LLM provider: {self.llm_provider}")
    
    def _execute_tool(
        self, 
        tool_name: str, 
        arguments: Dict[str, Any],
        db: Session,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute a tool function with database context.
        
        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments
            db: Database session
            user_id: Optional user ID for user-specific operations
        
        Returns:
            Tool execution result
        """
        if tool_name == "check_availability":
            date_range = arguments.get("date_range", {})
            start_str = date_range.get("start")
            if start_str:
                start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                available = scheduling_service.check_availability(db, start_dt)
                return {
                    "available": available,
                    "start": start_str,
                    "message": "Slot is available" if available else "Slot is not available"
                }
        
        elif tool_name == "get_free_slots":
            day_str = arguments.get("day", "")
            try:
                day_dt = datetime.fromisoformat(day_str.replace("Z", "+00:00"))
                slots = scheduling_service.get_free_slots(db, day_dt)
                return {
                    "day": day_str,
                    "slots": [s.isoformat() for s in slots],
                    "count": len(slots)
                }
            except Exception as e:
                return {"error": str(e)}
        
        elif tool_name == "book_appointment":
            name = arguments.get("name", "")
            datetime_str = arguments.get("datetime_str", "")
            reason = arguments.get("reason")
            
            try:
                appointment_dt = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
                
                # Check availability first
                if not scheduling_service.check_availability(db, appointment_dt):
                    return {
                        "error": "Slot not available",
                        "suggestions": scheduling_service.suggest_alternative_slots(db, appointment_dt)
                    }
                
                # Get or create user
                user = db.query(User).filter(User.name == name).first()
                if not user:
                    user = User(name=name)
                    db.add(user)
                    db.flush()
                
                # Create booking
                booking = Booking(
                    user_id=user.id,
                    appointment_datetime=appointment_dt,
                    reason=reason,
                    status="confirmed"
                )
                db.add(booking)
                db.commit()
                
                return {
                    "success": True,
                    "booking_id": booking.id,
                    "name": name,
                    "datetime": appointment_dt.isoformat(),
                    "reason": reason
                }
            except Exception as e:
                db.rollback()
                return {"error": str(e)}
        
        elif tool_name == "reschedule_appointment":
            booking_id = arguments.get("booking_id")
            new_time = arguments.get("new_time", "")
            
            try:
                booking = db.query(Booking).filter(Booking.id == booking_id).first()
                if not booking:
                    return {"error": "Booking not found"}
                
                new_dt = datetime.fromisoformat(new_time.replace("Z", "+00:00"))
                
                # Check availability
                if not scheduling_service.check_availability(db, new_dt):
                    return {
                        "error": "New slot not available",
                        "suggestions": scheduling_service.suggest_alternative_slots(db, new_dt)
                    }
                
                booking.appointment_datetime = new_dt
                booking.status = "rescheduled"
                db.commit()
                
                return {
                    "success": True,
                    "booking_id": booking_id,
                    "new_datetime": new_dt.isoformat()
                }
            except Exception as e:
                db.rollback()
                return {"error": str(e)}
        
        elif tool_name == "cancel_appointment":
            booking_id = arguments.get("booking_id")
            
            try:
                booking = db.query(Booking).filter(Booking.id == booking_id).first()
                if not booking:
                    return {"error": "Booking not found"}
                
                booking.status = "cancelled"
                db.commit()
                
                return {
                    "success": True,
                    "booking_id": booking_id,
                    "status": "cancelled"
                }
            except Exception as e:
                db.rollback()
                return {"error": str(e)}
        
        elif tool_name == "save_user_preference":
            user_id = arguments.get("user_id") or user_id
            key = arguments.get("key", "")
            value = arguments.get("value", "")
            
            if not user_id:
                return {"error": "User ID required"}
            
            try:
                preference = db.query(Preference).filter(
                    Preference.user_id == user_id,
                    Preference.key == key
                ).first()
                
                if preference:
                    preference.value = value
                else:
                    preference = Preference(user_id=user_id, key=key, value=value)
                    db.add(preference)
                
                db.commit()
                return {"success": True, "user_id": user_id, "key": key, "value": value}
            except Exception as e:
                db.rollback()
                return {"error": str(e)}
        
        elif tool_name == "get_user_preferences":
            user_id = arguments.get("user_id") or user_id
            
            if not user_id:
                return {"error": "User ID required"}
            
            try:
                preferences = db.query(Preference).filter(Preference.user_id == user_id).all()
                return {
                    "user_id": user_id,
                    "preferences": {p.key: p.value for p in preferences}
                }
            except Exception as e:
                return {"error": str(e)}
        
        return {"error": f"Unknown tool: {tool_name}"}
    
    def process_message(
        self,
        message: str,
        db: Session,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_id: Optional[int] = None,
        call_log_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Process a user message and generate agent response with tool calls.
        
        Args:
            message: User's message text
            db: Database session
            conversation_history: Previous conversation messages
            user_id: Optional user ID
            call_log_id: Optional call log ID for transcript tracking
        
        Returns:
            Dict with agent response, tool calls, and updated conversation history
        """
        if conversation_history is None:
            conversation_history = []
        
        # Add user message to history
        conversation_history.append({"role": "user", "content": message})
        
        # Save user message to transcript if call_log_id provided
        if call_log_id:
            transcript = Transcript(
                call_log_id=call_log_id,
                role="user",
                content=message
            )
            db.add(transcript)
            db.commit()
        
        # Prepare messages for LLM
        messages = [{"role": "system", "content": AGENT_SYSTEM_PROMPT}]
        messages.extend(conversation_history)
        
        tool_calls_executed = []
        
        if self.llm_provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto"
            )
            
            assistant_message = response.choices[0].message
            response_text = assistant_message.content or ""
            
            # Execute tool calls if any
            if assistant_message.tool_calls:
                for tool_call in assistant_message.tool_calls:
                    tool_name = tool_call.function.name
                    tool_args = json.loads(tool_call.function.arguments)
                    
                    tool_result = self._execute_tool(tool_name, tool_args, db, user_id)
                    tool_calls_executed.append({
                        "tool": tool_name,
                        "arguments": tool_args,
                        "result": tool_result
                    })
                    
                    # Add tool result to conversation for follow-up
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": tool_name,
                        "content": json.dumps(tool_result)
                    })
                
                # Get final response after tool execution
                try:
                    final_response = self.client.chat.completions.create(
                        model=self.model,
                        messages=messages
                    )
                    response_text = final_response.choices[0].message.content or response_text
                except Exception as e:
                    # If final response fails, use the initial response
                    response_text = response_text or f"I've processed your request. Error generating final response: {str(e)}"
        
        elif self.llm_provider == "gemini":
            # Gemini function calling (simplified - may need adjustment based on actual API)
            try:
                response = self.model.generate_content(
                    json.dumps({
                        "messages": messages,
                        "tools": TOOL_DEFINITIONS
                    })
                )
                response_text = response.text
            except Exception as e:
                # Fallback: manual tool detection and execution
                response_text = self._handle_gemini_fallback(messages, db, user_id, tool_calls_executed)
        
        # Add assistant response to history
        conversation_history.append({"role": "assistant", "content": response_text})
        
        # Save assistant message to transcript
        if call_log_id:
            transcript = Transcript(
                call_log_id=call_log_id,
                role="assistant",
                content=response_text,
                metadata={"tool_calls": tool_calls_executed} if tool_calls_executed else None
            )
            db.add(transcript)
            db.commit()
        
        return {
            "response": response_text,
            "tool_calls": tool_calls_executed,
            "conversation_history": conversation_history
        }
    
    def _handle_gemini_fallback(
        self,
        messages: List[Dict],
        db: Session,
        user_id: Optional[int],
        tool_calls_executed: List[Dict]
    ) -> str:
        """Fallback handler for Gemini when function calling isn't available."""
        # Simple pattern matching for tool calls (basic implementation)
        last_message = messages[-1]["content"].lower()
        
        # This is a simplified fallback - in production, use proper Gemini function calling
        if "check availability" in last_message or "is available" in last_message:
            # Try to extract datetime and check
            return "I'll check availability for you. Please provide the specific date and time."
        
        return "I'm here to help you schedule an appointment. What date and time would work for you?"


# Global agent instance
conversation_agent = ConversationAgent()
