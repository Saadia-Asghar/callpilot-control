"""
Google Calendar integration module with mock option.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from config import settings
import json


class CalendarService:
    """Service for Google Calendar integration."""
    
    def __init__(self, use_mock: bool = True):
        """
        Initialize calendar service.
        
        Args:
            use_mock: If True, use mock calendar instead of real Google Calendar API
        """
        self.use_mock = use_mock
        self.mock_events = []  # Store mock events
        
        if not use_mock:
            self._initialize_google_calendar()
    
    def _initialize_google_calendar(self):
        """Initialize Google Calendar API client."""
        try:
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from googleapiclient.discovery import build
            from googleapiclient.errors import HttpError
            
            # SCOPES = ['https://www.googleapis.com/auth/calendar']
            # This would require OAuth setup - for MVP, we'll use mock
            self.service = None
            print("Google Calendar API not fully configured - using mock mode")
            self.use_mock = True
        except ImportError:
            print("Google Calendar libraries not installed - using mock mode")
            self.use_mock = True
    
    def create_event(
        self,
        summary: str,
        start_datetime: datetime,
        end_datetime: Optional[datetime] = None,
        description: Optional[str] = None,
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a calendar event.
        
        Args:
            summary: Event title/summary
            start_datetime: Start datetime
            end_datetime: End datetime (if None, uses start + slot duration)
            description: Event description
            location: Event location
        
        Returns:
            Dict with event details
        """
        if end_datetime is None:
            end_datetime = start_datetime + timedelta(minutes=settings.slot_duration_minutes)
        
        if self.use_mock:
            event = {
                "id": f"mock_event_{len(self.mock_events) + 1}",
                "summary": summary,
                "start": {
                    "dateTime": start_datetime.isoformat(),
                    "timeZone": settings.timezone
                },
                "end": {
                    "dateTime": end_datetime.isoformat(),
                    "timeZone": settings.timezone
                },
                "description": description or "",
                "location": location or "",
                "status": "confirmed",
                "created": datetime.utcnow().isoformat()
            }
            self.mock_events.append(event)
            return {
                "success": True,
                "event_id": event["id"],
                "event": event,
                "htmlLink": f"https://calendar.google.com/calendar/event?eid={event['id']}"
            }
        else:
            # Real Google Calendar API implementation
            return self._create_google_calendar_event(
                summary, start_datetime, end_datetime, description, location
            )
    
    def _create_google_calendar_event(
        self,
        summary: str,
        start_datetime: datetime,
        end_datetime: datetime,
        description: Optional[str],
        location: Optional[str]
    ) -> Dict[str, Any]:
        """Create event using real Google Calendar API."""
        # Placeholder for real implementation
        # Would require OAuth credentials and proper setup
        event = {
            'summary': summary,
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': settings.timezone,
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': settings.timezone,
            },
        }
        
        if description:
            event['description'] = description
        if location:
            event['location'] = location
        
        # Real implementation would be:
        # event = self.service.events().insert(calendarId='primary', body=event).execute()
        # return {"success": True, "event_id": event['id'], "event": event}
        
        return {"error": "Google Calendar API not configured"}
    
    def get_events(
        self,
        start_datetime: datetime,
        end_datetime: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get events in a date range.
        
        Args:
            start_datetime: Start of range
            end_datetime: End of range
        
        Returns:
            List of event dictionaries
        """
        if self.use_mock:
            events = []
            for event in self.mock_events:
                event_start = datetime.fromisoformat(event["start"]["dateTime"])
                if start_datetime <= event_start < end_datetime:
                    events.append(event)
            return events
        else:
            return self._get_google_calendar_events(start_datetime, end_datetime)
    
    def _get_google_calendar_events(
        self,
        start_datetime: datetime,
        end_datetime: datetime
    ) -> List[Dict[str, Any]]:
        """Get events using real Google Calendar API."""
        # Placeholder for real implementation
        # events_result = self.service.events().list(
        #     calendarId='primary',
        #     timeMin=start_datetime.isoformat(),
        #     timeMax=end_datetime.isoformat(),
        #     singleEvents=True,
        #     orderBy='startTime'
        # ).execute()
        # return events_result.get('items', [])
        return []
    
    def delete_event(self, event_id: str) -> Dict[str, Any]:
        """
        Delete a calendar event.
        
        Args:
            event_id: ID of event to delete
        
        Returns:
            Dict with deletion result
        """
        if self.use_mock:
            self.mock_events = [e for e in self.mock_events if e["id"] != event_id]
            return {"success": True, "event_id": event_id}
        else:
            return self._delete_google_calendar_event(event_id)
    
    def _delete_google_calendar_event(self, event_id: str) -> Dict[str, Any]:
        """Delete event using real Google Calendar API."""
        # Placeholder for real implementation
        # self.service.events().delete(calendarId='primary', eventId=event_id).execute()
        # return {"success": True, "event_id": event_id}
        return {"error": "Google Calendar API not configured"}
    
    def sync_with_bookings(self, bookings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Sync calendar events with booking records.
        
        Args:
            bookings: List of booking dictionaries
        
        Returns:
            Sync result summary
        """
        synced = 0
        created = 0
        
        for booking in bookings:
            if booking.get("status") != "confirmed":
                continue
            
            # Check if event already exists
            event_id = booking.get("calendar_event_id")
            if event_id:
                synced += 1
                continue
            
            # Create new event
            result = self.create_event(
                summary=f"Appointment - {booking.get('name', 'Guest')}",
                start_datetime=datetime.fromisoformat(booking["appointment_datetime"]),
                description=booking.get("reason", "")
            )
            
            if result.get("success"):
                created += 1
                booking["calendar_event_id"] = result["event_id"]
        
        return {
            "synced": synced,
            "created": created,
            "total": len(bookings)
        }


# Global instance (defaults to mock)
calendar_service = CalendarService(use_mock=True)
