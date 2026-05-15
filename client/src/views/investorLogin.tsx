import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginInvestor } from '../api/dashboardApi';
import { saveSessionToken } from '../utils/auth';

const InvestorLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await loginInvestor(username.trim(), password);
      saveSessionToken(response.token);
      navigate('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="investor-auth-shell">
      <section className="investor-auth-card">
        <h1 className="investor-auth-title">NomadMe Investor Access</h1>
        <p className="investor-auth-subtitle">
          Connect to your shipment dashboard and track your first cargo in real-time.
        </p>

        <form className="investor-auth-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <p className="investor-error-banner">{error}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default InvestorLogin;
