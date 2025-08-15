
-- Remove all attendance-related data and tables
DROP TABLE IF EXISTS public.attendance_links CASCADE;

-- Remove any attendance-related triggers or functions if they exist
DROP FUNCTION IF EXISTS public.handle_attendance_update() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_attendance_percentage() CASCADE;
