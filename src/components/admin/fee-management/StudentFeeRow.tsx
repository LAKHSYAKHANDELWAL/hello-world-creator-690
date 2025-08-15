
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, MessageSquare, FolderOpen, Check, Clock } from 'lucide-react';
import { AddRemarkDialog } from './AddRemarkDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Student = {
  id: string;
  full_name: string;
  name: string;
  class: string;
  section: string;
  login_id: string;
  parent_name: string;
  mother_name: string;
  phone: string;
  mobile_2: string;
  email: string;
  address: string;
  fee_paid: number;
  fee_pending: number;
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
  remarks: FeeRemark[];
  onEditPayment: (studentId: string) => void;
  onDeletePayment: (studentId: string) => void;
  onAddRemark: (studentId: string, remarkText: string, followUpDate: string) => void;
  onMarkRemarkComplete: (remarkId: string) => void;
  isEditingDisabled: boolean;
};

export function StudentFeeRow({ 
  student, 
  remarks, 
  onEditPayment, 
  onDeletePayment, 
  onAddRemark,
  onMarkRemarkComplete,
  isEditingDisabled 
}: Props) {
  const [showRemarkDialog, setShowRemarkDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInstallments, setShowInstallments] = useState(false);

  const getStatusIcon = (feePaid: number, feePending: number) => {
    if (feePending === 0 && feePaid > 0) {
      return <span className="text-green-600 text-lg">✅</span>;
    } else if (feePaid > 0 && feePending > 0) {
      return <span className="text-yellow-600 text-lg">⚠️</span>;
    } else {
      return <span className="text-red-600 text-lg">❌</span>;
    }
  };

  const getRowColorClass = (feePaid: number, feePending: number) => {
    if (feePending === 0 && feePaid > 0) {
      return "bg-green-50/50";
    } else if (feePaid > 0 && feePending > 0) {
      return "bg-yellow-50/50";
    } else {
      return "bg-red-50/50";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const mockInstallments = [
    { term: 'Term 1', installments: [
      { no: 1, amount: 1000, date: '2024-01-12', paid: true },
      { no: 2, amount: 2000, date: '2024-02-15', paid: false }
    ]},
    { term: 'Term 2', installments: [
      { no: 1, amount: 1500, date: '2024-04-10', paid: false }
    ]},
    { term: 'Term 3', installments: [
      { no: 1, amount: 2000, date: '2024-07-05', paid: false }
    ]}
  ];

  return (
    <TooltipProvider>
      <TableRow className={`${getRowColorClass(student.fee_paid || 0, student.fee_pending || 0)} h-12 border-b border-gray-200/50`}>
        {/* Student Info */}
        <TableCell className="p-2 w-48">
          <div className="space-y-0.5">
            <div className="font-medium text-sm truncate">{student.full_name || student.name}</div>
            <div className="text-xs text-muted-foreground">{student.login_id}</div>
          </div>
        </TableCell>

        {/* Class/Section */}
        <TableCell className="p-2 w-20 text-sm">
          {student.class}
          <div className="text-xs text-muted-foreground">{student.section || 'N/A'}</div>
        </TableCell>

        {/* Parents */}
        <TableCell className="p-2 w-40">
          <div className="space-y-0.5 text-xs">
            <div><span className="font-medium">F:</span> {student.parent_name || 'N/A'}</div>
            <div><span className="font-medium">M:</span> {student.mother_name || 'N/A'}</div>
          </div>
        </TableCell>

        {/* Contact */}
        <TableCell className="p-2 w-32">
          <div className="space-y-0.5 text-xs">
            <div>{student.phone || 'N/A'}</div>
            {student.mobile_2 && <div className="text-muted-foreground">{student.mobile_2}</div>}
          </div>
        </TableCell>

        {/* Email/Address */}
        <TableCell className="p-2 w-48">
          <div className="space-y-0.5 text-xs">
            <div className="truncate">{student.email || 'N/A'}</div>
            <Tooltip>
              <TooltipTrigger>
                <div className="truncate text-muted-foreground cursor-help">
                  {student.address || 'N/A'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{student.address || 'No address'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>

        {/* Fee Status with Installments */}
        <TableCell className="p-2 w-40">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {getStatusIcon(student.fee_paid || 0, student.fee_pending || 0)}
              <span className="text-xs">₹{student.fee_paid || 0} / ₹{(student.fee_paid || 0) + (student.fee_pending || 0)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstallments(!showInstallments)}
              className="h-6 px-2 text-xs flex items-center gap-1"
            >
              <FolderOpen className="h-3 w-3" />
              Terms
            </Button>
          </div>
        </TableCell>

        {/* Remarks - Always Visible */}
        <TableCell className="p-2 w-64">
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {remarks.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">No remarks</div>
            ) : (
              remarks.slice(0, 3).map((remark) => (
                <div key={remark.id} className="flex items-start gap-1 p-1 bg-gray-50 rounded text-xs">
                  <div className="flex-1">
                    <div className="font-medium text-xs text-muted-foreground">
                      [{formatDate(remark.created_at)}]
                    </div>
                    <div className="text-xs line-clamp-2">{remark.remark_text}</div>
                    {remark.follow_up_date && (
                      <div className="text-xs text-blue-600">
                        Follow: {formatDate(remark.follow_up_date)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {remark.is_completed ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkRemarkComplete(remark.id)}
                        className="h-4 w-4 p-0"
                      >
                        <Clock className="h-3 w-3 text-orange-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            {remarks.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{remarks.length - 3} more...
              </div>
            )}
          </div>
        </TableCell>

        {/* Actions */}
        <TableCell className="p-2 w-32">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRemarkDialog(true)}
              className="h-7 w-7 p-0"
              disabled={isEditingDisabled}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditPayment(student.id)}
              className="h-7 w-7 p-0"
              disabled={isEditingDisabled}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
              disabled={isEditingDisabled}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Installment Details Row */}
      {showInstallments && (
        <TableRow>
          <TableCell colSpan={8} className="p-2 bg-muted/20">
            <div className="grid grid-cols-3 gap-4 text-xs">
              {mockInstallments.map((term) => (
                <div key={term.term} className="space-y-1">
                  <div className="font-medium">{term.term}: ₹{term.installments.reduce((sum, inst) => sum + inst.amount, 0)}</div>
                  {term.installments.map((inst) => (
                    <div key={inst.no} className={`pl-2 ${inst.paid ? 'text-green-600' : 'text-red-600'}`}>
                      • Inst {inst.no}: ₹{inst.amount} ({formatDate(inst.date)}) {inst.paid ? '✅' : '❌'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}

      <AddRemarkDialog
        open={showRemarkDialog}
        onOpenChange={setShowRemarkDialog}
        onSubmit={(remarkText, followUpDate) => {
          onAddRemark(student.id, remarkText, followUpDate);
          setShowRemarkDialog(false);
        }}
        studentName={student.full_name || student.name}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Payment Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the fee payment record for {student.full_name || student.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDeletePayment(student.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
