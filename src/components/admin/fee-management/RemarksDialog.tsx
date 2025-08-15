
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { AddRemarkDialog } from './AddRemarkDialog';

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
  remarks: FeeRemark[];
  studentName: string;
  onMarkComplete: (remarkId: string) => void;
  onAddRemark: (studentId: string, remarkText: string, followUpDate: string) => void;
  studentId: string;
};

export function RemarksDialog({ 
  open, 
  onOpenChange, 
  remarks, 
  studentName, 
  onMarkComplete,
  onAddRemark,
  studentId
}: Props) {
  const [showAddRemark, setShowAddRemark] = useState(false);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Remarks for {studentName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {remarks.length} total remarks
              </div>
              <Button
                onClick={() => setShowAddRemark(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Remark
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3">
                {remarks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No remarks found for this student.
                  </div>
                ) : (
                  remarks
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((remark) => (
                      <div 
                        key={remark.id} 
                        className={`border rounded-lg p-4 space-y-2 ${
                          remark.is_completed ? 'bg-green-50' : 'bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={remark.is_completed ? "secondary" : "destructive"}>
                                {remark.is_completed ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Created: {formatDate(remark.created_at)}
                              </span>
                            </div>
                            
                            <p className="text-sm mb-2">{remark.remark_text}</p>
                            
                            {remark.follow_up_date && (
                              <div className="text-xs text-blue-600">
                                Follow-up: {formatDate(remark.follow_up_date)}
                              </div>
                            )}
                          </div>
                          
                          {!remark.is_completed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onMarkComplete(remark.id)}
                              className="ml-2"
                            >
                              Mark Done
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AddRemarkDialog
        open={showAddRemark}
        onOpenChange={setShowAddRemark}
        onSubmit={(remarkText, followUpDate) => {
          onAddRemark(studentId, remarkText, followUpDate);
          setShowAddRemark(false);
        }}
        studentName={studentName}
      />
    </>
  );
}
