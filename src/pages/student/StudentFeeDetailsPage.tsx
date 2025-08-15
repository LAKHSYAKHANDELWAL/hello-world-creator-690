
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Banknote, CreditCard, Calendar, Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface FeeStructure {
  id: string;
  class: string;
  fee_type: string;
  amount: number;
  description: string;
  installments: number;
  term_no: number;
}

interface FeePayment {
  id: string;
  amount_paid: number;
  payment_date: string;
  installment_no: number;
  amount_pending: number;
  payment_mode: string;
  term_no: number;
  submitted_by: string;
}

const StudentFeeDetailsPage = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<{ id: string; className: string; section: string; transport_fee: number }>({ 
    id: '', 
    className: '', 
    section: '',
    transport_fee: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("student-profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStudent({
          id: parsed.id || "",
          className: parsed.className || "",
          section: parsed.section || "",
          transport_fee: parsed.transport_fee || 0,
        });
      } catch {
        setStudent({ id: "", className: "", section: "", transport_fee: 0 });
      }
    }
  }, []);

  useEffect(() => {
    if (student.className && student.id) {
      fetchFeeData();
    }
  }, [student.className, student.id]);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('transport_fee')
        .eq('id', student.id)
        .single();

      if (studentError) throw studentError;
      
      setStudent(prev => ({ ...prev, transport_fee: studentData?.transport_fee || 0 }));
      
      const { data: structures, error: structureError } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('class', student.className);

      if (structureError) throw structureError;

      const { data: payments, error: paymentError } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('student_id', student.id)
        .order('payment_date', { ascending: false });

      if (paymentError) throw paymentError;

      setFeeStructures(structures || []);
      setFeePayments(payments || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch fee details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getTotalPaid = () => {
    return feePayments.reduce((sum, payment) => sum + payment.amount_paid, 0);
  };

  const getTotalDue = () => {
    const structureTotal = feeStructures.reduce((sum, structure) => sum + structure.amount, 0);
    return structureTotal + (student.transport_fee || 0);
  };

  const getPendingAmount = () => {
    return getTotalDue() - getTotalPaid();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Banknote className="h-8 w-8" />
            Fee Details
          </h1>
          <p className="text-muted-foreground mt-2">
            {student.className} {student.section && `- ${student.section}`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Loading fee details...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Fee Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(getTotalDue())}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(getTotalPaid())}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(getPendingAmount())}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Structure */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Structure</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                    {feeStructures.map((structure) => (
                      <div key={structure.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{structure.fee_type}</h3>
                          <p className="text-sm text-muted-foreground">{structure.description}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm">Term: {structure.term_no}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(structure.amount)}</div>
                          {structure.installments > 1 && (
                            <div className="text-sm text-muted-foreground">
                              {structure.installments} installments
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {student.transport_fee > 0 && (
                      <div className="flex justify-between items-center p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                           <Bus className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">Transport Fee</h3>
                            <p className="text-sm text-muted-foreground">Annual transport charges</p>
                          </div>
                        </div>
                        <div className="text-lg font-bold">{formatCurrency(student.transport_fee)}</div>
                      </div>
                    )}
                     {feeStructures.length === 0 && student.transport_fee === 0 && (
                       <p className="text-muted-foreground">No fee structure found for your class.</p>
                     )}
                  </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {feePayments.length === 0 ? (
                  <p className="text-muted-foreground">No payment records found.</p>
                ) : (
                  <div className="space-y-4">
                    {feePayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-semibold">{formatCurrency(payment.amount_paid)}</div>
                            <div className="text-sm text-muted-foreground">
                              Term {payment.term_no} • Submitted by {payment.submitted_by}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{payment.payment_mode}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatDate(payment.payment_date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeeDetailsPage;
