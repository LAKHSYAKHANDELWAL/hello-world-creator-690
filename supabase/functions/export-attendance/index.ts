import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  class: string;
  section: string;
  date: string;
  status: string;
  teacher_name: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { date } = await req.json()
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch attendance records for the date
    const { data: attendanceRecords, error: fetchError } = await supabaseClient
      .from('attendance')
      .select('*')
      .eq('date', date)
      .order('class')
      .order('section')
      .order('student_name')

    if (fetchError) {
      throw fetchError
    }

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No attendance records found for this date' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Group records by class
    const classSections = new Map<string, AttendanceRecord[]>()
    
    attendanceRecords.forEach(record => {
      const key = `${record.class}-${record.section}`
      if (!classSections.has(key)) {
        classSections.set(key, [])
      }
      classSections.get(key)!.push(record)
    })

    // Call Google Apps Script for each class
    const exportPromises = Array.from(classSections.entries()).map(async ([classSection, records]) => {
      const [className, section] = classSection.split('-')
      
      // Prepare data for Google Sheets
      const sheetData = {
        className,
        section,
        date,
        records: records.map(r => ({
          studentName: r.student_name,
          status: r.status,
          teacherName: r.teacher_name
        }))
      }

      // Replace with your Google Apps Script URL
      const gasUrl = 'https://script.google.com/macros/s/AKfycbyNNvgXg8sanUondv8R-sIB2Px2qKLq6oLkaKa2qJ_zCVLd194h0-A4-CQbA3Pzrr9b/exec'
      
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sheetData)
      })

      if (!response.ok) {
        throw new Error(`Failed to export ${classSection}: ${response.statusText}`)
      }

      return { classSection, success: true }
    })

    const results = await Promise.allSettled(exportPromises)
    
    const successes = results.filter(r => r.status === 'fulfilled').length
    const failures = results.filter(r => r.status === 'rejected')

    if (failures.length > 0) {
      console.error('Export failures:', failures)
    }

    // If all exports successful, delete the records from Supabase
    if (failures.length === 0) {
      const { error: deleteError } = await supabaseClient
        .from('attendance')
        .delete()
        .eq('date', date)

      if (deleteError) {
        console.error('Failed to delete records after export:', deleteError)
        // Don't throw here as export was successful
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully exported ${successes} class sections`,
        exported: successes,
        failed: failures.length,
        recordsDeleted: failures.length === 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})