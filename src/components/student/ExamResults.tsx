
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ExamResults = ({ studentName }: { studentName: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exam_marks", studentName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_marks")
        .select("*")
        .eq("student_name", studentName)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div>Loading your exam results...</div>;
  if (error) return <div>Failed to load exam results. {error.message}</div>;
  if (!data || data.length === 0) return <div>No exam results found.</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Your Exam Results</h2>
      <table className="min-w-full text-base mb-4 border border-border rounded shadow-sm">
        <thead>
          <tr>
            <th className="text-left pr-2">Exam Name</th>
            <th className="text-left pr-2">Type</th>
            <th className="text-left pr-2">Out Of</th>
            <th className="text-left pr-2">Marks</th>
            <th className="text-left pr-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.id}>
              <td>{row.exam_name || "--"}</td>
              <td>{row.exam_type}</td>
              <td>{row.out_of}</td>
              <td>
                <span
                  className={
                    typeof row.marks_obtained === "number" && row.out_of
                      ? row.marks_obtained / row.out_of >= 0.5
                        ? "text-green-700 font-semibold"
                        : "text-red-600 font-semibold"
                      : ""
                  }
                >
                  {row.marks_obtained}
                </span>
              </td>
              <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
