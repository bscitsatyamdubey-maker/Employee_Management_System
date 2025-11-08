"use client"

// src/components/EmployeeDashboard.tsx
import type React from "react"
import { useState } from "react"
import { useAuth } from "./AuthContext"
import { useEmployee } from "./EmployeeContext"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Badge } from "./ui/badge"
import {
  User,
  Calendar,
  Clock,
  LogOut,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  UserCheck,
  ClipboardList,
} from "lucide-react"
import { EmployeeProfile } from "./EmployeeProfile"
import { LeaveRequestForm } from "./LeaveRequestForm"
import { LeaveHistory } from "./LeaveHistory"
import { EmployeeHolidayCalendar } from "./EmployeeHolidayCalendar"

export const EmployeeDashboard: React.FC = () => {
  const { user, signOut } = useAuth()
  const { leaveRequests, holidays } = useEmployee()
  const [activeTab, setActiveTab] = useState("overview")

  const userLeaveRequests = leaveRequests.filter((req) => req.employee_id === user?.id)
  const pendingRequests = userLeaveRequests.filter(
    (req) => req.status === "pending_hod" || req.status === "pending_admin",
  )
  const approvedRequests = userLeaveRequests.filter((req) => req.status === "approved")
  const rejectedRequests = userLeaveRequests.filter((req) => req.status === "rejected")

  // Get current leave status
  const today = new Date().toISOString().split("T")[0]
  const currentLeave = approvedRequests.find((req) => req.start_date <= today && req.end_date >= today)

  // Get upcoming approved leaves
  const upcomingLeaves = approvedRequests
    .filter((req) => req.start_date > today)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  // Get recent activity (last 5 requests)
  const recentActivity = userLeaveRequests
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const handleSignOut = async () => {
    await signOut()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_hod":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending HOD Approval
          </Badge>
        )
      case "pending_admin":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <UserCheck className="w-3 h-3 mr-1" />
            Pending Admin Approval
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

  const getLeaveTypeBadge = (type: string) => {
    const colors = {
      Sick: "bg-red-100 text-red-800",
      Vacation: "bg-blue-100 text-blue-800",
      Personal: "bg-purple-100 text-purple-800",
      Emergency: "bg-orange-100 text-orange-800",
      Paternity: "bg-blue-100 text-blue-800",
      "leave on compassionate grounds": "bg-red-100 text-red-800",
    }

    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {type}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Employee Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
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
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <ClipboardList className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="request-leave" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Request Leave</span>
            </TabsTrigger>
            <TabsTrigger value="leave-history" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Leave History</span>
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4" />
              <span>Holidays</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Current Status */}
            {currentLeave && (
              <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-900">You are currently on leave</h3>
                      <p className="text-sm text-blue-700">
                        {currentLeave.leave_type} leave until {new Date(currentLeave.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      On Leave
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Leave Balance</p>
                      <p className="text-3xl font-bold text-blue-600">{user?.leave_balance ?? 0}</p>
                      <p className="text-xs text-gray-500">days remaining</p>
                    </div>
                    <CalendarDays className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                      <p className="text-3xl font-bold text-orange-600">{pendingRequests.length}</p>
                      <p className="text-xs text-gray-500">awaiting approval</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved Leaves</p>
                      <p className="text-3xl font-bold text-green-600">{approvedRequests.length}</p>
                      <p className="text-xs text-gray-500">this year</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Days Used</p>
                      <p className="text-3xl font-bold text-gray-900">{20 - (user?.leave_balance ?? 20)}</p>
                      <p className="text-xs text-gray-500">out of 20 days</p>
                    </div>
                    <Calendar className="w-8 h-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Leaves */}
            {upcomingLeaves.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Upcoming Approved Leaves</CardTitle>
                  <CardDescription>Your scheduled time off</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingLeaves.slice(0, 3).map((leave) => {
                      const daysUntil = Math.ceil(
                        (new Date(leave.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                      )
                      return (
                        <div key={leave.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                {getLeaveTypeBadge(leave.leave_type)}
                                <span className="text-sm text-gray-600">
                                  {leave.start_date} to {leave.end_date} ({leave.days_requested} days)
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{leave.reason}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-700">
                                {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Leave Requests</CardTitle>
                <CardDescription>Your latest leave request activity</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No leave requests yet</p>
                    <p className="text-sm">Submit your first leave request to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getLeaveTypeBadge(request.leave_type)}
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {request.start_date} to {request.end_date} ({request.days_requested} days)
                          </p>
                          <p className="text-sm text-gray-700 mt-1">{request.reason}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Balance Warning */}
            {(user?.leave_balance ?? 20) <= 5 && (
              <Card className="mt-6 bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                    <div>
                      <h3 className="font-medium text-orange-900">Low Leave Balance</h3>
                      <p className="text-sm text-orange-700">
                        You have {user?.leave_balance || 0} leave days remaining. Plan your time off accordingly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <EmployeeProfile />
          </TabsContent>

          <TabsContent value="request-leave">
            <LeaveRequestForm />
          </TabsContent>

          <TabsContent value="leave-history">
            <LeaveHistory />
          </TabsContent>

          <TabsContent value="holidays">
            <EmployeeHolidayCalendar />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
