
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Mail, Phone, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  phone: string;
  email: string;
  assigned_classes: string[];
}

const StudentTeachersPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
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
      fetchTeachers();
    }
  }, [student.className]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .contains('assigned_classes', [student.className]);

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch teachers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Class Teachers
          </h1>
          <p className="text-muted-foreground mt-2">
            {student.className} {student.section && `- ${student.section}`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Loading teachers...</div>
          </div>
        ) : teachers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No teachers found for your class.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{teacher.name}</CardTitle>
                  {teacher.subject && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      {teacher.subject}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {teacher.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${teacher.email}`}
                        className="text-primary hover:underline"
                      >
                        {teacher.email}
                      </a>
                    </div>
                  )}

                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${teacher.phone}`}
                        className="text-primary hover:underline"
                      >
                        {teacher.phone}
                      </a>
                    </div>
                  )}

                  {teacher.assigned_classes && teacher.assigned_classes.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <div className="font-medium mb-1">Classes:</div>
                      <div className="flex flex-wrap gap-1">
                        {teacher.assigned_classes.map((cls, index) => (
                          <span 
                            key={index}
                            className="bg-muted px-2 py-1 rounded"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
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

export default StudentTeachersPage;
