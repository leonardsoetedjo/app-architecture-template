import React, { useState, createContext, useContext, useCallback } from 'react';

export interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  username: null,
  login: async () => false,
  logout: async () => {},
  loading: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (user: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
        credentials: 'include',
      });
      if (!res.ok) return false;
      setIsLoggedIn(true);
      setUsername(user);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setIsLoggedIn(false);
      setUsername(null);
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
