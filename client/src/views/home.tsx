import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingThemes } from '../utils/landingThemes';
import WorldMap from '../components/WorldMap';
import { getPublicInvestments, getPublicSiteContent, PublicInvestment, SiteContent } from '../api/portalApi';
import StoryMediaGallery from '../components/cargo/StoryMediaGallery';

type LandingSection = 'globe' | 'investments' | 'who';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Active',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  in_progress: { label: 'In Progress', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  waiting:     { label: 'Waiting',     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};


const NAV_H = 64;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<LandingSection>('globe');
  const [selectedTheme, setSelectedTheme] = useState(0);

  const [investments, setInvestments] = useState<PublicInvestment[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);

  const idx = Math.min(Math.max(selectedTheme, 0), landingThemes.length - 1);
  const palette = landingThemes[idx] as (typeof landingThemes)[number];

  useEffect(() => {
    if (section === 'investments' && investments.length === 0) {
      getPublicInvestments().then((r) => setInvestments(r.investments)).catch(() => {});
    }
    if (section === 'who' && !siteContent) {
      getPublicSiteContent('who_are_we').then((r) => setSiteContent(r.content)).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const navItems: Array<{ id: LandingSection; label: string }> = [
    { id: 'globe', label: 'The Globe' },
    { id: 'investments', label: 'Investments' },
    { id: 'who', label: 'Who Are We?' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0c14', overflow: 'hidden' }}>
      {/* ── Nav bar ── */}
      <nav style={{
        height: NAV_H,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(10,12,20,0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 20,
        gap: 16,
      }}>
        {/* Brand */}
        <span style={{ fontWeight: 800, color: palette.accent, letterSpacing: '0.12em', fontSize: '0.9rem', textTransform: 'uppercase', flexShrink: 0 }}>
          NomadMee
        </span>

        {/* Section links */}
        <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              style={{
                padding: '7px 18px',
                borderRadius: 999,
                border: 'none',
                background: section === item.id ? palette.accent : 'transparent',
                color: section === item.id ? '#000' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.18s',
                letterSpacing: '0.01em',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right side: theme + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {landingThemes.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTheme(i)}
                aria-label={t.name}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${i === selectedTheme ? '#fff' : 'transparent'}`,
                  background: t.accent,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '8px 18px',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              background: `linear-gradient(90deg, ${palette.accent}, ${palette.highlight})`,
              color: '#000',
              whiteSpace: 'nowrap',
            }}
          >
            Login →
          </button>
        </div>
      </nav>

      {/* ── Content area ── */}
      <div style={{ flex: 1, minHeight: 0, display: section === 'globe' ? 'flex' : 'block', overflow: section === 'globe' ? 'hidden' : 'auto' }}>

        {/* Globe */}
        {section === 'globe' && (
          <WorldMap accentColor={palette.accent} />
        )}

        {/* Investments */}
        {section === 'investments' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 28px' }}>
            <p style={{ color: palette.accent, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, fontSize: '0.65rem', marginBottom: 8 }}>
              Open rounds
            </p>
            <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, margin: '0 0 8px' }}>
              Active investments
            </h2>
            <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 36px' }}>
              Join an active investment round and start tracking your cargo across the globe.
            </p>

            {investments.length === 0 ? (
              <p style={{ color: '#334155', textAlign: 'center', marginTop: 60, fontSize: '0.9rem' }}>No active investments at the moment.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {investments.map((inv) => {
                  const st = STATUS_STYLE[inv.status] ?? STATUS_STYLE['active']!;
                  return (
                    <div
                      key={inv._id}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 20,
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${palette.accent}55`)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{inv.title}</h3>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: st.color,
                          background: st.bg,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {st.label}
                        </span>
                      </div>

                      <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>{inv.description}</p>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                        <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '4px 10px', fontSize: '0.72rem', color: '#94a3b8' }}>
                          Min {inv.minimumInvestment.toLocaleString()} {inv.currency}
                        </span>
                        <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '4px 10px', fontSize: '0.72rem', color: '#94a3b8' }}>
                          {inv.cargoCount} cargo{inv.cargoCount !== 1 ? 's' : ''}
                        </span>
                        <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '4px 10px', fontSize: '0.72rem', color: '#94a3b8' }}>
                          {inv.investorCount} investor{inv.investorCount !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        style={{
                          border: `1px solid ${palette.accent}55`,
                          borderRadius: 10,
                          padding: '10px',
                          background: 'transparent',
                          color: palette.accent,
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.16s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${palette.accent}18`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        Join this round →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Who Are We */}
        {section === 'who' && (
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 28px' }}>
            <p style={{ color: palette.accent, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, fontSize: '0.65rem', marginBottom: 8 }}>
              Our story
            </p>
            {siteContent?.title ? (
              <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, margin: '0 0 32px' }}>
                {siteContent.title}
              </h2>
            ) : (
              <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, margin: '0 0 32px' }}>
                Who Are We?
              </h2>
            )}

            {siteContent?.body ? (
              <p style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: '0.95rem', margin: '0 0 40px' }}>
                {siteContent.body}
              </p>
            ) : (
              <p style={{ color: '#334155', fontSize: '0.9rem' }}>Content coming soon.</p>
            )}

            {(siteContent?.mediaUrls ?? []).length > 0 && (
              <StoryMediaGallery urls={siteContent!.mediaUrls ?? []} accentColor={palette.accent} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
