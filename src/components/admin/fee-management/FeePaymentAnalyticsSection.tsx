import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';
import { FeeStructure, classes, feeTypes } from '@/utils/feeUtils';

type StructureFormData = {
  class: string;
  fee_type: string;
  term_no: number;
  description: string;
  amount: string;
};

type Props = {
  feeStructures: FeeStructure[];
  structureFormData: StructureFormData;
  isEditingStructure: boolean;
  onFormDataChange: (data: StructureFormData) => void;
  onStructureSubmit: (e: React.FormEvent) => void;
  onResetForm: () => void;
  onEditStructure: (structure: FeeStructure) => void;
};

export function FeePaymentAnalyticsSection({
  feeStructures,
  structureFormData,
  isEditingStructure,
  onFormDataChange,
  onStructureSubmit,
  onResetForm,
  onEditStructure,
}: Props) {
  return (
    <div className="space-y-6">
      <Card className={isEditingStructure ? "border-blue-500 shadow-lg" : ""}>
        <CardHeader>
          <CardTitle>
            {isEditingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onStructureSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="structure_class">Class *</Label>
                <Select 
                  value={structureFormData.class} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...structureFormData, 
                    class: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="structure_term_no">Term Number *</Label>
                <Select 
                  value={structureFormData.term_no.toString()} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...structureFormData, 
                    term_no: parseInt(value) 
                  })}
                >    
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="structure_fee_type">Fee Type *</Label>
                <Select 
                  value={structureFormData.fee_type} 
                  onValueChange={(value) => onFormDataChange({ 
                    ...structureFormData, 
                    fee_type: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="structure_amount">Amount (Reference) *</Label>
                <Input
                  id="structure_amount"
                  type="number"
                  step="0.01"
                  value={structureFormData.amount}
                  onChange={(e) => onFormDataChange({ 
                    ...structureFormData, 
                    amount: e.target.value 
                  })}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="structure_description">Description</Label>
                <Input
                  id="structure_description"
                  value={structureFormData.description}
                  onChange={(e) => onFormDataChange({ 
                    ...structureFormData, 
                    description: e.target.value 
                  })}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {isEditingStructure ? '✅ Update Fee Structure' : 'Create Fee Structure'}
              </Button>
              {isEditingStructure && (
                <Button type="button" variant="outline" onClick={onResetForm} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Fee Structures</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeStructures.map((structure) => (
                <TableRow key={structure.id}>
                  <TableCell>{structure.class}</TableCell>
                  <TableCell>Term {structure.term_no}</TableCell>
                  <TableCell>{structure.fee_type}</TableCell>
                  <TableCell>₹{structure.amount}</TableCell>
                  <TableCell>{structure.description || 'N/A'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditStructure(structure)}
                      className="flex items-center gap-1"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {feeStructures.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No fee structures found. Create one to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}