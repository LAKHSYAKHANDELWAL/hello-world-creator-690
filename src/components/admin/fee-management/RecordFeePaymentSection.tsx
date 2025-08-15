import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, X, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { Student, FeePayment, classes, sections, paymentModes, submittedByOptions } from '@/utils/feeUtils';
import { PrintReceiptDialog } from './PrintReceiptDialog';
import { SmartSearchBar } from './SmartSearchBar';

type PaymentFormData = {
  class: string;
  section: string;
  student_id: string;
  amount_paid: string;
  payment_mode: string;
  term_no: number;
  submitted_by: string;
  receipt_number: string;
};

type Props = {
  students: Student[]
  feePayments: FeePayment[]
  feeTerms: any[]
  paymentFormData: PaymentFormData
  isEditingPayment: boolean
  onFormDataChange: (data: PaymentFormData) => void
  onPaymentSubmit: (e: React.FormEvent) => Promise<void>
  onResetForm: () => void
  onEditPayment?: (payment: FeePayment) => void
}

export function RecordFeePaymentSection({
  students,
  feePayments,
  feeTerms,
  paymentFormData,
  isEditingPayment,
  onFormDataChange,
  onPaymentSubmit,
  onResetForm,
  onEditPayment,
}: Props) {
  const formCardRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () => {
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState<any>(null);
  const [lastStudentData, setLastStudentData] = useState<Student | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const handleSubmitWithReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent duplicate receipt number (ignore empty string)
    const enteredReceipt = paymentFormData.receipt_number?.trim();
    if (enteredReceipt) {
      const duplicate = feePayments.some(
        p => p.receipt_no && p.receipt_no.toLowerCase() === enteredReceipt.toLowerCase() && p.id !== editingPaymentId
      );
      if (duplicate) {
        alert('Receipt number already exists. Please enter a unique receipt number.');
        return;
      }
    }
    // Store current student data before form reset
    const currentStudent = students.find(s => s.id === paymentFormData.student_id);
    try {
      await onPaymentSubmit(e); // Only pass the event
      setEditingPaymentId(null); // Reset edit mode after update
      // Store the payment data for receipt printing
      setLastPaymentData({
        amount_paid: parseFloat(paymentFormData.amount_paid),
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: paymentFormData.payment_mode,
        term_no: paymentFormData.term_no,
        submitted_by: paymentFormData.submitted_by,
        receipt_no: paymentFormData.receipt_number,
      });
      setLastStudentData(currentStudent || null);
      setShowPrintDialog(true);
    } catch (error) {
      // Error already handled by parent component
    }
  };

  // Handler for edit button
  const handleEditPayment = (payment: FeePayment, student: Student | undefined) => {
    onFormDataChange({
      class: student?.class || '',
      section: student?.section || '',
      student_id: payment.student_id,
      amount_paid: payment.amount_paid.toString(),
      payment_mode: payment.payment_mode,
      term_no: payment.term_no,
      submitted_by: payment.submitted_by,
      receipt_number: payment.receipt_no || '',
    });
    setEditingPaymentId(payment.id);
    scrollToForm();
  };

  // Handler for cancel edit
  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    onResetForm();
  };

  const getFilteredStudentsForPayment = () => {
    return students.filter(student => 
      student.class === paymentFormData.class && 
      student.section === paymentFormData.section
    );
  };

  const getStudentPaymentHistory = () => {
    if (!paymentFormData.student_id) return [];
    return feePayments
      .filter(payment => payment.student_id === paymentFormData.student_id)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  };

  const studentPaymentHistory = getStudentPaymentHistory();
  const selectedStudent = students.find(s => s.id === paymentFormData.student_id);

  // For global payment history (when no student is selected)
  const [globalHistoryCount, setGlobalHistoryCount] = useState(5);
  const [globalSearch, setGlobalSearch] = useState('');
  const globalPaymentHistory = React.useMemo(() => {
    let filtered = feePayments.slice();
    if (globalSearch.trim()) {
      const searchTerm = globalSearch.toLowerCase();
      filtered = filtered.filter(payment => {
        const student = students.find(s => s.id === payment.student_id);
        return [
          payment.receipt_no,
          payment.amount_paid?.toString(),
          payment.term_no?.toString(),
          payment.payment_mode,
          payment.submitted_by,
          payment.payment_date,
          student?.full_name,
          student?.name,
          student?.login_id,
          student?.class,
          student?.section,
          student?.parent_name,
          student?.mother_name,
          student?.phone,
          student?.phone1,
          student?.phone2,
          student?.address,
          student?.sr_no?.toString(),
        ]
          .filter(Boolean)
          .some(field => field.toLowerCase().includes(searchTerm));
      });
    }
    return filtered
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .slice(0, globalHistoryCount);
  }, [feePayments, globalHistoryCount, globalSearch, students]);

  const getTotalFee = (student: Student, feeTerms: any[]) => {
    if (!student || !feeTerms) return 0;
    const termFee = feeTerms
      .filter(term => term.class === student.class)
      .reduce((sum, term) => sum + term.amount, 0);
    return (
      termFee +
      (student.transport_fee || 0) -
      (student.discount_amount || 0)
    );
  };

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <Card ref={formCardRef} className={editingPaymentId ? "border-blue-500 shadow-lg" : ""}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {editingPaymentId ? 'Edit Fee Payment' : 'Record Fee Payment'}
          </CardTitle>
          {!editingPaymentId && (
            <Button type="button" variant="outline" size="sm" onClick={onResetForm} className="ml-auto">
              Reset
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitWithReceipt} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_class">Class *</Label>
                <Select 
                  value={paymentFormData.class} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...paymentFormData, 
                    class: value, 
                    section: '', 
                    student_id: '' 
                  })}
                  disabled={isEditingPayment}
                >
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
                <Label htmlFor="payment_section">Section *</Label>
                <Select 
                  value={paymentFormData.section} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...paymentFormData, 
                    section: value, 
                    student_id: '' 
                  })}
                  disabled={!paymentFormData.class || isEditingPayment}
                >
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

              <div className="col-span-2">
                <Label htmlFor="payment_student">Student *</Label>
                <Select 
                  value={paymentFormData.student_id} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...paymentFormData, 
                    student_id: value 
                  })}
                  disabled={!paymentFormData.class || !paymentFormData.section || isEditingPayment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search and select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredStudentsForPayment().map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name || student.name} - {student.login_id} (Pending: ₹{student.fee_pending || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="receipt_number">Receipt Number</Label>
                <Input
                  id="receipt_number"
                  type="text"
                  value={paymentFormData.receipt_number}
                  onChange={(e) => onFormDataChange({ 
                    ...paymentFormData, 
                    receipt_number: e.target.value 
                  })}
                  placeholder="Enter receipt number"
                />
              </div>

              <div>
                <Label htmlFor="term_no">Term Number *</Label>
                <Select 
                  value={paymentFormData.term_no.toString()} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...paymentFormData, 
                    term_no: parseInt(value) 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount_paid">Amount Paid *</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  value={paymentFormData.amount_paid}
                  onChange={(e) => onFormDataChange({ 
                    ...paymentFormData, 
                    amount_paid: e.target.value 
                  })}
                  placeholder="Enter amount paid"
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_mode">Payment Mode *</Label>
                <Select 
                  value={paymentFormData.payment_mode} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...paymentFormData, 
                    payment_mode: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="submitted_by">Fee Submitted By *</Label>
                <Select 
                  value={paymentFormData.submitted_by} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...paymentFormData, 
                    submitted_by: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select who submitted" />
                  </SelectTrigger>
                  <SelectContent>
                    {submittedByOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingPaymentId ? '✅ Update Payment' : 'Record Payment'}
              </Button>
              {editingPaymentId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Payment History */}
  
{selectedStudent && studentPaymentHistory.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>
        Payment History - {selectedStudent.full_name || selectedStudent.name}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Receipt No.</TableHead>
            <TableHead>Submitted By</TableHead>
              <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentPaymentHistory.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {format(new Date(payment.payment_date), 'dd MMM yyyy')}
              </TableCell>
              <TableCell>₹{payment.amount_paid}</TableCell>
              <TableCell>Term {payment.term_no}</TableCell>
              <TableCell>{payment.payment_mode}</TableCell>
              <TableCell>{payment.receipt_no || 'N/A'}</TableCell>
              <TableCell>{payment.submitted_by || 'N/A'}</TableCell>
              <TableCell className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setLastPaymentData({
                      amount_paid: payment.amount_paid,
                      payment_date: payment.payment_date,
                      payment_mode: payment.payment_mode,
                      term_no: payment.term_no,
                      submitted_by: payment.submitted_by,
                      receipt_no: payment.receipt_no,
                    });
                    setLastStudentData(selectedStudent);
                    setShowPrintDialog(true);
                  }}
                  title="Print Receipt"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEditPayment(payment, selectedStudent)}
                  title="Edit Payment"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
)}

{/* Show global payment history if no student is selected */}
{!selectedStudent && (
  <Card>
    <CardHeader>
      <CardTitle>Recent Fee Submissions</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="mb-2">
        <SmartSearchBar value={globalSearch} onChange={setGlobalSearch} placeholder="Search by name, receipt, class, section, parent, mobile, amount, term, etc..." />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Class & Section</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Receipt No.</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {globalPaymentHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">No records found</TableCell>
            </TableRow>
          ) : (
            globalPaymentHistory.map((payment) => {
              const student = students.find(s => s.id === payment.student_id);
              return (
                <TableRow key={payment.id}>
                  <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{student ? (student.full_name || student.name) : 'N/A'}</TableCell>
                  <TableCell>{student ? `${student.class || ''} ${student.section || ''}` : 'N/A'}</TableCell>
                  <TableCell>₹{payment.amount_paid}</TableCell>
                  <TableCell>Term {payment.term_no}</TableCell>
                  <TableCell>{payment.payment_mode}</TableCell>
                  <TableCell>{payment.receipt_no || 'N/A'}</TableCell>
                  <TableCell>{payment.submitted_by || 'N/A'}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setLastPaymentData({
                          amount_paid: payment.amount_paid,
                          payment_date: payment.payment_date,
                          payment_mode: payment.payment_mode,
                          term_no: payment.term_no,
                          submitted_by: payment.submitted_by,
                          receipt_no: payment.receipt_no,
                        });
                        setLastStudentData(student || null);
                        setShowPrintDialog(true);
                      }}
                      title="Print Receipt"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const student = students.find(s => s.id === payment.student_id);
                        handleEditPayment(payment, student);
                      }}
                      title="Edit Payment"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {feePayments.length > globalHistoryCount && globalPaymentHistory.length > 0 && (
        <div className="flex justify-center mt-2">
          <Button variant="outline" size="sm" onClick={() => setGlobalHistoryCount(c => c + 5)}>
            Load More
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
)}
      {showPrintDialog && lastPaymentData && lastStudentData && (
        <PrintReceiptDialog
          isOpen={showPrintDialog}
          onClose={() => setShowPrintDialog(false)}
          student={lastStudentData}
          paymentData={lastPaymentData}
          previousPending={lastStudentData.previous_fee_pending || 0}
          totalFee={getTotalFee(lastStudentData, feeTerms)}
        />
      )}
    </div>   
     ); // Correctly close the return statement
}

