/*
  # Upgrade announcements table for targeted push notifications

  1. New Columns
    - `target_type` (text) - targeting mode: 'single', 'multiple', 'class_section', 'whole_school'
    - `target_ids` (text[]) - array of student IDs for single/multiple targeting
    - `is_read` (boolean) - read status, default false
    - `sent_by` (text) - admin name/id who sent the announcement

  2. New Table
    - `student_tokens` - stores FCM tokens for push notifications
      - `student_id` (text) - references students
      - `class` (text) - student's class
      - `section` (text) - student's section  
      - `fcm_token` (text) - Firebase Cloud Messaging token

  3. Security
    - Enable RLS on new table
    - Add policies for token management
*/

-- Add new columns to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'whole_school' CHECK (target_type IN ('single', 'multiple', 'class_section', 'whole_school')),
ADD COLUMN IF NOT EXISTS target_ids TEXT[],
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sent_by TEXT;

-- Create student_tokens table for FCM tokens
CREATE TABLE IF NOT EXISTS public.student_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT,
  fcm_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, fcm_token)
);

-- Enable RLS on student_tokens
ALTER TABLE public.student_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for student_tokens
CREATE POLICY "Admins can manage student tokens"
  ON public.student_tokens
  FOR ALL
  USING (true);

CREATE POLICY "Students can view their own tokens"
  ON public.student_tokens
  FOR SELECT
  USING (true);

-- Create trigger for updated_at on student_tokens
CREATE OR REPLACE TRIGGER update_student_tokens_updated_at
  BEFORE UPDATE ON public.student_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();