"use client"

// src/components/HodLeaveManagement.tsx
import type React from "react"
import { useState } from "react"
import { useAuth } from "./AuthContext"
import { useEmployee, type LeaveRequest } from "./EmployeeContext"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { toast } from "sonner@2.0.3"
import { CheckCircle, XCircle, Clock, Calendar, User, FileText, Eye, UserCheck } from "lucide-react"
import { NotificationModal } from "./NotificationModal"

export const HodLeaveManagement: React.FC = () => {
  const { user } = useAuth()
  const { leaveRequests, loading, updateLeaveRequestStatus } = useEmployee()

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [notificationData, setNotificationData] = useState<{
    show: boolean
    type: "approved" | "rejected" | "forwarded"
    employeeName: string
    leaveType: string
    dates: string
  }>({ show: false, type: "approved", employeeName: "", leaveType: "", dates: "" })

  // Filter requests for HOD's department
  const departmentRequests = leaveRequests.filter((req) => req.department === user?.department)

  const handleApprove = async (request: LeaveRequest) => {
    // HOD approval sends to admin queue (not final approval)
    const result = await updateLeaveRequestStatus(request.id, "approved")
    if (result.success) {
      toast.success("Leave request approved and forwarded to Admin for final approval")
      setNotificationData({
        show: true,
        type: "forwarded",
        employeeName: request.employee_name,
        leaveType: request.leave_type,
        dates: `${request.start_date} to ${request.end_date}`,
      })
    } else {
      toast.error(result.error || "Failed to approve request")
    }
  }

  const handleReject = async (request: LeaveRequest) => {
    // HOD rejection
    const result = await updateLeaveRequestStatus(request.id, "rejected")
    if (result.success) {
      toast.success("Leave request rejected")
      setNotificationData({
        show: true,
        type: "rejected",
        employeeName: request.employee_name,
        leaveType: request.leave_type,
        dates: `${request.start_date} to ${request.end_date}`,
      })
    } else {
      toast.error(result.error || "Failed to reject request")
    }
  }

  const openDetailDialog = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setIsDetailDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_hod":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending HOD
          </Badge>
        )
      // *** ADDED THIS CASE ***
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending HOD
          </Badge>
        )
      case "pending_admin":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <UserCheck className="w-3 h-3 mr-1" />
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

  // *** THIS IS THE FIX ***
  // HOD's "Pending" tab now shows "pending_hod" AND stale "pending"
  const pendingRequests = departmentRequests.filter((req) => req.status === "pending_hod" || req.status === "pending")

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span>Pending HOD Approval</span>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              {pendingRequests.length}
            </Badge>
          </CardTitle>
          <CardDescription>Review and approve or reject leave requests from your department</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No pending leave requests for your department</p>
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{request.employee_name}</h3>
                        {getLeaveTypeBadge(request.leave_type)}
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {request.start_date} to {request.end_date}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{request.days_requested} days</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{request.reason}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => openDetailDialog(request)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(request)}
                        className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(request)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests (Your Department)</CardTitle>
          <CardDescription>Complete history of leave requests from {user?.department}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No leave requests found for your department
                    </TableCell>
                  </TableRow>
                ) : (
                  departmentRequests
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Sort by newest first
                    .map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.employee_name}</TableCell>
                        <TableCell>{getLeaveTypeBadge(request.leave_type)}</TableCell>
                        <TableCell>
                          {request.start_date} to {request.end_date}
                        </TableCell>
                        <TableCell>{request.days_requested}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openDetailDialog(request)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>Complete information about the leave request</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedRequest.employee_name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <div>{getLeaveTypeBadge(selectedRequest.leave_type)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{selectedRequest.start_date}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{selectedRequest.end_date}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Days Requested</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{selectedRequest.days_requested} days</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{selectedRequest.reason}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Submitted On</Label>
                  <div className="text-sm text-gray-600">{new Date(selectedRequest.created_at).toLocaleString()}</div>
                </div>
              </div>

              {selectedRequest.reviewed_at && (
                <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <Label>Admin Review</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedRequest.reviewed_by}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(selectedRequest.reviewed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* *** THIS IS THE FIX ***
                Show buttons if status is "pending_hod" OR stale "pending"
              */}
              {(selectedRequest.status === "pending_hod" || selectedRequest.status === "pending") && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleReject(selectedRequest)
                      setIsDetailDialogOpen(false)
                    }}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      handleApprove(selectedRequest)
                      setIsDetailDialogOpen(false)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationData.show}
        onClose={() => setNotificationData({ ...notificationData, show: false })}
        type={notificationData.type}
        employeeName={notificationData.employeeName}
        leaveType={notificationData.leaveType}
        dates={notificationData.dates}
      />
    </div>
  )
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-sm font-medium text-gray-700">{children}</label>
)