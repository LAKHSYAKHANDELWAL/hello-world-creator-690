import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Student } from '@/utils/feeUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siblings: Student[];
  studentName: string;
};

export function SiblingsDialog({ open, onOpenChange, siblings, studentName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Siblings of {studentName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Students with matching parent phone numbers (Total: {siblings.length})
          </p>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Student Name</TableHead>
                  <TableHead className="text-xs">Class & Section</TableHead>
                  <TableHead className="text-xs">Roll No</TableHead>
                  <TableHead className="text-xs">Parent Contact</TableHead>
                  <TableHead className="text-xs">Fee Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siblings.map((sibling) => (
                  <TableRow key={sibling.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-sm">
                      {sibling.full_name || sibling.name}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <span className="font-medium">{sibling.class}</span>
                        {sibling.section && <span className="text-muted-foreground ml-1">({sibling.section})</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {sibling.login_id}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-1">
                        {sibling.phone1 && <div>{sibling.phone1}</div>}
                        {sibling.phone2 && <div className="text-muted-foreground">{sibling.phone2}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <Badge 
                          variant={sibling.fee_pending > 0 ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {sibling.fee_pending > 0 ? `₹${sibling.fee_pending} Pending` : 'Paid'}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}