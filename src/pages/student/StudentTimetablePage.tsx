
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TimetableEntry {
  id: string;
  day: string;
  subject: string;
  period_no: number;
  start_time: string;
  end_time: string;
  teacher_id: string;
}

const StudentTimetablePage = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<{ className: string; section: string }>({ className: '', section: '' });
  const navigate = useNavigate();
  const { toast } = useToast();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const stored = localStorage.getItem("student-profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStudent({
          className: parsed.className || "",
          section: parsed.section || "",
        });
      } catch {
        setStudent({ className: "", section: "" });
      }
    }
  }, []);

  useEffect(() => {
    if (student.className) {
      fetchTimetable();
    }
  }, [student.className, student.section]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('timetables')
        .select('*')
        .eq('class', student.className);

      if (student.section) {
        query = query.eq('section', student.section);
      }

      const { data, error } = await query.order('day').order('period_no');

      if (error) throw error;
      setTimetable(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch timetable. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimetableForDay = (day: string) => {
    return timetable
      .filter(entry => entry.day === day)
      .sort((a, b) => (a.period_no || 0) - (b.period_no || 0));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Class Timetable
          </h1>
          <p className="text-muted-foreground mt-2">
            {student.className} {student.section && `- ${student.section}`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Loading timetable...</div>
          </div>
        ) : timetable.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No timetable found for your class.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {days.map((day) => {
              const dayTimetable = getTimetableForDay(day);
              return (
                <Card key={day}>
                  <CardHeader>
                    <CardTitle className="text-xl">{day}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dayTimetable.length === 0 ? (
                      <p className="text-muted-foreground">No classes scheduled</p>
                    ) : (
                      <div className="grid gap-3">
                        {dayTimetable.map((entry) => (
                          <div 
                            key={entry.id} 
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium bg-primary text-primary-foreground px-2 py-1 rounded">
                                Period {entry.period_no || 'N/A'}
                              </div>
                              <div>
                                <div className="font-semibold">{entry.subject}</div>
                                {(entry.start_time || entry.end_time) && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {entry.start_time && formatTime(entry.start_time)}
                                    {entry.start_time && entry.end_time && ' - '}
                                    {entry.end_time && formatTime(entry.end_time)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetablePage;
