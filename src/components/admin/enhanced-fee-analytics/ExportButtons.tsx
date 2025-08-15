import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  totalFee: number;
  amountPaid: number;
  pendingAmount: number;
  status: string;
}

interface ExportButtonsProps {
  students: Student[];
  timeFilter: string;
  selectedClass: string;
  selectedSection: string;
}

export function ExportButtons({ students, timeFilter, selectedClass, selectedSection }: ExportButtonsProps) {
  const exportToCSV = () => {
    const headers = ['Student Name', 'Class', 'Section', 'Total Fee', 'Amount Paid', 'Pending Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...students.map(student => [
        `"${student.name}"`,
        student.class,
        student.section,
        student.totalFee,
        student.amountPaid,
        student.pendingAmount,
        student.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fee-analytics-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const totalCollected = students.reduce((sum, s) => sum + s.amountPaid, 0);
    const totalPending = students.reduce((sum, s) => sum + s.pendingAmount, 0);
    
    const content = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">Fee Analytics Report</h1>
          <p style="color: #666; margin: 0;">Generated on ${new Date().toLocaleDateString()}</p>
          ${selectedClass && selectedSection ? `<p style="color: #666; margin: 5px 0;">Class: ${selectedClass} ${selectedSection}</p>` : ''}
          <p style="color: #666; margin: 5px 0;">Period: ${timeFilter}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px;">Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0; color: #28a745;">Total Collected</h3>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">₹${totalCollected.toLocaleString()}</p>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0; color: #dc3545;">Total Pending</h3>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">₹${totalPending.toLocaleString()}</p>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0; color: #007bff;">Total Students</h3>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${students.length}</p>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0; color: #17a2b8;">Collection Rate</h3>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${totalCollected + totalPending > 0 ? ((totalCollected / (totalCollected + totalPending)) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>
        </div>
        
        <div>
          <h2 style="color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px;">Student Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Student Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Class</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Section</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total Fee</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Paid</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Pending</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${student.name}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${student.class}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${student.section}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${student.totalFee.toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${student.amountPaid.toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${student.pendingAmount.toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; 
                      background: ${student.status === 'Paid' ? '#d4edda' : student.status === 'Partially Paid' ? '#fff3cd' : '#f8d7da'};
                      color: ${student.status === 'Paid' ? '#155724' : student.status === 'Partially Paid' ? '#856404' : '#721c24'};">
                      ${student.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `fee-analytics-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().from(content).set(opt).save();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button 
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            onClick={exportToPDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}