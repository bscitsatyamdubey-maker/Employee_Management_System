// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Users, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const redirectByRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return (window.location.href = '/');

    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ea915b54/user/profile`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return (window.location.href = '/');
    const profile = await res.json();

    if (profile?.role === 'admin') window.location.href = '/admin';
    else if (profile?.role === 'hod') window.location.href = '/hod';
    else window.location.href = '/employee';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const email = formData.email.trim().toLowerCase();
    const pwd = formData.password;

    if (!email || !pwd) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    const result = await signIn(email, pwd);
    setLoading(false);

    if (!result?.success) {
      setError(result?.error || 'Invalid credentials');
      return;
    }

    redirectByRole();
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      setError('Enter your email to reset your password');
      return;
    }
    try {
      setResetBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      setResetBusy(false);
      if (error) {
        setError(error.message || 'Failed to send reset email');
      } else {
        setInfo('Password reset email sent. Check your inbox.');
      }
    } catch (e: any) {
      setResetBusy(false);
      setError('Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Employee Management System</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || info) && (
              <Alert variant={error ? 'destructive' : undefined}>
                <AlertDescription>{error || info}</AlertDescription>
              </Alert>
            )}

             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={show ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                   className="px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-60"
                  disabled={resetBusy}
                >
                  {resetBusy ? 'Sending…' : 'Forgot password?'}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:underline"
              >
                Register here
              </button>
            </p>
          </div>

          
        </CardContent>
      </Card>
    </div>
  );
};
