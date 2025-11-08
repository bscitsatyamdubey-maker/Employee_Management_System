// src/components/NotificationModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Mail, Calendar, User, Send } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'approved' | 'rejected' | 'forwarded'; // Added 'forwarded'
  employeeName: string;
  leaveType: string;
  dates: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  type,
  employeeName,
  leaveType,
  dates
}) => {
  const isApproved = type === 'approved';
  const isForwarded = type === 'forwarded';
  const isRejected = type === 'rejected'; // <<<--- THIS IS THE FIX

  // Determine email content based on type
  const getEmailContent = () => {
    if (isApproved) {
      return `
Your ${leaveType.toLowerCase()} leave request for ${dates} has been approved.

Your leave has been approved and will be deducted from your leave balance. Please ensure all necessary handovers are completed before your leave begins.
      `.trim();
    }
    if (isForwarded) {
      return `
Your ${leaveType.toLowerCase()} leave request for ${dates} has been approved by your HOD and forwarded to Admin for final approval.

You will receive another notification once a final decision is made.
      `.trim();
    }
    // Rejected
    return `
Your ${leaveType.toLowerCase()} leave request for ${dates} has been rejected.

Unfortunately, your leave request could not be approved at this time. Please contact HR or your manager for more information.
    `.trim();
  };

  const getSubject = () => {
    if (isApproved) return `Leave Request Approved - ${leaveType}`;
    if (isForwarded) return `Leave Request Forwarded - ${leaveType}`;
    return `Leave Request Rejected - ${leaveType}`;
  };

  const getTitle = () => {
    if (isApproved) return { icon: <CheckCircle className="w-6 h-6 text-green-600" />, text: 'Email Notification Sent' };
    if (isForwarded) return { icon: <Send className="w-6 h-6 text-blue-600" />, text: 'Email Notification Sent' };
    return { icon: <XCircle className="w-6 h-6 text-red-600" />, text: 'Email Notification Sent' };
  };

  const getStatusSummary = () => {
    if (isApproved) {
      return {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-900',
        icon: <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />,
        title: 'Leave Request Approved',
        desc: "The requested days have been deducted from the employee's leave balance."
      };
    }
    if (isForwarded) {
      return {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-900',
        icon: <Send className="w-5 h-5 text-blue-600 mt-0.5" />,
        title: 'Request Forwarded to Admin',
        desc: 'This request has been approved by the HOD and is now pending final admin approval.'
      };
    }
    // Rejected
    return {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-900',
      icon: <XCircle className="w-5 h-5 text-red-600 mt-0.5" />,
      title: 'Leave Request Rejected',
      desc: 'This leave request has been rejected.'
    };
  };

  const emailContent = getEmailContent();
  const subject = getSubject();
  const title = getTitle();
  const summary = getStatusSummary();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {title.icon}
            <span>{title.text}</span>
          </DialogTitle>
          <DialogDescription>
            Simulated email notification for leave request status update
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Preview */}
          <div className="border rounded-lg bg-gray-50">
            <div className="p-4 border-b bg-white rounded-t-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>Email Preview</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">To:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{employeeName}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Subject:</span>
                    <div className="mt-1">
                      {subject}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {emailContent}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className={`p-4 rounded-lg border-2 ${summary.bg}`}>
            <div className="flex items-start space-x-3">
              {summary.icon}
              <div className="flex-1">
                <h3 className={`font-medium ${summary.text}`}>
                  {summary.title}
                </h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Employee: {employeeName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{leaveType} leave for {dates}</span>
                  </div>
                </div>
                {summary.desc && (
                  <p className={`mt-2 text-sm ${isRejected ? 'text-red-700' : (isForwarded ? 'text-blue-700' : 'text-green-700')}`}>
                    {summary.desc}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};