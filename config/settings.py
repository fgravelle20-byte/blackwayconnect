import os
from typing import Optional

class Settings:
    APP_NAME: str = "BlackWayConnect Engine"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.environ.get("ENVIRONMENT", "development")
    DEBUG: bool = os.environ.get("DEBUG", "false").lower() == "true"
    JWT_SECRET_KEY: Optional[str] = os.environ.get("JWT_SECRET_KEY")
    JWT_ACCESS_EXPIRE_MINUTES: int = int(os.environ.get("JWT_ACCESS_EXPIRE_MINUTES", "30"))
    JWT_REFRESH_EXPIRE_DAYS: int = int(os.environ.get("JWT_REFRESH_EXPIRE_DAYS", "30"))
    SENTRY_DSN: str = os.environ.get("SENTRY_DSN", "")
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./blackwayconnect.db")
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379")
    OPENAI_API_KEY: Optional[str] = os.environ.get("OPENAI_API_KEY")
    STRIPE_SECRET_KEY: Optional[str] = os.environ.get("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = os.environ.get("STRIPE_WEBHOOK_SECRET")
    APNS_KEY_ID: Optional[str] = os.environ.get("APNS_KEY_ID")
    APNS_TEAM_ID: Optional[str] = os.environ.get("APNS_TEAM_ID")
    FCM_SERVER_KEY: Optional[str] = os.environ.get("FCM_SERVER_KEY")
    SMTP_HOST: str = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.environ.get("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.environ.get("SMTP_PASSWORD")
    FROM_EMAIL: str = os.environ.get("FROM_EMAIL", "service@blackwayconnect.com")
    BRAND_NAME: str = "BlackWayConnect"
    BRAND_URL: str = "https://blackwayconnect.com"
    SUPPORT_EMAIL: str = "service@blackwayconnect.com"
    ACCOUNTING_EMAIL: str = "accounting@blackwayconnect.com"
    RATE_LIMIT_AUTH: int = int(os.environ.get("RATE_LIMIT_AUTH", "100"))
    RATE_LIMIT_ANON: int = int(os.environ.get("RATE_LIMIT_ANON", "30"))

settings = Settings()