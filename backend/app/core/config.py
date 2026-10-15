"""
Application configuration — all settings read exclusively from environment variables.
Missing required variables cause startup failure with a clear error naming the variable.
"""
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = ""  # required — validated below

    # ── Auth ─────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = ""  # required — validated below
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── AI Provider ──────────────────────────────────────────────────────────
    # Empty string → mock mode (clearly labeled in UI, not an error)
    GROQ_API_KEY: str = ""
    AI_REQUEST_TIMEOUT_SECONDS: int = 30

    # ── Admin ────────────────────────────────────────────────────────────────
    ADMIN_SECRET: str = ""  # required — validated below

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = ""  # required — comma-separated list, validated below

    # ── Feature Flags ────────────────────────────────────────────────────────
    ENABLE_OCR_FALLBACK: bool = False

    # ── Mastery ──────────────────────────────────────────────────────────────
    MASTERY_WEIGHT_NEW: float = 0.3

    # ── Rate Limiting ────────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def check_required_non_empty(self) -> "Settings":
        required = ("DATABASE_URL", "JWT_SECRET_KEY", "ADMIN_SECRET", "CORS_ORIGINS")
        for field in required:
            if not getattr(self, field):
                raise ValueError(
                    f"Required environment variable '{field}' is missing or empty. "
                    f"See .env.example for reference."
                )
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS_ORIGINS split on comma, stripped of whitespace."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_mock_ai(self) -> bool:
        """True when no Groq API key is configured — app runs in demo/mock mode."""
        return not bool(self.GROQ_API_KEY)


# Module-level singleton — imported everywhere as `from app.core.config import settings`
# This instantiation will raise ValueError at startup if required vars are missing.
settings = Settings()
