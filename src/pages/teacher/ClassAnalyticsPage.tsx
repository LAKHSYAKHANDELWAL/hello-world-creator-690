
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, TrendingUp, DollarSign, BookOpen, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalStudents: number;
  avgMarks: number;
  feePendingCount: number;
  homeworkCount: number;
  topPerformers: Array<{
    student_name: string;
    marks_obtained: number;
    out_of: number;
    percentage: number;
  }>;
}

const ClassAnalyticsPage = () => {
  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalStudents: 0,
    avgMarks: 0,
    feePendingCount: 0,
    homeworkCount: 0,
    topPerformers: []
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      fetchAnalytics();
    }
  }, [selectedClass, selectedSection]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('students')
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
      .from('students')
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

  const fetchAnalytics = async () => {
    setLoading(true);
    
    try {
      // Fetch total students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class', selectedClass)
        .eq('section', selectedSection);

      if (studentsError) throw studentsError;

      const totalStudents = studentsData?.length || 0;
      const feePendingCount = studentsData?.filter(s => s.fee_status === 'pending').length || 0;

      // Fetch exam marks for average calculation
      const { data: marksData, error: marksError } = await supabase
        .from('exam_marks')
        .select('*')
        .eq('class_name', selectedClass);

      if (marksError) throw marksError;

      const avgMarks = marksData?.length > 0 
        ? marksData.reduce((sum, mark) => sum + (mark.marks_obtained / mark.out_of * 100), 0) / marksData.length
        : 0;

      // Get top performers
      const topPerformers = marksData
        ?.map(mark => ({
          student_name: mark.student_name,
          marks_obtained: mark.marks_obtained,
          out_of: mark.out_of,
          percentage: Math.round((mark.marks_obtained / mark.out_of) * 100)
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5) || [];

      // Fetch homework count
      const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('class_name', `${selectedClass}-${selectedSection}`);

      if (homeworkError) throw homeworkError;

      const homeworkCount = homeworkData?.length || 0;

      setAnalyticsData({
        totalStudents,
        avgMarks: Math.round(avgMarks),
        feePendingCount,
        homeworkCount,
        topPerformers
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    }
    
    setLoading(false);
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
            <h1 className="text-2xl font-bold">Class Analytics</h1>
            <p className="text-muted-foreground">View performance data and class statistics</p>
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

        {/* Analytics Cards */}
        {selectedClass && selectedSection && (
          <>
            {loading ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p>Loading analytics data...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                          <p className="text-2xl font-bold">{analyticsData.totalStudents}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Marks</p>
                          <p className="text-2xl font-bold">{analyticsData.avgMarks}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fee Pending</p>
                          <p className="text-2xl font-bold">{analyticsData.feePendingCount}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Homework Assigned</p>
                          <p className="text-2xl font-bold">{analyticsData.homeworkCount}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performers */}
                {analyticsData.topPerformers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Top Performers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.topPerformers.map((performer, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{performer.student_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {performer.marks_obtained}/{performer.out_of} marks
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{performer.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassAnalyticsPage;
