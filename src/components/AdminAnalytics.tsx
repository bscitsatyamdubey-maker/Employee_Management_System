// src/components/AdminAnalytics.tsx
import React from 'react';
import { useEmployee } from './EmployeeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

export const AdminAnalytics: React.FC = () => {
  const { employees, leaveRequests, holidays } = useEmployee();

  // Calculate statistics
  const totalEmployees = employees.length;
  
  // *** UPDATED LOGIC ***
  const pendingHodRequests = leaveRequests.filter(req => req.status === 'pending_hod').length;
  const pendingAdminRequests = leaveRequests.filter(req => req.status === 'pending_admin').length;
  const pendingRequests = pendingAdminRequests; // Metric card shows what's pending for Admin
  
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved').length;
  const rejectedRequests = leaveRequests.filter(req => req.status === 'rejected').length;

  // Get employees currently on leave
  const today = new Date().toISOString().split('T')[0];
  const employeesOnLeave = leaveRequests.filter(req => 
    req.status === 'approved' && 
    req.start_date <= today && 
    req.end_date >= today
  ).length;

  // Leave type distribution
  const leaveTypeData = leaveRequests.reduce((acc, req) => {
    acc[req.leave_type] = (acc[req.leave_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const leaveTypeChartData = Object.entries(leaveTypeData).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // *** UPDATED LOGIC ***
  // Leave status distribution
  const statusData = [
    { name: 'Approved', value: approvedRequests, color: '#10b981' },
    { name: 'Pending HOD', value: pendingHodRequests, color: '#f97316' },
    { name: 'Pending Admin', value: pendingAdminRequests, color: '#f59e0b' },
    { name: 'Rejected', value: rejectedRequests, color: '#ef4444' }
  ];

  // Department distribution
  const departmentData = employees.reduce((acc, emp) => {
    if (emp.department) {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const departmentChartData = Object.entries(departmentData).map(([dept, count]) => ({
    department: dept,
    employees: count
  }));

  // Monthly leave trends (last 6 months)
  const monthlyData = [];
  const currentDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    const monthLeaves = leaveRequests.filter(req => {
      const reqDate = new Date(req.created_at);
      return reqDate.getMonth() === date.getMonth() && reqDate.getFullYear() === year;
    });

    monthlyData.push({
      month: `${month} ${year}`,
      requests: monthLeaves.length,
      approved: monthLeaves.filter(req => req.status === 'approved').length,
      rejected: monthLeaves.filter(req => req.status === 'rejected').length
    });
  }

  // Employees with low leave balance
  const lowBalanceEmployees = employees.filter(emp => (emp.leave_balance ?? 0) <= 5);

  // Upcoming holidays in next 30 days
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);
  const upcomingHolidays = holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= new Date() && holidayDate <= next30Days;
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
                <p className="text-xs text-gray-500 mt-1">Active workforce</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600">{pendingRequests}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting admin approval</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Leave Today</p>
                <p className="text-3xl font-bold text-green-600">{employeesOnLeave}</p>
                <p className="text-xs text-gray-500 mt-1">Currently absent</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-3xl font-bold text-blue-600">
                  {approvedRequests + rejectedRequests > 0 
                    ? Math.round((approvedRequests / (approvedRequests + rejectedRequests)) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Leave requests</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Status</CardTitle>
            <CardDescription>Distribution of all leave request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No leave requests data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Types</CardTitle>
            <CardDescription>Distribution of leave types requested</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaveTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No leave type data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
            <CardDescription>Distribution of employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="employees" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No department data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Trends</CardTitle>
            <CardDescription>Monthly leave request patterns (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} name="Total Requests" />
                <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} name="Approved" />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Leave Balance Alert */}
        {lowBalanceEmployees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span>Low Leave Balance Alert</span>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  {lowBalanceEmployees.length}
                </Badge>
              </CardTitle>
              <CardDescription>Employees with 5 or fewer leave days remaining</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowBalanceEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-200">
                    <div>
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-sm text-gray-600">{employee.department}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      {employee.leave_balance} days left
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Upcoming Holidays</span>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {upcomingHolidays.length}
              </Badge>
            </CardTitle>
            <CardDescription>Holidays in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length > 0 ? (
              <div className="space-y-3">
                {upcomingHolidays.slice(0, 5).map((holiday) => {
                  const daysDiff = Math.ceil((new Date(holiday.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{holiday.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Tomorrow' : `In ${daysDiff} days`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming holidays in the next 30 days</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};