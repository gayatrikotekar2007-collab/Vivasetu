"""
Document extraction service — extracts and validates text from PDF, DOCX, and TXT files.

Smarter multi-document ranking is a future upgrade — use most recent for now.
"""
import io
import os

from app.core.config import settings


class DocumentTooLargeError(Exception):
    """Raised when uploaded document exceeds 10 MB."""


class InsufficientTextError(Exception):
    """Raised when document has fewer than 200 words or no extractable text."""


class UnsupportedFormatError(Exception):
    """Raised when file format is not supported."""


class DocumentExtractor:
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
    MIN_WORD_COUNT = 200

    def extract(self, file_bytes: bytes, filename: str) -> str:
        """
        Extract text from file bytes based on filename extension.
        Validates file size (max 10 MB) and word count (min 200 words).
        """
        if len(file_bytes) > self.MAX_FILE_SIZE_BYTES:
            raise DocumentTooLargeError("File size exceeds 10 MB limit.")

        _, ext = os.path.splitext(filename.lower())

        if ext == ".pdf":
            text = self._extract_pdf(file_bytes)
        elif ext == ".docx":
            text = self._extract_docx(file_bytes)
        elif ext == ".txt":
            text = self._extract_txt(file_bytes)
        else:
            raise UnsupportedFormatError(
                f"Unsupported file format '{ext}'. Only .pdf, .docx, and .txt files are accepted."
            )

        words = text.split()
        if len(words) < self.MIN_WORD_COUNT:
            if not words and ext == ".pdf" and not settings.ENABLE_OCR_FALLBACK:
                raise InsufficientTextError(
                    "Could not extract text. Enable OCR or upload a text-based PDF."
                )
            raise InsufficientTextError(
                f"Document contains only {len(words)} words. A minimum of {self.MIN_WORD_COUNT} words is required."
            )

        return text.strip()

    def _extract_pdf(self, file_bytes: bytes) -> str:
        import pypdf

        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                pages_text.append(extracted)
        text = "\n\n".join(pages_text).strip()

        if not text and settings.ENABLE_OCR_FALLBACK:
            # Optional OCR fallback using pytesseract if configured
            try:
                import pytesseract
                from pdf2image import convert_from_bytes

                images = convert_from_bytes(file_bytes)
                ocr_text = [pytesseract.image_to_string(img) for img in images]
                text = "\n\n".join(ocr_text).strip()
            except Exception:
                pass

        return text

    def _extract_docx(self, file_bytes: bytes) -> str:
        import docx

        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs).strip()

    def _extract_txt(self, file_bytes: bytes) -> str:
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1", errors="replace")
