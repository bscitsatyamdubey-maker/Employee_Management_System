// src/components/EmployeeProfile.tsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { User, Mail, Building, Calendar, Save, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DEPARTMENTS } from '../constants'; // Import departments

export const EmployeeProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    hire_date: user?.hire_date || ''
  });
  const [loading, setLoading] = useState(false);

  // Update form data if user context changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        hire_date: user.hire_date || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDepartmentChange = (value: string) => {
    setFormData({
      ...formData,
      department: value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Only send fields that can be updated
    // Email is used for login and role is controlled by admin, so we don't update them here.
    const { name, department, hire_date } = formData;
    const result = await updateProfile({ name, department, hire_date });
    
    if (result.success) {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      hire_date: user?.hire_date || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Profile information not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal and work information</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Enter your full name"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{user.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Cannot be changed)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      className="pl-10"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  {isEditing ? (
                    <Select value={formData.department} onValueChange={handleDepartmentChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{user.department || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="hire_date"
                        name="hire_date"
                        type="date"
                        value={formData.hire_date}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {user.hire_date ? new Date(user.hire_date).toLocaleDateString() : 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
          <CardDescription>Your work-related details and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center space-x-2">
                <Badge variant={user.role === 'admin' ? 'default' : (user.role === 'hod' ? 'secondary' : 'outline')}>
                  {user.role === 'admin' ? 'Administrator' : (user.role === 'hod' ? 'HOD' : 'Employee')}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Leave Balance</Label>
              <div className="flex items-center space-x-2">
                <Badge variant={user.leave_balance != null && user.leave_balance <= 5 ? 'destructive' : 'outline'}>
                  {user.leave_balance ?? 'N/A'} days remaining
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Employee Since</Label>
              <div className="text-gray-900">
                {user.hire_date ? (
                  <>
                    {new Date(user.hire_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    <p className="text-sm text-gray-500">
                      {(() => {
                        const today = new Date();
                        const hireDate = new Date(user.hire_date);
                        let years = today.getFullYear() - hireDate.getFullYear();
                        let months = today.getMonth() - hireDate.getMonth();
                        
                        if (months < 0 || (months === 0 && today.getDate() < hireDate.getDate())) {
                          years--;
                          months += 12;
                        }

                        if (years > 0) {
                          return `${years} year${years > 1 ? 's' : ''} with company`;
                        } else if (months > 0) {
                          return `${months} month${months > 1 ? 's' : ''} with company`;
                        } else {
                          return 'Less than a month with company';
                        }
                      })()}
                    </p>
                  </>
                ) : (
                  'Date not specified'
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Security and preference settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Password</h3>
                <p className="text-sm text-gray-500">Last updated: Never</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Change Password
                <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications about leave status</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Enabled
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Enable 2FA
                <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};