import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'app/providers/AuthProvider';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, username, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>Welcome{username ? `, ${username}` : ''}! 👋</h1>
      <p>You are successfully logged in.</p>
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        <button onClick={() => navigate('/orders')}>View Orders</button>
        {isLoggedIn && <button onClick={handleLogout}>Sign Out</button>}
      </div>
    </div>
  );
};

export default LandingPage;
