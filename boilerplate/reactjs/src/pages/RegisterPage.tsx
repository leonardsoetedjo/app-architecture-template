import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from 'features/auth/useAuth';
import { useFormValidation } from 'shared/lib/validation';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [values, setValues] = useState<RegisterFormValues>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [apiError, setApiError] = useState('');
  const { register, isLoading } = useAuth();

  const { touched, errors, isValid, touchField, touchAll } = useFormValidation(
    registerSchema,
    values,
  );

  const handleChange = useCallback(
    (field: keyof RegisterFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      if (apiError) setApiError('');
    },
    [apiError],
  );

  const handleBlur = useCallback(
    (field: keyof RegisterFormValues) => () => {
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
        await register(values.email, values.password);
      } catch {
        setApiError('Registration failed. Email may already be in use.');
      }
    },
    [values, isValid, touchAll, register],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Get started managing your orders</p>

        {apiError && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={touched.email && errors.email ? 'reg-email-error' : undefined}
              className={`input ${touched.email && errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="you@example.com"
            />
            {touched.email && errors.email && (
              <p id="reg-email-error" role="alert" className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={touched.password && errors.password ? 'reg-password-error' : undefined}
              className={`input ${touched.password && errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={values.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              placeholder="Min. 8 characters"
            />
            {touched.password && errors.password && (
              <p id="reg-password-error" role="alert" className="text-red-600 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
              aria-describedby={touched.confirmPassword && errors.confirmPassword ? 'reg-confirm-error' : undefined}
              className={`input ${touched.confirmPassword && errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={values.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              placeholder="Re-enter"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p id="reg-confirm-error" role="alert" className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isValid}
            aria-busy={isLoading}
            className="btn-primary w-full"
          >
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
