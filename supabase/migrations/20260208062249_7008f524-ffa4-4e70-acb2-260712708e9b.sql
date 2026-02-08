
-- Call logs table
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_name TEXT NOT NULL,
  intent TEXT NOT NULL DEFAULT 'Unknown',
  outcome TEXT NOT NULL DEFAULT 'No Action',
  duration TEXT NOT NULL DEFAULT '0:00',
  status TEXT NOT NULL DEFAULT 'neutral',
  date TEXT NOT NULL DEFAULT 'Today',
  summary TEXT DEFAULT '',
  transcript TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  preferences TEXT[] NOT NULL DEFAULT '{}',
  last_contact TEXT NOT NULL DEFAULT 'Today',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent settings table
CREATE TABLE public.agent_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_hours_start TEXT NOT NULL DEFAULT '09:00',
  business_hours_end TEXT NOT NULL DEFAULT '17:00',
  slot_duration INTEGER NOT NULL DEFAULT 30,
  buffer_time INTEGER NOT NULL DEFAULT 15,
  voice_persona TEXT NOT NULL DEFAULT 'Professional & Friendly',
  auto_confirm BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (demo app, no auth required)
CREATE POLICY "Allow public read on call_logs" ON public.call_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on call_logs" ON public.call_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on call_logs" ON public.call_logs FOR UPDATE USING (true);

CREATE POLICY "Allow public read on appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on appointments" ON public.appointments FOR UPDATE USING (true);

CREATE POLICY "Allow public read on user_preferences" ON public.user_preferences FOR SELECT USING (true);
CREATE POLICY "Allow public insert on user_preferences" ON public.user_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on user_preferences" ON public.user_preferences FOR UPDATE USING (true);

CREATE POLICY "Allow public read on agent_settings" ON public.agent_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on agent_settings" ON public.agent_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on agent_settings" ON public.agent_settings FOR UPDATE USING (true);
