import React from 'react';
import { Link } from 'react-router-dom';
import { InvestorProfile } from '../api/portalApi';

interface Props {
  investor: InvestorProfile;
  onLogout: () => void;
}

const WaitingRoom: React.FC<Props> = ({ investor, onLogout }) => {
  const displayName = investor.displayName || investor.name;

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0c14',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      fontFamily: 'inherit',
    }}>
      <img src="/logo192.png" alt="NomadMee" style={{ width: 56, height: 56, borderRadius: 12, marginBottom: 16 }} />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
        Welcome, {displayName}
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 48, textAlign: 'center', maxWidth: 400 }}>
        Your account is active. You'll be invited to investment opportunities when they open.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        width: '100%',
        maxWidth: 720,
        marginBottom: 48,
      }}>
        <ActionCard
          emoji="🛒"
          title="Explore the Shop"
          description="Browse products and bundles from our network of artisans."
          to="/shop"
        />
        <ActionCard
          emoji="🧭"
          title="Join a Journey"
          description="Discover immersive travel experiences curated by NomadMee."
          to="/journeys"
          disabled
        />
        <ActionCard
          emoji="💼"
          title="Investment Lounge"
          description="Learn how NomadMee investments work while you wait for your allocation."
          to="/about-investments"
          disabled
        />
      </div>

      <div style={{
        padding: '16px 24px',
        background: 'rgba(200,160,106,0.06)',
        border: '1px solid rgba(200,160,106,0.15)',
        borderRadius: 12,
        maxWidth: 480,
        marginBottom: 32,
        textAlign: 'center',
      }}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
          <span style={{ color: '#c8a06a', fontWeight: 600 }}>How it works:</span> Once our team reviews your profile and an investment opportunity opens, you'll receive an invitation to join. Until then, enjoy full access to the shop and journeys.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none' }}>← Home</Link>
        <span style={{ color: '#334155' }}>·</span>
        <Link to="/contact-us" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none' }}>Contact us</Link>
        <span style={{ color: '#334155' }}>·</span>
        <button
          type="button"
          onClick={onLogout}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
        >
          Sign out
        </button>
      </div>
    </main>
  );
};

interface ActionCardProps {
  emoji: string;
  title: string;
  description: string;
  to: string;
  disabled?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ emoji, title, description, to, disabled }) => (
  <div style={{
    background: '#111827',
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(200,160,106,0.15)'}`,
    borderRadius: 14,
    padding: '24px 20px',
    opacity: disabled ? 0.5 : 1,
    transition: 'border-color 0.2s',
  }}>
    <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{emoji}</div>
    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{title}</h3>
    <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, marginBottom: 16 }}>{description}</p>
    {!disabled ? (
      <Link
        to={to}
        style={{
          display: 'inline-block',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#c8a06a',
          textDecoration: 'none',
          borderBottom: '1px solid rgba(200,160,106,0.3)',
          paddingBottom: 2,
        }}
      >
        Explore →
      </Link>
    ) : (
      <span style={{ fontSize: '0.78rem', color: '#334155' }}>Coming soon</span>
    )}
  </div>
);

export default WaitingRoom;
