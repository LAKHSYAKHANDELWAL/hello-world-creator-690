
import React from "react";
import { EnterExamMarksForm } from "@/components/teacher/EnterExamMarksForm";

const EnterExamMarksPage = () => {
  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl font-bold my-4 text-center">Enter Exam Marks</h1>
        <EnterExamMarksForm />
      </div>
    </div>
  );
};

export default EnterExamMarksPage;
