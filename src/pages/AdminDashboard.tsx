
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, MessageSquare, DollarSign, Calendar, Link, BarChart3, UserCheck, FileText, Building } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored session data
    localStorage.clear();
    sessionStorage.clear();
    // Navigate to home page
    navigate('/');
  };

  const managementCards = [
    {
      title: "Manage Students",
      description: "Add, edit, and manage student records with comprehensive details",
      icon: Users,
      color: "bg-blue-500",
      route: "/admin/students"
    },
    {
      title: "Manage Teachers", 
      description: "Add, edit, and manage teacher records with class assignments",
      icon: GraduationCap,
      color: "bg-green-500",
      route: "/admin/teachers"
    },
    {
      title: "Announcements",
      description: "Create and manage school announcements with targeting",
      icon: MessageSquare,
      color: "bg-purple-500",
      route: "/admin/announcements"
    },
    {
      title: "Fee Management",
      description: "Set fee structures and manage student payments",
      icon: DollarSign,
      color: "bg-yellow-500",
      route: "/admin/fees"
    },
    {
      title: "Time Table",
      description: "Create and manage class timetables by section",
      icon: Calendar,
      color: "bg-red-500",
      route: "/admin/timetable"
    },
    {
      title: "Attendance Management",
      description: "Manage and export attendance records to Google Sheets",
      icon: BarChart3,
      color: "bg-teal-500",
      route: "/dashboard/admin/attendance"
    }
  ];

  const analyticsCards = [
    {
      title: "Fee Analytics",
      description: "Comprehensive fee collection tracking, payment analysis, and student financial reports",
      icon: DollarSign,
      color: "bg-blue-500",
      route: "/admin/fee-analytics"
    },
    {
      title: "Marks Report",
      description: "Student exam results and performance",
      icon: FileText,
      color: "bg-indigo-500",
      route: "/admin/marks-report"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, Lucky</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Main Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">School Management System</h2>
        </div>

        {/* Management Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {managementCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <RouterLink key={index} to={card.route}>
                <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm cursor-pointer h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {card.title}
                      </CardTitle>
                      <div className={`p-3 rounded-full ${card.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </RouterLink>
            );
          })}
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <RouterLink key={index} to={card.route}>
                  <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm cursor-pointer h-full">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-gray-900">
                          {card.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${card.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-gray-600 text-sm leading-relaxed">
                        {card.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </RouterLink>
              );
            })}
          </div>
        </div>

        {/* Login Success Message */}
        <Card className="bg-green-50 border-green-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-full">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Login Successful</h4>
                <p className="text-green-700">Welcome to Admin Panel!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
