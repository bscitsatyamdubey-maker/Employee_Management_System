// src/components/EmployeeManagement.tsx
import React, { useState } from 'react';
import { useEmployee, Employee } from './EmployeeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner@2.0.3';
import { Plus, Edit, Trash2, User, Mail, Calendar, Building } from 'lucide-react';
import { DEPARTMENTS } from '../constants'; // Import departments

export const EmployeeManagement: React.FC = () => {
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployee();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: 'employee' as 'admin' | 'employee' | 'hod',
    hire_date: '',
    leave_balance: 20
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      department: '',
      role: 'employee',
      hire_date: '',
      leave_balance: 20
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Note: Admin should preferably use the Register page to create users with auth
    // This form is a shortcut for creating employee data directly
    const result = await addEmployee(formData);
    if (result.success) {
      toast.success('Employee added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } else {
      toast.error(result.error || 'Failed to add employee');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEmployee) return;
    
    const result = await updateEmployee(editingEmployee.id, formData);
    if (result.success) {
      toast.success('Employee updated successfully');
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
    } else {
      toast.error(result.error || 'Failed to update employee');
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      const result = await deleteEmployee(employee.id);
      if (result.success) {
        toast.success('Employee deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete employee');
      }
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department || '',
      role: employee.role,
      hire_date: employee.hire_date || '',
      leave_balance: employee.leave_balance || 0
    });
    setIsEditDialogOpen(true);
  };

  const EmployeeForm = ({ isEdit = false, onSubmit }: { isEdit?: boolean; onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
           <Select value={formData.department} onValueChange={(value: string) => setFormData({ ...formData, department: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value: 'admin' | 'employee' | 'hod') => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="hod">HOD</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hire_date">Hire Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="leave_balance">Leave Balance (Days)</Label>
          <Input
            id="leave_balance"
            type="number"
            min="0"
            max="50"
            value={formData.leave_balance}
            onChange={(e) => setFormData({ ...formData, leave_balance: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {
          if (isEdit) {
            setIsEditDialogOpen(false);
            setEditingEmployee(null);
          } else {
            setIsAddDialogOpen(false);
          }
          resetForm();
        }}>
          Cancel
        </Button>
        <Button type="submit">
          {isEdit ? 'Update Employee' : 'Add Employee'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>Manage employee information and access</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Manually create a new employee record. It's recommended to use the Sign Up page to create a user with login credentials.
                  </DialogDescription>
                </DialogHeader>
                <EmployeeForm onSubmit={handleAdd} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Leave Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No employees found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={employee.role === 'admin' ? 'default' : (employee.role === 'hod' ? 'secondary' : 'outline')}>
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{employee.hire_date}</TableCell>
                        <TableCell>
                          <Badge variant={(employee.leave_balance || 0) <= 5 ? 'destructive' : 'outline'}>
                            {employee.leave_balance} days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(employee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(employee)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information and settings
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm isEdit onSubmit={handleEdit} />
        </DialogContent>
      </Dialog>
    </div>
  );
};