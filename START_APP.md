# 🚀 CallPilot - Complete Setup & Start Guide

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- API Keys (at least one LLM provider)

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

#### Backend Dependencies
```bash
pip install -r requirements.txt
```

#### Frontend Dependencies
```bash
npm install
```

### Step 2: Configure API Keys

Edit `.env` file and add your API key:

**For OpenAI (Recommended):**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- Gemini (alternative): https://makersuite.google.com/app/apikey
- ElevenLabs (optional, for voice): https://elevenlabs.io/app/settings/api-keys

### Step 3: Initialize Database

```bash
python setup.py
```

This will:
- ✅ Validate your API keys
- ✅ Initialize SQLite database
- ✅ Create sample data
- ✅ Set up industry presets

### Step 4: Start the Application

#### Option A: Start Both (Recommended)

**Terminal 1 - Backend:**
```bash
python start.py
```
Backend will run on: http://localhost:8000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend will run on: http://localhost:5173

#### Option B: Start Separately

**Backend Only:**
```bash
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Only:**
```bash
npm run dev
```

### Step 5: Access the Application

1. **Frontend Dashboard**: http://localhost:5173
2. **Backend API Docs**: http://localhost:8000/docs
3. **Health Check**: http://localhost:8000/health

## 🎯 Testing the App

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy", "service": "CallPilot API"}
```

### Test 2: Voice Input (Agent Test)
```bash
curl -X POST "http://localhost:8000/voice/input" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hi, I need to schedule an appointment for tomorrow at 2pm",
    "session_id": "test-session-123"
  }'
```

### Test 3: Demo Calls
```bash
curl http://localhost:8000/demo/calls
```

### Test 4: List Available Voices
```bash
curl http://localhost:8000/voice/list
```

## 📱 Using the Frontend

### Demo Mode (No Login Required)
1. Go to http://localhost:5173
2. Click "Try Demo" on landing page
3. Explore 3 free demo calls
4. Try voice cloning (3 tries)
5. Create call drafts (3 tries)

### Full Access (After Registration)
1. Click "Sign Up" or "Register"
2. Enter email and password
3. Access full dashboard with:
   - Live call monitoring
   - Voice clone studio
   - Custom scripts
   - Calendar integration
   - Analytics & insights
   - Recovery management

## 🔧 Troubleshooting

### Issue: "API key validation failed"
**Solution:**
```bash
# Edit .env and add valid API key
# Then run:
python validate_config.py
```

### Issue: "Database error"
**Solution:**
```bash
# Reset database (WARNING: deletes all data)
python -c "from database import reset_db; reset_db()"
# Then reinitialize:
python setup.py
```

### Issue: "Frontend can't connect to backend"
**Solution:**
1. Check backend is running on port 8000
2. Verify `.env` has `VITE_API_URL=http://localhost:8000`
3. Restart frontend: `npm run dev`

### Issue: "Port already in use"
**Solution:**
```bash
# For backend (port 8000):
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# For frontend (port 5173):
# Change port in vite.config.ts or kill process
```

### Check Logs
Logs are saved in `logs/callpilot_YYYYMMDD.log`

## 🎨 Features to Explore

### 1. Demo Mode
- Pre-loaded demo calls for different industries
- Voice clone preview with sliders
- Call draft editor
- Limited to 3 tries per feature

### 2. Voice Clone Studio
- Upload audio samples
- Preview with adjustable parameters (tone, speed, energy)
- Save custom voices
- Apply to scripts

### 3. Live Call Monitoring
- Real-time transcript updates
- AI decision tracking
- Tool call visualization
- WebSocket-powered updates

### 4. Dashboard & Analytics
- Call volume charts
- Success rate metrics
- Peak hours analysis
- AI efficiency insights

### 5. Smart Scheduling
- AI-optimized slot suggestions
- Context-aware recommendations
- Historical pattern analysis

### 6. Recovery Management
- Missed call detection
- Automated recovery attempts
- Success tracking

### 7. Custom Scripts
- Industry presets (clinic, salon, tutor, university)
- Custom call flows
- Conditional logic
- Voice persona assignment

## 📚 API Documentation

Full API documentation available at: http://localhost:8000/docs

### Key Endpoints:
- `POST /auth/register` - Register new operator
- `POST /auth/login` - Login
- `POST /voice/input` - Process voice input
- `GET /demo/calls` - Get demo calls
- `POST /voice/preview` - Preview voice with settings
- `POST /voice/save` - Save voice clone
- `GET /operator/insights` - Get dashboard insights
- `WS /ws/subscribe/{operator_id}` - Real-time updates

## 🎓 Next Steps

1. **Read Documentation:**
   - [README.md](README.md) - Full project overview
   - [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
   - [EXTENSIONS.md](EXTENSIONS.md) - Advanced features
   - [HACKATHON_DEMO_CHECKLIST.md](HACKATHON_DEMO_CHECKLIST.md) - Demo checklist

2. **Explore Advanced Features:**
   - Auto-triage system
   - Explainable AI reasoning
   - Multi-channel support
   - Call simulation

3. **Customize:**
   - Add your own industry presets
   - Create custom scripts
   - Configure business hours
   - Set up Google Calendar integration

## 🚀 Deployment

### Backend Deployment
Deploy to:
- Railway
- Render
- Heroku
- AWS/GCP/Azure

### Frontend Deployment
Deploy to:
- Vercel
- Netlify
- GitHub Pages
- Lovable (built-in)

## 📞 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review API docs at http://localhost:8000/docs
3. Check [HACKATHON_DEMO_CHECKLIST.md](HACKATHON_DEMO_CHECKLIST.md)

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Health check returns "healthy"
- [ ] Can access API docs
- [ ] Can view demo calls
- [ ] Can register/login
- [ ] Dashboard loads with data
- [ ] Voice preview works
- [ ] Real-time updates working

---

**Ready to go!** 🎉

Your CallPilot application is now fully configured and ready for demonstration!
