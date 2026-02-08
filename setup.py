"""
Setup and validation script for CallPilot.
Checks API keys, initializes database, and validates configuration.
"""
import os
import sys
from pathlib import Path
from config import settings
from database import init_db, engine
from sqlalchemy import inspect
from models import Base, User, Booking, Preference, CallLog, Transcript
from logging_config import get_logger

logger = get_logger("setup")


def check_env_file():
    """Check if .env file exists and create from example if needed."""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists():
        logger.warning(".env file not found!")
        if env_example.exists():
            logger.info("Creating .env from .env.example...")
            env_file.write_text(env_example.read_text())
            logger.info("✓ Created .env file. Please edit it with your API keys.")
            return False
        else:
            logger.error(".env.example not found!")
            return False
    return True


def validate_api_keys():
    """Validate API keys based on selected provider."""
    errors = []
    warnings = []
    
    logger.info(f"LLM Provider: {settings.llm_provider}")
    
    if settings.llm_provider == "openai":
        if not settings.openai_api_key or settings.openai_api_key == "your_openai_api_key_here":
            errors.append("OpenAI API key is missing or not configured")
        elif len(settings.openai_api_key) < 20:
            warnings.append("OpenAI API key seems invalid (too short)")
        else:
            logger.info("✓ OpenAI API key configured")
    
    elif settings.llm_provider == "gemini":
        if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
            errors.append("Gemini API key is missing or not configured")
        elif len(settings.gemini_api_key) < 20:
            warnings.append("Gemini API key seems invalid (too short)")
        else:
            logger.info("✓ Gemini API key configured")
    
    # Check optional API keys
    if settings.elevenlabs_api_key and settings.elevenlabs_api_key != "your_elevenlabs_key_here":
        logger.info("✓ ElevenLabs API key configured (optional)")
    else:
        logger.info("ℹ ElevenLabs API key not configured (optional, using placeholder)")
    
    if settings.whisper_api_key and settings.whisper_api_key != "your_whisper_key_here":
        logger.info("✓ Whisper API key configured (optional)")
    else:
        logger.info("ℹ Whisper API key not configured (optional, using placeholder)")
    
    return errors, warnings


def initialize_database():
    """Initialize database and create tables."""
    try:
        logger.info("Initializing database...")
        
        # Check if database exists
        db_path = Path("callpilot.db")
        db_exists = db_path.exists()
        
        # Create all tables
        init_db()
        logger.info("✓ Database tables created/verified")
        
        # Verify tables were created
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        expected_tables = ["users", "bookings", "preferences", "call_logs", "transcripts"]
        
        missing_tables = [t for t in expected_tables if t not in tables]
        if missing_tables:
            logger.error(f"Missing tables: {missing_tables}")
            return False
        
        logger.info(f"✓ All tables verified: {', '.join(tables)}")
        
        if not db_exists:
            logger.info("✓ New database created")
        else:
            logger.info("✓ Existing database verified")
        
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False


def test_database_connection():
    """Test database connection."""
    try:
        logger.info("Testing database connection...")
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            result.fetchone()
        logger.info("✓ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False


def create_sample_data():
    """Create sample data for testing (optional)."""
    try:
        from sqlalchemy.orm import Session
        from database import SessionLocal
        
        db = SessionLocal()
        
        # Check if sample data already exists
        existing_user = db.query(User).filter(User.name == "Test User").first()
        if existing_user:
            logger.info("ℹ Sample data already exists, skipping...")
            db.close()
            return
        
        logger.info("Creating sample data...")
        
        # Create sample user
        sample_user = User(
            name="Test User",
            email="test@example.com",
            phone_number="+1234567890"
        )
        db.add(sample_user)
        db.commit()
        db.refresh(sample_user)
        
        logger.info(f"✓ Created sample user: {sample_user.name} (ID: {sample_user.id})")
        
        # Create sample preference
        preference = Preference(
            user_id=sample_user.id,
            key="preferred_time",
            value="afternoon"
        )
        db.add(preference)
        db.commit()
        
        logger.info("✓ Created sample preference")
        db.close()
        
    except Exception as e:
        logger.warning(f"Could not create sample data: {str(e)}")


def main():
    """Main setup function."""
    print("=" * 60)
    print("CallPilot Setup & Validation")
    print("=" * 60)
    print()
    
    # Check .env file
    if not check_env_file():
        print("\n⚠ Please configure your .env file with API keys before continuing.")
        print("   Edit .env and add your API keys, then run this script again.")
        sys.exit(1)
    
    # Validate API keys
    print("\n[1/4] Validating API keys...")
    errors, warnings = validate_api_keys()
    
    if warnings:
        for warning in warnings:
            logger.warning(f"⚠ {warning}")
    
    if errors:
        print("\n❌ API Key Validation Failed:")
        for error in errors:
            print(f"   - {error}")
        print("\nPlease configure your API keys in .env file:")
        print(f"   - Set {settings.llm_provider.upper()}_API_KEY")
        sys.exit(1)
    
    # Initialize database
    print("\n[2/4] Initializing database...")
    if not initialize_database():
        print("\n❌ Database initialization failed!")
        sys.exit(1)
    
    # Test database connection
    print("\n[3/4] Testing database connection...")
    if not test_database_connection():
        print("\n❌ Database connection test failed!")
        sys.exit(1)
    
    # Create sample data (optional)
    print("\n[4/4] Creating sample data...")
    create_sample_data()
    
    print("\n" + "=" * 60)
    print("✓ Setup Complete!")
    print("=" * 60)
    print("\nYou can now start the server with:")
    print("   python main.py")
    print("   or")
    print("   python start.py")
    print("\nAPI will be available at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")


if __name__ == "__main__":
    main()
