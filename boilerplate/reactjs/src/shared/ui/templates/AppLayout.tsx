import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from 'features/auth/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Orders', to: '/orders' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-gray-900">OrderService</Link>
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.to)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-500 hidden sm:inline">{user.email}</span>
                <button onClick={logout} className="btn-secondary text-sm">Sign out</button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
};

export default AppLayout;
