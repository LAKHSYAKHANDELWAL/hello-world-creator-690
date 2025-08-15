
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

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
  compact?: boolean;
};

export function RemarksDisplay({ remarks, onMarkComplete, compact = false }: Props) {
  const isFollowUpToday = (followUpDate: string) => {
    if (!followUpDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return followUpDate === today;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), compact ? 'dd MMM' : 'MMM dd, yyyy');
  };

  if (compact) {
    return (
      <div className="space-y-1">
        {remarks.map((remark) => (
          <div key={remark.id} className="flex items-start gap-1 p-1 bg-gray-50/50 rounded text-xs">
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground font-medium">
                  [{formatDate(remark.created_at)}]
                </span>
                {remark.is_completed ? (
                  <Badge variant="secondary" className="text-xs px-1 py-0">Done</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs px-1 py-0">Pending</Badge>
                )}
              </div>
              <div className="text-xs mt-0.5 line-clamp-2">{remark.remark_text}</div>
              {remark.follow_up_date && (
                <div className={`text-xs mt-0.5 ${isFollowUpToday(remark.follow_up_date) ? 'text-red-600 font-medium' : 'text-blue-600'}`}>
                  Follow: {formatDate(remark.follow_up_date)}
                  {isFollowUpToday(remark.follow_up_date) && <span className="ml-1">🔔</span>}
                </div>
              )}
            </div>
            {!remark.is_completed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkComplete(remark.id)}
                className="h-5 w-5 p-0"
                title="Mark as done"
              >
                <CheckCircle className="h-3 w-3 text-green-600" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Active Remarks:</h4>
      {remarks.map((remark) => (
        <div key={remark.id} className="border rounded-lg p-3 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <p className="text-sm">{remark.remark_text}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Added: {formatDate(remark.created_at)}</span>
                {remark.follow_up_date && (
                  <>
                    <span>•</span>
                    <span className={isFollowUpToday(remark.follow_up_date) ? 'text-red-600 font-medium' : ''}>
                      Follow-up: {formatDate(remark.follow_up_date)}
                    </span>
                    {isFollowUpToday(remark.follow_up_date) && (
                      <Badge variant="destructive" className="text-xs">Due Today</Badge>
                    )}
                  </>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkComplete(remark.id)}
              className="flex items-center gap-1 text-xs"
            >
              <CheckCircle className="h-3 w-3" />
              Mark Done
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
