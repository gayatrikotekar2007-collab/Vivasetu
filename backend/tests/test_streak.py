"""Unit tests for streak service (Group 4)."""
from datetime import date, timedelta
import pytest
from app.services.streak_service import update_streak


def test_initial_streak():
    today = date(2026, 9, 15)
    streak, last_date = update_streak(0, None, today)
    assert streak == 1
    assert last_date == today


def test_consecutive_day_increments_streak():
    yesterday = date(2026, 9, 14)
    today = date(2026, 9, 15)
    streak, last_date = update_streak(5, yesterday, today)
    assert streak == 6
    assert last_date == today


def test_same_day_no_change():
    today = date(2026, 9, 15)
    streak, last_date = update_streak(3, today, today)
    assert streak == 3
    assert last_date == today


def test_missed_day_resets_to_one():
    three_days_ago = date(2026, 9, 12)
    today = date(2026, 9, 15)
    streak, last_date = update_streak(10, three_days_ago, today)
    assert streak == 1
    assert last_date == today
