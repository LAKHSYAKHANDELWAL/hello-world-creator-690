
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import DashboardCard from '@/components/DashboardCard';
import { 
  Bell, 
  BookOpenCheck, 
  CalendarDays, 
  FileDown, 
  GraduationCap, 
  LogOut, 
  MessageSquareQuote,
  Banknote,
  Users,
  FileText,
  Settings
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { Link, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [student, setStudent] = useState<{ name: string; className: string; section: string }>({ 
    name: "", 
    className: "",
    section: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("student-profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStudent({
          name: parsed.name || "",
          className: parsed.className || "",
          section: parsed.section || "",
        });
      } catch {
        setStudent({ name: "", className: "", section: "" });
      }
    }
  }, []);

  const dashboardItems = [
    {
      title: "Attendance",
      Icon: BookOpenCheck,
      onClick: () => navigate("/dashboard/student/attendance"),
      content: (
        <>
          <span className="text-2xl font-bold text-green-600">View</span>
          <p className="text-xs text-muted-foreground">Monthly Reports</p>
        </>
      ),
    },
    {
      title: "Homework",
      Icon: FileText,
      onClick: () => navigate("/dashboard/student/homework"),
      content: (
        <>
          <span className="text-2xl font-bold text-blue-600">Latest</span>
          <p className="text-xs text-muted-foreground">Assignments</p>
        </>
      ),
    },
    {
      title: "Exam Marks",
      Icon: GraduationCap,
      onClick: () => navigate("/dashboard/student/exam-results"),
      content: (
        <>
          <span className="text-2xl font-bold text-purple-600">Results</span>
          <p className="text-xs text-muted-foreground">View Marks</p>
        </>
      ),
    },
    {
      title: "Fee Details",
      Icon: Banknote,
      onClick: () => navigate("/dashboard/student/fees"),
      content: (
        <>
          <span className="text-2xl font-bold text-orange-600">Status</span>
          <p className="text-xs text-muted-foreground">Payment Info</p>
        </>
      ),
    },
    {
      title: "Timetable",
      Icon: CalendarDays,
      onClick: () => navigate("/dashboard/student/timetable"),
      content: (
        <>
          <span className="text-2xl font-bold text-indigo-600">Schedule</span>
          <p className="text-xs text-muted-foreground">Class Periods</p>
        </>
      ),
    },
    {
      title: "Apply Leave",
      Icon: MessageSquareQuote,
      onClick: () => navigate("/dashboard/student/leave"),
      content: (
        <>
          <span className="text-2xl font-bold text-red-600">Request</span>
          <p className="text-xs text-muted-foreground">Leave Application</p>
        </>
      ),
    },
    {
      title: "Teachers",
      Icon: Users,
      onClick: () => navigate("/dashboard/student/teachers"),
      content: (
        <>
          <span className="text-2xl font-bold text-teal-600">List</span>
          <p className="text-xs text-muted-foreground">Class Teachers</p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={student.name
                  ? `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`
                  : undefined}
                alt={student.name}
              />
              <AvatarFallback>
                {student.name ? student.name.charAt(0).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {student.name || "Student"}
              </h1>
              <p className="text-muted-foreground">
                {student.className ? `${student.className}${student.section ? ` - ${student.section}` : ''}` : "Class"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell 
              userType="student" 
              userClass={student.className}
              userSection={student.section}
            />
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/student/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <LogOut className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </header>

        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dashboardItems.map((item, index) => (
              <div
                key={index}
                className="cursor-pointer"
                onClick={item.onClick}
                role="button"
              >
                <div className="h-32 sm:h-36 md:h-40 flex items-center justify-center min-w-0 w-full rounded-lg shadow transition bg-card border border-border hover:shadow-lg duration-200 px-3 py-2 hover:bg-muted/40">
                  <DashboardCard title={item.title} Icon={item.Icon}>
                    {item.content}
                  </DashboardCard>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
