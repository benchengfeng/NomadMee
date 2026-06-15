import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, getGoogleAuthUrl } from '../api/portalApi';
import { track } from '../utils/analytics';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await registerUser({ name: name.trim(), email: email.trim(), password });
      track('register', { method: 'email' });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="investor-login-shell">
        <div className="investor-login-logo">
          <img src="/logo192.png" alt="nomadme" />
        </div>
        <p className="investor-login-brand">NomadMee</p>
        <section className="investor-login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✉️</div>
          <h2 style={{ color: '#f1f5f9', marginBottom: 12 }}>Check your email</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
            We sent a verification link to <strong style={{ color: '#c8a06a' }}>{email}</strong>.
            Click it to activate your account.
          </p>
          <p style={{ color: '#475569', fontSize: '0.82rem' }}>
            Didn't receive it?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: '#c8a06a', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit' }}
            >
              Go back to login
            </button>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="investor-login-shell">
      <div className="investor-login-topbar">
        <LanguageSwitcher variant="ghost" />
      </div>

      <div className="investor-login-logo">
        <img src="/logo192.png" alt="nomadme" />
      </div>
      <p className="investor-login-brand">NomadMee</p>

      <section className="investor-login-card">
        <Link to="/" className="auth-back-link">← Back to home</Link>
        <h2>Create account</h2>
        <p className="investor-login-subtitle">Join the NomadMee community</p>

        <a
          href={getGoogleAuthUrl()}
          className="auth-google-btn"
          onClick={() => track('register-click', { method: 'google' })}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <div className="auth-divider"><span>or</span></div>

        <form className="investor-login-form" onSubmit={handleSubmit}>
          <div className="investor-login-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>

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

          <div className="investor-login-field">
            <label htmlFor="password">Password</label>
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

          {error && <p className="investor-login-error">{error}</p>}

          <button type="submit" disabled={isLoading} className="investor-login-btn">
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="investor-login-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;
