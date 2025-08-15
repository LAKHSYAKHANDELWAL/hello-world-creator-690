
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Homework {
  id: string;
  title: string;
  description: string;
  due_date: string;
  class_name: string;
  created_at: string;
  attachment_url?: string;
}

const StudentHomeworkPage = () => {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [filteredHomework, setFilteredHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [student, setStudent] = useState<{ className: string; section: string }>({ className: '', section: '' });
  const navigate = useNavigate();
  const { toast } = useToast();

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
      fetchHomework();
    }
  }, [student.className]);

  useEffect(() => {
    if (filterSubject === 'all') {
      setFilteredHomework(homework);
    } else {
      setFilteredHomework(homework.filter(h => h.title.toLowerCase().includes(filterSubject.toLowerCase())));
    }
  }, [homework, filterSubject]);

  const fetchHomework = async () => {
    try {
      setLoading(true);
      console.log('Fetching homework for class:', student.className);
      
      let query = supabase
        .from('homework_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by class name if available
      if (student.className) {
        query = query.eq('class_name', student.className);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Homework data received:', data);
      setHomework(data || []);

      // If no homework found for specific class, try to get all homework
      if ((!data || data.length === 0) && student.className) {
        console.log('No homework found for class, fetching all homework');
        const { data: allData, error: allError } = await supabase
          .from('homework_assignments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!allError && allData && allData.length > 0) {
          console.log('All homework data:', allData);
          setHomework(allData);
        }
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
      toast({
        title: "Error",
        description: "Failed to fetch homework. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const subjects = [...new Set(homework.map(h => h.title.split(' ')[0]))];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Homework
            </h1>
            <p className="text-muted-foreground mt-2">
              {student.className} {student.section && `- ${student.section}`}
            </p>
          </div>

          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Loading homework...</div>
          </div>
        ) : filteredHomework.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No homework assignments found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredHomework.map((hw) => (
              <Card key={hw.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <CardTitle className="text-xl">{hw.title}</CardTitle>
                    <div className="flex gap-2">
                      {hw.due_date && (
                        <Badge variant={isOverdue(hw.due_date) ? "destructive" : "secondary"}>
                          <Clock className="h-3 w-3 mr-1" />
                          Due: {formatDate(hw.due_date)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{hw.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Assigned: {formatDate(hw.created_at)}
                    </div>
                  </div>

                  {hw.attachment_url && (
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href={hw.attachment_url} target="_blank" rel="noopener noreferrer">
                          View Attachment
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHomeworkPage;
