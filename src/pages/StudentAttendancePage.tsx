import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

// Map class names to their respective Google Apps Script attendance API endpoints
const CLASS_ATTENDANCE_API_URLS: Record<string, string> = {
  "Class 1": "https://script.google.com/macros/s/AKfycbzukuYgbFcRP0KJW2rC5NJ8rmDOV4f1se91gkMEqscbngHChAjka8Yy9SGlhmrIo-7nPw/exec",
  "Class 2": "https://script.google.com/macros/s/AKfycbzukuYgbFcRP0KJW2rC5NJ8rmDOV4f1se91gkMEqscbngHChAjka8Yy9SGlhmrIo-7nPw/exec",
  "Class 3": "https://script.google.com/macros/s/AKfycbzukuYgbFcRP0KJW2rC5NJ8rmDOV4f1se91gkMEqscbngHChAjka8Yy9SGlhmrIo-7nPw/exec",
  "Class 4": "https://script.google.com/macros/s/AKfycbzukuYgbFcRP0KJW2rC5NJ8rmDOV4f1se91gkMEqscbngHChAjka8Yy9SGlhmrIo-7nPw/exec",
  "Class 5": "https://script.google.com/macros/s/AKfycbzukuYgbFcRP0KJW2rC5NJ8rmDOV4f1se91gkMEqscbngHChAjka8Yy9SGlhmrIo-7nPw/exec",
};

// Helper to format today's date in dd-mm-yyyy
function formatToday() {
  const date = new Date();
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
}

// Get student info from location state (preferred), then localStorage fallback
function getStudentProfile() {
  const state = (window.history.state && window.history.state.usr) || {};
  if (state && state.name && state.className) {
    return { name: state.name, className: String(state.className).trim() };
  }
  // Also check localStorage for fallback
  const stored = localStorage.getItem("student-profile");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.name && parsed.className)
        return {
          name: parsed.name,
          className: String(parsed.className).trim(),
        };
    } catch {}
  }
  return { name: "", className: "" };
}

const StudentAttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Attempt to get student name and class from route state or localStorage
  const [student, setStudent] = useState<{ name: string; className: string }>(() =>
    getStudentProfile()
  );
  const [attendance, setAttendance] = useState<{
    dates: string[];
    statuses: string[];
    totalPresent: number;
    totalAbsent: number;
    workingDays: number;
    percent: number;
    lastUpdated: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // On mount, fetch attendance for student's class
  useEffect(() => {
    if (!student.name || !student.className) {
      setError("Student information not available.");
      setLoading(false);
      return;
    }
    // Get the correct endpoint for this student's class
    const classTab = String(student.className).trim();
    const API_URL = CLASS_ATTENDANCE_API_URLS[classTab];
    if (!API_URL) {
      setError(
        `No attendance data source is configured for class "${classTab}". Please contact your administrator.`
      );
      setLoading(false);
      return;
    }

    // Fetch data from Google Apps Script API
    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch from the specific Google Sheet endpoint, no sheet param needed
        const res = await fetch(API_URL);
        if (!res.ok) {
          throw new Error(`Failed to fetch attendance: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        if (!json || !Array.isArray(json.data)) {
          throw new Error("No attendance data received.");
        }
        // Each row: [Name, date1, date2, ...]
        const [header, ...rows] = json.data;
        if (!header || header.length < 2) throw new Error("Invalid data format.");

        // Match student's full name (case-insensitive, trimmed)
        const studentRow =
          rows.find(
            (row: string[]) =>
              row[0]?.toLowerCase().trim() === student.name.toLowerCase().trim()
          ) || [];

        if (!studentRow.length) {
          throw new Error(
            `Attendance for "${student.name}" not found in "${classTab}".`
          );
        }

        const dates = header.slice(1);
        const statuses = studentRow.slice(1);

        let totalPresent = 0;
        let totalAbsent = 0;
        statuses.forEach((st) => {
          if (String(st).toUpperCase() === "P") totalPresent += 1;
          else if (String(st).toUpperCase() === "A") totalAbsent += 1;
        });
        const workingDays = statuses.length;
        const percent = workingDays > 0 ? Math.round((totalPresent / workingDays) * 100) : 0;
        const lastUpdated = formatToday();

        setAttendance({
          dates,
          statuses,
          totalPresent,
          totalAbsent,
          workingDays,
          percent,
          lastUpdated,
        });
      } catch (err: any) {
        setError(
          err?.message ||
            "An error occurred while fetching attendance. Please try again."
        );
        setAttendance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
    // Only fetch once per mount (student never changes after login)
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 relative">
      <div className="w-full max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          ← Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <CalendarDays className="h-6 w-6 text-primary" />
              Attendance - {student.name && <span>{student.name}</span>}
              {student.className && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({student.className})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 flex flex-col items-center">
                <span className="animate-pulse text-muted-foreground">
                  Loading attendance...
                </span>
              </div>
            ) : error ? (
              <div className="py-8 text-destructive text-center">{error}</div>
            ) : attendance ? (
              <div className="flex flex-col gap-7">
                {/* Progress Bar */}
                <div className="flex flex-col items-center gap-3 mb-2">
                  <span className="font-semibold text-lg mb-1">
                    Attendance Percentage
                  </span>
                  <Progress
                    value={attendance.percent}
                    className="w-full h-4 rounded-lg"
                  />
                  <span className="text-primary font-bold text-3xl">
                    {attendance.percent}%
                  </span>
                  <div className="text-muted-foreground mt-1">
                    Present:{" "}
                    <span className="font-semibold text-green-600">
                      {attendance.totalPresent}
                    </span>
                    {" | "}
                    Absent:{" "}
                    <span className="font-semibold text-red-500">
                      {attendance.totalAbsent}
                    </span>
                    {" | "}
                    Total Days:{" "}
                    <span className="font-semibold">
                      {attendance.workingDays}
                    </span>
                  </div>
                </div>

                {/* Date-wise Log */}
                <div>
                  <span className="font-semibold text-base mb-2 block">
                    Date-wise Log
                  </span>
                  <div className="overflow-x-auto pb-2 -mb-2">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.dates.map((date, i) => {
                          const status = attendance.statuses[i];
                          const isPresent =
                            String(status).toUpperCase() === "P";
                          return (
                            <tr
                              key={date}
                              className={cn(
                                "border-b",
                                isPresent
                                  ? "bg-green-50/40"
                                  : "bg-red-50/40"
                              )}
                            >
                              <td className="px-2 py-1 font-mono">{date}</td>
                              <td
                                className={cn(
                                  "px-2 py-1 font-semibold",
                                  isPresent
                                    ? "text-green-600"
                                    : "text-red-500"
                                )}
                              >
                                {isPresent ? "Present" : "Absent"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="mt-3 text-xs text-muted-foreground text-right">
                  Last updated on: {attendance.lastUpdated}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
