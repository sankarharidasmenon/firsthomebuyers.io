-- Migration to create the ai_feedback table

CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  question text NOT NULL,
  ai_answer text NOT NULL,
  feedback_score integer NOT NULL CHECK (feedback_score IN (-1, 1)),
  referenced_schemes text[] DEFAULT '{}'::text[],
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add comments for postgrest reflection
COMMENT ON TABLE public.ai_feedback IS 'Feedback submitted by users on AI responses';

-- Set up RLS
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert feedback
CREATE POLICY "Anyone can insert ai feedback" ON public.ai_feedback
  FOR INSERT WITH CHECK (true);

-- Only admins/staff can read feedback in production (basic lock down)
CREATE POLICY "Only staff can read ai feedback" ON public.ai_feedback
  FOR SELECT USING (false); -- Adjust when staff roles are defined
