
-- Create the exam_marks table for storing students' exam marks
CREATE TABLE public.exam_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  student_name text NOT NULL,
  exam_type text NOT NULL,
  exam_name text,
  out_of integer NOT NULL,
  marks_obtained integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security for exam_marks
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can insert/update/delete marks. (You should have a way to distinguish teachers in your user/auth scheme)
CREATE POLICY "Teachers can manage exam marks"
  ON public.exam_marks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Anyone can read (students see their own marks, but you can tighten this later via auth if needed)
CREATE POLICY "Select all exam marks"
  ON public.exam_marks
  FOR SELECT
  USING (true);

