
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EXAM_TYPES = [
  { value: "Class Test", label: "Class Test" },
  { value: "Oral Test", label: "Oral Test" },
  { value: "Unit Test", label: "Unit Test" },
  { value: "Half Yearly Exam", label: "Half Yearly Exam" },
  { value: "Yearly Exam", label: "Yearly Exam" },
];

type FormData = {
  class_name: string;
  section: string;
  exam_type: string;
  exam_name?: string;
  out_of: number;
  subject: string;
  marks: { student_name: string; marks_obtained: number | "" }[];
};

type Student = {
  name: string;
  id: string;
};

export const EnterExamMarksForm = () => {
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { control, register, handleSubmit, reset, watch, setValue } = useForm<FormData>({
    defaultValues: {
      class_name: "",
      section: "",
      exam_type: "",
      exam_name: "",
      subject: "",
      out_of: 0,
      marks: [],
    },
  });

  const navigate = useNavigate();

  // Fetch available classes from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class')
        .not('class', 'is', null);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch classes from database",
          variant: "destructive",
        });
        return;
      }

      const uniqueClasses = [...new Set(data.map(item => item.class))].sort();
      setAvailableClasses(uniqueClasses);
    };

    fetchClasses();
  }, []);

  // Fetch sections when class is selected
  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedClass) {
        setAvailableSections([]);
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select('section')
        .eq('class', selectedClass)
        .not('section', 'is', null);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch sections from database",
          variant: "destructive",
        });
        return;
      }

      const uniqueSections = [...new Set(data.map(item => item.section))].sort();
      setAvailableSections(uniqueSections);
    };

    fetchSections();
    setSelectedSection(""); // Reset section when class changes
  }, [selectedClass]);

  // Fetch students when class and section are selected
  const {
    data: students,
    isLoading: loadingStudents,
    error: studentsError,
  } = useQuery({
    queryKey: ['students-for-marks', selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass || !selectedSection) return [];
      
      const { data, error } = await supabase
        .from('students')
        .select('id, name, full_name')
        .eq('class', selectedClass)
        .eq('section', selectedSection)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch students: ${error.message}`);
      }

      return data.map(student => ({
        id: student.id,
        name: student.full_name || student.name || 'Unknown Student'
      })).filter(student => student.name.trim() !== '');
    },
    enabled: !!(selectedClass && selectedSection),
  });

  // Whenever students load, update marks array in form
  useEffect(() => {
    if (students && selectedClass && selectedSection) {
      setValue(
        "marks",
        students.map(({ name }) => ({ student_name: name, marks_obtained: "" }))
      );
    } else if (!selectedClass || !selectedSection) {
      setValue("marks", []);
    }
  }, [students, selectedClass, selectedSection, setValue]);

  const outOf = watch("out_of");

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);

    // Filter out students with blank marks, validate marks
    const payload = data.marks
      .filter(m => m.marks_obtained !== "" && m.marks_obtained !== undefined)
      .map(m => ({
        class_name: data.class_name,
        exam_type: data.exam_type,
        exam_name:
          data.exam_type === "Class Test" || data.exam_type === "Oral Test"
            ? data.exam_name?.trim() || null
            : null,
        subject: data.subject?.trim() || 'General',
        out_of: data.out_of,
        student_name: m.student_name,
        marks_obtained: Number(m.marks_obtained),
      }))
      .filter(row => row.marks_obtained <= data.out_of);

    if (payload.length === 0) {
      toast({
        title: "No marks entered",
        description: "Please enter marks for at least one student.",
      });
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("exam_marks").insert(payload);
      if (error) {
        throw error;
      }
      toast({ title: "Success", description: "Marks saved successfully!" });
      reset();
      setSelectedClass("");
      setSelectedSection("");
      setSelectedExamType("");
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message || "Could not save marks.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Back button */}
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-1">
          <ArrowLeft className="mr-2" /> Back
        </Button>
      </div>
      
      {/* Class and Section dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium block mb-1">Select Class</label>
          <Select
            value={selectedClass}
            onValueChange={val => {
              setSelectedClass(val);
              setValue("class_name", val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose class" />
            </SelectTrigger>
            <SelectContent>
              {availableClasses.map(cls => (
                <SelectItem value={cls} key={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="font-medium block mb-1">Select Section</label>
          <Select
            value={selectedSection}
            onValueChange={val => {
              setSelectedSection(val);
              setValue("section", val);
            }}
            disabled={!selectedClass || availableSections.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose section" />
            </SelectTrigger>
            <SelectContent>
              {availableSections.map(section => (
                <SelectItem value={section} key={section}>
                  {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subject field */}
      <div>
        <label className="font-medium block mb-1">Subject</label>
        <Input
          placeholder="Enter subject name (e.g., Mathematics, English)"
          {...register("subject")}
          required
        />
      </div>

      {/* Exam type and name */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">Exam Type</label>
        <Select
          value={selectedExamType}
          onValueChange={val => {
            setSelectedExamType(val);
            setValue("exam_type", val);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose exam type" />
          </SelectTrigger>
          <SelectContent>
            {EXAM_TYPES.map(opt => (
              <SelectItem value={opt.value} key={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(selectedExamType === "Class Test" || selectedExamType === "Oral Test") && (
          <div className="pt-2">
            <label className="text-sm">Test Name</label>
            <Input
              placeholder="Eg: Science CT-2"
              {...register("exam_name")}
              className="mt-1"
              required
            />
          </div>
        )}
      </div>

      {/* Out of / Total marks */}
      <div className="relative">
        <label className="font-medium block mb-1">Exam is out of</label>
        <div className="relative">
          <Input
            type="number"
            min={1}
            max={200}
            {...register("out_of", { valueAsNumber: true })}
            placeholder="Enter total marks"
            className="z-10 relative bg-opacity-80"
            required
          />
          <div
            className="absolute inset-0 -z-10 rounded-md bg-cover blur-sm opacity-30"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=400&q=80')",
            }}
            aria-hidden
          />
        </div>
      </div>

      {/* Student marks list */}
      {selectedClass && selectedSection && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Enter Marks for Students</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStudents && (
                <div className="py-4 text-center text-muted-foreground">Loading students...</div>
              )}
              {studentsError && (
                <div className="py-4 text-center text-destructive">
                  Failed to load students from database. Please try again.
                </div>
              )}
              {students && students.length === 0 && !loadingStudents && (
                <div className="py-3 text-center">No students found for this class and section.</div>
              )}
              <div className="max-h-64 overflow-y-auto space-y-3">
                {students &&
                  students.map((student, idx) => (
                    <div className="flex items-center gap-4" key={student.id}>
                      <span className="min-w-[120px]">{student.name}</span>
                      <Input
                        type="number"
                        min={0}
                        max={outOf || 100}
                        step={1}
                        className="w-28"
                        {...register(`marks.${idx}.marks_obtained`, {
                          valueAsNumber: true,
                          validate: val =>
                            val === "" ||
                            (typeof val === "number" && val >= 0 && val <= (outOf || 0)) ||
                            `Cannot exceed total of ${outOf}`,
                        })}
                        placeholder="Marks"
                        disabled={!outOf}
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Button type="submit" disabled={submitting || !selectedClass || !selectedSection || !selectedExamType || !outOf}>
        {submitting ? "Saving..." : "Save Marks"}
      </Button>
    </form>
  );
};
