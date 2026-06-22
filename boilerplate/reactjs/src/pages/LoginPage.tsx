import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from 'features/auth/useAuth';
import { useFormValidation } from 'shared/lib/validation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [apiError, setApiError] = useState('');
  const { login, isLoading } = useAuth();

  const { touched, errors, isValid, touchField, touchAll } = useFormValidation(
    loginSchema,
    values,
  );

  const handleChange = useCallback(
    (field: keyof LoginFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      if (apiError) setApiError('');
    },
    [apiError],
  );

  const handleBlur = useCallback(
    (field: keyof LoginFormValues) => () => {
      touchField(field);
    },
    [touchField],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      touchAll();
      if (!isValid) return;
      setApiError('');
      try {
        await login(values.email, values.password);
      } catch {
        setApiError('Invalid email or password.');
      }
    },
    [values, isValid, touchAll, login],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">to your account to manage orders</p>

        {apiError && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
              className={`input ${touched.email && errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="you@example.com"
            />
            {touched.email && errors.email && (
              <p id="email-error" role="alert" className="text-red-600 text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
              className={`input ${touched.password && errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={values.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              placeholder="••••••••"
            />
            {touched.password && errors.password && (
              <p id="password-error" role="alert" className="text-red-600 text-xs mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isValid}
            aria-busy={isLoading}
            className="btn-primary w-full"
          >
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
