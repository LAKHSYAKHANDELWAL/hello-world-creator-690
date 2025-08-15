
-- Create fee_terms table for term-specific due dates and amounts
CREATE TABLE IF NOT EXISTS public.fee_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class TEXT NOT NULL,
  term_no INTEGER NOT NULL CHECK (term_no >= 1 AND term_no <= 3),
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class, term_no)
);

-- Enable RLS on fee_terms
ALTER TABLE public.fee_terms ENABLE ROW LEVEL SECURITY;

-- Create policies for fee_terms
CREATE POLICY "Admins can manage fee terms" 
  ON public.fee_terms 
  FOR ALL 
  USING (true);

CREATE POLICY "Everyone can view fee terms" 
  ON public.fee_terms 
  FOR SELECT 
  USING (true);

-- Update fee_payments table structure
ALTER TABLE public.fee_payments 
DROP COLUMN IF EXISTS description,
ADD COLUMN IF NOT EXISTS submitted_by TEXT,
ADD COLUMN IF NOT EXISTS term_no INTEGER DEFAULT 1 CHECK (term_no >= 1 AND term_no <= 3);

-- Remove due_date from fee_structures since it's now in fee_terms
ALTER TABLE public.fee_structures 
DROP COLUMN IF EXISTS due_date;

-- Add discount_amount to students table if not exists
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Create trigger to update updated_at on fee_terms
CREATE OR REPLACE TRIGGER update_fee_terms_updated_at
  BEFORE UPDATE ON public.fee_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
