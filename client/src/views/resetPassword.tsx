import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/portalApi';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.');
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
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
            <h2 style={{ color: '#c8a06a' }}>Password updated!</h2>
            <p style={{ color: '#94a3b8' }}>Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <Link to="/login" className="auth-back-link">← Back to login</Link>
            <h2>Set new password</h2>
            <p className="investor-login-subtitle">Choose a strong password for your account.</p>

            <form className="investor-login-form" onSubmit={handleSubmit}>
              <div className="investor-login-field">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="investor-login-field">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="investor-login-error">{error}</p>}
              <button type="submit" disabled={isLoading} className="investor-login-btn">
                {isLoading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default ResetPasswordPage;
