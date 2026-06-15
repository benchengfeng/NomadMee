import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getInvestorHome } from '../api/portalApi';
import { saveInvestorToken } from '../utils/auth';
import { track } from '../utils/analytics';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    const err = params.get('error');

    if (err || !token) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    saveInvestorToken(token);
    track('login-success', { method: 'google' });

    getInvestorHome()
      .then((profile) => {
        navigate(profile.investor.kycCompleted ? '/home' : '/onboarding');
      })
      .catch(() => {
        navigate('/home');
      });
  }, [params, navigate]);

  return (
    <main className="investor-login-shell">
      <div className="investor-login-logo">
        <img src="/logo192.png" alt="nomadme" />
      </div>
      <p className="investor-login-brand">NomadMee</p>

      <section className="investor-login-card" style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❌</div>
            <h2 style={{ color: '#f1f5f9' }}>Sign-in failed</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>{error}</p>
            <a href="/login" className="investor-login-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Back to login
            </a>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            <h2 style={{ color: '#f1f5f9' }}>Signing you in…</h2>
          </>
        )}
      </section>
    </main>
  );
};

export default AuthCallbackPage;
