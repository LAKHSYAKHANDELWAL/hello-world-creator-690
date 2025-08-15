import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { format } from 'date-fns';

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  termNo: number;
  payments: FeePayment[];
  remarks: FeeRemark[];
};

export function FeeInfoDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  termNo,
  payments,
  remarks,
}: Props) {
  const termPayments = payments.filter(p => p.student_id === studentId && p.term_no === termNo);
  const termRemarks = remarks.filter(r => r.student_id === studentId && !r.is_completed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Term {termNo} Details - {studentName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Payment Information */}
          <div>
            <h3 className="font-medium text-lg mb-3">Payment History</h3>
            {termPayments.length > 0 ? (
              <div className="space-y-2">
                {termPayments.map((payment) => (
                  <div key={payment.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Amount Paid:</span> ₹{payment.amount_paid}
                      </div>
                      <div>
                        <span className="font-medium">Payment Date:</span> {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                      </div>
                      <div>
                        <span className="font-medium">Paid By:</span> {payment.submitted_by || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Payment Method:</span> {payment.payment_mode}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No payments recorded for this term.</p>
            )}
          </div>

          {/* Remarks Information */}
          {termRemarks.length > 0 && (
            <div>
              <h3 className="font-medium text-lg mb-3">Active Remarks</h3>
              <div className="space-y-2">
                {termRemarks.map((remark) => (
                  <div key={remark.id} className="p-3 border rounded-lg bg-yellow-50">
                    <div className="text-sm">
                      <div className="font-medium mb-1">{remark.remark_text}</div>
                      <div className="text-muted-foreground">
                        Created: {format(new Date(remark.created_at), 'dd MMM yyyy')}
                        {remark.follow_up_date && (
                          <span className="ml-2">
                            | Follow-up: {format(new Date(remark.follow_up_date), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
