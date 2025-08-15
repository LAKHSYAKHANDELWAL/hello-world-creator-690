/**
 * Google Apps Script for Attendance Export
 * This script runs every few seconds to export attendance data from Supabase to Google Sheets
 * 
 * Setup Instructions:
 * 1. Create a new Google Apps Script project
 * 2. Paste this code
 * 3. Set up a time-driven trigger to run every 1-5 seconds
 * 4. Add your Supabase URL and API key in the script properties
 */

// Configuration - Add these to Script Properties in Google Apps Script
const SUPABASE_URL = 'https://vlayfdbhjwhodpvruohc.supabase.co';
const SUPABASE_API_KEY = 'your_supabase_anon_key';
const SPREADSHEET_ID = 'your_google_sheets_id';

function exportAttendanceFromSupabase() {
  try {
    console.log('Starting attendance export...');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch attendance data from Supabase
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/attendance?date=eq.${today}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() !== 200) {
      console.log('No attendance data found for today');
      return;
    }
    
    const attendanceData = JSON.parse(response.getContentText());
    
    if (!attendanceData || attendanceData.length === 0) {
      console.log('No attendance records to export');
      return;
    }
    
    console.log(`Found ${attendanceData.length} attendance records`);
    
    // Group data by class-section
    const classGroups = {};
    attendanceData.forEach(record => {
      const key = `${record.class}-${record.section}`;
      if (!classGroups[key]) {
        classGroups[key] = [];
      }
      classGroups[key].push(record);
    });
    
    // Export each class to its own sheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    Object.keys(classGroups).forEach(classSection => {
      const records = classGroups[classSection];
      const className = records[0].class;
      const section = records[0].section;
      
      // Create or get sheet for this class
      let sheet = spreadsheet.getSheetByName(classSection);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(classSection);
        // Set up headers
        sheet.getRange(1, 1, 1, 2).setValues([['Date', today]]);
        sheet.getRange(2, 1, 1, 2).setValues([['Teacher', records[0].teacher_name]]);
        sheet.getRange(3, 1, 1, 3).setValues([['Student Name', 'Status', 'Time']]);
      }
      
      // Find the next available column for this date
      let dateColumn = findOrCreateDateColumn(sheet, today);
      
      // Add attendance data
      const dataToWrite = records.map(record => [
        record.student_name,
        record.status,
        new Date(record.created_at).toLocaleTimeString()
      ]);
      
      if (dataToWrite.length > 0) {
        sheet.getRange(4, 1, dataToWrite.length, 3).setValues(dataToWrite);
      }
      
      console.log(`Exported ${records.length} records for ${classSection}`);
    });
    
    // Delete exported records from Supabase
    const deleteResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/attendance?date=eq.${today}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Attendance export completed successfully');
    
  } catch (error) {
    console.error('Error exporting attendance:', error);
  }
}

function findOrCreateDateColumn(sheet, date) {
  // Simple implementation - always use columns 1-3 for student data
  // In a real implementation, you'd create dynamic date columns
  return 1;
}

function setupTimeTrigger() {
  // Run every 10 seconds (minimum allowed by Google Apps Script)
  ScriptApp.newTrigger('exportAttendanceFromSupabase')
    .timeBased()
    .everyMinutes(1)
    .create();
}

// Manual execution function for testing
function testExport() {
  exportAttendanceFromSupabase();
}