"""
Configuration settings for CallPilot application.
"""
from pydantic_settings import BaseSettings
from typing import Literal, Optional
from datetime import time
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # LLM Provider
    llm_provider: Literal["openai", "gemini"] = "openai"
    
    # API Keys
    openai_api_key: str = ""
    gemini_api_key: str = ""
    
    # Database
    database_url: str = "sqlite:///./callpilot.db"
    
    # Business Configuration
    business_hours_start: str = "09:00"
    business_hours_end: str = "17:00"
    slot_duration_minutes: int = 30
    timezone: str = "America/New_York"
    
    # Voice Services
    elevenlabs_api_key: str = ""
    whisper_api_key: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def validate_api_keys(self):
        """
        Validate API keys based on provider.
        Returns (errors, warnings)
        """
        errors = []
        warnings = []
        
        if self.llm_provider == "openai":
            if not self.openai_api_key or self.openai_api_key in ["", "your_openai_api_key_here"]:
                errors.append("OpenAI API key is required when using OpenAI provider")
            elif not self.openai_api_key.startswith("sk-"):
                warnings.append("OpenAI API key should start with 'sk-'")
        
        elif self.llm_provider == "gemini":
            if not self.gemini_api_key or self.gemini_api_key in ["", "your_gemini_api_key_here"]:
                errors.append("Gemini API key is required when using Gemini provider")
        
        return errors, warnings


# Global settings instance
settings = Settings()

# Validate on import if .env exists
if Path(".env").exists():
    errors, warnings = settings.validate_api_keys()
    if errors:
        import warnings as py_warnings
        py_warnings.warn(
            f"API key validation failed: {', '.join(errors)}. "
            "Run 'python setup.py' to validate configuration.",
            UserWarning
        )
