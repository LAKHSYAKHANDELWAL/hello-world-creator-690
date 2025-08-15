
import React, { useState, useEffect } from "react";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { fetchStudentsFromSupabase } from "@/utils/fetchStudentsFromSupabase";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function ViewStudentsSheet() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch available classes from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class')
        .not('class', 'is', null);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch classes from database",
        });
        return;
      }

      const uniqueClasses = [...new Set(data.map(item => item.class))].sort();
      setAvailableClasses(uniqueClasses);
    };

    fetchClasses();
  }, [toast]);

  // Fetch students when a class is selected
  const {
    data: students,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["students-sheet", selectedClass],
    queryFn: () => selectedClass ? fetchStudentsFromSupabase(selectedClass) : Promise.resolve([]),
    enabled: Boolean(selectedClass),
  });

  return (
    <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            View Students
          </div>
        </SheetTitle>
        <SheetDescription>
          Select a class to view all students in that class.
        </SheetDescription>
      </SheetHeader>
      <div className="my-4 space-y-4">
        <div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {availableClasses.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          {!selectedClass && (
            <div className="text-muted-foreground text-center py-8">Please select a class to see students.</div>
          )}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6 text-primary" />
            </div>
          )}
          {isError && (
            <div className="text-destructive text-center py-8">
              Failed to fetch students from database: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          )}
          {selectedClass && !isLoading && students && students.length === 0 && (
            <div className="text-muted-foreground text-center py-8">No students found for this class.</div>
          )}
          {students && students.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, idx) => (
                  <TableRow key={student.name + idx}>
                    <TableCell>{(idx + 1).toString().padStart(2, "0")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`} />
                          <AvatarFallback>{student.name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">View Profile</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </SheetContent>
  );
}
