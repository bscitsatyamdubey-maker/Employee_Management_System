// src/components/LeaveRequestForm.tsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useEmployee } from './EmployeeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Send, 
  CalendarX,
  Info
} from 'lucide-react';

export const LeaveRequestForm: React.FC = () => {
  const { user } = useAuth();
  const { holidays, submitLeaveRequest } = useEmployee();
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleLeaveTypeChange = (value: string) => {
    setFormData({
      ...formData,
      leave_type: value
    });
    
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateRequest = () => {
    const errors: string[] = [];
    
    if (!formData.leave_type) {
      errors.push('Please select a leave type');
    }
    
    if (!formData.start_date) {
      errors.push('Please select a start date');
    }
    
    if (!formData.end_date) {
      errors.push('Please select an end date');
    }
    
    if (!formData.reason.trim()) {
      errors.push('Please provide a reason for your leave');
    }
    
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.push('Start date cannot be in the past');
      }
      
      if (endDate < startDate) {
        errors.push('End date cannot be before start date');
      }
      
      // Calculate days requested
      const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysRequested > (user?.leave_balance || 0)) {
        errors.push(`Insufficient leave balance. You have ${user?.leave_balance || 0} days remaining, but requested ${daysRequested} days.`);
      }
      
      // Check for holidays in the requested period
      const requestDates = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        requestDates.push(d.toISOString().split('T')[0]);
      }
      
      const conflictingHolidays = holidays.filter(holiday => 
        requestDates.includes(holiday.date)
      );
      
      if (conflictingHolidays.length > 0) {
        errors.push(`Cannot request leave on public holidays: ${conflictingHolidays.map(h => h.name).join(', ')}`);
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateRequest();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setLoading(true);
    
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const requestData = {
      leave_type: formData.leave_type as 'Sick' | 'Vacation' | 'Personal' | 'Emergency' | 'Paternity' | 'leave on compassionate grounds',
      start_date: formData.start_date,
      end_date: formData.end_date,
      days_requested: daysRequested,
      reason: formData.reason,
    };
    
    // @ts-ignore - We are intentionally omitting fields that the backend will add
    const result = await submitLeaveRequest(requestData);
    
    if (result.success) {
      toast.success('Leave request submitted successfully');
      setFormData({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
      });
    } else {
      toast.error(result.error || 'Failed to submit leave request');
    }
    
    setLoading(false);
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate >= startDate) {
        return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    return 0;
  };

  const daysRequested = calculateDays();
  const canSubmit = user && (user.leave_balance ?? 0) >= daysRequested && daysRequested > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Request Leave</span>
          </CardTitle>
          <CardDescription>Submit a new leave request for approval</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Leave Balance Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Your Leave Balance</h3>
                  <p className="text-sm text-blue-700">
                    You have {user?.leave_balance ?? 0} leave days remaining out of your annual allowance
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {user?.leave_balance ?? 0} days left
              </Badge>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave Type</Label>
                <Select value={formData.leave_type} onValueChange={handleLeaveTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vacation">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>PL</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Sick">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Sick Leave</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Personal">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Casual</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Emergency">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Maternity</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Paternity">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Paternity</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="leave on compassionate grounds">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Leave on Compassionate Grounds</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Days Requested</Label>
                <div className="p-3 bg-gray-50 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {daysRequested > 0 ? `${daysRequested} day${daysRequested > 1 ? 's' : ''}` : '0 days'}
                    </span>
                    {daysRequested > 0 && (
                      <Badge variant={canSubmit ? 'outline' : 'destructive'} className="ml-auto">
                        {canSubmit ? 'Available' : 'Exceeds Balance'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Please provide a reason for your leave request..."
                value={formData.reason}
                onChange={handleChange}
                rows={4}
                className="resize-none"
                required
              />
            </div>

            {/* Holiday Warning */}
            {formData.start_date && formData.end_date && (
              (() => {
                const startDate = new Date(formData.start_date);
                const endDate = new Date(formData.end_date);
                const requestDates = [];
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                  requestDates.push(d.toISOString().split('T')[0]);
                }
                
                const conflictingHolidays = holidays.filter(holiday => 
                  requestDates.includes(holiday.date)
                );
                
                if (conflictingHolidays.length > 0) {
                  return (
                    <Alert variant="destructive">
                      <CalendarX className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Holiday Conflict:</strong> Your request includes the following holidays: {' '}
                        {conflictingHolidays.map(h => h.name).join(', ')}. 
                        Leave requests cannot be submitted for public holidays.
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()
            )}

            {/* Leave Balance Warning */}
            {daysRequested > 0 && !canSubmit && (user?.leave_balance || 0) < daysRequested && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Insufficient Leave Balance:</strong> You are requesting {daysRequested} days 
                  but only have {user?.leave_balance || 0} days remaining.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setFormData({
                    leave_type: '',
                    start_date: '',
                    end_date: '',
                    reason: ''
                  });
                  setValidationErrors([]);
                }}
              >
                Clear Form
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !canSubmit || validationErrors.length > 0}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span>Leave Request Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
              <span>Submit your requests at least 2 weeks in advance for better approval chances</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
              <span>Emergency leave requests may be submitted with less notice</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
              <span>You cannot request leave on public holidays</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
              <span>Approved leave days will be deducted from your balance automatically</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};