
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimetableEntry {
  id: string;
  class: string;
  section: string;
  day: string;
  period: number;
  period_no: number;
  subject: string;
  start_time: string;
  end_time: string;
  teacher_id: string;
}

const ViewTimetablePage = () => {
  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSections();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchTimetable();
    }
  }, [selectedClass, selectedSection]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('timetables')
      .select('class')
      .not('class', 'is', null);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
      return;
    }

    const uniqueClasses = [...new Set(data.map(item => item.class))];
    setClasses(uniqueClasses);
  };

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('timetables')
      .select('section')
      .eq('class', selectedClass)
      .not('section', 'is', null);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sections",
        variant: "destructive",
      });
      return;
    }

    const uniqueSections = [...new Set(data.map(item => item.section))];
    setSections(uniqueSections);
  };

  const fetchTimetable = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('class', selectedClass)
      .eq('section', selectedSection)
      .order('day')
      .order('period_no');
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch timetable",
        variant: "destructive",
      });
    } else {
      setTimetableData(data || []);
    }
    
    setLoading(false);
  };

  const getTimetableEntry = (day: string, period: number) => {
    return timetableData.find(
      entry => entry.day === day && (entry.period_no === period || entry.period === period)
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/teacher">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Class Timetable</h1>
            <p className="text-muted-foreground">View class schedule and timings</p>
          </div>
        </div>

        {/* Class Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Class & Section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section} value={section}>
                        {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable */}
        {selectedClass && selectedSection && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timetable for Class {selectedClass}-{selectedSection}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading timetable...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Period</TableHead>
                        {days.map((day) => (
                          <TableHead key={day} className="text-center min-w-32">
                            {day}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periods.map((period) => (
                        <TableRow key={period}>
                          <TableCell className="font-medium text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4" />
                              {period}
                            </div>
                          </TableCell>
                          {days.map((day) => {
                            const entry = getTimetableEntry(day, period);
                            return (
                              <TableCell key={`${day}-${period}`} className="text-center">
                                {entry ? (
                                  <div className="p-2 bg-primary/10 rounded border">
                                    <p className="font-semibold text-sm">{entry.subject}</p>
                                    {(entry.start_time || entry.end_time) && (
                                      <p className="text-xs text-muted-foreground">
                                        {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-2 text-muted-foreground text-sm">
                                    Free
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ViewTimetablePage;
