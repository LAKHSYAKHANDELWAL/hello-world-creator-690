import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Eye, Settings } from 'lucide-react';
import { NotificationBell } from './fee-management/NotificationBell';
import { SetFeeStructureSection } from './fee-management/SetFeeStructureSection';
import { ViewFeeStructureSection } from './fee-management/ViewFeeStructureSection';
import { RecordFeePaymentSection } from './fee-management/RecordFeePaymentSection';
import { FeePaymentAnalyticsSection } from './fee-management/FeePaymentAnalyticsSection';
import { 
  Student,
  FeeTerm,
  FeeStructure,
  FeePayment,
  FeeRemark,
  fetchStudents,
  fetchFeeTerms,
  fetchFeeStructures,
  fetchFeePayments,
  fetchFeeRemarks,
  calculatePendingFee,
} from '@/utils/feeUtils';

export function FeeManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [feeTerms, setFeeTerms] = useState<FeeTerm[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [feeRemarks, setFeeRemarks] = useState<FeeRemark[]>([]);
  const [activeTab, setActiveTab] = useState('view');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [smartSearch, setSmartSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Edit modes
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isEditingStructure, setIsEditingStructure] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    class: '',
    section: '',
    student_id: '',
    amount_paid: '',
    payment_mode: '',
    term_no: 1,
    submitted_by: '',
    receipt_number: '',
  });

  // Fee structure form state
  const [structureFormData, setStructureFormData] = useState({
    class: '',
    fee_type: '',
    term_no: 1,
    description: '',
    amount: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, classFilter, sectionFilter, smartSearch]);

  const fetchAllData = async () => {
    const [studentsResult, feeTermsResult, feeStructuresResult, feePaymentsResult, feeRemarksResult] = await Promise.all([
      fetchStudents(),
      fetchFeeTerms(),
      fetchFeeStructures(),
      fetchFeePayments(),
      fetchFeeRemarks()
    ]);

    if (studentsResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } else {
      setStudents(studentsResult.data || []);
    }

    if (feeTermsResult.error) {
      console.error('Error fetching fee terms:', feeTermsResult.error);
    } else {
      setFeeTerms(feeTermsResult.data || []);
    }

    if (feeStructuresResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch fee structures",
        variant: "destructive",
      });
    } else {
      setFeeStructures(feeStructuresResult.data || []);
    }

    if (feePaymentsResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch fee payments",
        variant: "destructive",
      });
    } else {
      setFeePayments(feePaymentsResult.data || []);
    }

    if (feeRemarksResult.error) {
      toast({
        title: "Error",
        description: "Failed to fetch fee remarks",
        variant: "destructive",
      });
    } else {
      setFeeRemarks(feeRemarksResult.data || []);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (classFilter && classFilter !== 'all') {
      filtered = filtered.filter(student => student.class === classFilter);
    }

    if (sectionFilter && sectionFilter !== 'all') {
      filtered = filtered.filter(student => student.section === sectionFilter);
    }

    if (smartSearch.trim()) {
      const searchTerm = smartSearch.toLowerCase().trim();
      filtered = filtered.filter(student => {
        const searchableFields = [
          student.full_name || '',
          student.name || '',
          student.login_id || '',
          student.class || '',
          student.section || '',
          student.parent_name || '',
          student.mother_name || '',
          student.phone || '',
          student.phone1 || '',
          student.phone2 || '',
          student.address || ''
        ];
        
        return searchableFields.some(field => 
          field.toLowerCase().includes(searchTerm)
        );
      });
    }

    setFilteredStudents(filtered);
  };

  const handleEditPayment = async (studentId: string) => {
    const latestPayment = feePayments.find(payment => payment.student_id === studentId);
    const student = students.find(s => s.id === studentId);
    
    if (latestPayment && student) {
      setPaymentFormData({
        class: student.class,
        section: student.section || '',
        student_id: studentId,
        amount_paid: latestPayment.amount_paid.toString(),
        payment_mode: latestPayment.payment_mode,
        term_no: latestPayment.term_no || 1,
        submitted_by: latestPayment.submitted_by || '',
        receipt_number: latestPayment.receipt_no || ''
      });
      setEditingPaymentId(latestPayment.id);
      setIsEditingPayment(true);
      setActiveTab('payment');
    }
  };

  const handleAddRemark = async (studentId: string, remarkText: string, followUpDate: string) => {
    const remarkData = {
      student_id: studentId,
      remark_text: remarkText,
      follow_up_date: followUpDate || null,
      is_completed: false
    };

    const { error } = await supabase
      .from('fee_remarks')
      .insert([remarkData]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add remark",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Remark added successfully",
      });
      fetchFeeRemarks();
    }
  };

  const handleMarkRemarkComplete = async (remarkId: string) => {
    const { error } = await supabase
      .from('fee_remarks')
      .update({ is_completed: true })
      .eq('id', remarkId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark remark as complete",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Remark marked as complete",
      });
      fetchFeeRemarks();
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentData = {
      student_id: paymentFormData.student_id,
      amount_paid: parseFloat(paymentFormData.amount_paid),
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: paymentFormData.payment_mode,
      term_no: paymentFormData.term_no,
      submitted_by: paymentFormData.submitted_by,
      receipt_no: paymentFormData.receipt_number || null
    };

    if (isEditingPayment && editingPaymentId) {
      const { error } = await supabase
        .from('fee_payments')
        .update(paymentData)
        .eq('id', editingPaymentId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update fee payment",
          variant: "destructive",
        });
        throw error;
      } else {
        toast({
          title: "Success",
          description: "Fee payment updated successfully",
        });
        resetPaymentForm();
        fetchAllData();
      }
    } else {
      const { error } = await supabase
        .from('fee_payments')
        .insert([paymentData]);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to record fee payment",
          variant: "destructive",
        });
        throw error;
      } else {
        toast({
          title: "Success",
          description: "Fee payment recorded successfully",
        });
        resetPaymentForm();
        fetchAllData();
      }
    }
  };

  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const structureData = {
      class: structureFormData.class,
      fee_type: structureFormData.fee_type,
      term_no: structureFormData.term_no,
      description: structureFormData.description || '',
      amount: parseFloat(structureFormData.amount) || 0,
      installments: 1
    };

    if (isEditingStructure && editingStructureId) {
      const { error } = await supabase
        .from('fee_structures')
        .update(structureData)
        .eq('id', editingStructureId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update fee structure",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Fee structure updated successfully",
        });
        resetStructureForm();
        fetchFeeStructures();
      }
    } else {
      const { error } = await supabase
        .from('fee_structures')
        .insert([structureData]);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to create fee structure",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Fee structure created successfully",
        });
        resetStructureForm();
        fetchFeeStructures();
      }
    }
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      class: '',
      section: '',
      student_id: '',
      amount_paid: '',
      payment_mode: '',
      term_no: 1,
      submitted_by: '',
      receipt_number: '',
    });
    setIsEditingPayment(false);
    setEditingPaymentId(null);
  };

  const resetStructureForm = () => {
    setStructureFormData({
      class: '',
      fee_type: '',
      term_no: 1,
      description: '',
      amount: ''
    });
    setIsEditingStructure(false);
    setEditingStructureId(null);
  };

  const getOverdueRemarksCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return feeRemarks.filter(remark => 
      !remark.is_completed && 
      remark.follow_up_date === today
    ).length;
  };

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full lg:w-auto gap-1">
              <TabsTrigger value="view" className="flex items-center gap-2 text-xs lg:text-sm px-2 py-1">
                <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">View Fee Management</span>
                <span className="sm:hidden">View</span>
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2 text-xs lg:text-sm px-2 py-1">
                <DollarSign className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">{isEditingPayment ? 'Edit Fee Payment' : 'Record Fee Payment'}</span>
                <span className="sm:hidden">{isEditingPayment ? 'Edit' : 'Payment'}</span>
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-2 text-xs lg:text-sm px-2 py-1">
                <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Set Fee Terms</span>
                <span className="sm:hidden">Terms</span>
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center gap-2 text-xs lg:text-sm px-2 py-1">
                <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">{isEditingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}</span>
                <span className="sm:hidden">{isEditingStructure ? 'Edit' : 'Structure'}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-shrink-0">
            <NotificationBell 
              students={students}
              remarks={feeRemarks}
              onMarkComplete={handleMarkRemarkComplete}
            />
          </div>
        </div>

        {/* View Fee Management Tab */}
        <TabsContent value="view" className="space-y-4 w-full">
          <ViewFeeStructureSection
            students={students}
            filteredStudents={filteredStudents}
            feeTerms={feeTerms}
            feePayments={feePayments}
            feeRemarks={feeRemarks}
            classFilter={classFilter}
            sectionFilter={sectionFilter}
            smartSearch={smartSearch}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalPages={totalPages}
            paginatedStudents={paginatedStudents}
            startIndex={startIndex}
            isEditingPayment={isEditingPayment}
            isEditingStructure={isEditingStructure}
            onClassFilterChange={setClassFilter}
            onSectionFilterChange={setSectionFilter}
            onSmartSearchChange={setSmartSearch}
            onClearFilters={() => {
              setClassFilter('all');
              setSectionFilter('all');
              setSmartSearch('');
            }}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onEditPayment={handleEditPayment}
            onAddRemark={handleAddRemark}
            onMarkRemarkComplete={handleMarkRemarkComplete}
          />
        </TabsContent>

        {/* Record Fee Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <RecordFeePaymentSection
            students={students}
            feePayments={feePayments}
            paymentFormData={paymentFormData}
            isEditingPayment={isEditingPayment}
            onFormDataChange={setPaymentFormData}
            onPaymentSubmit={handlePaymentSubmit}
            onResetForm={resetPaymentForm} feeTerms={[]}          />
        </TabsContent>

        {/* Set Fee Terms Tab */}
        <TabsContent value="terms">
          <SetFeeStructureSection />
        </TabsContent>

        {/* Create Fee Structure Tab */}
        <TabsContent value="structure" className="space-y-6">
          <FeePaymentAnalyticsSection
            feeStructures={feeStructures}
            structureFormData={structureFormData}
            isEditingStructure={isEditingStructure}
            onFormDataChange={setStructureFormData}
            onStructureSubmit={handleStructureSubmit}
            onResetForm={resetStructureForm}
            onEditStructure={(structure) => {
              setStructureFormData({
                class: structure.class,
                fee_type: structure.fee_type,
                term_no: structure.term_no,
                description: structure.description || '',
                amount: structure.amount.toString()
              });
              setIsEditingStructure(true);
              setEditingStructureId(structure.id);
              setActiveTab('structure');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
