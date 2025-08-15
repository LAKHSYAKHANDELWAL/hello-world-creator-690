
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Clock } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';

type FeeRemark = {
  id: string;
  student_id: string;
  remark_text: string;
  follow_up_date: string;
  created_at: string;
  is_completed: boolean;
};

type Props = {
  remarks: FeeRemark[];
  onMarkComplete: (remarkId: string) => void;
};

export function RemarksColumn({ remarks, onMarkComplete }: Props) {
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd MMM');
  };

  const isFollowUpToday = (followUpDate: string) => {
    if (!followUpDate) return false;
    return isSameDay(parseISO(followUpDate), new Date());
  };

  const pendingRemarks = remarks.filter(r => !r.is_completed);
  const completedRemarks = remarks.filter(r => r.is_completed);

  if (remarks.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No remarks
      </div>
    );
  }

  return (
    <div className="space-y-1 max-w-48">
      {/* Pending Remarks */}
      {pendingRemarks.slice(0, 2).map((remark) => (
        <div key={remark.id} className="flex items-start gap-1 p-1 bg-yellow-50 rounded text-xs border">
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground font-medium">
                [{formatDate(remark.created_at)}]
              </span>
              {isFollowUpToday(remark.follow_up_date) && (
                <span className="text-red-600 font-bold">🔔</span>
              )}
            </div>
            <div className="text-xs mt-0.5 line-clamp-2">{remark.remark_text}</div>
            {remark.follow_up_date && (
              <div className={`text-xs mt-0.5 ${isFollowUpToday(remark.follow_up_date) ? 'text-red-600 font-medium' : 'text-blue-600'}`}>
                Follow: {formatDate(remark.follow_up_date)}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkComplete(remark.id)}
            className="h-4 w-4 p-0"
            title="Mark as done"
          >
            <Clock className="h-3 w-3 text-orange-600" />
          </Button>
        </div>
      ))}

      {/* Completed Remarks (last 1) */}
      {completedRemarks.slice(0, 1).map((remark) => (
        <div key={remark.id} className="flex items-start gap-1 p-1 bg-green-50 rounded text-xs border">
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground font-medium">
                [{formatDate(remark.created_at)}]
              </span>
              <Check className="h-3 w-3 text-green-600" />
            </div>
            <div className="text-xs mt-0.5 line-clamp-2 text-muted-foreground">{remark.remark_text}</div>
          </div>
        </div>
      ))}

      {/* Show count if more remarks exist */}
      {remarks.length > 3 && (
        <div className="text-xs text-muted-foreground text-center">
          +{remarks.length - 3} more...
        </div>
      )}
    </div>
  );
}
