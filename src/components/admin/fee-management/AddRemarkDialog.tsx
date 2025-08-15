
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (remarkText: string, followUpDate: string) => void;
  studentName: string;
};

export function AddRemarkDialog({ open, onOpenChange, onSubmit, studentName }: Props) {
  const [remarkText, setRemarkText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (remarkText.trim()) {
      onSubmit(remarkText.trim(), followUpDate);
      setRemarkText('');
      setFollowUpDate('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Remark for {studentName}</DialogTitle>
          <DialogDescription>
            Add a remark about parent conversation or payment commitment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="remark">Remark *</Label>
            <Textarea
              id="remark"
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="What did the parent say? Any payment commitment?"
              required
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="followUpDate">Follow-up Date (Optional)</Label>
            <Input
              id="followUpDate"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              placeholder="When to follow up?"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!remarkText.trim()}>
              Save Remark
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
