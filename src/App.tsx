
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelectionPage from "./pages/Index";
import StudentLoginPage from "./pages/StudentLoginPage";
import TeacherLoginPage from "./pages/TeacherLoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import StudentDashboardPage from "./pages/StudentDashboard";
import TeacherDashboardPage from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentAttendancePage from "./pages/StudentAttendancePage";
import NotFound from "./pages/NotFound";
import EnterExamMarksPage from "./pages/EnterExamMarksPage";
import AttendanceManagementPage from "./pages/admin/AttendanceManagementPage";
import MarkAttendancePage from "./pages/teacher/MarkAttendancePage";
import StudentExamResultsPage from "./pages/StudentExamResultsPage";
import StudentManagementPage from "./pages/admin/StudentManagementPage";
import TeacherManagementPage from "./pages/admin/TeacherManagementPage";
import AnnouncementManagementPage from "./pages/admin/AnnouncementManagementPage";
import FeeManagementPage from "./pages/admin/FeeManagementPage";
import TimetableManagementPage from "./pages/admin/TimetableManagementPage";
import EnhancedFeeAnalyticsPage from "./pages/admin/EnhancedFeeAnalyticsPage";
import MarksReportPage from "./pages/admin/MarksReportPage";
import SendAbsenteeSMSPage from "./pages/teacher/SendAbsenteeSMSPage";
import UploadHomeworkPage from "./pages/teacher/UploadHomeworkPage";
import ViewStudentsPage from "./pages/teacher/ViewStudentsPage";
import ApprovalLeavePage from "./pages/teacher/ApprovalLeavePage";
import ClassAnalyticsPage from "./pages/teacher/ClassAnalyticsPage";
import ViewTimetablePage from "./pages/teacher/ViewTimetablePage";
import StudentHomeworkPage from "./pages/student/StudentHomeworkPage";
import StudentFeeDetailsPage from "./pages/student/StudentFeeDetailsPage";
import StudentTimetablePage from "./pages/student/StudentTimetablePage";
import StudentLeavePage from "./pages/student/StudentLeavePage";
import StudentTeachersPage from "./pages/student/StudentTeachersPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelectionPage />} />
          <Route path="/login/student" element={<StudentLoginPage />} />
          <Route path="/login/teacher" element={<TeacherLoginPage />} />
          <Route path="/login/admin" element={<AdminLoginPage />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<StudentManagementPage />} />
          <Route path="/admin/teachers" element={<TeacherManagementPage />} />
          <Route path="/admin/announcements" element={<AnnouncementManagementPage />} />
          <Route path="/admin/fees" element={<FeeManagementPage />} />
          <Route path="/admin/timetable" element={<TimetableManagementPage />} />
          <Route path="/admin/fee-analytics" element={<EnhancedFeeAnalyticsPage />} />
          <Route path="/admin/marks-report" element={<MarksReportPage />} />
          <Route path="/dashboard/student" element={<StudentDashboardPage />} />
          <Route path="/dashboard/student/attendance" element={<StudentAttendancePage />} />
          <Route path="/dashboard/student/homework" element={<StudentHomeworkPage />} />
          <Route path="/dashboard/student/exam-results" element={<StudentExamResultsPage />} />
          <Route path="/dashboard/student/fees" element={<StudentFeeDetailsPage />} />
          <Route path="/dashboard/student/timetable" element={<StudentTimetablePage />} />
          <Route path="/dashboard/student/leave" element={<StudentLeavePage />} />
          <Route path="/dashboard/student/teachers" element={<StudentTeachersPage />} />
          <Route path="/dashboard/student/settings" element={<SettingsPage userType="student" />} />
          <Route path="/dashboard/teacher" element={<TeacherDashboardPage />} />
          <Route path="/dashboard/teacher/send-absentee-sms" element={<SendAbsenteeSMSPage />} />
          <Route path="/dashboard/teacher/upload-homework" element={<UploadHomeworkPage />} />
          <Route path="/dashboard/teacher/enter-exam-marks" element={<EnterExamMarksPage />} />
          <Route path="/dashboard/teacher/view-students" element={<ViewStudentsPage />} />
          <Route path="/dashboard/teacher/approve-leave" element={<ApprovalLeavePage />} />
          <Route path="/dashboard/teacher/class-analytics" element={<ClassAnalyticsPage />} />
          <Route path="/dashboard/teacher/view-timetable" element={<ViewTimetablePage />} />
          <Route path="/dashboard/teacher/mark-attendance" element={<MarkAttendancePage />} />
          <Route path="/dashboard/admin/attendance" element={<AttendanceManagementPage />} />
          <Route path="/dashboard/teacher/settings" element={<SettingsPage userType="teacher" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
