import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/portalApi';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="investor-login-shell">
      <div className="investor-login-logo">
        <img src="/logo192.png" alt="nomadme" />
      </div>
      <p className="investor-login-brand">NomadMee</p>

      <section className="investor-login-card">
        <Link to="/login" className="auth-back-link">← Back to login</Link>
        <h2>Forgot password</h2>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📬</div>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
              If that email is registered, you'll receive a reset link shortly. Check your inbox.
            </p>
            <Link to="/login" style={{ color: '#c8a06a', fontSize: '0.9rem', textDecoration: 'none', marginTop: 16, display: 'block' }}>
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <p className="investor-login-subtitle">Enter your email and we'll send you a reset link.</p>
            <form className="investor-login-form" onSubmit={handleSubmit}>
              <div className="investor-login-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              {error && <p className="investor-login-error">{error}</p>}
              <button type="submit" disabled={isLoading} className="investor-login-btn">
                {isLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
