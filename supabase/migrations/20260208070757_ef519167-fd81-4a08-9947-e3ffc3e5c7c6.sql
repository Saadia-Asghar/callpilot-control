
-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  theme_preference TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Voice profiles table
CREATE TABLE public.voice_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  elevenlabs_voice_id TEXT,
  is_cloned BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_business_voice BOOLEAN NOT NULL DEFAULT false,
  quality_score INTEGER NOT NULL DEFAULT 85,
  warmth INTEGER NOT NULL DEFAULT 50,
  professionalism INTEGER NOT NULL DEFAULT 50,
  energy INTEGER NOT NULL DEFAULT 50,
  speed INTEGER NOT NULL DEFAULT 50,
  expressiveness INTEGER NOT NULL DEFAULT 50,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view default voices" ON public.voice_profiles FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert own voices" ON public.voice_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voices" ON public.voice_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own voices" ON public.voice_profiles FOR DELETE USING (auth.uid() = user_id);

-- Live call events for real-time subscriptions
CREATE TABLE public.live_call_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id TEXT NOT NULL DEFAULT 'call-1847',
  event_type TEXT NOT NULL,
  speaker TEXT,
  content TEXT NOT NULL,
  detail TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.live_call_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read live_call_events" ON public.live_call_events FOR SELECT USING (true);
CREATE POLICY "Public insert live_call_events" ON public.live_call_events FOR INSERT WITH CHECK (true);

-- Enable realtime for live call events
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_call_events;

-- Add user_id to existing tables (nullable for backward compatibility with seeded data)
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.agent_settings ADD COLUMN IF NOT EXISTS user_id UUID;

-- Seed default voice presets (no user_id = global defaults)
INSERT INTO public.voice_profiles (name, elevenlabs_voice_id, is_cloned, is_default, warmth, professionalism, energy, speed, expressiveness) VALUES
('Medical Assistant', 'EXAVITQu4vr4xnSDxMaL', false, false, 80, 70, 40, 45, 60),
('Corporate Receptionist', 'JBFqnCBsd6RMkjVDRZzb', false, false, 40, 90, 50, 55, 35),
('Friendly Concierge', 'cgSgspJ2msm6clMCkdW9', false, false, 90, 50, 70, 50, 80),
('Academic Advisor', 'onwK4e9ZLuTAKqWW03F9', false, false, 50, 80, 40, 45, 45),
('Calm Support Agent', 'pFZP5JQG7iQjIQuC4Bku', false, true, 75, 65, 30, 40, 55);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
