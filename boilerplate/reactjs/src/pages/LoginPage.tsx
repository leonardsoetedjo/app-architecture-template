import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'app/providers/AuthProvider';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = await login(username, password);
    if (ok) {
      navigate('/orders');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ width: '300px', padding: '24px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Sign In</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ marginBottom: '12px' }}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>Default: admin / admin123</p>
      </form>
    </div>
  );
};

export default LoginPage;
