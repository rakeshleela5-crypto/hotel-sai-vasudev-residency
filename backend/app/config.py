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
    
    # Allowed origins for CORS (Cloudflare Pages, localhost)
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "https://hotel-sai-vasudev-residency.pages.dev,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    )

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
