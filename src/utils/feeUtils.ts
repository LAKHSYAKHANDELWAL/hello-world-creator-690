import { supabase } from "@/integrations/supabase/client";

export type Student = {
  id: string;
  full_name: string;
  name: string;
  class: string;
  section: string;
  login_id: string;
  parent_name: string;
  mother_name: string;
  phone: string;
  phone1: string;
  phone2: string;
  address: string;
  fee_paid: number;
  fee_pending: number;
  discount_amount: number;
  sr_no: number;
  dob: string;
  previous_fee_pending: number;
  transport_fee: number;
};

export type FeeTerm = {
  id: string;
  class: string;
  term_no: number;
  due_date: string;
  amount: number;
};

export type FeeStructure = {
  id: string;
  class: string;
  fee_type: string;
  amount: number;
  installments: number;
  description: string;
  term_no: number;
};

export type FeePayment = {
  id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  payment_mode: string;
  term_no: number;
  submitted_by: string;
  receipt_no?: string;
};

export type FeeRemark = {
  id: string;
  student_id: string;
  remark_text: string;
  follow_up_date: string;
  created_at: string;
  is_completed: boolean;
};

export const classes = Array.from({length: 12}, (_, i) => `Class ${i + 1}`);
export const sections = ['A', 'B', 'C', 'D'];
export const feeTypes = ['Tuition Fee', 'Admission Fee', 'Exam Fee', 'Library Fee', 'Lab Fee', 'Sports Fee', 'Other'];
export const paymentModes = ['Cash', 'Online', 'Cheque', 'Bank Transfer', 'UPI'];
export const submittedByOptions = ['Father', 'Mother', 'Guardian', 'Student', 'Other'];

// Utility functions for data fetching
export const fetchStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('class', { ascending: true });
  
  return { data, error };
};

export const fetchFeeTerms = async () => {
  const { data, error } = await supabase
    .from('fee_terms')
    .select('*')
    .order('class', { ascending: true })
    .order('term_no', { ascending: true });
  
  return { data, error };
};

export const fetchFeeStructures = async () => {
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*')
    .order('class', { ascending: true });
  
  return { data, error };
};

export const fetchFeePayments = async () => {
  const { data, error } = await supabase
    .from('fee_payments')
    .select('*')
    .order('payment_date', { ascending: false });
  
  return { data, error };
};

export const fetchFeeRemarks = async () => {
  const { data, error } = await supabase
    .from('fee_remarks')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
};

// Calculate pending fee correctly
export const calculatePendingFee = (
  student: Student,
  feeTerms: FeeTerm[],
  payments: FeePayment[]
) => {
  const classTerms = feeTerms.filter(term => term.class === student.class);
  const totalTermAmount = classTerms.reduce((sum, term) => sum + term.amount, 0);
  const studentPayments = payments.filter(payment => payment.student_id === student.id);
  const totalPaid = studentPayments.reduce((sum, payment) => sum + payment.amount_paid, 0);
  
  const totalFee = totalTermAmount + (student.previous_fee_pending || 0) + (student.transport_fee || 0);
  const pendingFee = totalFee - (student.discount_amount || 0) - totalPaid;
  
  return Math.max(0, pendingFee);
};