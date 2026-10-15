"""
Mastery service — pure functions for spaced repetition mastery scoring and scheduling.

No database access — fully unit-testable.
"""
from datetime import date, timedelta


def update_mastery(existing_score: float, new_score: float, weight_new: float = 0.3) -> float:
    """
    Computes updated mastery score using exponentially weighted moving average.
    Default weight is 0.3 new / 0.7 existing (configurable via settings.MASTERY_WEIGHT_NEW).
    """
    weight_old = 1.0 - weight_new
    updated = (weight_old * existing_score) + (weight_new * new_score)
    return round(max(0.0, min(100.0, updated)), 2)


def next_review_date(mastery_score: float, from_date: date | None = None) -> date:
    """
    Calculates the next spaced repetition review date based on score bands:
      - Score < 40: review in 1 day (critical / weak)
      - Score 40-70: review in 3 days (moderate)
      - Score > 70: review in 7 days (strong / mastered)
    """
    base = from_date or date.today()
    if mastery_score < 40.0:
        return base + timedelta(days=1)
    elif mastery_score <= 70.0:
        return base + timedelta(days=3)
    else:
        return base + timedelta(days=7)
