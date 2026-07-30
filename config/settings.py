import os
from typing import Optional

class Settings:
    APP_NAME: str = "BlackWayConnect Engine"
    VERSION: str = "2.0.1"
    ENVIRONMENT: str = os.environ.get("ENVIRONMENT", "production")
    DEBUG: bool = os.environ.get("DEBUG", "false").lower() == "true"
    
    # Valeur par défaut pour vérouiller le démarrage même si la variable manque sur Railway
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "BW_DEFAULT_ULTRA_SECRET_2026_MASTER")
    
    JWT_ACCESS_EXPIRE_MINUTES: int = int(os.environ.get("JWT_ACCESS_EXPIRE_MINUTES", "30"))
    JWT_REFRESH_EXPIRE_DAYS: int = int(os.environ.get("JWT_REFRESH_EXPIRE_DAYS", "30"))
    SENTRY_DSN: str = os.environ.get("SENTRY_DSN", "")
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./blackwayconnect.db")
    REDIS_URL: str = os.environ.get("REDIS_URL", "")
    
    OPENAI_API_KEY: Optional[str] = os.environ.get("OPENAI_API_KEY")
    STRIPE_SECRET_KEY: Optional[str] = os.environ.get("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    SMTP_HOST: str = os.environ.get("SMTP_HOST", "smtp.sendgrid.net")
    SMTP_PORT: int = int(os.environ.get("SMTP_PORT", "587"))
    SENDGRID_API_KEY: Optional[str] = os.environ.get("SENDGRID_API_KEY")
    FROM_EMAIL: str = os.environ.get("FROM_EMAIL", "hello@blackwayconnect.com")
    
    BRAND_NAME: str = "BlackWayConnect"
    BRAND_URL: str = "https://blackwayconnect.com"
    SUPPORT_EMAIL: str = "serviceclient@blackwayconnect.com"
    
    RATE_LIMIT_AUTH: int = 100
    RATE_LIMIT_ANON: int = 30

settings = Settings()