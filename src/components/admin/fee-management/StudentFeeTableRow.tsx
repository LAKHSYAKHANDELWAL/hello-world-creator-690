import React, { useState, useEffect } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit, Plus, Eye, Info } from 'lucide-react';
import { AddRemarkDialog } from './AddRemarkDialog';
import { RemarksDialog } from './RemarksDialog';
import { DiscountDialog } from './DiscountDialog';
import { FeeInfoDialog } from './FeeInfoDialog';
import { SiblingsDialog } from './SiblingsDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isAfter, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/utils/feeUtils';

type FeeTerm = {
  id: string;
  class: string;
  term_no: number;
  due_date: string;
  amount: number;
};

type FeePayment = {
  id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  payment_mode: string;
  term_no: number;
  submitted_by: string;
};

type FeeRemark = {
  id: string;
  student_id: string;
  remark_text: string;
  follow_up_date: string;
  created_at: string;
  is_completed: boolean;
};

type Props = {
  student: Student;
  rowIndex: number;
  feeTerms: FeeTerm[];
  payments: FeePayment[];
  remarks: FeeRemark[];
  onEditPayment: (studentId: string) => void;
  onAddRemark: (studentId: string, remarkText: string, followUpDate: string) => void;
  onMarkRemarkComplete: (remarkId: string) => void;
  isEditingDisabled: boolean;
  allStudents: Student[];
};

export function StudentFeeTableRow({
  student: initialStudent,
  rowIndex,
  feeTerms,
  payments,
  remarks,
  onEditPayment,
  onAddRemark,
  onMarkRemarkComplete,
  isEditingDisabled,
  allStudents
}: Props) {
  const [student, setStudent] = useState(initialStudent);
  // Track last synced pending fee to avoid unnecessary updates
  const [lastSyncedPending, setLastSyncedPending] = useState<number | null>(null);
  const [showRemarkDialog, setShowRemarkDialog] = useState(false);
  const [showRemarksView, setShowRemarksView] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showFeeInfoDialog, setShowFeeInfoDialog] = useState(false);
  const [showSiblingsDialog, setShowSiblingsDialog] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const { toast } = useToast();

  // Update local state if the initial student prop changes
  useEffect(() => {
    setStudent(initialStudent);
  }, [initialStudent]);

  // Calculate total pending fee as in UI
  const totalTermFee = feeTerms
    .filter(t => t.class === student.class)
    .reduce((sum, term) => sum + term.amount, 0);
  const totalFee = totalTermFee + (student.transport_fee || 0) - (student.discount_amount || 0);
  const previousYearPending = student.previous_fee_pending || 0;
  const totalPaid = payments.filter(p => p.student_id === student.id).reduce((sum, p) => sum + p.amount_paid, 0);
  const currentYearPending = Math.max(0, totalFee - totalPaid );
  const totalPendingFee = currentYearPending;

  // Sync calculated pending fee to Supabase if changed
  useEffect(() => {
    // Only update if value changed and student has a valid id
    if (student.id && totalPendingFee !== lastSyncedPending && !isNaN(totalPendingFee)) {
      const updateFeePending = async () => {
        const { error } = await supabase
          .from('students')
          .update({ fee_pending: totalPendingFee })
          .eq('id', student.id);
        if (!error) {
          setLastSyncedPending(totalPendingFee);
        } else {
          toast({
            title: "Error",
            description: `Failed to sync fee pending: ${error.message}`,
            variant: "destructive",
          });
        }
      };
      updateFeePending();
    }
  }, [student.id, totalPendingFee, lastSyncedPending]);

  const getTermStatus = (termNo: number) => {
    const term = feeTerms.find(t => t.class === student.class && t.term_no === termNo);
    if (!term) return { termNo, amount: 0, dueDate: '', paidAmount: 0, status: 'pending', hasPayments: false };

    const termPayments = payments.filter(p => p.student_id === student.id && p.term_no === termNo);
    const paidAmount = termPayments.reduce((sum, p) => sum + p.amount_paid, 0);
    const latestPayment = termPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];

    let status: 'paid' | 'overdue' | 'pending' = 'pending';

    if (termPayments.length > 0) {
      if (paidAmount >= term.amount) {
        status = 'paid';
      } else if (isAfter(new Date(), parseISO(term.due_date))) {
        status = 'overdue';
      } else {
        status = 'pending';
      }
    }

    return {
      termNo,
      amount: term.amount,
      dueDate: term.due_date,
      paidAmount,
      paidDate: latestPayment?.payment_date,
      status,
      hasPayments: termPayments.length > 0
    };
  };
 
  const termStatuses = [1, 2, 3].map(getTermStatus);
  // ...existing code...

  const studentRemarks = remarks.filter(r => r.student_id === student.id);
  const pendingRemarks = studentRemarks.filter(r => !r.is_completed);

  const handleUpdateStudentFee = async (updates: Partial<Student>) => {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', student.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: `Failed to update student fee: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } else if (data) {
      setStudent(data);
      toast({
        title: "Success",
        description: "Student fee updated successfully",
      });
      return true;
    }
    return false;
  };

  const handleAddDiscount = async (amount: number) => {
    await handleUpdateStudentFee({ discount_amount: amount });
  };

  const handleUpdateTransportFee = async (amount: number) => {
    await handleUpdateStudentFee({ transport_fee: amount });
  };

  const truncateAddress = (address: string, maxLength: number = 25) => {
    if (!address || address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '…';
  };

  const handleFeeInfoClick = (termNo: number) => {
    setSelectedTerm(termNo);
    setShowFeeInfoDialog(true);
  };

  // Find siblings based on matching phone numbers
  const findSiblings = () => {
    return allStudents.filter(otherStudent => {
      if (otherStudent.id === student.id) return false; // Exclude self
      
      const studentPhones = [student.phone1, student.phone2].filter(Boolean);
      const otherPhones = [otherStudent.phone1, otherStudent.phone2].filter(Boolean);
      
      // Check if any phone number matches
      return studentPhones.some(phone => otherPhones.includes(phone));
    });
  };

  const siblings = findSiblings();

  return (
    <TooltipProvider>
      <TableRow className="h-16 hover:bg-muted/30">
        <TableCell className="p-2 w-12 text-center font-medium">{rowIndex + 1}</TableCell>
        <TableCell className="p-2 w-40">
          <div className="space-y-1">
            <div className="font-medium text-sm">{student.full_name || student.name}</div>
            <div className="text-xs text-muted-foreground">{student.login_id}</div>
          </div>
        </TableCell>
        <TableCell className="p-2 w-20 text-sm font-medium">
          {student.class}
          {student.section && <div className="text-xs text-muted-foreground">{student.section}</div>}
        </TableCell><TableCell className="p-2 w-32 text-sm">
  <div className="font-medium">{student.parent_name || "—"}</div>
  {student.mother_name && <div className="text-xs text-muted-foreground">M: {student.mother_name}</div>}
</TableCell>

        <TableCell className="p-2 text-xs whitespace-nowrap max-w-[120px]">
          <div className="space-y-0.5 text-xs">
            {student.phone1 && <div className="font-medium text-blue-600">{student.phone1}</div>}
            {student.phone2 && <div className="text-muted-foreground">{student.phone2}</div>}
            {!student.phone1 && !student.phone2 && <div className="text-muted-foreground">No contact</div>}
            {student.address && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-muted-foreground truncate cursor-help text-xs mt-1 border-t pt-1 max-w-[100px] overflow-hidden">
                    {truncateAddress(student.address)}
                  </div>
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs">{student.address}</p></TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
        <TableCell className="p-2 w-32">
          <div className="space-y-1">
            {siblings.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSiblingsDialog(true)}
                className="h-6 p-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
              >
                {siblings.length} sibling{siblings.length > 1 ? 's' : ''}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">No siblings</span>
            )}
          </div>
        </TableCell>
        <TableCell className="p-2 w-20 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-1">
            <span>₹{student.transport_fee || 0}</span>
            {/* Assuming an edit mechanism for transport fee exists, it should call handleUpdateTransportFee */}
            {/* For demonstration, adding a placeholder button that you can replace with your actual edit implementation */}
             <Button variant="ghost" size="sm" onClick={() => {
               const newTransportFee = prompt("Enter new transport fee:", student.transport_fee?.toString() || "0");
               if (newTransportFee !== null) {
                 const amount = parseFloat(newTransportFee);
                 if (!isNaN(amount)) {
                   handleUpdateTransportFee(amount);
                 } else {
                   toast({
                     title: "Invalid Input",
                     description: "Please enter a valid number for transport fee.",
                     variant: "destructive",
                   });
                 }
               }
            }} className="h-5 w-5 p-0 text-blue-600" disabled={isEditingDisabled}>
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell className="p-2 w-20 text-center text-sm font-bold text-indigo-600">₹{totalFee}</TableCell>
        <TableCell className="p-2 w-24 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <div className="text-xs font-medium">₹{termStatuses[0].paidAmount}</div>
              <Button variant="ghost" size="sm" onClick={() => handleFeeInfoClick(1)} className="h-4 w-4 p-0">
                <Info className="h-3 w-3 text-blue-600" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {termStatuses[0].paidDate ? new Date(termStatuses[0].paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
            </div>
          </div>
        </TableCell>
        <TableCell className="p-2 w-24 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <div className="text-xs font-medium">₹{termStatuses[1].paidAmount}</div>
              <Button variant="ghost" size="sm" onClick={() => handleFeeInfoClick(2)} className="h-4 w-4 p-0">
                <Info className="h-3 w-3 text-blue-600" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {termStatuses[1].paidDate ? new Date(termStatuses[1].paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
            </div>
          </div>
        </TableCell>
        <TableCell className="p-2 w-24 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <div className="text-xs font-medium">₹{termStatuses[2].paidAmount}</div>
              <Button variant="ghost" size="sm" onClick={() => handleFeeInfoClick(3)} className="h-4 w-4 p-0">
                <Info className="h-3 w-3 text-blue-600" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {termStatuses[2].paidDate ? new Date(termStatuses[2].paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
            </div>
          </div>
        </TableCell>
        <TableCell className="p-2 w-20 text-center">
          <div className="space-y-1">
            <div className="text-sm">₹{student.discount_amount || 0}</div>
            {/* DiscountDialog handles the update and calls handleAddDiscount */}
            <Button variant="ghost" size="sm" onClick={() => setShowDiscountDialog(true)} className="h-5 w-5 p-0 text-blue-600" disabled={isEditingDisabled}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell className="p-2 w-20 text-center text-sm">
          <span className={previousYearPending > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
            ₹{previousYearPending}
          </span>
        </TableCell>
        <TableCell className="p-2 w-20 text-center text-sm">
          <span className={totalPendingFee > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
            ₹{totalPendingFee}
          </span>
        </TableCell>
        <TableCell className="p-2 w-20 text-center text-sm font-medium text-green-600">₹{totalPaid}</TableCell>
        <TableCell className="p-2 w-64">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRemarksView(true)} className="h-7 text-xs flex items-center gap-1">
                <Eye className="h-3 w-3" />
                View Remarks
                {pendingRemarks.length > 0 && <Badge variant="destructive" className="h-4 w-4 p-0 text-xs">{pendingRemarks.length}</Badge>}
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShowRemarkDialog(true)} className="h-7 w-7 p-0" disabled={isEditingDisabled}>
                <MessageSquare className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEditPayment(student.id)} className="h-7 w-7 p-0" disabled={isEditingDisabled}>
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>

      <AddRemarkDialog
        open={showRemarkDialog}
        onOpenChange={setShowRemarkDialog}
        onSubmit={(remarkText, followUpDate) => {
          onAddRemark(student.id, remarkText, followUpDate);
          setShowRemarkDialog(false);
        }}
        studentName={student.full_name || student.name}
      />
      <RemarksDialog
        open={showRemarksView}
        onOpenChange={setShowRemarksView}
        remarks={studentRemarks}
        studentName={student.full_name || student.name}
        onMarkComplete={onMarkRemarkComplete}
        onAddRemark={onAddRemark}
        studentId={student.id}
      />
      <DiscountDialog
        open={showDiscountDialog}
        onOpenChange={setShowDiscountDialog}
        studentName={student.full_name || student.name}
        currentDiscount={student.discount_amount || 0}
        onSubmit={handleAddDiscount}
      />
      <FeeInfoDialog
        open={showFeeInfoDialog}
        onOpenChange={setShowFeeInfoDialog}
        studentId={student.id}
        studentName={student.full_name || student.name}
        termNo={selectedTerm}
        payments={payments}
        remarks={remarks}
      />
      <SiblingsDialog
        open={showSiblingsDialog}
        onOpenChange={setShowSiblingsDialog}
        siblings={siblings}
        studentName={student.full_name || student.name}
      />
    </TooltipProvider>
  );
}
