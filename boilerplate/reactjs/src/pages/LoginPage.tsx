import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'features/auth/useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
        await login(email, password);
      } catch {
        setError('Invalid email or password.');
      }
    },
    [email, password, login],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">to your account to manage orders</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email" type="email" required autoComplete="email"
              className="input" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password" type="password" required autoComplete="current-password"
              className="input" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
