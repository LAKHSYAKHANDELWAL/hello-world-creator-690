
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, CheckCircle, Phone, User } from 'lucide-react';
import { format } from 'date-fns';

type Student = {
  id: string;
  full_name: string;
  name: string;
  class: string;
  section: string;
  phone1: string;
  phone2: string;
  parent_name: string;
  mother_name: string;
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
  students: Student[];
  remarks: FeeRemark[];
  onMarkComplete: (remarkId: string) => void;
};

export function NotificationBell({ students, remarks, onMarkComplete }: Props) {
  const [open, setOpen] = useState(false);

  // Get all pending remarks sorted by due date (ascending)
  const pendingRemarks = remarks
    .filter(remark => !remark.is_completed && remark.follow_up_date)
    .sort((a, b) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime());

  const getStudentInfo = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const remarkCount = pendingRemarks.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {remarkCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {remarkCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[800px]" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Pending Follow-up Remarks</h3>
            {remarkCount > 0 ? (
              <Badge variant="destructive">{remarkCount} pending</Badge>
            ) : (
              <Badge variant="secondary">No pending remarks</Badge>
            )}
          </div>
          
          {remarkCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pending follow-up remarks</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                <div>Student Name</div>
                <div>Class</div>
                <div>Term</div>
                <div>Due Date</div>
                <div>Remark</div>
                <div>Contact No.</div>
                <div>Action</div>
              </div>
              
              {pendingRemarks.map((remark) => {
                const student = getStudentInfo(remark.student_id);
                return (
                  <div key={remark.id} className="grid grid-cols-7 gap-2 text-sm border rounded-lg p-3 bg-yellow-50">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {student?.full_name || student?.name || 'Unknown Student'}
                      </span>
                    </div>
                    
                    <div className="text-muted-foreground">
                      {student?.class} - {student?.section}
                    </div>
                    
                    <div className="text-muted-foreground">
                      All Terms
                    </div>
                    
                    <div className="font-medium text-red-600">
                      {format(new Date(remark.follow_up_date), 'dd MMM yyyy')}
                    </div>
                    
                    <div className="text-sm bg-yellow-100 p-2 rounded">
                      {remark.remark_text}
                    </div>
                    
                    <div className="space-y-1">
                      {student?.phone1 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3" />
                          {student.phone1}
                        </div>
                      )}
                      {student?.phone2 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {student.phone2}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onMarkComplete(remark.id);
                        }}
                        className="h-7 text-xs flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Done
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
