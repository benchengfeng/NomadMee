import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../api/portalApi';
import { saveAdminToken } from '../utils/auth';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await loginAdmin(username.trim(), password);
      saveAdminToken(response.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell admin-shell">
      <section className="auth-card admin-card">
        <h1>Admin Access</h1>
        <p>Restricted dashboard for cargo and investor management.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="admin-username">Username</label>
          <input id="admin-username" value={username} onChange={(e) => setUsername(e.target.value)} required />

          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login as Admin'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/">Investor login</Link>
        </div>
      </section>
    </main>
  );
};

export default AdminLogin;
