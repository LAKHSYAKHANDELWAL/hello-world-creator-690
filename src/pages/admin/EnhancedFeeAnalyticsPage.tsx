import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

import { TimeFilters } from '@/components/admin/enhanced-fee-analytics/TimeFilters';
import { FeeVisualization } from '@/components/admin/enhanced-fee-analytics/FeeVisualization';
import { ExportButtons } from '@/components/admin/enhanced-fee-analytics/ExportButtons';
import { StudentSummaryTable } from '@/components/admin/enhanced-fee-analytics/StudentSummaryTable';

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  totalFee: number;
  amountPaid: number;
  pendingAmount: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
}

const EnhancedFeeAnalyticsPage = () => {
  console.log('EnhancedFeeAnalyticsPage component is rendering...');
  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [terms, setTerms] = useState<number[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [timeFilter, setTimeFilter] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
    fetchTerms();
    updateDateRange();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSections();
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchFeeAnalytics();
  }, [selectedClass, selectedSection, selectedTerm, dateRange]);

  useEffect(() => {
    updateDateRange();
  }, [timeFilter]);

  const updateDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    switch (timeFilter) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'prev_month':
        const prevMonth = subMonths(now, 1);
        start = startOfMonth(prevMonth);
        end = endOfMonth(prevMonth);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          end = new Date(customEndDate);
        } else {
          return;
        }
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    setDateRange({ start, end });
  };

  const handleApplyCustomRange = () => {
    if (customStartDate && customEndDate) {
      updateDateRange();
    } else {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
    }
  };

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

  const fetchTerms = async () => {
    const { data, error } = await supabase
      .from('fee_structures')
      .select('term_no')
      .not('term_no', 'is', null);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch terms",
        variant: "destructive",
      });
      return;
    }

    const uniqueTerms = [...new Set(data.map(item => item.term_no))].sort();
    setTerms(uniqueTerms);
  };

  const fetchFeeAnalytics = async () => {
    setLoading(true);
    
    try {
      // Build query for students
      let studentsQuery = supabase.from('students').select('*');
      
      if (selectedClass && selectedClass !== 'all') {
        studentsQuery = studentsQuery.eq('class', selectedClass);
      }
      
      if (selectedSection && selectedSection !== 'all') {
        studentsQuery = studentsQuery.eq('section', selectedSection);
      }

      const { data: studentsData, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      // Fetch fee structures
      let feeStructureQuery = supabase.from('fee_structures').select('*');
      
      if (selectedClass && selectedClass !== 'all') {
        feeStructureQuery = feeStructureQuery.eq('class', selectedClass);
      }
      
      if (selectedTerm && selectedTerm !== 'all') {
        feeStructureQuery = feeStructureQuery.eq('term_no', parseInt(selectedTerm));
      }

      const { data: feeStructures, error: feeError } = await feeStructureQuery;
      if (feeError) throw feeError;

      // Fetch fee payments within date range
      let paymentsQuery = supabase
        .from('fee_payments')
        .select('*')
        .gte('payment_date', dateRange.start.toISOString())
        .lte('payment_date', dateRange.end.toISOString());

      const { data: feePayments, error: paymentsError } = await paymentsQuery;
      if (paymentsError) throw paymentsError;

      // Process student data
      const processedStudents: Student[] = studentsData?.map((student) => {
        // Calculate total fee for the student based on their class and selected term
        const studentFeeStructures = feeStructures?.filter(fs => 
          fs.class === student.class && (!selectedTerm || selectedTerm === 'all' || fs.term_no === parseInt(selectedTerm))
        ) || [];
        
        const totalFee = studentFeeStructures.reduce((sum, fs) => sum + Number(fs.amount), 0);

        // Calculate payments for this student
        const studentPayments = feePayments?.filter(payment => payment.student_id === student.id) || [];
        const amountPaid = studentPayments.reduce((sum, payment) => sum + Number(payment.amount_paid), 0);
        const pendingAmount = Math.max(0, totalFee - amountPaid);
        
        let status: 'Paid' | 'Partially Paid' | 'Unpaid';
        if (pendingAmount <= 0 && totalFee > 0) {
          status = 'Paid';
        } else if (amountPaid > 0) {
          status = 'Partially Paid';
        } else {
          status = 'Unpaid';
        }

        return {
          id: student.id,
          name: student.full_name || student.name || 'Unknown',
          class: student.class || '',
          section: student.section || '',
          totalFee,
          amountPaid,
          pendingAmount,
          status
        };
      }) || [];

      setStudents(processedStudents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch fee analytics",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Calculate statistics for visualization
  const stats = {
    totalCollected: students.reduce((sum, s) => sum + s.amountPaid, 0),
    totalPending: students.reduce((sum, s) => sum + s.pendingAmount, 0),
    tuitionCollected: students.reduce((sum, s) => sum + s.amountPaid * 0.8, 0), // Assuming 80% tuition
    transportCollected: students.reduce((sum, s) => sum + s.amountPaid * 0.2, 0), // Assuming 20% transport
    totalStudents: students.length,
    classStats: Object.entries(
      students.reduce((acc, student) => {
        const key = `${student.class} ${student.section}`;
        if (!acc[key]) {
          acc[key] = { collected: 0, total: 0 };
        }
        acc[key].collected += student.amountPaid;
        acc[key].total += student.totalFee;
        return acc;
      }, {} as Record<string, { collected: number; total: number }>)
    ).map(([className, data]) => ({
      class: className,
      collected: data.collected,
      total: data.total,
      percentage: data.total > 0 ? (data.collected / data.total) * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage)
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Enhanced Fee Analytics</h1>
            <p className="text-muted-foreground">Comprehensive fee collection tracking and analysis</p>
          </div>
        </div>

        {/* Time Filters */}
        <TimeFilters
          timeFilter={timeFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onTimeFilterChange={setTimeFilter}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
          onApplyCustomRange={handleApplyCustomRange}
        />

        {/* Class/Section/Term Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass || selectedClass === 'all'}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map((section) => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    {terms.map((term) => (
                      <SelectItem key={term} value={term.toString()}>Term {term}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Visualization */}
        <FeeVisualization stats={stats} />

        {/* Export Options */}
        <ExportButtons 
          students={students}
          timeFilter={timeFilter}
          selectedClass={selectedClass}
          selectedSection={selectedSection}
        />

        {/* Student Summary Table */}
        <StudentSummaryTable
          students={students}
          loading={loading}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={setSearchTerm}
        />
      </div>
    </div>
  );
};

export default EnhancedFeeAnalyticsPage;