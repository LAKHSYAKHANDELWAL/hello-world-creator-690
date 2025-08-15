import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Student } from '@/utils/feeUtils';
import jsPDF from 'jspdf';  // Ensure installed: npm install jspdf

type PrintReceiptDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  paymentData: {
    amount_paid: number;
    payment_date: string;
    payment_mode: string;
    term_no: number;
    submitted_by: string;
    receipt_no?: string;
  };
  previousPending: number;
  totalFee: number;
};

export function PrintReceiptDialog({
  isOpen,
  onClose,
  student,
  paymentData,
  previousPending = 0,
  totalFee = 0,
}: PrintReceiptDialogProps) {
  const balanceAfterPayment = (totalFee + previousPending) - paymentData.amount_paid;

  // Basic number to words (extend for full range as needed)
  const numberToWords = (num: number): string => {
    const belowTwenty = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['Thousand', 'Million', 'Billion'];

    if (num === 0) return 'Zero';
    let word = '';
    let i = 0;
    while (num > 0) {
      if (num % 1000 !== 0) {
        word = helper(num % 1000) + thousands[i] + ' ' + word;
      }
      num = Math.floor(num / 1000);
      i++;
    }
    return word.trim() + ' Rupees only';

    function helper(n: number): string {
      if (n === 0) return '';
      else if (n < 20) return belowTwenty[n] + ' ';
      else if (n < 100) return tens[Math.floor(n / 10)] + ' ' + helper(n % 10);
      else return belowTwenty[Math.floor(n / 100)] + ' Hundred ' + helper(n % 100);
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Function to draw one receipt copy with borders
    const drawReceipt = (yOffset: number, copyLabel: string) => {
      // Outer border
      doc.setLineWidth(0.5);
      doc.rect(10, yOffset, 190, 130);  // Full receipt border

      // Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Sun Valley International School', 105, yOffset + 10, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('A-1, Sector-1, Vaishali, Ghaziabad, U.P- 201010', 105, yOffset + 15, { align: 'center' });
      doc.text('Tel. No: 0120-4151530, Email: Accounts@sunvalleyncr.in', 105, yOffset + 20, { align: 'center' });
      doc.text('www.sunvalleyncr.in', 105, yOffset + 25, { align: 'center' });
      doc.text('Affiliated to CBSE. Affiliation No. 2130652', 105, yOffset + 30, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(copyLabel, 105, yOffset + 35, { align: 'center' });
      doc.text('FEE RECEIPT:- 2025-2026', 105, yOffset + 40, { align: 'center' });  // Update year as needed

      // Details (two columns)
      doc.setFontSize(9);
      doc.text(`Receipt No. : ${paymentData.receipt_no || 'N/A'}`, 15, yOffset + 50);
      doc.text(`Date : ${format(new Date(paymentData.payment_date), 'dd-MMM-yyyy')}`, 120, yOffset + 50);
      doc.text(`Name of the Student : ${student.full_name || student.name}`, 15, yOffset + 55);
      doc.text(`Class & Section : ${student.class} - ${student.section || 'N/A'}`, 120, yOffset + 55);
      doc.text(`Father Name : ${student.parent_name || 'N/A'}`, 15, yOffset + 60);
      doc.text(`Mother Name : ${student.mother_name || 'N/A'}`, 120, yOffset + 60);
      doc.text(`Father's Mobile No. : ${student.phone1 || 'N/A'}`, 15, yOffset + 65);
      doc.text(`Mother's Mobile No. : ${student.phone2 || 'N/A'}`, 120, yOffset + 65);
      doc.text(`Enrollment No. : ${student.login_id || 'N/A'}`, 15, yOffset + 70);
      doc.text(`Mode of Payment : ${paymentData.payment_mode}`, 120, yOffset + 70);
      doc.text(`Address : ${student.address || 'N/A'}`, 15, yOffset + 75);
      doc.text(`Period : Term ${paymentData.term_no}`, 120, yOffset + 75);

      // Table headers with borders

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const tableStartY = yOffset + 85;
      // Table header row
      doc.rect(15, tableStartY, 180, 5);  // Header row border
      doc.text('S No.', 17, tableStartY + 3.5);
      doc.text('Particulars', 40, tableStartY + 3.5);
      doc.text('Installment Name', 90, tableStartY + 3.5);
      doc.text('Fee Paid', 150, tableStartY + 3.5);

      // Table data row
      const dataY = tableStartY + 5;
      doc.rect(15, dataY, 180, 5);  // Data row border
      doc.setFont('helvetica', 'normal');
      doc.text('1', 17, dataY + 3.5);
      doc.text('Tuition Fees', 40, dataY + 3.5);
      doc.text(`Term ${paymentData.term_no}`, 90, dataY + 3.5);
      // Use 'Rs.' instead of '₹' for better compatibility
      doc.text(`Rs. ${paymentData.amount_paid.toFixed(2)}`, 150, dataY + 3.5);

      // Amount in words and note
      doc.setFontSize(8);
      doc.text(`Total Paid Amount: Rupees ${numberToWords(paymentData.amount_paid)}`, 15, dataY + 10);
      doc.text('Payments are subject to realization.', 15, dataY + 15);
      // Add signature line for manual signing
      doc.setFontSize(10);
      doc.text('Signature & Stamp of Centre Head:', 130, dataY + 25);
      doc.line(170, dataY + 25, 200, dataY + 25); // Signature line
    };

    // Draw two copies
    drawReceipt(10, 'Parent Copy');  // Upper half
    doc.setLineDashPattern([1, 1], 0);  // Dashed separator
    doc.line(10, 140, 200, 140);
    doc.setLineDashPattern([], 0);  // Reset to solid
    drawReceipt(145, 'Office Copy');  // Lower half

    // Open PDF in new tab for printing
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Receipt</DialogTitle>
        </DialogHeader>
        <Button onClick={handlePrint} disabled={!student || !paymentData}>
          <Printer className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </DialogContent>
    </Dialog>
  );
}
