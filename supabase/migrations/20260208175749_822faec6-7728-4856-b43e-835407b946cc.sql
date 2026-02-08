
-- Add call platform and meeting link columns to meeting_bookings
ALTER TABLE public.meeting_bookings
ADD COLUMN call_platform text NOT NULL DEFAULT 'phone',
ADD COLUMN meeting_link text;

-- Add a comment for documentation
COMMENT ON COLUMN public.meeting_bookings.call_platform IS 'Platform for the meeting: phone, google_meet, teams, zoom, etc.';
COMMENT ON COLUMN public.meeting_bookings.meeting_link IS 'Meeting URL or phone number for joining';
