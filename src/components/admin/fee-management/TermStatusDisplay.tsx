
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, parseISO } from 'date-fns';

type TermStatus = {
  termNo: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidDate?: string;
  status: 'paid' | 'overdue' | 'pending';
};

type Props = {
  terms: TermStatus[];
  compact?: boolean;
};

export function TermStatusDisplay({ terms, compact = false }: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white text-xs">✅ Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 text-white text-xs">❌ Overdue</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white text-xs">🕒 Pending</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  const formatAmount = (amount: number) => {
    return amount > 0 ? `₹${amount}` : '-';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(parseISO(dateString), 'dd MMM');
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        {terms.map((term) => (
          <div key={term.termNo} className="text-center min-w-[80px]">
            <div className="text-xs font-medium">T{term.termNo}</div>
            <div className="text-xs">{formatAmount(term.paidAmount)}</div>
            <div className="text-xs text-muted-foreground">{formatDate(term.paidDate)}</div>
            {getStatusBadge(term.status)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {terms.map((term) => (
        <div key={term.termNo} className="border rounded-lg p-3 space-y-2">
          <div className="font-medium text-sm">Term {term.termNo}</div>
          <div className="text-sm">
            <div>Due: ₹{term.amount}</div>
            <div>Paid: {formatAmount(term.paidAmount)}</div>
            <div className="text-muted-foreground">
              {term.paidDate ? `Paid: ${formatDate(term.paidDate)}` : `Due: ${formatDate(term.dueDate)}`}
            </div>
          </div>
          {getStatusBadge(term.status)}
        </div>
      ))}
    </div>
  );
}
