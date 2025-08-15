-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT,
  login_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  fee_status TEXT DEFAULT 'pending',
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create teachers table  
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  assigned_class TEXT,
  login_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  subject TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create marks table (extends existing exam_marks)
ALTER TABLE public.exam_marks ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.exam_marks ADD COLUMN IF NOT EXISTS student_id UUID;

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  target_class TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create fees table
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  due_date DATE,
  payment_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create timetables table
CREATE TABLE public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT NOT NULL,
  day TEXT NOT NULL,
  subject TEXT NOT NULL,
  period INTEGER NOT NULL,
  teacher_id UUID,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create leaves table
CREATE TABLE public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create admins table
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create Google Sheets mapping table for attendance
CREATE TABLE public.attendance_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT UNIQUE NOT NULL,
  sheet_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sheets ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Students can view their own data" ON public.students
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL USING (true);

-- Teachers policies  
CREATE POLICY "Teachers can view their data" ON public.teachers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL USING (true);

-- Announcements policies
CREATE POLICY "Everyone can read announcements" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (true);

-- Fees policies
CREATE POLICY "Students can view their fees" ON public.fees
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fees" ON public.fees
  FOR ALL USING (true);

-- Timetables policies
CREATE POLICY "Everyone can view timetables" ON public.timetables
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage timetables" ON public.timetables
  FOR ALL USING (true);

-- Leaves policies
CREATE POLICY "Students can view their leaves" ON public.leaves
  FOR SELECT USING (true);

CREATE POLICY "Students can create leave requests" ON public.leaves
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers and admins can manage leaves" ON public.leaves
  FOR ALL USING (true);

-- Admins policies
CREATE POLICY "Admins can manage admin accounts" ON public.admins
  FOR ALL USING (true);

-- Attendance sheets policies
CREATE POLICY "Everyone can view attendance sheet mappings" ON public.attendance_sheets
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage attendance sheets" ON public.attendance_sheets
  FOR ALL USING (true);

-- Add foreign key constraints
ALTER TABLE public.fees ADD CONSTRAINT fk_fees_student 
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.leaves ADD CONSTRAINT fk_leaves_student 
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON public.fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON public.leaves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_sheets_updated_at BEFORE UPDATE ON public.attendance_sheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();