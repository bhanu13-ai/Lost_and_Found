import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LoginPageProps {
  redirectPath?: string;
  onNavigate: (path: string) => void;
}

const DEMO_ACCOUNTS = [
  {
    label: 'Student',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@saiuniversity.edu.in',
    pass: 'Student@123',
  },
  {
    label: 'Faculty',
    name: 'Dr. Meera Krishnan',
    email: 'meera.krishnan@saiuniversity.edu.in',
    pass: 'Faculty@123',
  },
  {
    label: 'Staff / Admin',
    name: 'Rajesh Nair',
    email: 'rajesh.nair@saiuniversity.edu.in',
    pass: 'Staff@123',
  },
];

export function LoginPage({ redirectPath, onNavigate }: LoginPageProps) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const completeSignIn = async (targetEmail: string, targetPass: string) => {
    setError('');
    setSubmitting(true);
    try {
      const signedUser = await login(targetEmail, targetPass, rememberMe);
      showToast(`Signed in as ${signedUser.fullName} (${signedUser.role}).`, 'success');
      if (redirectPath) {
        onNavigate(redirectPath);
      } else {
        onNavigate('/dashboard');
      }
    } catch (err) {
      const msg = (err as Error).message || 'Invalid credentials.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeSignIn(email, password);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Sai University Portal
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-[#14213D]">
            Sign In to Your Account
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Access your lost and found reports, ownership claims, and verification queue.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#14213D]">
              University Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bhanusri.m-29@abcd.saiuniversity.edu.in"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-[#14213D]">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
            />
            <span>Remember login on this device (30 days)</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Campus Role Demo Accounts */}
        <div className="mt-7 border-t border-slate-200 pt-5">
          <p className="text-xs font-semibold text-slate-500">Quick Campus Demo Sign-In</p>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={submitting}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.pass);
                  completeSignIn(acc.email, acc.pass);
                }}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-left text-xs hover:border-[#2563EB] hover:bg-blue-50/40 transition-colors"
              >
                <span className="font-semibold text-[#14213D]">{acc.name}</span>
                <span className="font-medium text-[#2563EB]">{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to the portal?{' '}
          <button
            type="button"
            onClick={() => onNavigate('/register')}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
