import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingThemes } from '../utils/landingThemes';
import WorldMap from '../components/WorldMap';
import type { PublicMapData } from '../api/portalApi';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

interface StatRowProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, sub, accent = '#fff' }) => (
  <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <p style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#475569', fontWeight: 700 }}>
      {label}
    </p>
    <p style={{ margin: '4px 0 0', fontSize: '1.35rem', fontWeight: 800, color: accent, lineHeight: 1.1 }}>
      {value}
    </p>
    {sub && <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748b' }}>{sub}</p>}
  </div>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [stats, setStats] = useState<PublicMapData['stats'] | null>(null);

  const idx = Math.min(Math.max(selectedTheme, 0), landingThemes.length - 1);
  const palette = landingThemes[idx] as (typeof landingThemes)[number];

  const handleDataLoaded = (data: PublicMapData) => {
    setStats(data.stats);
  };

  return (
    <main style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0c14',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Floating header */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        background: 'linear-gradient(180deg, rgba(10,12,20,0.92) 0%, rgba(10,12,20,0.0) 100%)',
        gap: 16,
      }}>
        <div>
          <p style={{ margin: 0, color: palette.highlight, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, fontSize: '0.65rem' }}>
            NomadMee
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Your investments,<br />tracked across the globe.
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Theme chips */}
          <div style={{ display: 'flex', gap: 6 }}>
            {landingThemes.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTheme(i)}
                aria-label={t.name}
                title={t.name}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: `2px solid ${i === selectedTheme ? palette.highlight : 'transparent'}`,
                  background: t.accent,
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: i === selectedTheme ? `0 0 0 3px ${t.highlight}33` : 'none',
                  transition: 'box-shadow 0.2s',
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: `linear-gradient(90deg, ${palette.accent}, ${palette.highlight})`,
              color: '#000',
              boxShadow: `0 8px 24px ${palette.accent}55`,
              whiteSpace: 'nowrap',
            }}
          >
            Start journey →
          </button>
        </div>
      </header>

      {/* Live stats panel — bottom-left overlay */}
      {stats && (
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: 28,
          zIndex: 10,
          width: 220,
          background: 'rgba(10,12,20,0.82)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '16px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ position: 'relative', width: 10, height: 10 }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'livePing 1.8s ease-out infinite',
              }} />
              <div style={{
                position: 'absolute',
                inset: '2px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 6px #22c55e',
              }} />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', color: '#22c55e', textTransform: 'uppercase' }}>
              Live
            </span>
          </div>

          <StatRow
            label="Total invested"
            value={formatCompact(stats.totalInvested)}
            sub="across all active deals"
            accent={palette.accent}
          />
          <StatRow
            label="Expected profits"
            value={formatCompact(stats.totalExpectedProfit)}
            sub="projected returns"
            accent="#22c55e"
          />
          <StatRow
            label="Active investments"
            value={stats.activeInvestments.toString()}
            sub="open investment rounds"
            accent="#f1f5f9"
          />
          <div style={{ padding: '12px 0 0' }}>
            <p style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#475569', fontWeight: 700 }}>
              Shipments in transit
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1 }}>
              {stats.activeShipments}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748b' }}>cargo routes active now</p>
          </div>

          <style>{`
            @keyframes livePing {
              0%   { transform: scale(1);   opacity: 0.9; }
              70%  { transform: scale(2.6); opacity: 0; }
              100% { transform: scale(1);   opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* World map — fills remaining space */}
      <WorldMap accentColor={palette.accent} onDataLoaded={handleDataLoaded} />
    </main>
  );
};

export default LandingPage;
