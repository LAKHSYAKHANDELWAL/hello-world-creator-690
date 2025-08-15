import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, BookOpen, Users, Award, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentMarksData {
  id: string;
  name: string;
  rollNo: number;
  subject: string;
  examType: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  status: 'Excellent' | 'Average' | 'Poor';
  isWeak: boolean;
}

const MarksReportPage = () => {
  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [students, setStudents] = useState<StudentMarksData[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
    fetchExamTypes();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSections();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedExamType) {
      fetchMarksData();
    }
  }, [selectedClass, selectedSection, selectedExamType]);

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

  const fetchExamTypes = async () => {
    const { data, error } = await supabase
      .from('exam_marks')
      .select('exam_type')
      .not('exam_type', 'is', null);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch exam types",
        variant: "destructive",
      });
      return;
    }

    const uniqueExamTypes = [...new Set(data.map(item => item.exam_type))];
    setExamTypes(uniqueExamTypes);
  };

  const fetchMarksData = async () => {
    setLoading(true);
    
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class', selectedClass)
        .eq('section', selectedSection);

      if (studentsError) throw studentsError;

      // Fetch exam marks - modified to handle "All Exams"
      let marksQuery = supabase
        .from('exam_marks')
        .select('*')
        .eq('class_name', selectedClass);

      if (selectedExamType && selectedExamType !== 'All Exams') {
        marksQuery = marksQuery.eq('exam_type', selectedExamType);
      }

      const { data: marksData, error: marksError } = await marksQuery;

      if (marksError) throw marksError;

      // Process student marks data
      const processedStudents: StudentMarksData[] = [];
      
      studentsData?.forEach((student, index) => {
        const studentMarks = marksData?.filter(mark => 
          mark.student_name === (student.full_name || student.name)
        ) || [];

        studentMarks.forEach(mark => {
          const percentage = Math.round((mark.marks_obtained / mark.out_of) * 100);
          
          let status: 'Excellent' | 'Average' | 'Poor';
          if (percentage >= 80) {
            status = 'Excellent';
          } else if (percentage >= 50) {
            status = 'Average';
          } else {
            status = 'Poor';
          }

          const isWeak = percentage < 40;

          processedStudents.push({
            id: `${student.id}-${mark.subject}-${mark.exam_type}`,
            name: student.full_name || student.name || 'Unknown',
            rollNo: index + 1,
            subject: mark.subject || 'General',
            examType: mark.exam_type || 'Unknown',
            marks: mark.marks_obtained,
            maxMarks: mark.out_of,
            percentage,
            status,
            isWeak
          });
        });
      });

      setStudents(processedStudents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch marks data",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const getStatusBadge = (status: string, percentage: number, isWeak: boolean) => {
    if (isWeak) {
      return <Badge className="bg-red-200 text-red-900 hover:bg-red-200">⚠️ Weak ({percentage}%)</Badge>;
    }

    switch (status) {
      case 'Excellent':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">🟢 Excellent ({percentage}%)</Badge>;
      case 'Average':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🟡 Average ({percentage}%)</Badge>;
      case 'Poor':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">🔴 Poor ({percentage}%)</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredStudents = students.filter(student => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'weak') return student.isWeak;
    return student.status === statusFilter;
  });

  const stats = {
    total: students.length,
    excellent: students.filter(s => s.status === 'Excellent').length,
    average: students.filter(s => s.status === 'Average').length,
    poor: students.filter(s => s.status === 'Poor').length,
    weak: students.filter(s => s.isWeak).length,
    avgMarks: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.percentage, 0) / students.length) : 0
  };

  // Group students by name for weak subjects alert
  const weakStudents = students.filter(s => s.isWeak);
  const weakByStudent = weakStudents.reduce((acc, student) => {
    if (!acc[student.name]) {
      acc[student.name] = [];
    }
    acc[student.name].push(student.subject);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Marks Report</h1>
            <p className="text-muted-foreground">Analyze student performance and identify areas needing attention</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
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
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Exam Type</label>
                <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Exams">All Exams</SelectItem>
                    {examTypes.map((examType) => (
                      <SelectItem key={examType} value={examType}>{examType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status Filter</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Excellent">Excellent Only</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Poor">Poor Only</SelectItem>
                    <SelectItem value="weak">Weak Areas Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weak Students Alert */}
        {Object.keys(weakByStudent).length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Students with weak areas (&lt; 40%):</strong>
              <ul className="mt-2 space-y-1">
                {Object.entries(weakByStudent).map(([studentName, subjects]) => (
                  <li key={studentName}>
                    <strong>{studentName}:</strong> {subjects.join(', ')}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {selectedClass && selectedSection && selectedExamType && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Excellent</p>
                    <p className="text-2xl font-bold text-green-600">{stats.excellent}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.average}</p>
                  </div>
                  <Users className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Poor</p>
                    <p className="text-2xl font-bold text-red-600">{stats.poor}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Weak Areas</p>
                    <p className="text-2xl font-bold text-red-800">{stats.weak}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-800" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                    <p className="text-2xl font-bold">{stats.avgMarks}%</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student Marks Table */}
        {selectedClass && selectedSection && selectedExamType && (
          <Card>
            <CardHeader>
              <CardTitle>
                Marks Report - {selectedClass} {selectedSection} 
                {selectedExamType === 'All Exams' ? ' (All Exams)' : ` (${selectedExamType})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Subject</TableHead>
                      {selectedExamType === 'All Exams' && <TableHead>Exam Type</TableHead>}
                      <TableHead>Marks / Max</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className={student.isWeak ? 'bg-red-50' : ''}>
                        <TableCell>{student.rollNo.toString().padStart(2, '0')}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.subject}</TableCell>
                        {selectedExamType === 'All Exams' && <TableCell>{student.examType}</TableCell>}
                        <TableCell>{student.marks} / {student.maxMarks}</TableCell>
                        <TableCell className="font-medium">{student.percentage}%</TableCell>
                        <TableCell>
                          {getStatusBadge(student.status, student.percentage, student.isWeak)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarksReportPage;
