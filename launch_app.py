#!/usr/bin/env python3
"""
CallPilot Complete Launch Script
This script helps you launch the entire CallPilot application with all necessary checks.
"""

import os
import sys
import subprocess
import time
from pathlib import Path
from dotenv import load_dotenv

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def check_env_file():
    """Check if .env file exists and has required keys"""
    print_header("Checking Environment Configuration")
    
    if not os.path.exists('.env'):
        print_error(".env file not found!")
        print_info("Creating .env from .env.example...")
        if os.path.exists('.env.example'):
            import shutil
            shutil.copy('.env.example', '.env')
            print_warning("Please edit .env file and add your API keys!")
            return False
        else:
            print_error(".env.example not found!")
            return False
    
    load_dotenv()
    
    # Check required environment variables
    required_vars = {
        'LLM_PROVIDER': 'LLM provider (openai or gemini)',
        'VITE_SUPABASE_URL': 'Supabase URL',
        'VITE_SUPABASE_PUBLISHABLE_KEY': 'Supabase publishable key',
        'VITE_API_URL': 'Backend API URL'
    }
    
    missing_vars = []
    placeholder_vars = []
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if not value:
            missing_vars.append(f"{var} ({description})")
        elif 'your_' in value.lower() or 'here' in value.lower():
            placeholder_vars.append(f"{var} ({description})")
    
    # Check LLM API keys
    llm_provider = os.getenv('LLM_PROVIDER', 'openai')
    if llm_provider == 'openai':
        openai_key = os.getenv('OPENAI_API_KEY')
        if not openai_key or 'your_' in openai_key.lower():
            placeholder_vars.append('OPENAI_API_KEY (OpenAI API key)')
    elif llm_provider == 'gemini':
        gemini_key = os.getenv('GEMINI_API_KEY')
        if not gemini_key or 'your_' in gemini_key.lower():
            placeholder_vars.append('GEMINI_API_KEY (Gemini API key)')
    
    # Check optional ElevenLabs key
    elevenlabs_key = os.getenv('ELEVENLABS_API_KEY')
    if not elevenlabs_key or 'your_' in elevenlabs_key.lower():
        print_warning("ELEVENLABS_API_KEY not set (voice features will be limited)")
    
    if missing_vars:
        print_error("Missing environment variables:")
        for var in missing_vars:
            print(f"  - {var}")
        return False
    
    if placeholder_vars:
        print_warning("Environment variables with placeholder values:")
        for var in placeholder_vars:
            print(f"  - {var}")
        print_info("Please update .env file with actual API keys")
        return False
    
    print_success("Environment configuration is valid!")
    print_info(f"LLM Provider: {llm_provider}")
    print_info(f"Supabase URL: {os.getenv('VITE_SUPABASE_URL')}")
    print_info(f"Backend API: {os.getenv('VITE_API_URL')}")
    
    return True

def check_python_dependencies():
    """Check if Python dependencies are installed"""
    print_header("Checking Python Dependencies")
    
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        import openai
        print_success("Core Python dependencies are installed!")
        return True
    except ImportError as e:
        print_error(f"Missing Python dependencies: {e}")
        print_info("Run: pip install -r requirements.txt")
        return False

def check_node_dependencies():
    """Check if Node.js dependencies are installed"""
    print_header("Checking Node.js Dependencies")
    
    if not os.path.exists('node_modules'):
        print_error("node_modules not found!")
        print_info("Run: npm install")
        return False
    
    print_success("Node.js dependencies are installed!")
    return True

def check_database():
    """Check if database exists"""
    print_header("Checking Database")
    
    if not os.path.exists('callpilot.db'):
        print_warning("Database not found!")
        print_info("Run: python setup.py")
        return False
    
    print_success("Database exists!")
    return True

def run_setup():
    """Run setup script"""
    print_header("Running Setup Script")
    
    try:
        result = subprocess.run([sys.executable, 'setup.py'], 
                              capture_output=True, 
                              text=True,
                              timeout=60)
        
        if result.returncode == 0:
            print_success("Setup completed successfully!")
            return True
        else:
            print_error("Setup failed!")
            print(result.stderr)
            return False
    except Exception as e:
        print_error(f"Setup error: {e}")
        return False

def start_backend():
    """Start the backend server"""
    print_header("Starting Backend Server")
    print_info("Starting FastAPI backend on http://localhost:8000")
    print_info("Press Ctrl+C to stop")
    
    try:
        subprocess.run([sys.executable, 'start.py'])
    except KeyboardInterrupt:
        print_info("\nBackend server stopped")

def start_frontend():
    """Start the frontend development server"""
    print_header("Starting Frontend Server")
    print_info("Starting Vite frontend on http://localhost:5173")
    print_info("Press Ctrl+C to stop")
    
    try:
        subprocess.run(['npm', 'run', 'dev'], shell=True)
    except KeyboardInterrupt:
        print_info("\nFrontend server stopped")

def main():
    """Main launch function"""
    print_header("CallPilot Application Launcher")
    print_info("Checking system requirements...")
    
    # Change to script directory
    os.chdir(Path(__file__).parent)
    
    # Run checks
    env_ok = check_env_file()
    python_ok = check_python_dependencies()
    node_ok = check_node_dependencies()
    db_ok = check_database()
    
    # If environment is not configured, stop here
    if not env_ok:
        print_error("\n❌ Environment configuration incomplete!")
        print_info("Please configure .env file with your API keys and try again.")
        sys.exit(1)
    
    # If dependencies are missing, offer to install
    if not python_ok:
        response = input("\nInstall Python dependencies? (y/n): ")
        if response.lower() == 'y':
            print_info("Installing Python dependencies...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
            python_ok = True
    
    if not node_ok:
        response = input("\nInstall Node.js dependencies? (y/n): ")
        if response.lower() == 'y':
            print_info("Installing Node.js dependencies...")
            subprocess.run(['npm', 'install'], shell=True)
            node_ok = True
    
    # If database doesn't exist, run setup
    if not db_ok:
        response = input("\nRun database setup? (y/n): ")
        if response.lower() == 'y':
            db_ok = run_setup()
    
    # Check if all requirements are met
    if not (python_ok and node_ok and db_ok):
        print_error("\n❌ System requirements not met!")
        print_info("Please resolve the issues above and try again.")
        sys.exit(1)
    
    print_success("\n✅ All system checks passed!")
    
    # Ask what to start
    print_header("Launch Options")
    print("1. Start Backend only")
    print("2. Start Frontend only")
    print("3. Start Both (in separate terminals)")
    print("4. Exit")
    
    choice = input("\nEnter your choice (1-4): ")
    
    if choice == '1':
        start_backend()
    elif choice == '2':
        start_frontend()
    elif choice == '3':
        print_info("\nPlease open two separate terminals:")
        print_info("Terminal 1: python start.py")
        print_info("Terminal 2: npm run dev")
        print_success("\nThen access:")
        print_info("Frontend: http://localhost:5173")
        print_info("Backend API: http://localhost:8000/docs")
    elif choice == '4':
        print_info("Goodbye!")
        sys.exit(0)
    else:
        print_error("Invalid choice!")
        sys.exit(1)

if __name__ == '__main__':
    main()
