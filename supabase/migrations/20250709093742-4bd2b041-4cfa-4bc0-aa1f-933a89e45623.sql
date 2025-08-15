
-- Add fee_paid and fee_pending columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS fee_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_pending NUMERIC DEFAULT 0;

-- Create a function to update student fee totals
CREATE OR REPLACE FUNCTION public.update_student_fee_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update fee_paid by summing all payments for the student
  UPDATE public.students 
  SET fee_paid = COALESCE((
    SELECT SUM(amount_paid) 
    FROM public.fee_payments 
    WHERE student_id = NEW.student_id
  ), 0)
  WHERE id = NEW.student_id;
  
  -- Update fee_pending based on total fee structure minus paid amount
  UPDATE public.students 
  SET fee_pending = COALESCE((
    SELECT SUM(fs.amount) 
    FROM public.fee_structures fs 
    WHERE fs.class = students.class
  ), 0) - fee_paid
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update student fee totals when payment is made
DROP TRIGGER IF EXISTS update_student_fees_on_payment ON public.fee_payments;
CREATE TRIGGER update_student_fees_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_fee_totals();

-- Create function to initialize fee_pending when fee structure is created
CREATE OR REPLACE FUNCTION public.update_students_fee_pending_on_structure_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update fee_pending for all students in the affected class
  UPDATE public.students 
  SET fee_pending = COALESCE((
    SELECT SUM(fs.amount) 
    FROM public.fee_structures fs 
    WHERE fs.class = students.class
  ), 0) - COALESCE(fee_paid, 0)
  WHERE class = NEW.class;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update students when fee structure changes
DROP TRIGGER IF EXISTS update_student_fees_on_structure_change ON public.fee_structures;
CREATE TRIGGER update_student_fees_on_structure_change
  AFTER INSERT OR UPDATE OR DELETE ON public.fee_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_students_fee_pending_on_structure_change();
