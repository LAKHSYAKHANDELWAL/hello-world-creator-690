import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EnhancedSmartSearch } from './EnhancedSmartSearch';
import { StudentFeeTableRow } from './StudentFeeTableRow';
import { Student, FeeTerm, FeePayment, FeeRemark, classes, sections } from '@/utils/feeUtils';

type Props = {
  students: Student[];
  filteredStudents: Student[];
  feeTerms: FeeTerm[];
  feePayments: FeePayment[];
  feeRemarks: FeeRemark[];
  classFilter: string;
  sectionFilter: string;
  smartSearch: string;
  currentPage: number;
  rowsPerPage: number;
  totalPages: number;
  paginatedStudents: Student[];
  startIndex: number;
  isEditingPayment: boolean;
  isEditingStructure: boolean;
  onClassFilterChange: (value: string) => void;
  onSectionFilterChange: (value: string) => void;
  onSmartSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: string) => void;
  onEditPayment: (studentId: string) => void;
  onAddRemark: (studentId: string, remarkText: string, followUpDate: string) => void;
  onMarkRemarkComplete: (remarkId: string) => void;
};

export function ViewFeeStructureSection({
  students,
  filteredStudents,
  feeTerms,
  feePayments,
  feeRemarks,
  classFilter,
  sectionFilter,
  smartSearch,
  currentPage,
  rowsPerPage,
  totalPages,
  paginatedStudents,
  startIndex,
  isEditingPayment,
  isEditingStructure,
  onClassFilterChange,
  onSectionFilterChange,
  onSmartSearchChange,
  onClearFilters,
  onPageChange,
  onRowsPerPageChange,
  onEditPayment,
  onAddRemark,
  onMarkRemarkComplete,
}: Props) {
  return (
    <div className="w-full px-4 py-6 overflow-x-auto">
      <div className="pb-4">
        <div className="text-lg font-semibold mb-3">Student Fee Management</div>
        <div className="space-y-3">
          <EnhancedSmartSearch 
            value={smartSearch}
            onChange={onSmartSearchChange}
          />
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={classFilter} onValueChange={onClassFilterChange}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={onSectionFilterChange}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearFilters}
              className="h-8"
            >
              Clear Filters
            </Button>
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredStudents.length)}-{Math.min(currentPage * rowsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            <div className="ml-auto">
              <Select value={rowsPerPage.toString()} onValueChange={onRowsPerPageChange}>
                <SelectTrigger className="w-20 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <Table className="min-w-full table-auto">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12 text-center text-xs p-2">Sr No</TableHead>
              <TableHead className="w-40 text-xs p-2">Roll No & Student Name</TableHead>
              <TableHead className="w-20 text-xs p-2">Class</TableHead>
              <TableHead className="w-32 text-xs p-2">Parent</TableHead>
              <TableHead className="text-xs p-2 whitespace-nowrap">Contact</TableHead>
              <TableHead className="w-32 text-xs p-2">Siblings</TableHead>
              <TableHead className="w-24 text-center text-xs p-2">Transport Fee (₹)</TableHead>
              <TableHead className="w-24 text-center text-xs p-2">Total Fee (₹)</TableHead>
              <TableHead className="w-24 text-center text-xs p-2">Term 1</TableHead>
              <TableHead className="w-24 text-center text-xs p-2">Term 2</TableHead>
              <TableHead className="w-24 text-center text-xs p-2">Term 3</TableHead>
              <TableHead className="w-20 text-center text-xs p-2">Discount</TableHead>
              <TableHead className="w-20 text-center text-xs p-2">Previous Year Fee Pending</TableHead>
              <TableHead className="w-20 text-center text-xs p-2">Pending</TableHead>
              <TableHead className="w-20 text-center text-xs p-2">Total</TableHead>
              <TableHead className="w-64 text-xs p-2">Remarks/Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map((student, index) => (
              <StudentFeeTableRow
                key={student.id}
                student={student}
                rowIndex={startIndex + index}
                feeTerms={feeTerms}
                payments={feePayments}
                remarks={feeRemarks}
                onEditPayment={onEditPayment}
                onAddRemark={onAddRemark}
                onMarkRemarkComplete={onMarkRemarkComplete}
                isEditingDisabled={isEditingPayment || isEditingStructure}
                allStudents={students}
              />
            ))}
          </TableBody>
        </Table>
        {paginatedStudents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {smartSearch || classFilter !== 'all' || sectionFilter !== 'all' 
              ? "No students found matching the current filters."
              : "No students found."
            }
          </div>
        )}
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center py-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={pageNum === currentPage}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}