"""
Streak service — pure function for daily study streak calculations.

Rules per design.md §12:
  - First drill: streak = 1
  - Consecutive calendar day: streak + 1
  - Same calendar day: no change (idempotent)
  - Missed a day (gap > 1): streak resets to 1 (not 0)
"""
from datetime import date


def update_streak(
    current_streak: int,
    last_drill_date: date | None,
    completed_date: date,
) -> tuple[int, date]:
    """
    Returns (new_streak_count, new_last_drill_date).
    Pure function — no side effects, fully testable without DB.
    """
    if last_drill_date is None:
        return 1, completed_date

    delta = (completed_date - last_drill_date).days

    if delta == 1:
        return current_streak + 1, completed_date
    elif delta == 0:
        return current_streak, last_drill_date
    else:
        # Missed a day or clock discrepancy
        return 1, completed_date
