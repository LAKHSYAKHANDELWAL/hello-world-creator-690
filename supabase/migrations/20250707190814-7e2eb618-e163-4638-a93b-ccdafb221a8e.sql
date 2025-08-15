
-- Update existing students table with new fields
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_relation TEXT,
ADD COLUMN IF NOT EXISTS phone1 TEXT,
ADD COLUMN IF NOT EXISTS phone2 TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update the name column to be nullable since we're adding full_name
ALTER TABLE public.students ALTER COLUMN name DROP NOT NULL;

-- Update existing teachers table with new fields
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS assigned_classes TEXT[], -- Array for multiple classes
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS role TEXT;

-- Update announcements table with new fields
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS target_section TEXT,
ADD COLUMN IF NOT EXISTS post_date DATE DEFAULT CURRENT_DATE;

-- Make message nullable since we're adding title/description
ALTER TABLE public.announcements ALTER COLUMN message DROP NOT NULL;

-- Create fee_structures table
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE,
  description TEXT,
  installments INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fee_payments table
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  installment_no INTEGER DEFAULT 1,
  amount_pending NUMERIC DEFAULT 0,
  payment_mode TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update existing timetables table with section
ALTER TABLE public.timetables 
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS period_no INTEGER;

-- Update period column to be nullable since we're adding period_no
ALTER TABLE public.timetables ALTER COLUMN period DROP NOT NULL;

-- Create attendance_links table for Google Sheets integration
CREATE TABLE public.attendance_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class TEXT NOT NULL,
  section TEXT,
  google_sheet_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class, section)
);

-- Enable RLS on new tables
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fee_structures
CREATE POLICY "Admins can manage fee structures" 
  ON public.fee_structures 
  FOR ALL 
  USING (true);

CREATE POLICY "Everyone can view fee structures" 
  ON public.fee_structures 
  FOR SELECT 
  USING (true);

-- Create RLS policies for fee_payments
CREATE POLICY "Admins can manage fee payments" 
  ON public.fee_payments 
  FOR ALL 
  USING (true);

CREATE POLICY "Students can view their fee payments" 
  ON public.fee_payments 
  FOR SELECT 
  USING (true);

-- Create RLS policies for attendance_links
CREATE POLICY "Admins can manage attendance links" 
  ON public.attendance_links 
  FOR ALL 
  USING (true);

CREATE POLICY "Teachers can view attendance links" 
  ON public.attendance_links 
  FOR SELECT 
  USING (true);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_fee_structures_updated_at 
  BEFORE UPDATE ON public.fee_structures 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_fee_payments_updated_at 
  BEFORE UPDATE ON public.fee_payments 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_attendance_links_updated_at 
  BEFORE UPDATE ON public.attendance_links 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
