// src/components/LeaveHistory.tsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useEmployee, LeaveRequest } from './EmployeeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Eye,
  Filter,
  Download,
  FileText,
  UserCheck
} from 'lucide-react';

export const LeaveHistory: React.FC = () => {
  const { user } = useAuth();
  const { leaveRequests, loading } = useEmployee();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const userLeaveRequests = leaveRequests.filter(req => req.employee_id === user?.id);

  // Filter requests based on selected filters
  const filteredRequests = userLeaveRequests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.leave_type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Sort by created date (newest first)
  const sortedRequests = filteredRequests.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const openDetailDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_hod':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending HOD
          </Badge>
        );
      case 'pending_admin':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Admin
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors = {
      'Sick': 'bg-red-100 text-red-800',
      'Vacation': 'bg-blue-100 text-blue-800',
      'Personal': 'bg-purple-100 text-purple-800',
      'Emergency': 'bg-orange-100 text-orange-800',
      'Paternity': 'bg-blue-100 text-blue-800',
      'leave on compassionate grounds': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  // Calculate statistics
  const totalRequests = userLeaveRequests.length;
  const approvedRequests = userLeaveRequests.filter(req => req.status === 'approved').length;
  const pendingRequestsCount = userLeaveRequests.filter(req => req.status === 'pending_hod' || req.status === 'pending_admin').length;
  const rejectedRequests = userLeaveRequests.filter(req => req.status === 'rejected').length;
  const totalDaysUsed = userLeaveRequests
    .filter(req => req.status === 'approved')
    .reduce((total, req) => total + req.days_requested, 0);

  const exportToCSV = () => {
    const csvContent = [
      ['Date Submitted', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'HOD Reviewed By', 'HOD Reviewed Date', 'Admin Reviewed By', 'Admin Reviewed Date'].join(','),
      ...sortedRequests.map(request => [
        new Date(request.created_at).toLocaleDateString(),
        request.leave_type,
        request.start_date,
        request.end_date,
        request.days_requested,
        request.status,
        `"${request.reason}"`,
        request.hod_reviewed_by || '',
        request.hod_reviewed_at ? new Date(request.hod_reviewed_at).toLocaleDateString() : '',
        request.reviewed_by || '',
        request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
              </div>
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedRequests}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingRequestsCount}</p>
              </div>
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Days Used</p>
                <p className="text-2xl font-bold text-blue-600">{totalDaysUsed}</p>
              </div>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leave Request History</CardTitle>
              <CardDescription>Complete history of your leave requests</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={totalRequests === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Filters:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_hod">Pending HOD</SelectItem>
                <SelectItem value="pending_admin">Pending Admin</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Vacation">PL</SelectItem>
                <SelectItem value="Sick">Sick Leave</SelectItem>
                <SelectItem value="Personal">Casual</SelectItem>
                <SelectItem value="Emergency">Maternity</SelectItem>
                <SelectItem value="Paternity">Paternity</SelectItem>
                <SelectItem value="leave on compassionate grounds">Leave on Compassionate Grounds</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {totalRequests === 0 ? 'No Leave Requests Yet' : 'No Matching Requests'}
              </h3>
              <p className="text-gray-500">
                {totalRequests === 0 
                  ? 'Submit your first leave request to see it here'
                  : 'Try adjusting your filters to see more results'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getLeaveTypeBadge(request.leave_type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{request.start_date} to {request.end_date}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.days_requested}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.reviewed_at ? (
                          <div className="text-sm">
                            <div>{new Date(request.reviewed_at).toLocaleDateString()}</div>
                            <div className="text-gray-500">{request.reviewed_by} (Admin)</div>
                          </div>
                        ) : request.hod_reviewed_at ? (
                          <div className="text-sm">
                            <div>{new Date(request.hod_reviewed_at).toLocaleDateString()}</div>
                            <div className="text-gray-500">{request.hod_reviewed_by} (HOD)</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailDialog(request)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              Complete information about your leave request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <div>{getLeaveTypeBadge(selectedRequest.leave_type)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
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

              <div className="space-y-2">
                <Label>Submitted On</Label>
                <div className="text-sm text-gray-600">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </div>
              </div>

              {/* HOD Review Status */}
              {selectedRequest.hod_reviewed_at && (
                 <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <Label>HOD Review</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedRequest.hod_reviewed_by}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(selectedRequest.hod_reviewed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Review Status */}
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

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-sm font-medium text-gray-700">{children}</label>
);