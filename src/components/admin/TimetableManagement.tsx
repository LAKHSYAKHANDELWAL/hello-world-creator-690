
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, Calendar, Clock, CalendarPlus, Eye } from 'lucide-react';

type TimetableEntry = {
  id: string;
  class: string;
  section: string;
  day: string;
  period_no: number;
  subject: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
  teachers: { name: string } | null;
};

export function TimetableManagement() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('');
  const [activeTab, setActiveTab] = useState('view');
  const [formData, setFormData] = useState({
    class: '',
    section: '',
    day: '',
    dayOption: 'specific', // 'all' or 'specific'
    period_no: 1,
    subject: '',
    teacher_id: '',
    start_time: '',
    end_time: ''
  });
  const { toast } = useToast();

  const classes = Array.from({length: 12}, (_, i) => `Class ${i + 1}`);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const subjects = [
    'Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 
    'Computer Science', 'Physical Education', 'Art', 'Music', 'Physics', 
    'Chemistry', 'Biology', 'Geography', 'History'
  ];

  useEffect(() => {
    fetchTimetable();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name');
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch teachers",
        variant: "destructive",
      });
    } else {
      setTeachers(data || []);
    }
  };

  const fetchTimetable = async () => {
    try {
      const { data, error } = await supabase
        .from('timetables')
        .select('*')
        .order('class')
        .order('day')
        .order('period_no');

      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Error",
          description: "Failed to fetch timetable data",
          variant: "destructive",
        });
        return;
      }

      // Process the data and fetch teacher names separately
      const processedData: TimetableEntry[] = await Promise.all((data || []).map(async (entry) => {
        let teacherInfo = null;
        
        if (entry.teacher_id) {
          try {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('name')
              .eq('id', entry.teacher_id)
              .single();
            
            if (teacherData) {
              teacherInfo = { name: teacherData.name };
            }
          } catch (e) {
            // Ignore teacher fetch errors
          }
        }
        
        return {
          id: entry.id,
          class: entry.class,
          section: entry.section || '',
          day: entry.day,
          period_no: entry.period_no || 0,
          subject: entry.subject,
          teacher_id: entry.teacher_id || '',
          start_time: entry.start_time || '',
          end_time: entry.end_time || '',
          created_at: entry.created_at,
          teachers: teacherInfo
        };
      }));

      setTimetable(processedData);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      toast({
        title: "Error",
        description: "Failed to fetch timetable data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const createEntry = async (day: string) => {
      const entryData = {
        ...formData,
        day,
        section: formData.section || null,
        teacher_id: formData.teacher_id === 'none' ? null : formData.teacher_id || null
      };
      delete entryData.dayOption; // Remove the UI-only field

      return entryData;
    };

    try {
      if (editingEntry) {
        const entryData = await createEntry(formData.day);
        const { error } = await supabase
          .from('timetables')
          .update(entryData)
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Timetable entry updated successfully",
        });
        setEditingEntry(null);
        setActiveTab('view');
      } else {
        const entriesToCreate = [];
        
        if (formData.dayOption === 'all') {
          // Create entry for all days
          for (const day of days) {
            const entryData = await createEntry(day);
            entriesToCreate.push(entryData);
          }
        } else {
          // Create entry for specific day
          const entryData = await createEntry(formData.day);
          entriesToCreate.push(entryData);
        }

        const { error } = await supabase
          .from('timetables')
          .insert(entriesToCreate);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `Timetable ${entriesToCreate.length > 1 ? 'entries' : 'entry'} created successfully`,
        });
      }
      
      fetchTimetable();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: editingEntry ? "Failed to update timetable entry" : "Failed to create timetable entry",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      class: '',
      section: '',
      day: '',
      dayOption: 'specific',
      period_no: 1,
      subject: '',
      teacher_id: '',
      start_time: '',
      end_time: ''
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete timetable entry",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Timetable entry deleted successfully",
      });
      fetchTimetable();
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      class: entry.class,
      section: entry.section || '',
      day: entry.day,
      dayOption: 'specific',
      period_no: entry.period_no,
      subject: entry.subject,
      teacher_id: entry.teacher_id,
      start_time: entry.start_time,
      end_time: entry.end_time
    });
    setActiveTab('add');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    resetForm();
  };

  // Filter timetable based on selected class and section
  const filteredTimetable = timetable.filter(entry => {
    if (selectedClass && selectedClass !== 'all' && entry.class !== selectedClass) return false;
    if (selectedSection && entry.section !== selectedSection) return false;
    return true;
  });

  // Group by day for display
  const groupedByDay = filteredTimetable.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  // Sort periods within each day
  Object.keys(groupedByDay).forEach(day => {
    groupedByDay[day] = groupedByDay[day]
      .filter(entry => entry.day === day)
      .sort((a, b) => a.period_no - b.period_no);
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Timetable
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                View Timetable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="filter-class">Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-section">Section</Label>
                  <Input
                    id="filter-section"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    placeholder="Enter section (optional)"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {days.map((day) => (
                  <div key={day} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {day}
                    </h3>
                    <div className="grid gap-2">
                      {groupedByDay[day] && groupedByDay[day].length > 0 ? (
                        groupedByDay[day].map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 border rounded bg-muted/50">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium">Period {entry.period_no}</span>
                                <span className="text-blue-600 font-medium">{entry.subject}</span>
                                <span className="text-muted-foreground">
                                  {entry.class} {entry.section && `- ${entry.section}`}
                                </span>
                                <span className="text-muted-foreground">
                                  {entry.teachers?.name || 'No Teacher'}
                                </span>
                                {entry.start_time && entry.end_time && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {entry.start_time} - {entry.end_time}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No classes scheduled</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                {editingEntry ? (
                  <span className="text-blue-600">Edit Timetable Entry - {editingEntry.class} {editingEntry.subject}</span>
                ) : (
                  'Add Timetable Entry'
                )}
              </CardTitle>
              {editingEntry && (
                <p className="text-sm text-muted-foreground">
                  You are currently editing this timetable entry.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class">Class *</Label>
                    <Select 
                      value={formData.class} 
                      onValueChange={(value) => setFormData({ ...formData, class: value })}
                    >
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
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="Enter section (optional)"
                    />
                  </div>
                  
                  {!editingEntry && (
                    <div className="col-span-2">
                      <Label>Day Selection</Label>
                      <Select 
                        value={formData.dayOption} 
                        onValueChange={(value) => setFormData({ ...formData, dayOption: value, day: value === 'all' ? '' : formData.day })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Days (Mon-Sat)</SelectItem>
                          <SelectItem value="specific">Specific Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(formData.dayOption === 'specific' || editingEntry) && (
                    <div>
                      <Label htmlFor="day">Day *</Label>
                      <Select 
                        value={formData.day} 
                        onValueChange={(value) => setFormData({ ...formData, day: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="period_no">Period No. *</Label>
                    <Input
                      id="period_no"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.period_no}
                      onChange={(e) => setFormData({ ...formData, period_no: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="teacher_id">Teacher</Label>
                    <Select 
                      value={formData.teacher_id} 
                      onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Teacher Assigned</SelectItem>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingEntry ? 'Update Entry' : 'Add Entry'}
                  </Button>
                  {editingEntry && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
