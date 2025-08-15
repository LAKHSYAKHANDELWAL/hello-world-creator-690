
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

type FeeTerm = {
  id: string;
  class: string;
  term_no: number;
  due_date: string;
  amount: number;
  created_at: string;
  updated_at: string;
};

export function SetFeeTerms() {
  const [feeTerms, setFeeTerms] = useState<FeeTerm[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    class: '',
    term_no: 1,
    due_date: '',
    amount: ''
  });

  const { toast } = useToast();
  const classes = Array.from({length: 12}, (_, i) => `Class ${i + 1}`);
  const terms = [
    { value: 1, label: 'Term 1' },
    { value: 2, label: 'Term 2' },
    { value: 3, label: 'Term 3' }
  ];

  useEffect(() => {
    fetchFeeTerms();
  }, []);

  const fetchFeeTerms = async () => {
    const { data, error } = await supabase
      .from('fee_terms')
      .select('*')
      .order('class', { ascending: true })
      .order('term_no', { ascending: true });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch fee terms",
        variant: "destructive",
      });
    } else {
      setFeeTerms(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const termData = {
      class: formData.class,
      term_no: formData.term_no,
      due_date: formData.due_date,
      amount: parseFloat(formData.amount)
    };

    if (isEditing && editingId) {
      const { error } = await supabase
        .from('fee_terms')
        .update(termData)
        .eq('id', editingId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update fee term",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Fee term updated successfully",
        });
        resetForm();
        fetchFeeTerms();
      }
    } else {
      const { error } = await supabase
        .from('fee_terms')
        .insert([termData]);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message.includes('duplicate') ? "Term already exists for this class" : "Failed to create fee term",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Fee term created successfully",
        });
        resetForm();
        fetchFeeTerms();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      class: '',
      term_no: 1,
      due_date: '',
      amount: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (term: FeeTerm) => {
    setFormData({
      class: term.class,
      term_no: term.term_no,
      due_date: term.due_date,
      amount: term.amount.toString()
    });
    setEditingId(term.id);
    setIsEditing(true);
  };

  const handleDelete = (termId: string) => {
    setDeletingId(termId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from('fee_terms')
      .delete()
      .eq('id', deletingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete fee term",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Fee term deleted successfully",
      });
      fetchFeeTerms();
    }

    setShowDeleteDialog(false);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Edit Fee Term' : 'Set Fee Terms'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class">Class *</Label>
                <Select 
                  value={formData.class} 
                  onValueChange={(value) => setFormData({ ...formData, class: value })}
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
                <Label htmlFor="term_no">Term *</Label>
                <Select 
                  value={formData.term_no.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, term_no: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.value} value={term.value.toString()}>{term.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {isEditing ? 'Update Term' : 'Set Term'}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Fee Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeTerms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell>{term.class}</TableCell>
                  <TableCell>Term {term.term_no}</TableCell>
                  <TableCell>{format(new Date(term.due_date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>₹{term.amount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(term)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(term.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {feeTerms.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No fee terms found. Create one to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Term</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fee term? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
