
import React, { useEffect, useState } from "react";
import { ExamResults } from "@/components/student/ExamResults";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentExamResultsPage = () => {
  const [studentName, setStudentName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Read from localStorage
    const stored = localStorage.getItem("student-profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStudentName(parsed.name || "");
      } catch {
        setStudentName("");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <ExamResults studentName={studentName} />
      </div>
    </div>
  );
};

export default StudentExamResultsPage;
