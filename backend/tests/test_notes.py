"""Notes endpoint tests (Group 3)."""
import io
import docx
import pytest


def _generate_valid_docx(word_count: int = 250) -> bytes:
    doc = docx.Document()
    doc.add_paragraph(" ".join(["engineering"] * word_count))
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _generate_valid_pdf(word_count: int = 250) -> bytes:
    content = " ".join(["engineering"] * word_count)
    stream_data = f"BT /F1 12 Tf 50 700 Td ({content}) Tj ET".encode("latin-1")
    stream_len = len(stream_data)

    return (
        f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {stream_len} >>
stream
""".encode("latin-1")
        + stream_data
        + b"""
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000000 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
500
%%EOF
"""
    )


async def _create_college_and_subject(client, auth_headers):
    # Create college
    c_resp = await client.post(
        "/api/v1/colleges",
        json={"name": "Notes Test College", "city": "Pune"},
        headers=auth_headers,
    )
    college_id = c_resp.json()["id"]

    # Create subject
    s_resp = await client.post(
        "/api/v1/subjects/suggest",
        json={
            "name": "Distributed Systems Notes Test",
            "branch": "Computer Engineering",
            "academic_year": "BE",
        },
        headers=auth_headers,
    )
    subject_id = s_resp.json()["id"]
    return college_id, subject_id


@pytest.mark.asyncio
async def test_upload_txt_notes_success(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    txt_content = ("operating systems principles and distributed synchronization " * 50).encode("utf-8")

    files = {"file": ("notes.txt", txt_content, "text/plain")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }

    resp = await client.post("/api/v1/notes/upload", data=data, files=files, headers=auth_headers)
    assert resp.status_code == 201
    res_data = resp.json()
    assert res_data["document"]["word_count"] >= 200
    assert res_data["document"]["filename"] == "notes.txt"
    assert "will be shared with future students" in res_data["shared_message"]


@pytest.mark.asyncio
async def test_upload_pdf_notes_success(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    pdf_bytes = _generate_valid_pdf(250)

    files = {"file": ("lecture.pdf", pdf_bytes, "application/pdf")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }

    resp = await client.post("/api/v1/notes/upload", data=data, files=files, headers=auth_headers)
    assert resp.status_code == 201
    res_data = resp.json()
    assert res_data["document"]["word_count"] >= 200
    assert res_data["document"]["filename"] == "lecture.pdf"


@pytest.mark.asyncio
async def test_upload_docx_notes_success(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    docx_bytes = _generate_valid_docx(250)

    files = {"file": ("notes.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }

    resp = await client.post("/api/v1/notes/upload", data=data, files=files, headers=auth_headers)
    assert resp.status_code == 201
    res_data = resp.json()
    assert res_data["document"]["word_count"] >= 200
    assert res_data["document"]["filename"] == "notes.docx"


@pytest.mark.asyncio
async def test_upload_file_too_large_422(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    # 10 MB + 1 KB
    large_bytes = b"x" * (10 * 1024 * 1024 + 1024)

    files = {"file": ("huge.txt", large_bytes, "text/plain")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }

    resp = await client.post("/api/v1/notes/upload", data=data, files=files, headers=auth_headers)
    assert resp.status_code == 422
    assert "10 MB" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_insufficient_text_422(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    short_content = "This is a very short text with only ten words.".encode("utf-8")

    files = {"file": ("short.txt", short_content, "text/plain")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }

    resp = await client.post("/api/v1/notes/upload", data=data, files=files, headers=auth_headers)
    assert resp.status_code == 422
    assert "minimum of 200 words" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_unsupported_format_422(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    content = b"random executable content"

    files = {"file": ("notes.exe", content, "application/octet-stream")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }

    resp = await client.post("/api/v1/notes/upload", data=data, files=files, headers=auth_headers)
    assert resp.status_code == 422
    assert "Unsupported file format" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_get_notes_nonexistent(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    resp = await client.get(
        f"/api/v1/notes?college_id={college_id}&branch=Computer%20Engineering&subject_id={subject_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["exists"] is False
    assert resp.json()["document"] is None


@pytest.mark.asyncio
async def test_get_notes_returns_most_recent(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)

    # First upload
    txt_1 = ("first upload notes content with enough words for validation " * 40).encode("utf-8")
    files_1 = {"file": ("first.txt", txt_1, "text/plain")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }
    r1 = await client.post("/api/v1/notes/upload", data=data, files=files_1, headers=auth_headers)
    assert r1.status_code == 201

    # Second upload
    txt_2 = ("second upload notes content with enough words for validation " * 40).encode("utf-8")
    files_2 = {"file": ("second.txt", txt_2, "text/plain")}
    r2 = await client.post("/api/v1/notes/upload", data=data, files=files_2, headers=auth_headers)
    assert r2.status_code == 201

    # GET should return second upload
    resp = await client.get(
        f"/api/v1/notes?college_id={college_id}&branch=Computer%20Engineering&subject_id={subject_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["exists"] is True
    assert data["document"]["filename"] == "second.txt"


@pytest.mark.asyncio
async def test_admin_soft_delete_notes(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    txt = ("lecture notes to be deleted by administrator later on " * 40).encode("utf-8")
    files = {"file": ("to_delete.txt", txt, "text/plain")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }
    upload_resp = await client.post("/api/v1/notes/upload", data=data, files=files, headers=auth_headers)
    assert upload_resp.status_code == 201
    note_id = upload_resp.json()["document"]["id"]

    # Admin delete
    del_resp = await client.delete(
        f"/api/v1/admin/notes/{note_id}",
        headers={"X-Admin-Secret": "test-admin-secret-not-for-production"},
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"

    # Subsequent GET returns exists=False
    resp = await client.get(
        f"/api/v1/notes?college_id={college_id}&branch=Computer%20Engineering&subject_id={subject_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["exists"] is False


@pytest.mark.asyncio
async def test_start_session_with_notes(client, auth_headers):
    college_id, subject_id = await _create_college_and_subject(client, auth_headers)
    txt = ("specialized distributed systems consensus algorithm raft paxos " * 40).encode("utf-8")
    files = {"file": ("consensus.txt", txt, "text/plain")}
    data = {
        "college_id": college_id,
        "branch": "Computer Engineering",
        "subject_id": subject_id,
    }
    upload_resp = await client.post("/api/v1/notes/upload", data=data, files=files, headers=auth_headers)
    note_id = upload_resp.json()["document"]["id"]

    # Start session with notes_document_id
    start_resp = await client.post(
        "/api/v1/sessions/start",
        json={
            "subject_id": subject_id,
            "difficulty": "Strict",
            "notes_document_id": note_id,
        },
        headers=auth_headers,
    )
    assert start_resp.status_code == 201
    # Mock AI should include "(from shared notes)"
    question = start_resp.json()["question"]
    assert "(from shared notes)" in question
