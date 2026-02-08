"""
Quick configuration validation script.
Run this to check if your API keys and database are properly configured.
"""
import sys
from config import settings
from database import init_db, test_database_connection
from logging_config import get_logger

logger = get_logger("validate")


def main():
    """Validate configuration."""
    print("Validating CallPilot configuration...\n")
    
    # Check API keys
    print("Checking API keys...")
    errors, warnings = settings.validate_api_keys()
    
    if errors:
        print("❌ Errors found:")
        for error in errors:
            print(f"   - {error}")
        print("\nPlease configure your API keys in .env file")
        sys.exit(1)
    
    if warnings:
        print("⚠ Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
    
    print(f"✓ LLM Provider: {settings.llm_provider}")
    print("✓ API keys configured")
    
    # Check database
    print("\nChecking database...")
    try:
        init_db(create_tables=False)
        if test_database_connection():
            print("✓ Database connection successful")
        else:
            print("❌ Database connection failed")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        sys.exit(1)
    
    print("\n✓ All checks passed! Configuration is valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
