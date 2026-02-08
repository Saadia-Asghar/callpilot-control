# CallPilot Quick Start Guide

Get CallPilot up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Run Setup

```bash
python setup.py
```

This will:
- ✅ Create `.env` file from template
- ✅ Validate your API keys
- ✅ Initialize database
- ✅ Create sample data

## Step 3: Configure API Keys

Edit `.env` file and add your API key:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://makersuite.google.com/app/apikey

## Step 4: Start Server

```bash
python start.py
```

Or:

```bash
python main.py
```

## Step 5: Test It!

1. **Web Interface**: http://localhost:8000
2. **API Docs**: http://localhost:8000/docs
3. **Health Check**: http://localhost:8000/health

## Quick Test

```bash
# Test the API
curl -X POST "http://localhost:8000/voice/input" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I need to schedule an appointment for tomorrow at 2pm",
    "session_id": "test-123"
  }'
```

## Troubleshooting

### API Key Issues

```bash
# Validate configuration
python validate_config.py
```

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
python -c "from database import reset_db; reset_db()"
```

### Check Logs

Logs are saved in `logs/callpilot_YYYYMMDD.log`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [EXTENSIONS.md](EXTENSIONS.md) for advanced features
- Explore the API at http://localhost:8000/docs
