"""
BlackWayConnect Engine - Configuration
Toutes les variables d'environnement centralisées.
Jamais de secrets en dur - tout vient de l'environnement.
"""

import os
from typing import Optional


class Settings:
    """Configuration centralisée du BaaS BlackWayConnect."""

    # ─── Application ─────────────────────────────────────────
    APP_NAME: str = "BlackWayConnect Engine"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.environ.get("ENVIRONMENT", "development")
    DEBUG: bool = os.environ.get("DEBUG", "false").lower() == "true"

    # ─── Security / Auth ─────────────────────────────────────
    JWT_SECRET_KEY: Optional[str] = os.environ.get("JWT_SECRET_KEY")
    JWT_ACCESS_EXPIRE_MINUTES: int = int(os.environ.get("JWT_ACCESS_EXPIRE_MINUTES", "30"))
    JWT_REFRESH_EXPIRE_DAYS: int = int(os.environ.get("JWT_REFRESH_EXPIRE_DAYS", "30"))

    # ─── Sentry ──────────────────────────────────────────────
    SENTRY_DSN: str = os.environ.get("SENTRY_DSN", "")

    # ─── Database (future) ───────────────────────────────────
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./blackwayconnect.db")
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379")

    # ─── External Services ───────────────────────────────────
    OPENAI_API_KEY: Optional[str] = os.environ.get("OPENAI_API_KEY")
    STRIPE_SECRET_KEY: Optional[str] = os.environ.get("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = os.environ.get("STRIPE_WEBHOOK_SECRET")

    # ─── Push Notifications ──────────────────────────────────
    APNS_KEY_ID: Optional[str] = os.environ.get("APNS_KEY_ID")
    APNS_TEAM_ID: Optional[str] = os.environ.get("APNS_TEAM_ID")
    FCM_SERVER_KEY: Optional[str] = os.environ.get("FCM_SERVER_KEY")

    # ─── Email (transactional) ───────────────────────────────
    SMTP_HOST: str = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.environ.get("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.environ.get("SMTP_PASSWORD")
    FROM_EMAIL: str = os.environ.get("FROM_EMAIL", "service@blackwayconnect.com")

    # ─── BlackWay Branding ───────────────────────────────────
    BRAND_NAME: str = "BlackWayConnect"
    BRAND_URL: str = "https://blackwayconnect.com"
    SUPPORT_EMAIL: str = "service@blackwayconnect.com"
    ACCOUNTING_EMAIL: str = "accounting@blackwayconnect.com"

    # ─── Rate Limiting ───────────────────────────────────────
    RATE_LIMIT_AUTHENTICATED: int = int(os.environ.get("RATE_LIMIT_AUTH", "100"))
    RATE_LIMIT_ANONYMOUS: int = int(os.environ.get("RATE_LIMIT_ANON", "30"))


settings = Settings()
