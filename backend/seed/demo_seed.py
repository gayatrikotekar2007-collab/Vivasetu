"""
Demo seed module — seeds a clearly-labeled demo student account with realistic sessions,
streak, and topic mastery so reviewers can explore a fully populated dashboard without manual effort.
"""
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import select

from app.core.security import hash_password
from app.models.college import College, _normalize
from app.models.mastery import TopicMastery
from app.models.session import DrillSession, DrillTurn, SessionTurn, VivaSession
from app.models.subject import Subject
from app.models.user import User

DEMO_EMAIL = "demo@vivasetu.edu"
DEMO_PASSWORD = "DemoPassword123!"


def seed_demo_account(db) -> dict:
    """
    Seed or reset the demo student account demo@vivasetu.edu.
    Idempotent: removes previous demo session data for this user and recreates a clean demo dataset.
    """
    # 1. Find PICT college
    pict_norm = _normalize("Pune Institute of Computer Technology (PICT), Dhankawadi, Pune")
    college = db.execute(
        select(College).filter(College.normalized_name.contains("pune institute of computer technology"))
    ).scalars().first()

    if not college:
        college = College(
            name="Pune Institute of Computer Technology (PICT), Dhankawadi, Pune",
            normalized_name=pict_norm,
            is_autonomous=True,
            sppu_college_code="06271",
            city="Pune",
            verified_by_admin=True,
        )
        db.add(college)
        db.commit()
        db.refresh(college)

    # 2. Find or create demo user
    user = db.execute(
        select(User).filter(User.email == DEMO_EMAIL)
    ).scalars().first()

    target_exam_date = date.today() + timedelta(days=28)

    if not user:
        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Gayatri Kulkarni (Demo Student)",
            college_id=college.id,
            branch="Computer Engineering",
            academic_year="SE",
            syllabus_mode="college_own",
            exam_date=target_exam_date,
            streak_count=5,
            last_drill_date=date.today(),
            profile_complete=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.full_name = "Gayatri Kulkarni (Demo Student)"
        user.college_id = college.id
        user.branch = "Computer Engineering"
        user.academic_year = "SE"
        user.syllabus_mode = "college_own"
        user.exam_date = target_exam_date
        user.streak_count = 5
        user.last_drill_date = date.today()
        user.profile_complete = True
        db.commit()

    # 3. Clean up existing demo sessions / turns / mastery for this user
    existing_sessions = db.execute(
        select(VivaSession).filter(VivaSession.user_id == user.id)
    ).scalars().all()
    for s in existing_sessions:
        db.delete(s)

    existing_mastery = db.execute(
        select(TopicMastery).filter(TopicMastery.user_id == user.id)
    ).scalars().all()
    for m in existing_mastery:
        db.delete(m)

    existing_drills = db.execute(
        select(DrillSession).filter(DrillSession.user_id == user.id)
    ).scalars().all()
    for d in existing_drills:
        db.delete(d)

    db.commit()

    # 4. Find subjects for Computer Engineering SE
    subjects = db.execute(
        select(Subject).filter(
            Subject.branch == "Computer Engineering",
            Subject.academic_year == "SE",
        )
    ).scalars().all()

    sub_map = {s.name: s for s in subjects}
    dms_sub = sub_map.get("Discrete Mathematics") or (subjects[0] if subjects else None)
    fds_sub = (
        sub_map.get("Data Structures")
        or sub_map.get("Fundamentals of Data Structures")
        or (subjects[1] if len(subjects) > 1 else dms_sub)
    )
    oop_sub = (
        sub_map.get("Object Oriented Programming")
        or sub_map.get("Object Oriented Programming (OOP)")
        or (subjects[2] if len(subjects) > 2 else dms_sub)
    )

    now = datetime.now(timezone.utc)

    # 5. Seed 3 real completed Viva Sessions
    if dms_sub:
        sess1 = VivaSession(
            user_id=user.id,
            subject_id=dms_sub.id,
            difficulty="Friendly",
            started_at=now - timedelta(days=2, hours=3),
            ended_at=now - timedelta(days=2, hours=2, minutes=45),
            question_count=3,
            mock_mode=False,
        )
        db.add(sess1)
        db.flush()
        db.add(
            SessionTurn(
                session_id=sess1.id,
                turn_index=1,
                question="Can you explain what an Eulerian path is in graph theory?",
                answer="An Eulerian path is a trail in a finite graph that visits every edge exactly once. For a connected graph, it exists if and only if exactly zero or two vertices have odd degree.",
                answered_at=sess1.started_at + timedelta(minutes=2),
            )
        )
        db.add(
            SessionTurn(
                session_id=sess1.id,
                turn_index=2,
                question="What is the difference between a relation being symmetric versus antisymmetric?",
                answer="A relation R on A is symmetric if for all a, b in A, aRb implies bRa. It is antisymmetric if aRb and bRa implies a = b.",
                answered_at=sess1.started_at + timedelta(minutes=5),
            )
        )
        db.add(
            SessionTurn(
                session_id=sess1.id,
                turn_index=3,
                question="State Pigeonhole Principle with a simple engineering example.",
                answer="If n items are put into m containers with n > m, then at least one container must contain more than one item. In hashing, if keys exceed hash table slots without open addressing, collisions must occur.",
                answered_at=sess1.started_at + timedelta(minutes=8),
            )
        )

    if fds_sub:
        sess2 = VivaSession(
            user_id=user.id,
            subject_id=fds_sub.id,
            difficulty="Strict",
            started_at=now - timedelta(days=1, hours=4),
            ended_at=now - timedelta(days=1, hours=3, minutes=40),
            question_count=3,
            mock_mode=False,
        )
        db.add(sess2)
        db.flush()
        db.add(
            SessionTurn(
                session_id=sess2.id,
                turn_index=1,
                question="What is the time complexity of searching in a balanced Binary Search Tree versus an unbalanced one?",
                answer="Searching in a balanced BST takes O(log n) time because each comparison halves the search space. In a degenerate skewed tree, it degrades to O(n).",
                answered_at=sess2.started_at + timedelta(minutes=3),
            )
        )
        db.add(
            SessionTurn(
                session_id=sess2.id,
                turn_index=2,
                question="How does a circular queue overcome the memory limitation of a simple linear queue?",
                answer="In a linear queue, elements deleted from the front leave unusable memory at the beginning once the rear reaches max size. A circular queue wraps rear back to index 0 using modulo arithmetic.",
                answered_at=sess2.started_at + timedelta(minutes=6),
            )
        )
        db.add(
            SessionTurn(
                session_id=sess2.id,
                turn_index=3,
                question="Explain the difference between collision resolution via Chaining and Linear Probing.",
                answer="Chaining maintains a linked list at each table slot so all collided keys are stored there. Linear probing searches sequentially for the next available empty bucket, which can cause primary clustering.",
                answered_at=sess2.started_at + timedelta(minutes=10),
            )
        )

    if oop_sub:
        sess3 = VivaSession(
            user_id=user.id,
            subject_id=oop_sub.id,
            difficulty="Friendly",
            started_at=now - timedelta(hours=5),
            ended_at=now - timedelta(hours=4, minutes=45),
            question_count=3,
            mock_mode=False,
        )
        db.add(sess3)
        db.flush()
        db.add(
            SessionTurn(
                session_id=sess3.id,
                turn_index=1,
                question="What is runtime polymorphism in C++ and how is it achieved?",
                answer="Runtime polymorphism allows a function call to be resolved dynamically at runtime rather than compile time. In C++, it is achieved using virtual functions and base class pointers.",
                answered_at=sess3.started_at + timedelta(minutes=2),
            )
        )
        db.add(
            SessionTurn(
                session_id=sess3.id,
                turn_index=2,
                question="Why is an abstract class useful and can we instantiate an abstract class directly?",
                answer="An abstract class provides an interface and partial implementation for derived classes. It contains at least one pure virtual function and cannot be instantiated directly.",
                answered_at=sess3.started_at + timedelta(minutes=5),
            )
        )
        db.add(
            SessionTurn(
                session_id=sess3.id,
                turn_index=3,
                question="What is the diamond problem in multiple inheritance?",
                answer="The diamond problem occurs when two classes inherit from a common base class, and a child class inherits from both. The child class receives two copies of the grandparent's members, creating ambiguity, resolved via virtual base classes.",
                answered_at=sess3.started_at + timedelta(minutes=8),
            )
        )

    # 6. Seed real Topic Mastery entries
    mastery_entries = [
        ("Graph Theory & Trees", dms_sub.id if dms_sub else "dms", 85.0, 3, date.today() + timedelta(days=4)),
        ("Pigeonhole Principle & Relations", dms_sub.id if dms_sub else "dms", 78.0, 2, date.today() + timedelta(days=2)),
        ("Binary Search Trees", fds_sub.id if fds_sub else "fds", 72.0, 3, date.today() + timedelta(days=1)),
        ("Queue & Stack Data Structures", fds_sub.id if fds_sub else "fds", 68.0, 2, date.today() + timedelta(days=3)),
        ("Virtual Functions & Polymorphism", oop_sub.id if oop_sub else "oop", 90.0, 4, date.today() + timedelta(days=6)),
        ("Inheritance & Abstract Classes", oop_sub.id if oop_sub else "oop", 88.0, 3, date.today() + timedelta(days=5)),
    ]

    for topic_name, sub_id, score, count, review_date in mastery_entries:
        db.add(
            TopicMastery(
                user_id=user.id,
                topic_name=topic_name,
                branch="Computer Engineering",
                subject_id=sub_id,
                mastery_score=score,
                session_count=count,
                next_review_due=review_date,
            )
        )

    # 7. Seed completed Daily Drill session for today
    drill = DrillSession(
        user_id=user.id,
        drill_date=date.today(),
        completed=True,
        completed_at=datetime.now(timezone.utc),
        question_count=1,
    )
    db.add(drill)
    db.flush()
    db.add(
        DrillTurn(
            drill_id=drill.id,
            turn_index=1,
            question="What is an Eulerian graph?",
            topic="Graph Theory",
            answer="A connected graph containing an Eulerian circuit.",
            answered_at=datetime.now(timezone.utc),
        )
    )

    db.commit()

    return {
        "status": "success",
        "message": "Demo account successfully seeded with realistic SPPU curriculum data.",
        "account": {
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD,
            "college": "Pune Institute of Computer Technology (PICT), Dhankawadi, Pune",
            "branch": "Computer Engineering",
            "academic_year": "SE",
            "streak_count": 5,
            "sessions_seeded": 3,
            "mastery_topics_seeded": len(mastery_entries),
        },
    }


if __name__ == "__main__":
    from app.core.config import settings
    from app.core.database import create_engine_from_url, sessionmaker
    engine = create_engine_from_url(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        res = seed_demo_account(db)
        print(res)
    finally:
        db.close()
