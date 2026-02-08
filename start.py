"""
Quick start script for CallPilot.
Checks dependencies and starts the server.
"""
import sys
import subprocess
import os

def check_dependencies():
    """Check if required packages are installed."""
    required_packages = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'pydantic',
        'pydantic_settings'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing.append(package)
    
    if missing:
        print("Missing dependencies:")
        for pkg in missing:
            print(f"  - {pkg}")
        print("\nInstall with: pip install -r requirements.txt")
        return False
    
    return True

def check_env_file():
    """Check if .env file exists."""
    if not os.path.exists('.env'):
        print("Warning: .env file not found!")
        print("Copy .env.example to .env and configure your API keys.")
        print("\nQuick setup:")
        print("  1. Run: python setup.py")
        print("  2. Or manually: cp .env.example .env")
        print("  3. Edit .env with your API keys")
        response = input("\nContinue anyway? (y/n): ")
        return response.lower() == 'y'
    return True

def main():
    """Main entry point."""
    print("=" * 60)
    print("CallPilot - Starting Server")
    print("=" * 60)
    print()
    
    if not check_dependencies():
        sys.exit(1)
    
    if not check_env_file():
        sys.exit(1)
    
    print("Starting FastAPI server...")
    print("API will be available at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        import uvicorn
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
    except Exception as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
