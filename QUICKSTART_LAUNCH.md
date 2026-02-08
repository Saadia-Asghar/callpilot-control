# 🚀 QUICK START - CallPilot Application

## ⚡ Fastest Way to Launch

### Windows Users:
```bash
# Double-click or run:
launch.bat
```

### All Platforms:
```bash
# Option 1: Use Python launcher
python launch_app.py

# Option 2: Manual start (2 terminals)
# Terminal 1:
python start.py

# Terminal 2:
npm run dev
```

---

## ✅ Pre-Launch Checklist

Run this command to check if you're ready:
```bash
python quick_check.py
```

### Expected Output:
```
[OK] Status: READY TO LAUNCH!
```

### If Not Ready:
The script will tell you exactly what's missing. Common fixes:

**Missing OpenAI API Key:**
1. Edit `.env` file
2. Add: `OPENAI_API_KEY=sk-your-key-here`
3. Get key from: https://platform.openai.com/api-keys

**Missing Dependencies:**
```bash
# Python dependencies
pip install -r requirements.txt

# Node.js dependencies
npm install
```

**Missing Database:**
```bash
python setup.py
```

---

## 🌐 Access Points

Once both servers are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main dashboard |
| **Backend API** | http://localhost:8000/docs | API documentation |
| **Health Check** | http://localhost:8000/health | Server status |

---

## 🎯 What You Get

### ✅ Backend (FastAPI)
- AI-powered scheduling agent (OpenAI/Gemini)
- Voice integration (ElevenLabs)
- Smart scheduling & auto-triage
- Real-time WebSocket updates
- Call logging & analytics
- Recovery management
- Demo mode (3 free calls)

### ✅ Frontend (React + TypeScript)
- Modern dashboard with real-time updates
- Voice clone studio
- Live call monitoring
- Calendar integration
- Custom scripts & industry presets
- Analytics & insights
- Call simulation

### ✅ Integrations
- **Supabase**: Authentication & database
- **ElevenLabs**: Voice cloning & TTS
- **OpenAI/Gemini**: AI agent intelligence
- **WebSocket**: Real-time updates

---

## 🧪 Quick Test

### 1. Test Backend Health
```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy","service":"CallPilot API"}`

### 2. Test Demo Mode
```bash
curl http://localhost:8000/demo/calls
```

### 3. Test AI Agent
```bash
curl -X POST "http://localhost:8000/voice/input" \
  -H "Content-Type: application/json" \
  -d '{"transcript": "I need an appointment tomorrow at 2pm", "session_id": "test-123"}'
```

---

## 📱 Using the App

### Demo Mode (No Login Required)
1. Visit http://localhost:5173
2. Click "Try Demo"
3. Explore 3 demo calls
4. Test voice features (3 tries)
5. Create call drafts (3 tries)

### Full Access (After Registration)
1. Click "Sign Up"
2. Create account
3. Access all features:
   - Live call monitoring
   - Voice clone studio
   - Custom scripts
   - Calendar sync
   - Full analytics
   - Unlimited usage

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <PID> /F

# Restart backend
python start.py
```

### Frontend won't start
```bash
# Check if port 5173 is in use
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <PID> /F

# Restart frontend
npm run dev
```

### API Connection Error
1. Verify backend is running: http://localhost:8000/health
2. Check `.env` has: `VITE_API_URL=http://localhost:8000`
3. Restart frontend

### Database Error
```bash
# Reset and reinitialize database
python setup.py
```

---

## 📚 Documentation

- **COMPLETE_SETUP_GUIDE.md**: Full setup instructions
- **README.md**: Project overview
- **START_APP.md**: Detailed startup guide
- **LAUNCH_READY.md**: Feature checklist
- **HACKATHON_DEMO_CHECKLIST.md**: Demo preparation

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Backend shows: `Uvicorn running on http://0.0.0.0:8000`
✅ Frontend shows: `Local: http://localhost:5173/`
✅ Health check returns: `{"status":"healthy"}`
✅ Dashboard loads without errors
✅ Demo calls are visible
✅ Voice preview works

---

## 💡 Pro Tips

1. **Free API Keys**: OpenAI gives $5 free credits to new accounts
2. **Demo Mode**: Test without API keys using demo features
3. **Voice Features**: ElevenLabs has free tier (10k chars/month)
4. **Development**: Use hot reload - changes appear instantly
5. **Logs**: Check `logs/` directory for debugging

---

## 🆘 Need Help?

1. Run: `python quick_check.py` for diagnostics
2. Check logs in `logs/` directory
3. Review API docs: http://localhost:8000/docs
4. Check `.env` configuration

---

## 🎯 Next Steps After Launch

1. **Explore Demo Mode**: Try the 3 demo calls
2. **Create Account**: Sign up for full access
3. **Configure Voice**: Set up voice cloning
4. **Customize Scripts**: Create industry-specific flows
5. **Test AI Agent**: Try live call simulation
6. **Review Analytics**: Check dashboard insights

---

**Status**: Ready to launch! 🚀

Just run `launch.bat` (Windows) or `python launch_app.py` (all platforms)
