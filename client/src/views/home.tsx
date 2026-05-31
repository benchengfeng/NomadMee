import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingThemes } from '../utils/landingThemes';
import WorldMap from '../components/WorldMap';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(0);

  const idx = Math.min(Math.max(selectedTheme, 0), landingThemes.length - 1);
  const palette = landingThemes[idx] as (typeof landingThemes)[number];

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
        {/* Brand + tagline */}
        <div>
          <p style={{ margin: 0, color: palette.highlight, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, fontSize: '0.65rem' }}>
            NomadMee
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Your investments,<br />tracked across the globe.
          </h1>
        </div>

        {/* Controls */}
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

      {/* World map — fills remaining space */}
      <WorldMap accentColor={palette.accent} />
    </main>
  );
};

export default LandingPage;
