import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'features/auth/useAuth';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      try { await register(email, password); }
      catch { setError('Registration failed. Email may already be in use.'); }
    },
    [email, password, confirmPassword, register],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Get started managing your orders</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="reg-email" type="email" required autoComplete="email"
              className="input" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="reg-password" type="password" required autoComplete="new-password"
              className="input" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
            <input
              id="reg-confirm" type="password" required autoComplete="new-password"
              className="input" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
