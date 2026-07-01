import React from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from 'features/auth/useLogin';

export const LoginPage: React.FC = () => {
  const {
    values,
    touched,
    errors,
    isValid,
    isLoading,
    apiError,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useLogin();

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
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            Register
          </Link>
        </p>

        <div className="mt-6 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
          <p className="font-semibold mb-1">Test credentials</p>
          <p>
            Email: <code className="font-mono bg-blue-100 px-1 rounded">demo@example.com</code>
          </p>
          <p>
            Password: <code className="font-mono bg-blue-100 px-1 rounded">DemoPass1!</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
