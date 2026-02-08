"""
Database setup and session management for CallPilot.
"""
from sqlalchemy import create_engine, inspect, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from pathlib import Path
import os
from config import settings
from logging_config import get_logger

logger = get_logger("database")

# Create database directory if needed
db_path = settings.database_url.replace("sqlite:///", "")
if db_path and db_path != ":memory:":
    db_dir = Path(db_path).parent
    if db_dir and not db_dir.exists():
        db_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created database directory: {db_dir}")

# Create database engine
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=False  # Set to True for SQL query logging
)

# Enable foreign key constraints for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Enable foreign key constraints for SQLite."""
    if "sqlite" in settings.database_url:
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function to get database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(create_tables: bool = True):
    """
    Initialize database by creating all tables.
    
    Args:
        create_tables: If True, create tables. If False, only verify they exist.
    """
    try:
        if create_tables:
            logger.info("Creating database tables...")
            Base.metadata.create_all(bind=engine)
            logger.info("✓ Database tables created")
        else:
            # Just verify tables exist
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            expected_tables = ["users", "bookings", "preferences", "call_logs", "transcripts"]
            missing = [t for t in expected_tables if t not in tables]
            if missing:
                raise ValueError(f"Missing tables: {missing}")
        
        # Verify tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"Database tables: {', '.join(tables)}")
        
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise


def reset_db():
    """Reset database by dropping and recreating all tables. Use with caution!"""
    logger.warning("Resetting database - all data will be lost!")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Database reset complete")
