"""
Smart scheduling service with optimization logic.
Suggests optimal time slots based on historical data and patterns.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models import CallLog, Booking, ClientProfile, RecoveryLog
from scheduling import scheduling_service
from logging_config import get_logger

logger = get_logger("smart_scheduling")


class SmartSchedulingService:
    """Service for intelligent scheduling suggestions."""
    
    def suggest_optimal_slots(
        self,
        db: Session,
        operator_id: int,
        user_id: Optional[int] = None,
        preferred_date: Optional[datetime] = None,
        days_ahead: int = 7
    ) -> Dict[str, Any]:
        """
        Suggest optimal time slots based on historical data.
        
        Args:
            db: Database session
            operator_id: Operator ID
            user_id: Optional user ID for personalized suggestions
            preferred_date: Optional preferred date
            days_ahead: Number of days to look ahead
        
        Returns:
            Dict with suggested slots, confidence scores, and reasoning
        """
        # Get base available slots
        if preferred_date:
            start_date = preferred_date.date()
        else:
            start_date = datetime.now().date()
        
        end_date = start_date + timedelta(days=days_ahead)
        
        # Get all available slots in range
        all_slots = []
        current_date = start_date
        while current_date <= end_date:
            day_dt = datetime.combine(current_date, datetime.min.time())
            slots = scheduling_service.get_free_slots(db, day_dt)
            all_slots.extend(slots)
            current_date += timedelta(days=1)
        
        if not all_slots:
            return {
                "suggestions": [],
                "reasoning": "No available slots found",
                "confidence": 0
            }
        
        # Analyze historical data
        historical_data = self._analyze_historical_patterns(db, operator_id, user_id)
        
        # Score each slot
        scored_slots = []
        for slot in all_slots:
            score, reasoning = self._score_slot(
                slot,
                historical_data,
                user_id,
                db
            )
            scored_slots.append({
                "datetime": slot.isoformat(),
                "score": score,
                "confidence": min(score, 100),
                "reasoning": reasoning
            })
        
        # Sort by score (highest first)
        scored_slots.sort(key=lambda x: x["score"], reverse=True)
        
        # Get top suggestions
        top_suggestions = scored_slots[:5]
        
        # Store suggestions in draft calls if user_id provided
        draft_calls = []
        if user_id:
            # Get active draft calls for this user
            from models import CallLog
            draft_calls = db.query(CallLog).filter(
                CallLog.user_id == user_id,
                CallLog.is_draft == True,
                CallLog.status == "active"
            ).all()
            
            for draft_call in draft_calls:
                if not draft_call.agent_decisions:
                    draft_call.agent_decisions = {}
                
                if "suggested_slots" not in draft_call.agent_decisions:
                    draft_call.agent_decisions["suggested_slots"] = top_suggestions[:3]  # Top 3
                    db.commit()
        
        return {
            "suggestions": top_suggestions,
            "total_available": len(all_slots),
            "reasoning_summary": self._generate_reasoning_summary(historical_data),
            "user_personalization": user_id is not None,
            "stored_in_draft": len(draft_calls) > 0 if user_id else False
        }
    
    def _analyze_historical_patterns(
        self,
        db: Session,
        operator_id: int,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Analyze historical patterns for scheduling optimization.
        
        Returns:
            Dict with pattern analysis
        """
        # Get past bookings
        query = db.query(Booking).join(CallLog).filter(
            CallLog.operator_id == operator_id
        )
        
        if user_id:
            query = query.filter(Booking.user_id == user_id)
        
        bookings = query.all()
        
        # Analyze cancellations
        cancellations = [b for b in bookings if b.status == "cancelled"]
        cancellation_rate = len(cancellations) / len(bookings) if bookings else 0
        
        # Analyze no-shows
        no_shows = [b for b in bookings if b.status == "no_show"]
        no_show_rate = len(no_shows) / len(bookings) if bookings else 0
        
        # Analyze time preferences
        time_preferences = {}
        for booking in bookings:
            if booking.status == "confirmed":
                hour = booking.appointment_datetime.hour
                time_preferences[hour] = time_preferences.get(hour, 0) + 1
        
        # Analyze recovery attempts
        recovery_query = db.query(RecoveryLog).join(CallLog).filter(
            CallLog.operator_id == operator_id
        )
        if user_id:
            recovery_query = recovery_query.join(CallLog).filter(
                CallLog.user_id == user_id
            )
        
        recovery_attempts = recovery_query.count()
        successful_recoveries = recovery_query.filter(
            RecoveryLog.status == "successful"
        ).count()
        
        recovery_success_rate = (
            successful_recoveries / recovery_attempts
            if recovery_attempts > 0 else 0
        )
        
        # Identify high-demand windows
        high_demand_hours = sorted(
            time_preferences.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        return {
            "total_bookings": len(bookings),
            "cancellation_rate": cancellation_rate,
            "no_show_rate": no_show_rate,
            "time_preferences": dict(high_demand_hours),
            "recovery_attempts": recovery_attempts,
            "recovery_success_rate": recovery_success_rate,
            "high_demand_hours": [h[0] for h in high_demand_hours]
        }
    
    def _score_slot(
        self,
        slot: datetime,
        historical_data: Dict[str, Any],
        user_id: Optional[int],
        db: Session
    ) -> tuple[int, str]:
        """
        Score a time slot based on various factors.
        
        Returns:
            Tuple of (score, reasoning)
        """
        score = 50  # Base score
        reasoning_parts = []
        
        hour = slot.hour
        day_of_week = slot.weekday()
        
        # Factor 1: High-demand windows (higher score for popular times)
        high_demand_hours = historical_data.get("high_demand_hours", [])
        if hour in high_demand_hours:
            score += 20
            reasoning_parts.append("Popular time slot")
        else:
            score += 10
            reasoning_parts.append("Available time slot")
        
        # Factor 2: Avoid cancellation-prone times
        cancellation_rate = historical_data.get("cancellation_rate", 0)
        if cancellation_rate > 0.3:  # High cancellation rate
            # Prefer morning slots (typically more reliable)
            if hour < 12:
                score += 15
                reasoning_parts.append("Morning slot (lower cancellation risk)")
        
        # Factor 3: Avoid no-show prone times
        no_show_rate = historical_data.get("no_show_rate", 0)
        if no_show_rate > 0.2:  # High no-show rate
            # Prefer mid-day slots
            if 10 <= hour <= 14:
                score += 15
                reasoning_parts.append("Mid-day slot (better attendance)")
        
        # Factor 4: User preferences (if available)
        if user_id:
            profile = db.query(ClientProfile).filter(
                ClientProfile.user_id == user_id
            ).first()
            
            if profile and profile.preferred_times:
                preferred_hours = profile.preferred_times.get("hours", [])
                if hour in preferred_hours:
                    score += 25
                    reasoning_parts.append("Matches user preference")
        
        # Factor 5: Day of week (prefer weekdays)
        if day_of_week < 5:  # Monday-Friday
            score += 10
            reasoning_parts.append("Weekday appointment")
        
        # Factor 6: Recovery success rate
        recovery_success_rate = historical_data.get("recovery_success_rate", 0)
        if recovery_success_rate > 0.7:
            score += 10
            reasoning_parts.append("High recovery success rate for this time")
        
        # Normalize score
        score = min(score, 100)
        
        reasoning = "; ".join(reasoning_parts) if reasoning_parts else "Standard availability"
        
        return score, reasoning
    
    def _generate_reasoning_summary(self, historical_data: Dict[str, Any]) -> str:
        """Generate summary reasoning for suggestions."""
        parts = []
        
        if historical_data.get("total_bookings", 0) > 0:
            parts.append(f"Based on {historical_data['total_bookings']} past bookings")
        
        cancellation_rate = historical_data.get("cancellation_rate", 0)
        if cancellation_rate > 0.2:
            parts.append(f"High cancellation rate ({cancellation_rate:.0%})")
        
        no_show_rate = historical_data.get("no_show_rate", 0)
        if no_show_rate > 0.15:
            parts.append(f"Moderate no-show rate ({no_show_rate:.0%})")
        
        high_demand = historical_data.get("high_demand_hours", [])
        if high_demand:
            parts.append(f"Peak hours: {', '.join(map(str, high_demand))}")
        
        return ". ".join(parts) if parts else "Standard scheduling patterns"


# Global instance
smart_scheduling_service = SmartSchedulingService()
