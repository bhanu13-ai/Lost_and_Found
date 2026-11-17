import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { UserRole } from '../types/portal';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid university email address.');
      return;
    }
    if (studentId.trim().length < 3) {
      setError('Please enter your Sai University ID.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const createdUser = await register({
        fullName,
        email,
        studentId,
        password,
        confirmPassword,
        role,
        department: department || undefined,
      });
      showToast(`Welcome to the portal, ${createdUser.fullName}.`, 'success');
      onNavigate('/dashboard');
    } catch (err) {
      const msg = (err as Error).message || 'Registration failed.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Sai University Portal
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-[#14213D]">
            Create Your Campus Account
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Register to report misplaced items, verify ownership claims, and track recovery.
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
            <label htmlFor="reg-name" className="block text-xs font-semibold text-[#14213D]">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Ananya Venkatesh"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold text-[#14213D]">
              University Email
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@saiuniversity.edu.in"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-id" className="block text-xs font-semibold text-[#14213D]">
                Student / Staff ID
              </label>
              <input
                id="reg-id"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="SU2026CS015"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-mono uppercase text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>

            <div>
              <label htmlFor="reg-role" className="block text-xs font-semibold text-[#14213D]">
                University Role
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="reg-dept" className="block text-xs font-semibold text-[#14213D]">
              School / Department (Optional)
            </label>
            <input
              id="reg-dept"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., School of Computing & Data Science"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-pass" className="block text-xs font-semibold text-[#14213D]">
                Password
              </label>
              <input
                id="reg-pass"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-semibold text-[#14213D]">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
