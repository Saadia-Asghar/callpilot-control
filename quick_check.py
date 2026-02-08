#!/usr/bin/env python3
"""Quick validation check for CallPilot configuration"""

import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("CallPilot Configuration Check".center(60))
print("=" * 60)

# Check environment variables
print("\n[Environment Variables]")
print(f"  LLM Provider: {os.getenv('LLM_PROVIDER', 'NOT SET')}")
print(f"  OpenAI Key: {'[OK] SET' if os.getenv('OPENAI_API_KEY') and 'your_' not in os.getenv('OPENAI_API_KEY', '') else '[X] NOT SET'}")
print(f"  Gemini Key: {'[OK] SET' if os.getenv('GEMINI_API_KEY') and 'your_' not in os.getenv('GEMINI_API_KEY', '') else '[X] NOT SET'}")
print(f"  ElevenLabs Key: {'[OK] SET' if os.getenv('ELEVENLABS_API_KEY') and 'your_' not in os.getenv('ELEVENLABS_API_KEY', '') else '[X] NOT SET (optional)'}")

print(f"\n[Supabase Configuration]")
print(f"  URL: {os.getenv('VITE_SUPABASE_URL', 'NOT SET')}")
print(f"  Key: {'[OK] SET' if os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY') else '[X] NOT SET'}")

print(f"\n[API Configuration]")
print(f"  Backend URL: {os.getenv('VITE_API_URL', 'NOT SET')}")

print(f"\n[Files]")
print(f"  Database: {'[OK] EXISTS' if os.path.exists('callpilot.db') else '[X] NOT FOUND'}")
print(f"  node_modules: {'[OK] EXISTS' if os.path.exists('node_modules') else '[X] NOT FOUND'}")

print("\n" + "=" * 60)

# Determine status
llm_provider = os.getenv('LLM_PROVIDER', 'openai')
llm_key_set = False

if llm_provider == 'openai':
    llm_key_set = os.getenv('OPENAI_API_KEY') and 'your_' not in os.getenv('OPENAI_API_KEY', '')
elif llm_provider == 'gemini':
    llm_key_set = os.getenv('GEMINI_API_KEY') and 'your_' not in os.getenv('GEMINI_API_KEY', '')

supabase_set = os.getenv('VITE_SUPABASE_URL') and os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')
db_exists = os.path.exists('callpilot.db')
node_exists = os.path.exists('node_modules')

if llm_key_set and supabase_set and db_exists and node_exists:
    print("[OK] Status: READY TO LAUNCH!")
    print("\nNext steps:")
    print("  1. Terminal 1: python start.py")
    print("  2. Terminal 2: npm run dev")
    print("  3. Open: http://localhost:5173")
else:
    print("[!] Status: CONFIGURATION INCOMPLETE")
    print("\nRequired actions:")
    if not llm_key_set:
        print(f"  - Set {llm_provider.upper()}_API_KEY in .env file")
    if not supabase_set:
        print("  - Verify Supabase credentials in .env file")
    if not db_exists:
        print("  - Run: python setup.py")
    if not node_exists:
        print("  - Run: npm install")

print("=" * 60)
