import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingThemes } from '../utils/landingThemes';

const popeyeHero = '/assets/popeyesmall.png';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(0);

  const safeThemeIndex = Math.min(Math.max(selectedTheme, 0), landingThemes.length - 1);
  const palette = landingThemes[safeThemeIndex] as (typeof landingThemes)[number];

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: `radial-gradient(circle at top, ${palette.surface}, ${palette.background})`,
        color: palette.text,
      }}
    >
      <section
        style={{
          width: 'min(1120px, 100%)',
          borderRadius: '30px',
          border: `1px solid ${palette.border}`,
          overflow: 'hidden',
          boxShadow: `0 30px 80px ${palette.accentSoft}44`,
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          background: `linear-gradient(180deg, ${palette.surface}, ${palette.background})`,
        }}
      >
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, color: palette.highlight, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, fontSize: '0.68rem' }}>NomadMee</p>
              <h1 style={{ margin: '10px 0 0', fontSize: 'clamp(2.6rem, 5vw, 4.25rem)', lineHeight: 0.95 }}>Welcome futur investor</h1>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: '999px', background: `${palette.accent}22`, border: `1px solid ${palette.border}`, color: palette.highlight, fontSize: '0.72rem', fontWeight: 700 }}>Adventure Ready</div>
          </div>

          <p style={{ margin: 0, maxWidth: '760px', color: `${palette.text}cc`, lineHeight: 1.55, fontSize: '1.05rem' }}>
            Step into the NomadMee journey: choose your style, explore cargo adventures, and enter the investor world with the same playful energy as PopeyeBalluta.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
            {landingThemes.map((themeOption, index) => (
              <button
                key={themeOption.name}
                type="button"
                onClick={() => setSelectedTheme(index)}
                style={{
                  minWidth: '44px',
                  height: '44px',
                  borderRadius: '999px',
                  border: `2px solid ${selectedTheme === index ? palette.highlight : themeOption.border}`,
                  background: themeOption.accent,
                  cursor: 'pointer',
                  boxShadow: selectedTheme === index ? `0 0 0 4px ${themeOption.highlight}44` : 'none',
                }}
                aria-label={`Theme ${index + 1}`}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '15px 18px',
                fontWeight: 800,
                cursor: 'pointer',
                background: `linear-gradient(90deg, ${palette.accent}, ${palette.highlight})`,
                color: '#000',
                boxShadow: `0 12px 30px ${palette.accent}44`,
              }}
            >
              Start journey
            </button>
            <div style={{ background: `${palette.surface}cc`, padding: '10px 12px', borderRadius: '999px', border: `1px solid ${palette.border}`, color: palette.text, fontSize: '0.78rem' }}>
              {palette.name}
            </div>
          </div>
        </div>

        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: `linear-gradient(180deg, ${palette.surface}cc, ${palette.background})`,
        }}>
          <div style={{
            borderRadius: '28px',
            border: `1px solid ${palette.border}`,
            background: `${palette.background}cc`,
            padding: '14px',
            boxShadow: `0 20px 50px ${palette.accentSoft}44`,
          }}>
            <img src={popeyeHero} alt="Popeye hero" style={{ width: '100%', maxWidth: '420px', borderRadius: '24px', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            borderRadius: '20px',
            padding: '14px 16px',
            background: `${palette.surface}dd`,
            border: `1px solid ${palette.border}`,
            color: palette.text,
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: palette.highlight }}>Character preview</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Popeye</p>
            <p style={{ margin: '6px 0 0', color: `${palette.text}cc`, lineHeight: 1.4 }}>
              The playful mascot is ready. Pick a theme, start your journey, and enter the investor playground.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
