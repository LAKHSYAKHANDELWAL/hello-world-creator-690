
-- Create the homework_assignments table for storing uploaded homework
CREATE TABLE public.homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  attachment_url TEXT,
  class_name TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read homework (public select access). Can restrict later.
CREATE POLICY "Anyone can read homework" ON public.homework_assignments
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert homework. Can restrict to teachers later.
CREATE POLICY "Anyone can insert homework" ON public.homework_assignments
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only creator can update their homework
CREATE POLICY "Creator can update their homework"
  ON public.homework_assignments
  FOR UPDATE
  USING (created_by = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Only creator can delete their homework
CREATE POLICY "Creator can delete their homework"
  ON public.homework_assignments
  FOR DELETE
  USING (created_by = current_setting('request.jwt.claims', true)::json->>'sub');
