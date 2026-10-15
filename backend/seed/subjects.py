"""
Subject and Branch seed data for SPPU curriculum.

- 25 Branches seeded into the `branches` table.
- First Year (FE): Common branch-independent curriculum (Sem 1 & Sem 2).
- Second Year (SE): Sem 3 & Sem 4 subjects and laboratories across 15 active branches.
- 10 branches have 0 subjects (honest empty states).
"""
from typing import Any
from sqlalchemy import select
from app.models.branch import Branch
from app.models.subject import Subject

# ── 1. The 25 SPPU Engineering Branches ───────────────────────────────────────
ALL_24_BRANCHES = [
    "Computer Engineering",
    "Computer Science",
    "Computer Science & Engineering",
    "CSE (Artificial Intelligence)",
    "CSE (Data Science)",
    "AI & Machine Learning",
    "AI & Data Science",
    "Electronics & Computer Engineering",
    "Electronics & Telecommunication",
    "Electronics Engineering (VLSI Design & Technology)",
    "Mechatronics Engineering",
    "Robotics & Automation Engineering",
    "Robotics & Artificial Intelligence",
    "Internet of Things",
    "Mechanical Engineering",
    "Mechanical Engineering (Sandwich)",
    "Civil Engineering",
    "Electrical Engineering",
    "Instrumentation & Control Engineering",
    "Chemical Engineering",
    "Automobile Engineering",
    "Information Technology",
    "Computer Science & Design",
    "Printing & Packaging Technology",
    "Biotechnology",
]

# Alias for clarity
ALL_BRANCHES = ALL_24_BRANCHES

# ── 2. First Year (FE) Common Curriculum ──────────────────────────────────────
# Common across all engineering branches in SPPU
FE_SUBJECTS = [
    # Semester 1 (11 subjects)
    {"name": "Engineering Mathematics I", "semester": 1},
    {"name": "Engineering Physics", "semester": 1},
    {"name": "Engineering Chemistry", "semester": 1},
    {"name": "Systems in Mechanical Engineering", "semester": 1},
    {"name": "Basic Electrical Engineering", "semester": 1},
    {"name": "Basic Electronics Engineering", "semester": 1},
    {"name": "Basic Civil and Environmental Engineering", "semester": 1},
    {"name": "Engineering Graphics", "semester": 1},
    {"name": "Manufacturing Practices Workshop", "semester": 1},
    {"name": "Project Based Learning", "semester": 1},
    {"name": "Physical Education Exercise and Field Activities", "semester": 1},
    # Semester 2 (Core 5 subjects)
    {"name": "Engineering Mathematics II", "semester": 2},
    {"name": "Engineering Mechanics", "semester": 2},
    {"name": "Programming and Problem Solving", "semester": 2},
    {"name": "English", "semester": 2},
    {"name": "Environmental Studies I", "semester": 2},
]

# ── 3. Second Year (SE) Curriculum (15 Active Branches) ───────────────────────
SE_CURRICULUM: dict[str, dict[int, list[str]]] = {
    # 1. Computer Engineering
    "Computer Engineering": {
        3: [
            "Discrete Mathematics",
            "Data Structures",
            "Object Oriented Programming",
            "Digital Electronics and Logic Design",
            "Data Structures Laboratory",
            "Object Oriented Programming Laboratory",
            "Digital Electronics Laboratory",
            "Entrepreneurship/Management",
            "Universal Human Values",
            "Community Engagement Project",
            "Open Elective-I",
            "Multidisciplinary Minor",
        ],
        4: [
            "Database Management Systems",
            "Operating Systems",
            "Computer Organization & Microprocessor",
            "Database Management Systems Laboratory",
            "Operating Systems Laboratory",
            "Microprocessor Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor (Internet of Things)",
            "Web Development",
            "Modern Indian Language",
            "Engineering Product Design",
            "Environmental Studies",
        ],
    },
    # 2. Computer Science
    "Computer Science": {
        3: [
            "Data Structures",
            "Object Oriented Programming",
            "Operating Systems",
            "Data Structures Laboratory",
            "Object Oriented Programming Laboratory",
            "Digital Electronics and Logic Design",
            "Entrepreneurship/Management",
            "Universal Human Values",
            "Community Engagement Project",
            "Open Elective-I",
            "Multidisciplinary Minor",
        ],
        4: [
            "Database Management Systems",
            "Discrete Mathematics",
            "Computer Organization & Microprocessor",
            "Database Management Systems Laboratory",
            "Microprocessor Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor (Internet of Things)",
            "Web Development",
            "Modern Indian Language",
            "Engineering Product Design",
            "Environmental Studies",
        ],
    },
    # 3. Computer Science & Engineering
    "Computer Science & Engineering": {
        3: [
            "Discrete Mathematics",
            "Data Structures",
            "Object-Oriented Programming & Computer Graphics",
            "Operating Systems",
            "Digital Electronics & Logic Design",
            "Data Structures Laboratory",
            "OOP & Computer Graphics Laboratory",
            "Digital Electronics & Logic Design Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship/Economics/Management",
            "Universal Human Values & Professional Ethics",
            "Community Engagement Project",
        ],
        4: [
            "Database Management Systems",
            "Computer Networks",
            "Computer Organization & Architecture",
            "DBMS Laboratory",
            "Computer Networks Laboratory",
            "Computer Organization & Architecture Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Web Development",
            "Modern Indian Language",
            "Engineering Product Design",
            "Environmental Studies",
        ],
    },
    # 4. CSE (Artificial Intelligence)
    "CSE (Artificial Intelligence)": {
        3: [
            "Discrete Mathematics",
            "Data Structures & Algorithms",
            "Object-Oriented Programming & Computer Graphics",
            "Artificial Intelligence",
            "Operating Systems",
            "Data Structures & Algorithms Laboratory",
            "OOP & Computer Graphics Laboratory",
            "Artificial Intelligence Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
            "Community Engagement Project",
        ],
        4: [
            "Database Management Systems",
            "Machine Learning",
            "Computer Networks",
            "Computer Organization & Architecture",
            "DBMS Laboratory",
            "Machine Learning Laboratory",
            "Computer Networks Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Web Development",
            "Modern Indian Language",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
    # 5. CSE (Data Science)
    "CSE (Data Science)": {
        3: [
            "Discrete Mathematics",
            "Data Structures & Algorithms",
            "Object-Oriented Programming & Computer Graphics",
            "Database Management Systems",
            "Operating Systems",
            "Data Structures & Algorithms Laboratory",
            "OOP & Computer Graphics Laboratory",
            "DBMS Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
            "Community Engagement Project",
        ],
        4: [
            "Data Science",
            "Machine Learning",
            "Probability & Statistics",
            "Computer Networks",
            "Data Science Laboratory",
            "Machine Learning Laboratory",
            "Computer Networks Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Web Development",
            "Modern Indian Language",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
    # 6. AI & Machine Learning
    "AI & Machine Learning": {
        3: [
            "Data Structures and Algorithms",
            "Artificial Intelligence",
            "Operating Systems",
            "Data Structures & Algorithms Laboratory",
            "Artificial Intelligence Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
            "Community Engagement Project",
        ],
        4: [
            "Database Management Systems",
            "Machine Learning",
            "Probability & Statistics",
            "Database Management Systems Laboratory",
            "Machine Learning Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Object-Oriented Programming",
            "Modern Indian Language",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
    # 7. Electronics & Computer Engineering
    "Electronics & Computer Engineering": {
        3: [
            "Discrete Mathematics",
            "Data Structures & Algorithms",
            "Digital Electronics & Logic Design",
            "Object-Oriented Programming",
            "Data Structures & Algorithms Laboratory",
            "Digital Electronics Laboratory",
            "Object-Oriented Programming Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
            "Community Engagement Project",
        ],
        4: [
            "Engineering Mathematics",
            "Computer Organization & Architecture",
            "Database Management Systems",
            "Microprocessors & Microcontrollers",
            "Computer Networks",
            "DBMS Laboratory",
            "Microprocessors & Microcontrollers Laboratory",
            "Computer Networks Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Object-Oriented/Professional Skill Development",
            "Environmental Studies",
        ],
    },
    # 8. Mechatronics Engineering
    "Mechatronics Engineering": {
        3: [
            "Engineering Mathematics-III",
            "Strength of Materials",
            "Sensors & Instrumentation",
            "Manufacturing Processes",
            "Electrical & Electronic Systems",
            "Sensors & Instrumentation Laboratory",
            "Manufacturing Processes Laboratory",
            "Electrical & Electronics Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
        ],
        4: [
            "Kinematics of Machines",
            "Dynamics of Machines",
            "Microcontrollers & Embedded Systems",
            "Industrial Automation",
            "Mechatronics System Design",
            "Microcontrollers & Embedded Systems Laboratory",
            "Industrial Automation Laboratory",
            "Mechatronics System Design Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
    # 9. Robotics & Automation Engineering
    "Robotics & Automation Engineering": {
        3: [
            "Engineering Mathematics-III",
            "Engineering Mechanics",
            "Sensors & Transducers",
            "Manufacturing Processes",
            "Electrical & Electronics Engineering",
            "Sensors & Transducers Laboratory",
            "Manufacturing Processes Laboratory",
            "Electrical & Electronics Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
        ],
        4: [
            "Kinematics of Machines",
            "Dynamics of Machines",
            "Microcontrollers & Embedded Systems",
            "Robotics Fundamentals",
            "Control Systems",
            "Microcontrollers & Embedded Systems Laboratory",
            "Robotics Laboratory",
            "Control Systems Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
    # 10. Robotics & Artificial Intelligence
    "Robotics & Artificial Intelligence": {
        3: [
            "Robot Operating System",
            "Hydraulics & Pneumatics",
            "Electrical & Electronics Engineering",
            "Data Structures & Algorithms",
            "Probability & Statistics",
            "Robot Operating System Laboratory",
            "Data Structures Laboratory",
            "Electrical & Electronics Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Universal Human Values & Professional Ethics",
            "Entrepreneurship/Management",
        ],
        4: [
            "Design of Machines & Mechanisms",
            "Materials & Manufacturing Technology",
            "Computer Graphics for Robotics",
            "Programming for Robotics",
            "Computer Graphics for Robotics Laboratory",
            "Measurement Laboratory",
            "Creative Problem Solving & Critical Thinking",
            "Open Elective-II",
            "Multidisciplinary Minor (Industrial Engineering & Management)",
            "Modern Indian Language",
            "Behavioural Science",
            "Environmental Studies",
            "Mini-project/Case Study/Seminar",
        ],
    },
    # 11. Electronics Engineering (VLSI Design & Technology)
    "Electronics Engineering (VLSI Design & Technology)": {
        3: [
            "Electronics Circuits",
            "Engineering Mathematics-III",
            "Digital Electronics",
            "Data Structures & Algorithms",
            "Semiconductor Devices/VLSI Fundamentals",
            "Electronics Circuits Laboratory",
            "Digital Electronics Laboratory",
            "Data Structures & Algorithms Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Universal Human Values & Professional Ethics",
            "Entrepreneurship Development",
        ],
        4: [
            "Analog & Digital Communication",
            "Microprocessors & Microcontrollers",
            "VLSI Design",
            "Computer Networks",
            "Digital Signal Processing",
            "VLSI Laboratory",
            "Microprocessor & Microcontroller Laboratory",
            "DSP Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
    # 12. Mechanical Engineering (Sandwich)
    "Mechanical Engineering (Sandwich)": {
        3: [
            "Engineering Mathematics-III",
            "Strength of Materials",
            "Manufacturing Processes",
            "Thermodynamics",
            "Machine Drawing/Engineering Graphics",
            "Manufacturing Processes Laboratory",
            "Strength of Materials Laboratory",
            "CAD/Machine Drawing Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
        ],
        4: [
            "Theory of Machines",
            "Fluid Mechanics",
            "Heat Transfer",
            "Metrology & Quality Control",
            "Industrial Engineering",
            "Theory of Machines Laboratory",
            "Fluid Mechanics Laboratory",
            "Metrology & Quality Control Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
    # 13. Printing & Packaging Technology
    "Printing & Packaging Technology": {
        3: [
            "Engineering Mathematics-III",
            "Printing Processes",
            "Packaging Materials",
            "Graphic Design & Prepress",
            "Printing & Packaging Machinery",
            "Printing Processes Laboratory",
            "Graphic Design & Prepress Laboratory",
            "Packaging Materials Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
            "Community Engagement Project",
        ],
        4: [
            "Packaging Technology",
            "Printing Technology",
            "Packaging Design",
            "Print Production Management",
            "Printing & Packaging Quality Control",
            "Printing Technology Laboratory",
            "Packaging Technology Laboratory",
            "Print Production/Quality Control Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Modern Indian Language",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
    # 14. Biotechnology
    "Biotechnology": {
        3: [
            "Engineering Mathematics-III",
            "Biochemistry",
            "Microbiology",
            "Molecular Biology",
            "Bioprocess Engineering",
            "Biochemistry Laboratory",
            "Microbiology Laboratory",
            "Molecular Biology Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
            "Community Engagement Project",
        ],
        4: [
            "Genetic Engineering",
            "Bioprocess Engineering-II",
            "Bioinformatics",
            "Immunology",
            "Environmental Biotechnology",
            "Genetic Engineering Laboratory",
            "Bioprocess Engineering Laboratory",
            "Bioinformatics Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Modern Indian Language",
            "Technology Commercialization & Startup Development",
            "Environmental/Sustainability component",
        ],
    },
    # 15. Internet of Things
    "Internet of Things": {
        3: [
            "Discrete Mathematics",
            "Data Structures & Algorithms",
            "Object-Oriented Programming",
            "Computer Organization & Architecture",
            "Internet of Things Fundamentals",
            "Data Structures & Algorithms Laboratory",
            "Object-Oriented Programming Laboratory",
            "IoT Laboratory",
            "Open Elective-I",
            "Multidisciplinary Minor",
            "Entrepreneurship Development",
            "Universal Human Values & Professional Ethics",
            "Community Engagement Project",
        ],
        4: [
            "Database Management Systems",
            "Computer Networks",
            "Embedded Systems",
            "Web Technologies",
            "IoT Data Analytics",
            "DBMS Laboratory",
            "Embedded Systems Laboratory",
            "IoT Data Analytics Laboratory",
            "Open Elective-II",
            "Multidisciplinary Minor",
            "Modern Indian Language",
            "Technology Commercialization & Startup Development",
            "Environmental Studies",
        ],
    },
}


def seed_subjects(db) -> None:
    """
    Seed 25 SPPU engineering branches, FE common subjects, and SE curriculum (15 active branches).
    Ensures 10 empty branches have zero subjects and removes obsolete/fabricated branches & subjects.
    Idempotent: updates existing state cleanly.
    """
    # 1. Clean up any obsolete branches not in the official 25 branches
    db.query(Branch).filter(~Branch.name.in_(ALL_24_BRANCHES)).delete(synchronize_session=False)

    # Clean up verified subjects for branches not in SE_CURRICULUM (ensures 10 empty branches have zero subjects)
    active_branch_names = set(SE_CURRICULUM.keys())
    db.query(Subject).filter(
        Subject.branch.isnot(None),
        ~Subject.branch.in_(active_branch_names),
        Subject.is_verified == True,
    ).delete(synchronize_session=False)

    # Clean up any fabricated/obsolete verified SE subjects for the 15 active branches
    for branch_name, semesters in SE_CURRICULUM.items():
        valid_se_names = set()
        for sem_subs in semesters.values():
            valid_se_names.update(sem_subs)
        db.query(Subject).filter(
            Subject.branch == branch_name,
            Subject.academic_year == "SE",
            Subject.is_verified == True,
            ~Subject.name.in_(valid_se_names),
        ).delete(synchronize_session=False)

    # 2. Seed branches (all 25)
    for branch_name in ALL_24_BRANCHES:
        existing_branch = db.execute(
            select(Branch).filter(Branch.name == branch_name)
        ).scalars().first()
        if not existing_branch:
            db.add(Branch(name=branch_name, is_active=True))
    db.commit()

    # 3. Seed First Year (FE) common subjects (branch = None)
    for sub in FE_SUBJECTS:
        existing = db.execute(
            select(Subject).filter(
                Subject.name == sub["name"],
                Subject.academic_year == "FE",
                Subject.semester == sub["semester"],
                Subject.branch.is_(None),
            )
        ).scalars().first()
        if not existing:
            db.add(
                Subject(
                    name=sub["name"],
                    branch=None,
                    academic_year="FE",
                    semester=sub["semester"],
                    is_verified=True,
                )
            )

    # 4. Seed Second Year (SE) curriculum for the 15 active branches
    for branch_name, semesters in SE_CURRICULUM.items():
        for sem, subjects_list in semesters.items():
            for name in subjects_list:
                existing = db.execute(
                    select(Subject).filter(
                        Subject.name == name,
                        Subject.branch == branch_name,
                        Subject.academic_year == "SE",
                        Subject.semester == sem,
                    )
                ).scalars().first()
                if not existing:
                    db.add(
                        Subject(
                            name=name,
                            branch=branch_name,
                            academic_year="SE",
                            semester=sem,
                            is_verified=True,
                        )
                    )

    # 5. Legacy support: Keep BE/TE subjects for Computer Engineering if needed by old tests
    legacy_subjects = [
        {"name": "Software Engineering", "branch": "Computer Engineering", "year": "BE", "sem": None},
        {"name": "Computer Networks", "branch": "Computer Engineering", "year": "BE", "sem": None},
        {"name": "Database Management Systems", "branch": "Computer Engineering", "year": "BE", "sem": None},
        {"name": "Machine Learning", "branch": "Computer Engineering", "year": "BE", "sem": None},
        {"name": "Operating Systems", "branch": "Computer Engineering", "year": "TE", "sem": None},
    ]
    for leg in legacy_subjects:
        existing = db.execute(
            select(Subject).filter(
                Subject.name == leg["name"],
                Subject.branch == leg["branch"],
                Subject.academic_year == leg["year"],
            )
        ).scalars().first()
        if not existing:
            db.add(
                Subject(
                    name=leg["name"],
                    branch=leg["branch"],
                    academic_year=leg["year"],
                    semester=leg["sem"],
                    is_verified=True,
                )
            )

    db.commit()
