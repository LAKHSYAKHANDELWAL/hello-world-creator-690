import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Calendar, Users, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export function MarkAttendanceDemo() {    
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const teacherName = localStorage.getItem('teacherName') || 'Demo Teacher';
  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Fetch unique classes and sections from students table
  useEffect(() => {
    async function fetchClassesAndSections() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('class, section');
        
        if (error) throw error;
        
        const uniqueClasses = [...new Set(data.map(s => s.class))].filter(Boolean);
        const uniqueSections = [...new Set(data.map(s => s.section))].filter(Boolean);
        
        setClasses(uniqueClasses);
        setSections(uniqueSections);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch classes and sections",
          variant: "destructive",
        });
        setClasses([]);
        setSections([]);
      }
    }
    fetchClassesAndSections();
  }, []);

  // Fetch students from Supabase when class and section are selected
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedClass || !selectedSection || !showStudentList) return;
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('class', selectedClass)
          .eq('section', selectedSection);
        
        if (error) throw error;
        setStudents(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch students",
          variant: "destructive",
        });
        setStudents([]);
      }
    }
    fetchStudents();
  }, [selectedClass, selectedSection, showStudentList]);

  useEffect(() => {
    if (showStudentList && selectedClass && students.length > 0) {
      const initialRecords = students.map(student => ({
        student_id: student.id,
        status: ''
      }));
      setAttendanceRecords(initialRecords);
    } else {
      setAttendanceRecords([]);
    }
  }, [showStudentList, selectedClass, students]);

  const updateAttendanceStatus = (studentId: string, status: string) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.student_id === studentId
          ? { ...record, status }
          : record
      )
    );
  };

  const saveAttendance = async () => {
    if (attendanceRecords.some(r => !r.status)) {
      toast({
        title: "Incomplete",
        description: "Please mark attendance for all students",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const attendanceData = attendanceRecords.map(record => {
        const student = students.find(s => s.id === record.student_id);
        return {
          student_id: record.student_id,
          student_name: student?.name || '',
          class: selectedClass,
          section: selectedSection,
          date,
          status: record.status,
          teacher_name: teacherName,
        };
      });

      // Direct API call since attendance table type doesn't exist yet
      const SUPABASE_URL = 'https://vlayfdbhjwhodpvruohc.supabase.co';
      const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsYXlmZGJoandob2RwdnJ1b2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTg4MDUsImV4cCI6MjA2NTU5NDgwNX0.DuDwvruX0Aasj3YbTXvbPxdsKUJX9ppQF243AdfvdyU';
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_API_KEY,
          'Authorization': `Bearer ${SUPABASE_API_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(attendanceData)
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });

      // Reset form
      setShowStudentList(false);
      setSelectedClass('');
      setSelectedSection('');
      setAttendanceRecords([]);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!showStudentList ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Class & Section
            </CardTitle>
            <CardDescription>Select a class and section to mark attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Class</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                >
                  <option value="">Select class</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Section</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                >
                  <option value="">Select section</option>
                  {sections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="default"
                disabled={!selectedClass || !selectedSection}
                onClick={() => setShowStudentList(true)}
              >
                Mark Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Student Attendance
            </CardTitle>
            <CardDescription>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="border rounded px-2 py-1 mt-2"
                style={{ fontSize: '1rem' }}
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map(student => {
                const record = attendanceRecords.find(r => r.student_id === student.id);
                const isPresent = record?.status === 'Present';
                const isAbsent = record?.status === 'Absent';
                return (
                  <div
                    key={student.id}
                    className={`rounded-lg p-4 flex flex-col items-center border transition ${isPresent ? 'bg-green-100' : isAbsent ? 'bg-red-100' : 'bg-white'}`}
                  >
                    <div className="font-bold text-center text-lg mb-3">{student.name}</div>
                    <div className="flex gap-4 mb-2">
                      <Button
                        variant={isPresent ? 'default' : 'outline'}
                        style={{ backgroundColor: isPresent ? '#22c55e' : undefined, color: isPresent ? 'white' : undefined }}
                        size="lg"
                        onClick={() => updateAttendanceStatus(student.id, 'Present')}
                      >
                        ✅ Present
                      </Button>
                      <Button
                        variant={isAbsent ? 'destructive' : 'outline'}
                        style={{ backgroundColor: isAbsent ? '#ef4444' : undefined, color: isAbsent ? 'white' : undefined }}
                        size="lg"
                        onClick={() => updateAttendanceStatus(student.id, 'Absent')}
                      >
                        ❌ Absent
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-8">
              <Button 
                onClick={saveAttendance}
                disabled={saving || attendanceRecords.some(r => !r.status)}
                className="flex items-center gap-2 text-lg px-6 py-3"
              >
                <Save className="h-5 w-5" /> 
                {saving ? 'Submitting...' : 'Submit Attendance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}