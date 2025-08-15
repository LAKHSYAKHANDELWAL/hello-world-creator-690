
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import DashboardCard from '@/components/DashboardCard';
import { 
  Bell, 
  LogOut, 
  ClipboardCheck,
  Send,
  Upload,
  PenSquare,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  Calendar,
  Clock
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { Link } from 'react-router-dom';

const TeacherDashboardPage = () => {
  const teacher = {
    name: "Jane Smith",
    subject: "Mathematics",
    photoUrl: `https://api.dicebear.com/8.x/avataaars/svg?seed=Jane`,
  };

  const dashboardItems = [
    { 
      href: '/dashboard/teacher/mark-attendance', 
      title: "Mark Attendance", 
      Icon: ClipboardCheck, 
      color: "text-sky-600", 
      bgColor: "bg-sky-100", 
      content: <p className="text-sm text-muted-foreground">Submit daily attendance via Google Sheets</p> 
    },
    { 
      href: '/dashboard/teacher/send-absentee-sms', 
      title: "Send Absentee SMS", 
      Icon: Send, 
      color: "text-amber-600", 
      bgColor: "bg-amber-100", 
      content: <p className="text-sm text-muted-foreground">Notify parents of absent students</p> 
    },
    { 
      href: '/dashboard/teacher/upload-homework', 
      title: "Upload Homework", 
      Icon: Upload, 
      color: "text-violet-600", 
      bgColor: "bg-violet-100", 
      content: <p className="text-sm text-muted-foreground">Assign new homework tasks</p> 
    },
    { 
      href: '/dashboard/teacher/enter-exam-marks', 
      title: "Enter Exam Marks", 
      Icon: PenSquare, 
      color: "text-rose-600", 
      bgColor: "bg-rose-100", 
      content: <p className="text-sm text-muted-foreground">Update student exam scores</p> 
    },
    { 
      href: '/dashboard/teacher/view-students', 
      title: "View Students", 
      Icon: Users, 
      color: "text-blue-600", 
      bgColor: "bg-blue-100", 
      content: <p className="text-sm text-muted-foreground">See class information and details</p> 
    },
    { 
      href: '/dashboard/teacher/approve-leave', 
      title: "Approve Leave", 
      Icon: UserCheck, 
      color: "text-emerald-600", 
      bgColor: "bg-emerald-100", 
      content: <p className="text-sm text-muted-foreground">Manage student leave requests</p> 
    },
    { 
      href: '/dashboard/teacher/class-analytics', 
      title: "Class Analytics", 
      Icon: BarChart3, 
      color: "text-indigo-600", 
      bgColor: "bg-indigo-100", 
      content: <p className="text-sm text-muted-foreground">View performance data and stats</p> 
    },
    { 
      href: '/dashboard/teacher/view-timetable', 
      title: "View Class Timetable", 
      Icon: Clock, 
      color: "text-teal-600", 
      bgColor: "bg-teal-100", 
      content: <p className="text-sm text-muted-foreground">Check class schedule and timings</p> 
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={teacher.photoUrl} alt={teacher.name} />
              <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{teacher.name}</h1>
              <p className="text-muted-foreground">{teacher.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell userType="teacher" />
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/teacher/settings">
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

        {/* Dashboard Grid */}
        <main>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dashboardItems.map((item, index) => (
              <Link 
                to={item.href} 
                key={index} 
                className="w-full h-full text-left rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform duration-200 hover:scale-[1.02]"
              >
                <DashboardCard 
                  title={item.title} 
                  Icon={item.Icon} 
                  iconColor={item.color} 
                  iconBgColor={item.bgColor} 
                  className="h-full cursor-pointer"
                >
                  {item.content}
                </DashboardCard>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
