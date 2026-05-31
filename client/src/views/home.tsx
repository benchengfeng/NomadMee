import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingThemes } from '../utils/landingThemes';
import WorldMap from '../components/WorldMap';
import StoryMediaGallery from '../components/cargo/StoryMediaGallery';
import { getPublicInvestments, getPublicSiteContent, PublicInvestment, SiteContent } from '../api/portalApi';
import '../styles/landing.css';

type LandingSection = 'globe' | 'investments' | 'who';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Active',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  in_progress: { label: 'In Progress', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  waiting:     { label: 'Waiting',     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

const NAV_ITEMS: Array<{ id: LandingSection; label: string }> = [
  { id: 'globe', label: 'The Globe' },
  { id: 'investments', label: 'Investments' },
  { id: 'who', label: 'Who Are We?' },
];

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

  return (
    <div className="landing-shell">
      {/* ── Nav bar ── */}
      <nav className="landing-nav">
        <span className="landing-brand" style={{ color: palette.accent }}>NomadMee</span>

        <div className="landing-nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`landing-nav-link${section === item.id ? ' landing-nav-link--active' : ''}`}
              style={section === item.id ? { background: palette.accent } : undefined}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="landing-nav-right">
          <div className="landing-theme-dots">
            {landingThemes.map((t, i) => (
              <button
                key={t.name}
                type="button"
                className="landing-theme-dot"
                onClick={() => setSelectedTheme(i)}
                aria-label={t.name}
                style={{
                  background: t.accent,
                  border: `2px solid ${i === selectedTheme ? '#fff' : 'transparent'}`,
                  boxShadow: i === selectedTheme ? `0 0 0 2px ${t.accent}55` : 'none',
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="landing-cta-btn"
            onClick={() => navigate('/login')}
            style={{ background: `linear-gradient(90deg, ${palette.accent}, ${palette.highlight})`, color: '#000' }}
          >
            Login →
          </button>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className={`landing-content ${section === 'globe' ? 'landing-content--globe' : 'landing-content--scroll'}`}>

        {/* Globe */}
        {section === 'globe' && <WorldMap accentColor={palette.accent} />}

        {/* Investments */}
        {section === 'investments' && (
          <div className="landing-section-inner">
            <p className="landing-section-eyebrow" style={{ color: palette.accent }}>Open rounds</p>
            <h2 className="landing-section-title">Active investments</h2>
            <p className="landing-section-sub">
              Join an active investment round and start tracking your cargo across the globe.
            </p>

            {investments.length === 0 ? (
              <p style={{ color: '#334155', textAlign: 'center', marginTop: 60, fontSize: '0.9rem' }}>
                No active investments at the moment.
              </p>
            ) : (
              <div className="investment-card-grid">
                {investments.map((inv) => {
                  const st = STATUS_STYLE[inv.status] ?? STATUS_STYLE['active']!;
                  return (
                    <div
                      key={inv._id}
                      className="investment-card"
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${palette.accent}55`)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    >
                      <div className="investment-card-header">
                        <h3 className="investment-card-title">{inv.title}</h3>
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

                      <p className="investment-card-desc">{inv.description}</p>

                      <div className="investment-card-tags">
                        <span className="investment-card-tag">Min {inv.minimumInvestment.toLocaleString()} {inv.currency}</span>
                        <span className="investment-card-tag">{inv.cargoCount} cargo{inv.cargoCount !== 1 ? 's' : ''}</span>
                        <span className="investment-card-tag">{inv.investorCount} investor{inv.investorCount !== 1 ? 's' : ''}</span>
                      </div>

                      <button
                        type="button"
                        className="investment-card-join"
                        onClick={() => navigate('/login')}
                        style={{ border: `1px solid ${palette.accent}55`, color: palette.accent }}
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
          <div className="landing-who-inner">
            <p className="landing-section-eyebrow" style={{ color: palette.accent }}>Our story</p>
            <h2 className="landing-section-title">
              {siteContent?.title || 'Who Are We?'}
            </h2>
            {siteContent?.body ? (
              <p className="landing-who-body">{siteContent.body}</p>
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
