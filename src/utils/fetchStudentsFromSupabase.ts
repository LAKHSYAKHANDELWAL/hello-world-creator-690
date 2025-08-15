
import { supabase } from "@/integrations/supabase/client";

export async function fetchStudentsFromSupabase(className: string): Promise<{ name: string }[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('name, full_name')
      .eq('class', className)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch students: ${error.message}`);
    }

    return data.map(student => ({
      name: student.full_name || student.name || 'Unknown Student'
    })).filter(student => student.name.trim() !== '');
  } catch (error) {
    console.error('Error fetching students from Supabase:', error);
    throw error;
  }
}

// Note: CLASS_SHEET_IDS is no longer needed as we fetch classes dynamically
// This ensures the app works with any number of classes in the database
