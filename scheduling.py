"""
Scheduling logic module for managing appointments and availability.
"""
from datetime import datetime, timedelta, time as dt_time
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
import pytz
from models import Booking
from config import settings


class SchedulingService:
    """Service for managing appointment scheduling logic."""
    
    def __init__(self):
        """Initialize scheduling service with business configuration."""
        self.timezone = pytz.timezone(settings.timezone)
        self.business_start = self._parse_time(settings.business_hours_start)
        self.business_end = self._parse_time(settings.business_hours_end)
        self.slot_duration = timedelta(minutes=settings.slot_duration_minutes)
    
    def _parse_time(self, time_str: str) -> dt_time:
        """Parse time string (HH:MM) into time object."""
        hour, minute = map(int, time_str.split(":"))
        return dt_time(hour, minute)
    
    def _is_business_hours(self, dt: datetime) -> bool:
        """Check if datetime falls within business hours."""
        if dt.tzinfo is None:
            dt = self.timezone.localize(dt)
        else:
            dt = dt.astimezone(self.timezone)
        
        time_only = dt.time()
        return self.business_start <= time_only < self.business_end
    
    def _is_weekday(self, dt: datetime) -> bool:
        """Check if datetime is a weekday (Monday-Friday)."""
        return dt.weekday() < 5
    
    def check_availability(
        self, 
        db: Session, 
        start_datetime: datetime, 
        end_datetime: Optional[datetime] = None
    ) -> bool:
        """
        Check if a time slot is available.
        
        Args:
            db: Database session
            start_datetime: Start datetime of the slot
            end_datetime: End datetime (if None, uses slot_duration)
        
        Returns:
            True if available, False otherwise
        """
        if end_datetime is None:
            end_datetime = start_datetime + self.slot_duration
        
        # Normalize timezone
        if start_datetime.tzinfo is None:
            start_datetime = self.timezone.localize(start_datetime)
        else:
            start_datetime = start_datetime.astimezone(self.timezone)
        
        if end_datetime.tzinfo is None:
            end_datetime = self.timezone.localize(end_datetime)
        else:
            end_datetime = end_datetime.astimezone(self.timezone)
        
        # Check business hours and weekday
        if not self._is_business_hours(start_datetime) or not self._is_weekday(start_datetime):
            return False
        
        # Check for conflicts with existing bookings
        conflicts = db.query(Booking).filter(
            and_(
                Booking.status == "confirmed",
                Booking.appointment_datetime < end_datetime,
                Booking.appointment_datetime + self.slot_duration > start_datetime
            )
        ).count()
        
        return conflicts == 0
    
    def get_free_slots(self, db: Session, day: datetime) -> List[datetime]:
        """
        Get all available time slots for a given day.
        
        Args:
            db: Database session
            day: Date to get slots for
        
        Returns:
            List of available datetime slots
        """
        # Normalize to start of day in timezone
        if day.tzinfo is None:
            day_start = self.timezone.localize(
                datetime.combine(day.date(), self.business_start)
            )
        else:
            day_start = day.astimezone(self.timezone).replace(
                hour=self.business_start.hour,
                minute=self.business_start.minute,
                second=0,
                microsecond=0
            )
        
        # Only process weekdays
        if not self._is_weekday(day_start):
            return []
        
        # Get all existing bookings for the day
        day_end = day_start.replace(
            hour=self.business_end.hour,
            minute=self.business_end.minute
        )
        
        existing_bookings = db.query(Booking).filter(
            and_(
                Booking.status == "confirmed",
                Booking.appointment_datetime >= day_start,
                Booking.appointment_datetime < day_end
            )
        ).all()
        
        # Generate all possible slots
        slots = []
        current = day_start
        
        while current < day_end:
            # Check if this slot conflicts with any booking
            slot_end = current + self.slot_duration
            has_conflict = any(
                booking.appointment_datetime < slot_end and
                booking.appointment_datetime + self.slot_duration > current
                for booking in existing_bookings
            )
            
            if not has_conflict:
                slots.append(current)
            
            current += self.slot_duration
        
        return slots
    
    def suggest_alternative_slots(
        self, 
        db: Session, 
        requested_datetime: datetime,
        days_ahead: int = 7
    ) -> List[datetime]:
        """
        Suggest alternative available slots near the requested time.
        
        Args:
            db: Database session
            requested_datetime: The requested datetime
            days_ahead: Number of days to look ahead
        
        Returns:
            List of alternative available datetime slots
        """
        alternatives = []
        current_date = requested_datetime.date()
        
        # Check same day first
        if self.check_availability(db, requested_datetime):
            alternatives.append(requested_datetime)
        
        # Check surrounding days
        for day_offset in range(1, days_ahead + 1):
            for direction in [-1, 1]:
                check_date = current_date + timedelta(days=direction * day_offset)
                check_datetime = datetime.combine(
                    check_date,
                    requested_datetime.time()
                )
                
                if check_datetime.tzinfo:
                    check_datetime = check_datetime.astimezone(self.timezone)
                else:
                    check_datetime = self.timezone.localize(check_datetime)
                
                if self.check_availability(db, check_datetime):
                    alternatives.append(check_datetime)
                    if len(alternatives) >= 5:  # Limit to 5 suggestions
                        return alternatives
        
        # If still not enough, get free slots from the requested day
        if len(alternatives) < 3:
            free_slots = self.get_free_slots(db, requested_datetime)
            alternatives.extend(free_slots[:5])
        
        return alternatives[:5]  # Return up to 5 alternatives


# Global instance
scheduling_service = SchedulingService()
