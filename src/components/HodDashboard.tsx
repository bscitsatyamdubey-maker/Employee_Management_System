// src/components/HodDashboard.tsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useEmployee } from './EmployeeContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  LogOut,
  Clock,
  AlertCircle,
  CalendarDays,
  User as UserIcon,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { HodLeaveManagement } from './HodLeaveManagement'; // Import new HOD component
import { LeaveRequestForm } from './LeaveRequestForm';
import { LeaveHistory } from './LeaveHistory';
import { EmployeeHolidayCalendar } from './EmployeeHolidayCalendar';
import { EmployeeProfile } from './EmployeeProfile'; // Import Profile

// Helper function to show status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending_hod":
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending HOD
        </Badge>
      )
    case "pending": // Handle stale "pending" status
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending HOD
        </Badge>
      )
    case "pending_admin":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending Admin
        </Badge>
      )
    case "approved":
      return (
        <Badge variant="outline" className="text-green-600 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className="text-red-600 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export const HodDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { employees, leaveRequests } = useEmployee();
  const [activeTab, setActiveTab] = useState('overview');

  // Filter all data by HOD's department
  const hodDepartment = user?.department;
  const departmentEmployees = employees.filter(emp => emp.department === hodDepartment && emp.role === 'employee');
  const departmentLeaveRequests = leaveRequests.filter(req => req.department === hodDepartment);

  // *** THIS IS THE FIX ***
  // HOD's "Pending" tab now shows "pending_hod" AND stale "pending"
  const pendingRequests = departmentLeaveRequests.filter(req => req.status === 'pending_hod' || req.status === 'pending');
  const approvedRequests = departmentLeaveRequests.filter(req => req.status === 'approved');

  // Get employees currently on leave *in this department*
  const today = new Date().toISOString().split('T')[0];
  const employeesOnLeave = approvedRequests.filter(req => 
    req.start_date <= today && req.end_date >= today
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">HOD Dashboard</h1>
                {/* Display department from user profile */}
                <p className="text-sm text-gray-500">{user?.department} Department</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
             <TabsTrigger value="profile">
              My Profile
            </TabsTrigger>
            <TabsTrigger value="leave-requests">
              Dept. Requests
            </TabsTrigger>
            <TabsTrigger value="request-leave">
              Request My Leave
            </TabsTrigger>
            <TabsTrigger value="leave-history">
              My Leave History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Employees in Dept.</p>
                      <p className="text-3xl font-bold text-gray-900">{departmentEmployees.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending HOD Approval</p>
                      <p className="text-3xl font-bold text-orange-600">{pendingRequests.length}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">On Leave Today (Dept.)</p>
                      <p className="text-3xl font-bold text-green-600">{employeesOnLeave.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Leave Requests (Pending HOD Approval)</CardTitle>
                <CardDescription>Latest employee leave requests from your department</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending leave requests for your department</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{request.employee_name}</p>
                          <p className="text-sm text-gray-500">
                            {request.leave_type} • {request.start_date} to {request.end_date} ({request.days_requested} days)
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                        </div>
                        {/* Use the helper function */}
                        {getStatusBadge(request.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW TABS */}
          <TabsContent value="profile">
            <EmployeeProfile />
          </TabsContent>

          <TabsContent value="leave-requests">
            <HodLeaveManagement />
          </TabsContent>

          <TabsContent value="request-leave">
            <LeaveRequestForm />
          </TabsContent>

          <TabsContent value="leave-history">
            <LeaveHistory />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};