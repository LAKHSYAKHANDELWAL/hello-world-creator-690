
-- Add missing fields to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS mobile_2 TEXT;

-- Create fee_remarks table for parent remarks and follow-up tracking
CREATE TABLE IF NOT EXISTS public.fee_remarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  remark_text TEXT NOT NULL,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_completed BOOLEAN DEFAULT FALSE
);

-- Enable RLS on fee_remarks table
ALTER TABLE public.fee_remarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fee_remarks
CREATE POLICY "Admins can manage fee remarks" 
  ON public.fee_remarks 
  FOR ALL 
  USING (true);

-- Add term-based payment tracking columns to fee_payments
ALTER TABLE public.fee_payments 
ADD COLUMN IF NOT EXISTS term VARCHAR(20) DEFAULT 'Term 1',
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Create trigger for updated_at on fee_remarks
CREATE OR REPLACE TRIGGER update_fee_remarks_updated_at
  BEFORE UPDATE ON public.fee_remarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
