// src/components/MainApp.tsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { AdminDashboard } from './AdminDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { HodDashboard } from './HodDashboard'; // Import the new HOD Dashboard

export const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return showRegister ? (
      <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  // Updated logic to include HOD role
  if (user.role === 'admin') {
    return <AdminDashboard />;
  }
  
  if (user.role === 'hod') {
    return <HodDashboard />;
  }

  return <EmployeeDashboard />;
};