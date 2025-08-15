
import React from 'react';
import { Button } from "@/components/ui/button";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function UploadHomeworkSheet() {
  const [date, setDate] = React.useState<Date>();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dueDateStr = date ? date.toISOString().substring(0, 10) : null;
    const attachment: File | null = formData.get("attachment") as File;
    const className = formData.get("class_name") as string;

    let attachment_url: string | null = null;

    if (attachment && attachment.size > 0) {
      const filePath = `homework/${Date.now()}-${attachment.name}`;
      const { data, error } = await supabase.storage
        .from("attachments")
        .upload(filePath, attachment);

      if (error) {
        toast({
          title: "File upload failed",
          description: error.message,
        });
        setLoading(false);
        return;
      }
      attachment_url = data?.path ? `https://vlayfdbhjwhodpvruohc.supabase.co/storage/v1/object/public/attachments/${filePath}` : null;
    }

    // For now, just use a dummy teacher name. You could fetch from real user profile if available.
    const created_by = "demo-teacher";

    // Save to Supabase
    const { error } = await supabase
      .from("homework_assignments")
      .insert([{
        title,
        description,
        due_date: dueDateStr,
        attachment_url,
        class_name: className,
        created_by,
      }]);

    setLoading(false);

    if (error) {
      toast({
        title: "Error uploading homework",
        description: error.message,
      })
    } else {
      toast({
        title: "Homework Uploaded",
        description: "The homework has been assigned to the students.",
      });
      e.currentTarget.reset();
      setDate(undefined);
    }
  }

  return (
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Upload Homework</SheetTitle>
        <SheetDescription>
          Fill in the details below to assign new homework.
        </SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Homework Title</Label>
          <Input id="title" name="title" placeholder="e.g., Algebra Chapter 5" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="Provide instructions for the homework..." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="class_name">Class</Label>
          <Input id="class_name" name="class_name" placeholder="e.g., Class 1" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due-date">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="attachment">Attachment (Optional)</Label>
          <Input id="attachment" name="attachment" type="file" />
        </div>
        <SheetFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Uploading..." : "Upload Homework"}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
