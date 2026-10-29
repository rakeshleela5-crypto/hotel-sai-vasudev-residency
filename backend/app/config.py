import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "Hotel Sai Vasudev Residency API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Official Government of India Form GST REG-06 Registration Details
    HOTEL_TRADE_NAME: str = "SRI SAI VASUDEV RESIDENCY"
    HOTEL_LEGAL_NAME: str = "PAIDISETTY MANMADHA RAO"
    HOTEL_GSTIN: str = "21AEKPP8689J1ZS"
    HOTEL_STATE_CODE: str = "21"
    HOTEL_PAN: str = "AEKPP8689J"
    HOTEL_ADDRESS: str = "Near Andhra Bank, New Colony, Rayagada, Odisha - 765001"
    HOTEL_STATE: str = "Odisha"
    HOTEL_PINCODE: str = "765001"
    HOTEL_JURISDICTION: str = "RAYAGADA DIVISION"
    
    # Railway passes DATABASE_URL when PostgreSQL is attached
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./hotel_sai_vasudev.db"
    )
    
    # Allowed origins for CORS (Cloudflare Pages, localhost) (#18, #19)
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "https://sai-vasudev-residency.pages.dev,https://hotel-sai-vasudev-residency.pages.dev,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    )

    # JWT Authentication & RBAC Configuration (#47)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "svr-hotel-jwt-super-secret-key-2026-safe-production-key")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15-min Access Token expiry (#47)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # 7-day Rotating Refresh Token expiry (#47)

    # Application-Layer Field Encryption for Sensitive Guest PII (#50)
    # 32-byte url-safe base64 key for cryptography.fernet
    FERNET_KEY: str = os.getenv("FERNET_KEY", "WqG6nF7L9B8h1K3vX5c2M4e6T8z0R2y4P6s8U1w3Y5A=")

    # Decentro Banking & KYC API Credentials
    DECENTRO_BASE_URL: str = os.getenv("DECENTRO_BASE_URL", "https://in.staging.decentro.tech")
    DECENTRO_CLIENT_ID: str = os.getenv("DECENTRO_CLIENT_ID", "")
    DECENTRO_CLIENT_SECRET: str = os.getenv("DECENTRO_CLIENT_SECRET", "")
    DECENTRO_PAYMENT_SECRET: str = os.getenv("DECENTRO_PAYMENT_SECRET", "")
    DECENTRO_KYC_SECRET: str = os.getenv("DECENTRO_KYC_SECRET", "")
    DECENTRO_WEBHOOK_SECRET: str = os.getenv("DECENTRO_WEBHOOK_SECRET", "")
    DECENTRO_PAYEE_ACCOUNT: str = os.getenv("DECENTRO_PAYEE_ACCOUNT", "SAIVASUDEV@icici")

    # Cloudflare R2 Object Storage (S3-Compatible) (#45, #50, #77)
    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "hotel-sai-vasudev-documents")
    R2_PUBLIC_DOMAIN: str = os.getenv("R2_PUBLIC_DOMAIN") or os.getenv("R2_PUBLIC_URL") or os.getenv("VITE_R2_PUBLIC_URL") or ""
    R2_PUBLIC_URL: str = os.getenv("R2_PUBLIC_URL") or os.getenv("R2_PUBLIC_DOMAIN") or os.getenv("VITE_R2_PUBLIC_URL") or ""
    R2_MAX_FILE_SIZE_BYTES: int = 5 * 1024 * 1024  # Strict 5MB limit (#45)
    R2_PRESIGNED_VIEW_EXPIRES_SECONDS: int = 60    # Strict 60s pre-signed URLs (#50)

    # SlowAPI Rate Limiting Configuration (#2, #18)
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_BOOKING: str = "10/minute"
    RATE_LIMIT_DEFAULT: str = "60/minute"

    # In-Memory TTLCache Configuration (#6, #7)
    CACHE_TTL_ROOMS: int = int(os.getenv("CACHE_TTL_ROOMS", "300"))  # 5 minutes TTL
    CACHE_TTL_MENUS: int = int(os.getenv("CACHE_TTL_MENUS", "300"))  # 5 minutes TTL

    # APScheduler & Automated R2 Backup Configuration (#41, #97, #98)
    ENABLE_CRON_SCHEDULER: bool = os.getenv("ENABLE_CRON_SCHEDULER", "true").lower() in ("true", "1", "yes")
    BACKUP_RETENTION_DAYS: int = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))

    # Observability & Webhook Alerting (#101, #103, #104)
    ALERT_WEBHOOK_URL: str = os.getenv("ALERT_WEBHOOK_URL", "")

    @property
    def get_database_url(self) -> str:
        # Railway sometimes provides postgres:// which SQLAlchemy 1.4+ requires postgresql://
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def parsed_allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
