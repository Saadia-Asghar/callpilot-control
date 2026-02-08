"""
Example usage script for CallPilot API.
Demonstrates how to interact with the API endpoints.
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"


def example_voice_conversation():
    """Example of a voice conversation flow."""
    print("=" * 60)
    print("Example: Voice Conversation Flow")
    print("=" * 60)
    
    session_id = "example-session-001"
    
    # Message 1: Initial request
    print("\n1. User: 'Hi, I need to schedule an appointment for next Monday at 2pm'")
    response = requests.post(
        f"{BASE_URL}/voice/input",
        json={
            "transcript": "Hi, I need to schedule an appointment for next Monday at 2pm",
            "session_id": session_id
        }
    )
    result = response.json()
    print(f"Agent: {result['response']}")
    if result.get('tool_calls'):
        print(f"Tool Calls: {json.dumps(result['tool_calls'], indent=2)}")
    
    # Message 2: Confirm booking
    print("\n2. User: 'Yes, please book it'")
    response = requests.post(
        f"{BASE_URL}/voice/input",
        json={
            "transcript": "Yes, please book it",
            "session_id": session_id
        }
    )
    result = response.json()
    print(f"Agent: {result['response']}")
    if result.get('tool_calls'):
        print(f"Tool Calls: {json.dumps(result['tool_calls'], indent=2)}")
    
    # Get call summary
    print("\n3. Getting call summary...")
    call_logs = requests.get(f"{BASE_URL}/call/logs?session_id={session_id}").json()
    if call_logs['logs']:
        call_log_id = call_logs['logs'][0]['id']
        summary = requests.get(f"{BASE_URL}/call/summary/{call_log_id}").json()
        print("\nCall Summary:")
        print(summary['human_readable'])


def example_direct_booking():
    """Example of direct booking creation."""
    print("\n" + "=" * 60)
    print("Example: Direct Booking Creation")
    print("=" * 60)
    
    # First, create a user (in real app, this would be done via user registration)
    # For demo, we'll assume user_id=1 exists
    
    # Get available slots for tomorrow
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    print(f"\n1. Getting available slots for {tomorrow}...")
    response = requests.get(f"{BASE_URL}/calendar/day?day={tomorrow}")
    slots = response.json()
    print(f"Available slots: {slots['count']}")
    if slots['available_slots']:
        print(f"First slot: {slots['available_slots'][0]}")
        
        # Book the first available slot
        print("\n2. Booking appointment...")
        booking_response = requests.post(
            f"{BASE_URL}/booking/create",
            json={
                "user_id": 1,
                "appointment_datetime": slots['available_slots'][0],
                "reason": "Consultation"
            }
        )
        booking = booking_response.json()
        print(f"Booking created: {json.dumps(booking, indent=2)}")


def example_check_availability():
    """Example of checking availability."""
    print("\n" + "=" * 60)
    print("Example: Check Availability")
    print("=" * 60)
    
    # Check availability for a specific time
    check_time = (datetime.now() + timedelta(days=2)).replace(
        hour=14, minute=0, second=0, microsecond=0
    ).isoformat()
    
    print(f"\nChecking availability for: {check_time}")
    # Note: This would typically go through the agent, but for demo:
    day = check_time.split('T')[0]
    response = requests.get(f"{BASE_URL}/calendar/day?day={day}")
    slots = response.json()
    
    if check_time in [s.split('+')[0] for s in slots['available_slots']]:
        print("✓ Slot is available!")
    else:
        print("✗ Slot is not available")
        print(f"Alternative slots: {slots['available_slots'][:3]}")


if __name__ == "__main__":
    print("\nCallPilot API Examples")
    print("Make sure the API server is running on http://localhost:8000\n")
    
    try:
        # Check if server is running
        health = requests.get(f"{BASE_URL}/health")
        if health.status_code == 200:
            print("✓ Server is running\n")
        else:
            print("✗ Server is not responding correctly")
            exit(1)
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server. Make sure it's running:")
        print("  python main.py")
        exit(1)
    
    # Run examples
    example_voice_conversation()
    example_direct_booking()
    example_check_availability()
    
    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)
