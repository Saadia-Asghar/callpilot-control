"""
Feedback service for tracking AI response ratings and learning loop.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models import Feedback, Operator, CallLog
from logging_config import get_logger

logger = get_logger("feedback")


class FeedbackService:
    """Service for managing feedback and learning loop."""
    
    def submit_feedback(
        self,
        db: Session,
        operator_id: int,
        rating: int,
        call_log_id: Optional[int] = None,
        comment: Optional[str] = None,
        feedback_type: str = "ai_response"
    ) -> Feedback:
        """
        Submit feedback for AI response or service.
        
        Args:
            db: Database session
            operator_id: Operator ID
            rating: Rating 1-5 stars
            call_log_id: Optional call log ID
            comment: Optional comment
            feedback_type: Type of feedback (ai_response, scheduling, recovery, overall)
        
        Returns:
            Created Feedback object
        
        Raises:
            ValueError: If rating is invalid
        """
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        
        feedback = Feedback(
            operator_id=operator_id,
            call_log_id=call_log_id,
            rating=rating,
            comment=comment,
            feedback_type=feedback_type
        )
        
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        
        logger.info(f"Feedback submitted: {rating} stars from operator {operator_id}")
        return feedback
    
    def get_feedback_summary(
        self,
        db: Session,
        operator_id: Optional[int] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get aggregate feedback metrics.
        
        Args:
            db: Database session
            operator_id: Optional operator ID to filter
            days: Number of days to analyze
        
        Returns:
            Dict with feedback summary and metrics
        """
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = db.query(Feedback).filter(Feedback.created_at >= start_date)
        
        if operator_id:
            query = query.filter(Feedback.operator_id == operator_id)
        
        all_feedback = query.all()
        
        if not all_feedback:
            return {
                "total_feedback": 0,
                "average_rating": 0,
                "rating_distribution": {},
                "by_type": {},
                "recent_feedback": []
            }
        
        # Calculate metrics
        total = len(all_feedback)
        average_rating = sum(f.rating for f in all_feedback) / total
        
        # Rating distribution
        rating_dist = {}
        for i in range(1, 6):
            rating_dist[i] = len([f for f in all_feedback if f.rating == i])
        
        # By feedback type
        by_type = {}
        for fb_type in ["ai_response", "scheduling", "recovery", "overall"]:
            type_feedback = [f for f in all_feedback if f.feedback_type == fb_type]
            if type_feedback:
                by_type[fb_type] = {
                    "count": len(type_feedback),
                    "average_rating": sum(f.rating for f in type_feedback) / len(type_feedback)
                }
        
        # Recent feedback
        recent = [
            {
                "id": f.id,
                "rating": f.rating,
                "comment": f.comment,
                "type": f.feedback_type,
                "created_at": f.created_at.isoformat() if f.created_at else None
            }
            for f in sorted(all_feedback, key=lambda x: x.created_at, reverse=True)[:10]
        ]
        
        return {
            "total_feedback": total,
            "average_rating": round(average_rating, 2),
            "rating_distribution": rating_dist,
            "by_type": by_type,
            "recent_feedback": recent,
            "period_days": days
        }
    
    def get_ai_improvement_suggestions(
        self,
        db: Session,
        operator_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get AI improvement suggestions based on feedback.
        
        Args:
            db: Database session
            operator_id: Operator ID
        
        Returns:
            List of improvement suggestions
        """
        summary = self.get_feedback_summary(db, operator_id)
        
        suggestions = []
        
        # Low rating analysis
        if summary["average_rating"] < 3.5:
            suggestions.append({
                "type": "low_rating",
                "priority": "high",
                "message": f"Average rating is {summary['average_rating']:.1f}/5. Consider reviewing AI responses.",
                "action": "Review recent low-rated feedback and adjust prompts"
            })
        
        # Type-specific suggestions
        by_type = summary.get("by_type", {})
        
        if "ai_response" in by_type:
            ai_rating = by_type["ai_response"]["average_rating"]
            if ai_rating < 4.0:
                suggestions.append({
                    "type": "ai_response",
                    "priority": "medium",
                    "message": f"AI response rating is {ai_rating:.1f}/5. Responses may need improvement.",
                    "action": "Review AI system prompts and adjust for better responses"
                })
        
        if "scheduling" in by_type:
            sched_rating = by_type["scheduling"]["average_rating"]
            if sched_rating < 4.0:
                suggestions.append({
                    "type": "scheduling",
                    "priority": "medium",
                    "message": f"Scheduling rating is {sched_rating:.1f}/5. Consider optimizing slot suggestions.",
                    "action": "Review scheduling logic and availability handling"
                })
        
        return suggestions


# Global instance
feedback_service = FeedbackService()
