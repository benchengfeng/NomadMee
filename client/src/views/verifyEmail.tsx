import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/portalApi';
import { saveInvestorToken } from '../utils/auth';
import { track } from '../utils/analytics';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    let cancelled = false;

    verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        saveInvestorToken(res.token);
        track('email-verified');
        setStatus('success');
        setTimeout(() => navigate('/home'), 2000);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed. The link may have expired.');
      });

    return () => { cancelled = true; };
  }, [token, navigate]);

  return (
    <main className="investor-login-shell">
      <div className="investor-login-logo">
        <img src="/logo192.png" alt="nomadme" />
      </div>
      <p className="investor-login-brand">NomadMee</p>

      <section className="investor-login-card" style={{ textAlign: 'center' }}>
        {status === 'pending' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            <h2 style={{ color: '#f1f5f9' }}>Verifying your email…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
            <h2 style={{ color: '#c8a06a' }}>Email verified!</h2>
            <p style={{ color: '#94a3b8' }}>Redirecting you to your account…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❌</div>
            <h2 style={{ color: '#f1f5f9' }}>Verification failed</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>{message}</p>
            <Link to="/login" className="investor-login-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Back to login
            </Link>
          </>
        )}
      </section>
    </main>
  );
};

export default VerifyEmailPage;
