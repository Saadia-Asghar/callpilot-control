# CallPilot – How Everything Connects

## Overview

- **Frontend** (Vite + React) talks to the **Backend** (FastAPI) for auth, demo, voice, drafts, calendar, etc.
- **Backend** uses **ElevenLabs** for TTS and voice clone when `ELEVENLABS_API_KEY` is set.
- **Supabase** is optional: used only for Google/Apple OAuth when `VITE_SUPABASE_*` env vars are set.

## 1. Frontend ↔ Backend

- **API base URL**: `VITE_API_URL` (default `http://localhost:8000`).
- **Client**: `src/lib/api.ts` – all requests go through this client; JWT is stored in `localStorage` under `callpilot_token`.
- **WebSocket**: `VITE_WS_URL` (default `ws://localhost:8000`) for live transcript/tool events in Live Call.
- **Auth**: Login/register use backend `/auth/login` and `/auth/register`; token is sent as `Authorization: Bearer <token>`.

## 2. Backend ↔ ElevenLabs

- **Config**: Backend reads `ELEVENLABS_API_KEY` from `.env` (see `config.py`).
- **Usage**: `voice_service.py` calls ElevenLabs for text-to-speech and voice list. If the key is missing or placeholder, voice endpoints return a clear error and no audio.
- **Endpoints**: `/voice/preview`, `/voice/tts`, `/voice/list`, etc. All run through the backend; the frontend never calls ElevenLabs directly.

## 3. Frontend ↔ Supabase (optional)

- **When used**: Only for **Google (and Apple) Sign-In** via Lovable cloud auth. If `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are not set, the Supabase client is not created and the app does not crash.
- **Email/password**: Uses the backend only; Supabase is not required.
- **Lovable**: `src/integrations/lovable/index.ts` uses Supabase only when configured; `lovable.isOAuthAvailable` is `false` when Supabase env is missing.

## 4. Quick setup for “everything connected”

**Backend**

```bash
cp .env.example .env
# Edit .env: set ELEVENLABS_API_KEY (and OPENAI_API_KEY if using LLM)
pip install -r requirements.txt
python main.py
# → http://localhost:8000
```

**Frontend**

```bash
# In project root, create .env with:
echo "VITE_API_URL=http://localhost:8000" >> .env
echo "VITE_WS_URL=ws://localhost:8000" >> .env
# Optional Google Sign-In:
# echo "VITE_SUPABASE_URL=https://xxx.supabase.co" >> .env
# echo "VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key" >> .env

npm install
npm run dev
# → http://localhost:5173
```

**Result**

- Frontend uses backend for auth, demo, voice, drafts, calendar.
- Voice features work when `ELEVENLABS_API_KEY` is set in backend `.env`.
- Google Sign-In works when Supabase env vars are set in frontend `.env`; otherwise use email/password only.
