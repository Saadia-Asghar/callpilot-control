# 🚀 CallPilot - Complete Application Setup Guide

## Current Status

Your CallPilot application is **almost ready**! Here's what we have:

✅ **Database**: Configured and ready
✅ **Node.js Dependencies**: Installed
✅ **Supabase**: Configured
✅ **Frontend**: Ready to launch

⚠️ **Missing**: API Keys for AI functionality

---

## 🔑 Required: API Keys Setup

### 1. OpenAI API Key (Required for AI Agent)

**Get your key:**
1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Add to .env file:**
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### 2. ElevenLabs API Key (Optional - for Voice Features)

**Get your key:**
1. Go to: https://elevenlabs.io/app/settings/api-keys
2. Sign up for a free account
3. Copy your API key

**Add to .env file:**
```env
ELEVENLABS_API_KEY=your-elevenlabs-key-here
```

---

## 📝 Quick Setup Steps

### Step 1: Configure API Keys

Edit the `.env` file in the project root and add your API keys:

```bash
# Open .env file and update these lines:
OPENAI_API_KEY=sk-your-actual-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key  # Optional
```

### Step 2: Verify Configuration

Run the quick check script:
```bash
python quick_check.py
```

You should see: `[OK] Status: READY TO LAUNCH!`

### Step 3: Start the Application

**Option A: Two Separate Terminals (Recommended)**

Terminal 1 - Backend:
```bash
python start.py
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Option B: Use the Launch Script**
```bash
python launch_app.py
```

---

## 🌐 Access the Application

Once both servers are running:

- **Frontend Dashboard**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 🎯 What's Already Configured

### ✅ Supabase Integration
- **URL**: https://cyeiioxtwnxhpvhndfke.supabase.co
- **Status**: Connected and ready
- **Features**: Authentication, database, real-time subscriptions

### ✅ Backend Features
- FastAPI server with LLM agent
- SQLite database with sample data
- Voice service integration hooks
- Real-time WebSocket support
- Call logging and analytics
- Smart scheduling system
- Auto-triage functionality
- Recovery management

### ✅ Frontend Features
- Modern React dashboard
- Real-time call monitoring
- Voice clone studio
- Calendar integration
- Call logs and analytics
- Agent settings
- Custom scripts
- Industry presets

---

## 🧪 Testing the Application

### 1. Test Backend Health
```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy","service":"CallPilot API"}`

### 2. Test Demo Calls
```bash
curl http://localhost:8000/demo/calls
```

### 3. Test Voice Input (AI Agent)
```bash
curl -X POST "http://localhost:8000/voice/input" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hi, I need to schedule an appointment for tomorrow at 2pm",
    "session_id": "test-123"
  }'
```

---

## 📱 Using the Frontend

### Demo Mode (No Login)
1. Visit http://localhost:5173
2. Click "Try Demo" on the landing page
3. Explore 3 demo calls
4. Test voice cloning features
5. Create call drafts

### Full Access (After Registration)
1. Click "Sign Up"
2. Create an account
3. Access all features:
   - Live call monitoring
   - Voice clone studio
   - Custom scripts
   - Calendar integration
   - Analytics dashboard
   - Recovery management

---

## 🔧 Troubleshooting

### Issue: "OpenAI API key not set"
**Solution**: Edit `.env` and add your OpenAI API key

### Issue: "Port 8000 already in use"
**Solution**: 
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue: "Frontend can't connect to backend"
**Solution**:
1. Verify backend is running: http://localhost:8000/health
2. Check `.env` has: `VITE_API_URL=http://localhost:8000`
3. Restart frontend: `npm run dev`

### Issue: "Database error"
**Solution**:
```bash
python setup.py
```

---

## 📚 Additional Resources

- **README.md**: Full project overview
- **START_APP.md**: Detailed startup guide
- **LAUNCH_READY.md**: Feature checklist
- **HACKATHON_DEMO_CHECKLIST.md**: Demo preparation

---

## 🎉 Next Steps

1. **Add OpenAI API Key** to `.env` file
2. **Run**: `python quick_check.py` to verify
3. **Start Backend**: `python start.py`
4. **Start Frontend**: `npm run dev`
5. **Open**: http://localhost:5173
6. **Enjoy!** 🚀

---

## 💡 Pro Tips

- **Free Tier**: OpenAI offers $5 free credits for new accounts
- **Voice Features**: ElevenLabs has a free tier with 10,000 characters/month
- **Demo Mode**: Try the app without API keys using demo mode
- **Supabase**: Already configured with authentication and database

---

## 📞 Support

If you encounter issues:
1. Check logs in `logs/` directory
2. Review API docs at http://localhost:8000/docs
3. Run `python quick_check.py` for diagnostics

---

**Status**: Ready to launch after adding OpenAI API key! 🚀
