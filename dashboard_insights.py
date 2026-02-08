"""
Dashboard insights service for operator metrics and AI recommendations.
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models import (
    Operator, CallLog, Booking, RecoveryLog, Feedback,
    ClientProfile, CallHistory
)
from recovery_agent import recovery_agent
from logging_config import get_logger

logger = get_logger("dashboard_insights")


class DashboardInsightsService:
    """Service for generating dashboard insights and recommendations."""
    
    def get_operator_insights(
        self,
        db: Session,
        operator_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get comprehensive insights for an operator.
        
        Args:
            db: Database session
            operator_id: Operator ID
            days: Number of days to analyze
        
        Returns:
            Dict with metrics, insights, and AI recommendations
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get call metrics
        call_metrics = self._get_call_metrics(db, operator_id, start_date)
        
        # Get recovery metrics
        recovery_metrics = self._get_recovery_metrics(db, operator_id, start_date)
        
        # Get booking metrics
        booking_metrics = self._get_booking_metrics(db, operator_id, start_date)
        
        # Get no-show risk
        no_show_risk = self._calculate_no_show_risk(db, operator_id)
        
        # Generate AI recommendations
        recommendations = self._generate_recommendations(
            call_metrics,
            recovery_metrics,
            booking_metrics,
            no_show_risk
        )
        
        return {
            "operator_id": operator_id,
            "period_days": days,
            "metrics": {
                "calls": call_metrics,
                "recovery": recovery_metrics,
                "bookings": booking_metrics,
                "no_show_risk": no_show_risk
            },
            "ai_recommendations": recommendations,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def _get_call_metrics(
        self,
        db: Session,
        operator_id: int,
        start_date: datetime
    ) -> Dict[str, Any]:
        """Get call-related metrics."""
        calls = db.query(CallLog).filter(
            CallLog.operator_id == operator_id,
            CallLog.started_at >= start_date
        ).all()
        
        total_calls = len(calls)
        completed = len([c for c in calls if c.status == "completed"])
        abandoned = len([c for c in calls if c.status == "abandoned"])
        missed = len([c for c in calls if c.missed_call_detected == True])
        
        # Average call duration
        durations = []
        for call in calls:
            if call.ended_at and call.started_at:
                duration = (call.ended_at - call.started_at).total_seconds()
                durations.append(duration)
        
        avg_duration = sum(durations) / len(durations) if durations else 0
        
        return {
            "total_calls": total_calls,
            "completed": completed,
            "abandoned": abandoned,
            "missed": missed,
            "completion_rate": (completed / total_calls * 100) if total_calls > 0 else 0,
            "average_duration_seconds": round(avg_duration, 2)
        }
    
    def _get_recovery_metrics(
        self,
        db: Session,
        operator_id: int,
        start_date: datetime
    ) -> Dict[str, Any]:
        """Get recovery-related metrics."""
        recoveries = db.query(RecoveryLog).join(CallLog).filter(
            CallLog.operator_id == operator_id,
            RecoveryLog.attempted_at >= start_date
        ).all()
        
        total_attempts = len(recoveries)
        successful = len([r for r in recoveries if r.status == "successful"])
        failed = len([r for r in recoveries if r.status == "failed"])
        pending = len([r for r in recoveries if r.status == "pending"])
        
        return {
            "total_attempts": total_attempts,
            "successful": successful,
            "failed": failed,
            "pending": pending,
            "success_rate": (successful / total_attempts * 100) if total_attempts > 0 else 0
        }
    
    def _get_booking_metrics(
        self,
        db: Session,
        operator_id: int,
        start_date: datetime
    ) -> Dict[str, Any]:
        """Get booking-related metrics."""
        bookings = db.query(Booking).join(CallLog).filter(
            CallLog.operator_id == operator_id,
            Booking.created_at >= start_date
        ).all()
        
        total_bookings = len(bookings)
        confirmed = len([b for b in bookings if b.status == "confirmed"])
        cancelled = len([b for b in bookings if b.status == "cancelled"])
        no_shows = len([b for b in bookings if b.status == "no_show"])
        
        return {
            "total_bookings": total_bookings,
            "confirmed": confirmed,
            "cancelled": cancelled,
            "no_shows": no_shows,
            "cancellation_rate": (cancelled / total_bookings * 100) if total_bookings > 0 else 0,
            "no_show_rate": (no_shows / total_bookings * 100) if total_bookings > 0 else 0
        }
    
    def _calculate_no_show_risk(
        self,
        db: Session,
        operator_id: int
    ) -> Dict[str, Any]:
        """Calculate no-show risk metrics."""
        # Get clients with high risk scores
        high_risk_clients = db.query(ClientProfile).filter(
            ClientProfile.operator_id == operator_id,
            ClientProfile.risk_score >= 70
        ).count()
        
        # Get upcoming bookings
        upcoming = db.query(Booking).join(CallLog).filter(
            CallLog.operator_id == operator_id,
            Booking.status == "confirmed",
            Booking.appointment_datetime >= datetime.utcnow()
        ).count()
        
        # Calculate overall risk
        if upcoming > 0:
            risk_percentage = (high_risk_clients / upcoming * 100) if upcoming > 0 else 0
        else:
            risk_percentage = 0
        
        return {
            "high_risk_clients": high_risk_clients,
            "upcoming_bookings": upcoming,
            "risk_percentage": round(risk_percentage, 2),
            "risk_level": "high" if risk_percentage > 30 else "medium" if risk_percentage > 15 else "low"
        }
    
    def _generate_recommendations(
        self,
        call_metrics: Dict[str, Any],
        recovery_metrics: Dict[str, Any],
        booking_metrics: Dict[str, Any],
        no_show_risk: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate AI recommendations for efficiency improvements."""
        recommendations = []
        
        # Call completion rate recommendation
        completion_rate = call_metrics.get("completion_rate", 0)
        if completion_rate < 70:
            recommendations.append({
                "type": "call_completion",
                "priority": "high",
                "title": "Improve Call Completion Rate",
                "message": f"Your call completion rate is {completion_rate:.1f}%. Consider improving call handling to reduce abandonment.",
                "action": "Review abandoned calls and identify common patterns"
            })
        
        # Recovery success recommendation
        recovery_success = recovery_metrics.get("success_rate", 0)
        if recovery_success < 50 and recovery_metrics.get("total_attempts", 0) > 0:
            recommendations.append({
                "type": "recovery",
                "priority": "medium",
                "title": "Improve Recovery Success Rate",
                "message": f"Recovery success rate is {recovery_success:.1f}%. Consider optimizing recovery timing or messaging.",
                "action": "Review recovery attempts and adjust strategy"
            })
        
        # No-show prevention recommendation
        no_show_rate = booking_metrics.get("no_show_rate", 0)
        if no_show_rate > 20:
            recommendations.append({
                "type": "no_show_prevention",
                "priority": "high",
                "title": "Reduce No-Show Rate",
                "message": f"No-show rate is {no_show_rate:.1f}%. Consider sending reminders or confirmation calls.",
                "action": "Implement reminder system for upcoming appointments"
            })
        
        # Cancellation rate recommendation
        cancellation_rate = booking_metrics.get("cancellation_rate", 0)
        if cancellation_rate > 25:
            recommendations.append({
                "type": "cancellation",
                "priority": "medium",
                "title": "Reduce Cancellation Rate",
                "message": f"Cancellation rate is {cancellation_rate:.1f}%. Consider flexible rescheduling options.",
                "action": "Offer easy rescheduling and understand cancellation reasons"
            })
        
        # High-risk clients recommendation
        risk_level = no_show_risk.get("risk_level", "low")
        if risk_level == "high":
            recommendations.append({
                "type": "risk_management",
                "priority": "high",
                "title": "Manage High-Risk Clients",
                "message": f"You have {no_show_risk.get('high_risk_clients', 0)} high-risk clients. Consider proactive outreach.",
                "action": "Send reminders and confirmations to high-risk clients"
            })
        
        # Positive feedback
        if completion_rate > 85 and no_show_rate < 10:
            recommendations.append({
                "type": "positive",
                "priority": "low",
                "title": "Excellent Performance",
                "message": "Your call handling and booking management are performing well!",
                "action": "Continue current practices"
            })
        
        return recommendations


# Global instance
dashboard_insights_service = DashboardInsightsService()
