"""
College seed data — ILLUSTRATIVE ONLY.

IMPORTANT: This list is illustrative only. Autonomy status changes over time.
Example: COEP (College of Engineering Pune) became a fully independent deemed
university and is NO LONGER SPPU-affiliated at all. Treat all entries as
correctable, never as permanent ground truth. Use the /colleges/{id}/report-autonomy
endpoint to submit corrections.

is_autonomous values:
  True  = known autonomous college
  False = known SPPU-affiliated college
  None  = status unknown / needs verification
"""
from typing import Any
from sqlalchemy import select
from app.models.college import College, _normalize

# fmt: off
SEED_COLLEGES: list[dict[str, Any]] = [
    # ── 1. Confirmed Autonomous (9) ───────────────────────────────────────────
    {
        "name": "Pune Institute of Computer Technology (PICT), Dhankawadi, Pune",
        "is_autonomous": True,
        "sppu_college_code": "06271",
        "city": "Pune",
    },
    {
        "name": "Vishwakarma Institute of Technology (VIT), Bibwewadi, Pune",
        "is_autonomous": True,
        "sppu_college_code": "06273",
        "city": "Pune",
    },
    {
        "name": "Pimpri Chinchwad College of Engineering (PCCOE), Nigdi, Pune",
        "is_autonomous": True,
        "sppu_college_code": "06175",
        "city": "Pune",
    },
    {
        "name": "All India Shri Shivaji Memorial Society's College of Engineering (AISSMS COE), Pune",
        "is_autonomous": True,
        "sppu_college_code": "06278",
        "city": "Pune",
    },
    {
        "name": "Cummins College of Engineering for Women (CCOEW), Karvenagar, Pune",
        "is_autonomous": True,
        "sppu_college_code": "06276",
        "city": "Pune",
    },
    {
        "name": "Symbiosis Institute of Technology, Pune",
        "is_autonomous": True,
        "sppu_college_code": None,
        "city": "Pune",
    },
    {
        "name": "MIT College of Engineering, Pune",
        "is_autonomous": True,
        "sppu_college_code": None,
        "city": "Pune",
    },
    {
        "name": "Pune Vidyarthi Griha's College of Engineering, Pune",
        "is_autonomous": True,
        "sppu_college_code": None,
        "city": "Pune",
    },
    {
        "name": "Indira College of Engineering and Management, Pune",
        "is_autonomous": True,
        "sppu_college_code": "06179",
        "city": "Pune",
    },

    # ── 2. Confirmed Non-Autonomous / Affiliated (45) ─────────────────────────
    {
        "name": "Savitribai Phule Pune University Department of Technology",
        "is_autonomous": False,
        "sppu_college_code": None,
        "city": "Pune",
    },
    {
        "name": "Government College of Engineering, Pune",
        "is_autonomous": False,
        "sppu_college_code": None,
        "city": "Pune",
    },
    {
        "name": "Bharati Vidyapeeth's College of Engineering, Lavale, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06796",
        "city": "Pune",
    },
    {
        "name": "Bharati Vidyapeeth's College of Engineering for Women, Katraj, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06285",
        "city": "Pune",
    },
    {
        "name": "Sinhgad College of Engineering, Vadgaon (Bk), Pune",
        "is_autonomous": False,
        "sppu_college_code": "06178",
        "city": "Pune",
    },
    {
        "name": "Smt. Kashibai Navale College of Engineering, Vadgaon (Bk), Pune",
        "is_autonomous": False,
        "sppu_college_code": "06177",
        "city": "Pune",
    },
    {
        "name": "Sinhgad Institute of Technology and Science, Narhe, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06182",
        "city": "Pune",
    },
    {
        "name": "Sinhgad Academy of Engineering, Kondhwa (Bk), Pune",
        "is_autonomous": False,
        "sppu_college_code": "06187",
        "city": "Pune",
    },
    {
        "name": "Sinhgad Institute of Technology, Lonavala",
        "is_autonomous": False,
        "sppu_college_code": "06185",
        "city": "Lonavala",
    },
    {
        "name": "SKN Sinhgad Institute of Technology and Science, Lonavala",
        "is_autonomous": False,
        "sppu_college_code": "06769",
        "city": "Lonavala",
    },
    {
        "name": "Nivrutti Babaji Navale College of Engineering, Kusgaon, Lonavala",
        "is_autonomous": False,
        "sppu_college_code": "06768",
        "city": "Lonavala",
    },
    {
        "name": "RMD Sinhgad School of Engineering, Warje, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06766",
        "city": "Pune",
    },
    {
        "name": "Dr. D. Y. Patil Institute of Technology, Pimpri, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06272",
        "city": "Pune",
    },
    {
        "name": "Dr. D. Y. Patil College of Engineering, Akurdi, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06277",
        "city": "Pune",
    },
    {
        "name": "Dr. D. Y. Patil School of Engineering, Lohegaon, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06786",
        "city": "Pune",
    },
    {
        "name": "Dr. D. Y. Patil Institute of Engineering, Management and Research, Akurdi, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06802",
        "city": "Pune",
    },
    {
        "name": "Pimpri Chinchwad College of Engineering and Research, Ravet, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06822",
        "city": "Pune",
    },
    {
        "name": "JSPM's Rajarshi Shahu College of Engineering, Tathawade, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06176",
        "city": "Pune",
    },
    {
        "name": "JSPM's Imperial College of Engineering and Research, Wagholi, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06184",
        "city": "Pune",
    },
    {
        "name": "JSPM's Jayawantrao Sawant College of Engineering, Hadapsar, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06145",
        "city": "Pune",
    },
    {
        "name": "JSPM's Bhivarabai Sawant Institute of Technology and Research, Wagholi, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06759",
        "city": "Pune",
    },
    {
        "name": "TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06315",
        "city": "Pune",
    },
    {
        "name": "TSSM's Padmabhooshan Vasantdada Patil Institute of Technology, Bavdhan, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06122",
        "city": "Pune",
    },
    {
        "name": "Modern Education Society's Wadia College of Engineering, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06275",
        "city": "Pune",
    },
    {
        "name": "Progressive Education Society's Modern College of Engineering, Shivajinagar, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06281",
        "city": "Pune",
    },
    {
        "name": "Marathwada Mitra Mandal's College of Engineering, Karvenagar, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06156",
        "city": "Pune",
    },
    {
        "name": "Marathwada Mitra Mandal's Institute of Technology, Lohgaon, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06203",
        "city": "Pune",
    },
    {
        "name": "All India Shri Shivaji Memorial Society's Institute of Information Technology, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06282",
        "city": "Pune",
    },
    {
        "name": "Genba Sopanrao Moze College of Engineering, Balewadi, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06146",
        "city": "Pune",
    },
    {
        "name": "Zeal College of Engineering and Research, Narhe, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06298",
        "city": "Pune",
    },
    {
        "name": "Al-Ameen Educational and Medical Foundation's College of Engineering, Koregaon Bhima, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06767",
        "city": "Pune",
    },
    {
        "name": "Anantrao Pawar College of Engineering and Research, Parvati, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06794",
        "city": "Pune",
    },
    {
        "name": "Dhole Patil College of Engineering, Wagholi, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06307",
        "city": "Pune",
    },
    {
        "name": "Jayawantrao Sawant Institute of Technology, Hadapsar, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06780",
        "city": "Pune",
    },
    {
        "name": "K. J. College of Engineering and Management Research, Pisoli, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06320",
        "city": "Pune",
    },
    {
        "name": "Trinity College of Engineering and Research, Pisoli, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06322",
        "city": "Pune",
    },
    {
        "name": "Trinity Academy of Engineering, Kondhwa Annexe, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06734",
        "city": "Pune",
    },
    {
        "name": "Nutan Maharashtra Institute of Engineering and Technology, Talegaon Dabhade, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06310",
        "city": "Pune",
    },
    {
        "name": "Nutan College of Engineering and Research, Talegaon Dabhade, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06826",
        "city": "Pune",
    },
    {
        "name": "P. K. Technical Campus, Chakan, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06764",
        "city": "Pune",
    },
    {
        "name": "Rajgad Dnyanpeeth's Technical Campus, Dhangawadi, Bhor, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06317",
        "city": "Pune",
    },
    {
        "name": "S. B. Patil College of Engineering, Vangali, Indapur, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06319",
        "city": "Pune",
    },
    {
        "name": "Siddhant College of Engineering, Sudumbare, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06149",
        "city": "Pune",
    },
    {
        "name": "Universal College of Engineering and Research, Sasewadi, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06781",
        "city": "Pune",
    },
    {
        "name": "Vidya Pratishthan's Kamalnayan Bajaj Institute of Engineering and Technology, Baramati, Pune",
        "is_autonomous": False,
        "sppu_college_code": "06284",
        "city": "Pune",
    },

    # ── 3. Status Unknown (Official DTE Codes) (21) ───────────────────────────
    {
        "name": "Arvind Gavali College of Engineering, Panmalewadi, Satara",
        "is_autonomous": None,
        "sppu_college_code": "06303",
        "city": "Satara",
    },
    {
        "name": "Bhivrabai Sawant College of Engineering and Research, Narhe, Pune",
        "is_autonomous": None,
        "sppu_college_code": "06315",
        "city": "Pune",
    },
    {
        "name": "Chhatrapati Shivaji Maharaj Institute of Technology, Panvel",
        "is_autonomous": None,
        "sppu_college_code": "06803",
        "city": "Panvel",
    },
    {
        "name": "Dr. D. Y. Patil Pratishthan's College of Engineering, Kolhapur",
        "is_autonomous": None,
        "sppu_college_code": "06270",
        "city": "Kolhapur",
    },
    {
        "name": "Fabtech Technical Campus College of Engineering and Research, Sangola, Solapur",
        "is_autonomous": None,
        "sppu_college_code": "06732",
        "city": "Solapur",
    },
    {
        "name": "G. H. Raisoni College of Engineering and Management, Wagholi, Pune",
        "is_autonomous": None,
        "sppu_college_code": "06155",
        "city": "Pune",
    },
    {
        "name": "G. H. Raisoni Institute of Engineering and Technology, Wagholi, Pune",
        "is_autonomous": None,
        "sppu_college_code": "06224",
        "city": "Pune",
    },
    {
        "name": "Karmaveer Bhaurao Patil College of Engineering, Satara",
        "is_autonomous": None,
        "sppu_college_code": "06280",
        "city": "Satara",
    },
    {
        "name": "K. E. Society's Rajarambapu Institute of Technology, Walwa, Sangli",
        "is_autonomous": None,
        "sppu_college_code": "06214",
        "city": "Sangli",
    },
    {
        "name": "Kolhapur Institute of Technology's College of Engineering, Kolhapur",
        "is_autonomous": None,
        "sppu_college_code": "06267",
        "city": "Kolhapur",
    },
    {
        "name": "Nanasaheb Mahadik College of Engineering, Walwa, Sangli",
        "is_autonomous": None,
        "sppu_college_code": "06756",
        "city": "Sangli",
    },
    {
        "name": "Padmabhooshan Vasantraodada Patil Institute of Technology, Tasgaon, Sangli",
        "is_autonomous": None,
        "sppu_college_code": "06269",
        "city": "Sangli",
    },
    {
        "name": "Rayat Shikshan Sanstha's Karmaveer Bhaurao Patil College of Engineering, Satara",
        "is_autonomous": None,
        "sppu_college_code": "06280",
        "city": "Satara",
    },
    {
        "name": "Sanjeevan Engineering and Technology Institute, Panhala, Kolhapur",
        "is_autonomous": None,
        "sppu_college_code": "06311",
        "city": "Kolhapur",
    },
    {
        "name": "Sant Gajanan Maharaj College of Engineering, Gadhinglaj, Kolhapur",
        "is_autonomous": None,
        "sppu_college_code": "06797",
        "city": "Kolhapur",
    },
    {
        "name": "Sharad Institute of Technology College of Engineering, Yadrav, Ichalkaranji",
        "is_autonomous": None,
        "sppu_college_code": "06313",
        "city": "Ichalkaranji",
    },
    {
        "name": "Shree Santkrupa Institute of Engineering and Technology, Karad, Satara",
        "is_autonomous": None,
        "sppu_college_code": "06758",
        "city": "Satara",
    },
    {
        "name": "Shri Balasaheb Mane Shikshan Prasarak Mandal's Group of Institutions, Hathkanangale, Kolhapur",
        "is_autonomous": None,
        "sppu_college_code": "06795",
        "city": "Kolhapur",
    },
    {
        "name": "Tatyasaheb Kore Institute of Engineering and Technology, Warananagar, Panhala",
        "is_autonomous": None,
        "sppu_college_code": "06288",
        "city": "Kolhapur",
    },
    {
        "name": "Walchand College of Engineering, Sangli",
        "is_autonomous": None,
        "sppu_college_code": "06219",
        "city": "Sangli",
    },
    {
        "name": "Walchand Institute of Technology, Solapur",
        "is_autonomous": None,
        "sppu_college_code": "06220",
        "city": "Solapur",
    },

    # ── 4. Uncertain (1) ──────────────────────────────────────────────────────
    {
        "name": "Army Institute of Technology, Pune",
        "is_autonomous": None,
        "sppu_college_code": None,
        "city": "Pune",
    },
]
# fmt: on


def seed_colleges(db) -> None:
    """
    Insert seed colleges if they do not exist.
    Updates sppu_college_code if college exists and was not admin-verified.
    """
    for data in SEED_COLLEGES:
        norm = _normalize(data["name"])
        existing = db.execute(
            select(College).filter(College.normalized_name == norm)
        ).scalars().first()

        if not existing:
            college = College(
                name=data["name"],
                normalized_name=norm,
                is_autonomous=data["is_autonomous"],
                sppu_college_code=data.get("sppu_college_code"),
                city=data.get("city", "Pune"),
                verified_by_admin=False,
            )
            db.add(college)
        else:
            if not existing.verified_by_admin:
                if existing.sppu_college_code != data.get("sppu_college_code"):
                    existing.sppu_college_code = data.get("sppu_college_code")
                if existing.is_autonomous != data["is_autonomous"]:
                    existing.is_autonomous = data["is_autonomous"]
    db.commit()
