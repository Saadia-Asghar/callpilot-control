
-- Meeting bookings table: stores all details from voice-booked meetings
CREATE TABLE public.meeting_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  caller_name TEXT NOT NULL,
  meeting_title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  transcript_summary TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  script_id UUID,
  script_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own bookings"
  ON public.meeting_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.meeting_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.meeting_bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings"
  ON public.meeting_bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamps
CREATE TRIGGER update_meeting_bookings_updated_at
  BEFORE UPDATE ON public.meeting_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
