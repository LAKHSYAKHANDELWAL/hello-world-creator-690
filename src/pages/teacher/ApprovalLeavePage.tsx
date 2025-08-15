
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LeaveRequest {
  id: string;
  student_id: string;
  date: string;
  reason: string;
  status: string;
  created_at: string;
  students: {
    full_name: string;
    name: string;
    class: string;
    section: string;
    parent_name: string;
    phone1: string;
  };
}

const ApprovalLeavePage = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leaves')
      .select(`
        *,
        students (
          full_name,
          name,
          class,
          section,
          parent_name,
          phone1
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive",
      });
    } else {
      setLeaveRequests(data || []);
    }
    
    setLoading(false);
  };

  const handleApprovalAction = async (leaveId: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('leaves')
      .update({ 
        status: action,
        approved_by: 'teacher' // Replace with actual teacher ID when auth is implemented
      })
      .eq('id', leaveId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} leave request`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Leave request ${action} successfully`,
      });
      fetchLeaveRequests(); // Refresh the list
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingRequests = leaveRequests.filter(req => req.status === 'pending');
  const processedRequests = leaveRequests.filter(req => req.status !== 'pending');

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/teacher">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Approve Leave Requests</h1>
            <p className="text-muted-foreground">Review and approve student leave applications</p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <p>Loading leave requests...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pending Requests */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Pending Requests ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No pending leave requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {request.students?.full_name || request.students?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Class: {request.students?.class}-{request.students?.section} | 
                              Parent: {request.students?.parent_name}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium">Leave Date:</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.date), 'PPP')}
                          </p>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium">Reason:</p>
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprovalAction(request.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApprovalAction(request.id, 'rejected')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {processedRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 opacity-75">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">
                              {request.students?.full_name || request.students?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Class: {request.students?.class}-{request.students?.section}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-sm">
                            <span className="font-medium">Date:</span> {format(new Date(request.date), 'PPP')}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Reason:</span> {request.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalLeavePage;
