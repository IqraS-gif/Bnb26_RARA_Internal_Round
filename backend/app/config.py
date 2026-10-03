"""Quorum Backend Configuration."""

from functools import lru_cache
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables and defaults."""

    # Application Information
    app_name: str = "Quorum Backend"
    app_version: str = "0.1.0"
    app_description: str = (
        "Decentralized Multi-Builder Verification Engine API"
    )
    environment: str = "development"
    debug: bool = False

    # API Routing
    api_v1_prefix: str = "/api/v1"

    # Server Configuration
    backend_host: str = "127.0.0.1"
    backend_port: int = 8000

    # CORS Configuration
    cors_origins: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Blockchain Configuration (Local Anvil / Dev Defaults)
    rpc_url: str = "http://127.0.0.1:8545"
    chain_id: int = 31337
    registry_contract_address: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated origins string or accept list of strings."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
