import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSessionToken } from '../utils/auth';
import { landingThemes } from '../utils/landingThemes';
import WorldMap from '../components/WorldMap';
import StoryMediaGallery from '../components/cargo/StoryMediaGallery';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { SocialLinks } from '../components/common/socialPlatforms';
import PartnersShowcase from '../components/home/PartnersShowcase';
import ShopSections from '../components/shop/ShopSections';
import { track } from '../utils/analytics';
import { getPublicInvestments, getPublicSiteContent, getPublicProducts, getPublicPartners, getPublicJourneys, getPublicMapData, Partner, PublicInvestment, PublicProduct, PublicBundle, ShopGalleries, SiteContent, Journey, PublicMapStats } from '../api/portalApi';
import '../styles/landing.css';
import '../styles/journeys.css';

type LandingSection = 'globe' | 'investments' | 'journeys' | 'shop' | 'who';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  active:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  in_progress: { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  waiting:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

const NAV_ITEMS: Array<{ id: LandingSection; key: string }> = [
  { id: 'globe', key: 'nav.globe' },
  { id: 'investments', key: 'nav.investments' },
  { id: 'journeys', key: 'nav.journeys' },
  { id: 'shop', key: 'nav.shop' },
  { id: 'who', key: 'nav.whoAreWe' },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');
  const [section, setSection] = useState<LandingSection>('globe');

  // Logged-in investors go straight to their dashboard
  useEffect(() => {
    if (getSessionToken()) navigate('/home', { replace: true });
  }, [navigate]);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [investments, setInvestments] = useState<PublicInvestment[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [investmentsError, setInvestmentsError] = useState(false);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [bundles, setBundles] = useState<PublicBundle[]>([]);
  const [shopGalleries, setShopGalleries] = useState<ShopGalleries>({ earth: [], hands: [] });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loadingJourneys, setLoadingJourneys] = useState(false);
  const [journeysLoaded, setJourneysLoaded] = useState(false);
  const [liveStats, setLiveStats] = useState<PublicMapStats | null>(null);

  const idx = Math.min(Math.max(selectedTheme, 0), landingThemes.length - 1);
  const palette = landingThemes[idx] as (typeof landingThemes)[number];

  const switchTheme = (i: number) => {
    setSelectedTheme(i);
    setToastKey((k) => k + 1);
    setShowToast(true);
    track('theme-change', { theme: landingThemes[i]?.name });
    const timer = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(timer);
  };

  // CSS custom properties applied to the shell — every element inherits from these
  const themeVars = {
    '--lt-bg':           palette.background,
    '--lt-surface':      palette.surface,
    '--lt-accent':       palette.accent,
    '--lt-accent-soft':  palette.accentSoft,
    '--lt-accent-dim':   palette.accent + '50',
    '--lt-accent-ultra': palette.accent + '18',
    '--lt-border':       palette.border,
    '--lt-text':         palette.text,
    '--lt-muted':        palette.textMuted,
    '--lt-highlight':    palette.highlight,
    '--lt-nav-bg':       palette.navBg,
    '--lt-nav-border':   palette.navBorder,
    '--lt-nav-link':     palette.navLinkColor,
    '--lt-card-bg':      palette.cardBg,
    '--lt-card-border':  palette.cardBorder,
    '--lt-tag-bg':       palette.tagBg,
    '--lt-tag-text':     palette.tagText,
    '--lt-glow':         palette.glow,
  } as React.CSSProperties;

  // Fetch live stats once on mount — powers the globe stat strip
  useEffect(() => {
    getPublicMapData()
      .then((r) => setLiveStats(r.stats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (section === 'investments' && investments.length === 0) {
      setLoadingInvestments(true);
      setInvestmentsError(false);
      getPublicInvestments()
        .then((r) => setInvestments(r.investments))
        .catch(() => setInvestmentsError(true))
        .finally(() => setLoadingInvestments(false));
    }
    if (section === 'shop' && !productsLoaded) {
      setLoadingProducts(true);
      setProductsError(false);
      getPublicProducts()
        .then((r) => { setProducts(r.products); setShopGalleries(r.galleries); setBundles(r.bundles ?? []); setProductsLoaded(true); })
        .catch(() => setProductsError(true))
        .finally(() => setLoadingProducts(false));
    }
    if (section === 'journeys' && !journeysLoaded) {
      setLoadingJourneys(true);
      getPublicJourneys()
        .then((r) => { setJourneys(r.journeys); setJourneysLoaded(true); })
        .catch(() => {})
        .finally(() => setLoadingJourneys(false));
      track('journey_section_viewed');
    }
    if (section === 'who' && !siteContent) {
      getPublicSiteContent('who_are_we').then((r) => setSiteContent(r.content)).catch(() => {});
      getPublicPartners().then((r) => setPartners(r.partners)).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return (
    <div className={`landing-shell${section !== 'globe' ? ' landing-shell--scroll' : ''}`} style={themeVars}>

      {/* ── Atmospheric ambient overlay — unique per theme ── */}
      <div className="landing-ambient" style={{ background: palette.ambient }} />

      {/* ── Theme name toast ── */}
      {showToast && (
        <div className="landing-theme-toast" key={toastKey}>
          <span className="landing-theme-toast-emoji">{palette.emoji}</span>
          {palette.name}
        </div>
      )}

      {/* ── Nav bar ── */}
      <nav className="landing-nav">
        <span className="landing-brand" style={{ color: palette.accent }}>
          <img src="/logo192.png" className="brand-logo" alt="" />
          NomadMe
        </span>

        <div className="landing-nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`landing-nav-link${section === item.id ? ' landing-nav-link--active' : ''}`}
              style={section === item.id ? { background: palette.accent } : undefined}
              onClick={() => { setSection(item.id); track('landing-section', { section: item.id }); }}
            >
              {t(item.key)}
            </button>
          ))}
        </div>

        <div className="landing-nav-right">
          <LanguageSwitcher variant="ghost" accentColor={palette.accent} />
          <div className="landing-theme-fab-wrap">
            {themePickerOpen && (
              <div className="landing-theme-fab-panel" style={{ background: palette.surface, boxShadow: `0 8px 32px ${palette.glow}` }}>
                {landingThemes.map((th, i) => (
                  <button
                    key={th.name}
                    type="button"
                    className={`landing-theme-swatch${i === selectedTheme ? ' landing-theme-swatch--active' : ''}`}
                    onClick={() => { switchTheme(i); setThemePickerOpen(false); }}
                    aria-label={th.name}
                    title={`${th.emoji} ${th.name}`}
                    style={{
                      background: `conic-gradient(${th.background} 0deg 180deg, ${th.accent} 180deg 360deg)`,
                      boxShadow: i === selectedTheme
                        ? `0 0 0 2px #fff, 0 0 0 4px ${th.accent}88`
                        : 'none',
                    }}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              className="landing-theme-toggle"
              onClick={() => setThemePickerOpen((o) => !o)}
              aria-label="Toggle theme picker"
              style={{ background: palette.surface, border: `2px solid ${palette.accent}55`, boxShadow: `0 2px 10px ${palette.glow}` }}
            >
              <span style={{ fontSize: 18 }}>{palette.emoji}</span>
            </button>
          </div>
          <button
            type="button"
            className="landing-cta-btn"
            onClick={() => { track('login-cta'); navigate('/login'); }}
            style={{ background: `linear-gradient(90deg, ${palette.accent}, ${palette.highlight})`, color: '#000' }}
          >
            {t('cta.login')}
          </button>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className={`landing-content ${section === 'globe' ? 'landing-content--globe' : 'landing-content--scroll'}`}>

        {/* Globe */}
        {section === 'globe' && (
          <>
            <WorldMap accentColor={palette.accent} />
            <div className="landing-hero-overlay" style={{ '--hero-accent': palette.accent } as React.CSSProperties}>
              <p className="landing-hero-eyebrow">{t('globe.taglineEyebrow')}</p>
              <h1 className="landing-hero-headline">{t('globe.taglineHeadline')}</h1>
            </div>
            <div className="landing-stat-strip" style={{ '--stat-accent': palette.accent } as React.CSSProperties}>
              {liveStats ? (
                <>
                  <div className="landing-stat-item">
                    <span className="landing-stat-value">{liveStats.activeShipments}+</span>
                    <span className="landing-stat-label">{t('globe.statCargos', 'Active Shipments')}</span>
                  </div>
                  <span className="landing-stat-sep">·</span>
                  <div className="landing-stat-item">
                    <span className="landing-stat-value">{liveStats.countryCount}+</span>
                    <span className="landing-stat-label">{t('globe.statCountries', 'Countries')}</span>
                  </div>
                  <span className="landing-stat-sep">·</span>
                  <div className="landing-stat-item">
                    <span className="landing-stat-value">
                      {liveStats.goodsInTransitValue >= 1_000_000
                        ? `$${(liveStats.goodsInTransitValue / 1_000_000).toFixed(1)}M`
                        : liveStats.goodsInTransitValue >= 1_000
                        ? `$${Math.round(liveStats.goodsInTransitValue / 1_000)}K`
                        : `$${liveStats.goodsInTransitValue}`}
                    </span>
                    <span className="landing-stat-label">{t('globe.statTransit', 'In Transit')}</span>
                  </div>
                  <span className="landing-stat-sep">·</span>
                  <div className="landing-stat-item">
                    <span className="landing-stat-value">{liveStats.investorCount}</span>
                    <span className="landing-stat-label">{t('globe.statInvestors', 'Investors')}</span>
                  </div>
                  <span className="landing-stat-sep">·</span>
                  <div className="landing-stat-item">
                    <span className="landing-stat-value">{liveStats.journeyCount}</span>
                    <span className="landing-stat-label">{t('globe.statJourneys', 'Journeys')}</span>
                  </div>
                </>
              ) : (
                <div className="landing-stat-skeleton" />
              )}
            </div>
          </>
        )}

        {/* Investments */}
        {section === 'investments' && (
          <div className="landing-section-inner">
            <p className="landing-section-eyebrow" style={{ color: palette.accent }}>{t('investments.eyebrow')}</p>
            <h2 className="landing-section-title">{t('investments.title')}</h2>
            <p className="landing-section-sub">
              {t('investments.sub')}
            </p>

            {loadingInvestments ? (
              <div className="investment-card-grid">
                <div className="investment-card-skeleton" />
                <div className="investment-card-skeleton" />
                <div className="investment-card-skeleton" />
              </div>
            ) : investmentsError ? (
              <div style={{ textAlign: 'center', marginTop: 60 }}>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 12 }}>{t('shopUi.loadError')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setInvestmentsError(false);
                    setLoadingInvestments(true);
                    getPublicInvestments()
                      .then((r) => setInvestments(r.investments))
                      .catch(() => setInvestmentsError(true))
                      .finally(() => setLoadingInvestments(false));
                  }}
                  style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${palette.accent}55`, background: 'transparent', color: palette.accent, cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}
                >
                  {t('shopUi.retry')}
                </button>
              </div>
            ) : investments.length === 0 ? (
              <p style={{ color: '#334155', textAlign: 'center', marginTop: 60, fontSize: '0.9rem' }}>
                {t('investments.none')}
              </p>
            ) : (
              <div className="investment-card-grid">
                {investments.map((inv) => {
                  const st = STATUS_STYLE[inv.status] ?? STATUS_STYLE['active']!;
                  return (
                    <div
                      key={inv._id}
                      className="investment-card"
                    >
                      {inv.coverImageUrl && (
                        <img src={inv.coverImageUrl} alt="" className="investment-card-cover" />
                      )}
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
                          {t(`status.${inv.status}`)}
                        </span>
                      </div>

                      <p className="investment-card-desc">{inv.description}</p>

                      <div className="investment-card-tags">
                        <span className="investment-card-tag">{t('card.min')} {inv.minimumInvestment.toLocaleString()} {inv.currency}</span>
                        <span className="investment-card-tag">{t('card.cargo', { count: inv.cargoCount })}</span>
                        <span className="investment-card-tag">{t('card.investor', { count: inv.investorCount })}</span>
                      </div>

                      <button
                        type="button"
                        className="investment-card-join"
                        onClick={() => { track('join-click', { investmentId: inv._id }); navigate(`/join/${inv._id}`); }}
                      >
                        {t('card.join')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Journeys */}
        {section === 'journeys' && (
          <div className="landing-section-inner">
            <div className="journeys-section">
              <p className="journeys-eyebrow" style={{ color: palette.accent }}>{t('journeys.eyebrow')}</p>
              <h2 className="journeys-headline" style={{ color: palette.text }}>{t('journeys.title')}</h2>
              <p className="journeys-sub" style={{ color: palette.textMuted }}>{t('journeys.sub')}</p>

              {/* Journey cards */}
              {loadingJourneys ? (
                <div className="journeys-grid">
                  {[1,2].map((i) => (
                    <div key={i} className="journey-card" style={{ height: 380, background: `${palette.surface}`, animation: 'shimmer 1.6s infinite linear', backgroundSize: '200% 100%' }} />
                  ))}
                </div>
              ) : journeys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>🧭</div>
                  <p style={{ color: palette.textMuted, fontSize: '0.9rem' }}>{t('journeys.comingSoon')}</p>
                </div>
              ) : (
                <div className="journeys-grid">
                  {journeys.map((j) => {
                    const minPrice = j.durations.length > 0 ? Math.min(...j.durations.map((d) => d.price)) : null;
                    const minCurrency = j.durations[0]?.currency ?? 'USD';
                    return (
                      <a
                        key={j._id}
                        href={`/journeys/${j._id}`}
                        className="journey-card"
                        style={{ borderColor: `${palette.accent}22` }}
                        onClick={(e) => { e.preventDefault(); navigate(`/journeys/${j._id}`); track('journey_card_clicked', { journeyId: j._id }); }}
                      >
                        <div className="journey-card-cover">
                          {j.coverImageUrl ? (
                            <img src={j.coverImageUrl} alt={j.title} loading="lazy" />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${palette.accent}22, ${palette.surface})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.4 }}>🌍</div>
                          )}
                          <div className="journey-card-cover-overlay" />
                          <span className={`journey-spots-badge${j.status === 'full' ? ' journey-full-badge' : ''}`} style={{ color: j.status === 'full' ? undefined : palette.accent }}>
                            {j.status === 'full' ? t('journeys.full') : `${j.spotsRemaining} ${t('journeys.spotsLeft')}`}
                          </span>
                        </div>
                        <div className="journey-card-body">
                          <span className="journey-card-location" style={{ color: palette.accent }}>📍 {j.location}</span>
                          <h3 className="journey-card-title" style={{ color: palette.text }}>{j.title}</h3>
                          <p className="journey-card-excerpt" style={{ color: palette.textMuted }}>{j.tagline || j.story.slice(0, 160)}</p>
                          <div className="journey-card-durations">
                            {j.durations.map((d, i) => (
                              <span key={i} className="journey-duration-chip" style={{ borderColor: `${palette.accent}33`, color: palette.textMuted }}>{d.label}</span>
                            ))}
                          </div>
                          <div className="journey-card-footer">
                            {minPrice != null ? (
                              <span className="journey-card-price" style={{ color: palette.textMuted }}>
                                {t('journeys.from')} <strong style={{ color: palette.text }}>{minPrice.toLocaleString()} {minCurrency}</strong>
                              </span>
                            ) : <span />}
                            <span className="journey-card-cta" style={{ background: palette.accent, color: '#000' }}>{t('journeys.learnMore')}</span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* How it works */}
              <div className="journeys-how" style={{ background: `${palette.surface}88` }}>
                {(Array.isArray(t('journeys.howSteps', { returnObjects: true })) ? t('journeys.howSteps', { returnObjects: true }) as Array<{ icon: string; text: string }> : []).map((step, i) => (
                  <div key={i} className="journeys-how-step">
                    <span className="journeys-how-icon">{step.icon}</span>
                    <span className="journeys-how-label" style={{ color: palette.text }}>{step.text}</span>
                  </div>
                ))}
              </div>

              {/* Founder note */}
              <div className="journeys-founder-note" style={{ borderLeftColor: palette.accent, background: `${palette.surface}44` }}>
                <p className="journeys-founder-text" style={{ color: palette.text }}>
                  {t('journeys.founderNote')}
                </p>
                <p className="journeys-founder-name" style={{ color: palette.accent }}>{t('journeys.founderName')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Shop */}
        {section === 'shop' && (
          <div className="landing-section-inner">
            {productsError && (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 12 }}>{t('shopUi.loadError')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setProductsError(false);
                    setLoadingProducts(true);
                    getPublicProducts()
                      .then((r) => { setProducts(r.products); setShopGalleries(r.galleries); setProductsLoaded(true); })
                      .catch(() => setProductsError(true))
                      .finally(() => setLoadingProducts(false));
                  }}
                  style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${palette.accent}55`, background: 'transparent', color: palette.accent, cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}
                >
                  {t('shopUi.retry')}
                </button>
              </div>
            )}
            <ShopSections
              products={products}
              bundles={bundles}
              loading={loadingProducts}
              galleries={shopGalleries}
              shipNote={t('shop.shipNote')}
              labels={{
                earthTitle: t('shop.earthTitle'),
                earthSub: t('shop.earthSub'),
                handsTitle: t('shop.handsTitle'),
                handsSub: t('shop.handsSub'),
                empty: t('shop.none'),
                gallery: t('shop.gallery'),
              }}
              onOrdered={(p) => track('order-submit', { product: p.name })}
            />
          </div>
        )}

        {/* Who Are We */}
        {section === 'who' && (
          <div className="landing-who-inner">
            <p className="landing-section-eyebrow" style={{ color: palette.accent }}>{t('who.eyebrow')}</p>
            <h2 className="landing-section-title">
              {siteContent?.title || t('who.titleFallback')}
            </h2>
            {siteContent?.body ? (
              <p className="landing-who-body">{siteContent.body}</p>
            ) : (
              <p style={{ color: '#334155', fontSize: '0.9rem' }}>{t('who.comingSoon')}</p>
            )}
            {(siteContent?.mediaUrls ?? []).length > 0 && (
              <StoryMediaGallery urls={siteContent!.mediaUrls ?? []} accentColor={palette.accent} />
            )}
            <SocialLinks links={siteContent?.links ?? []} accent={palette.accent} className="social-links--who" />
            <PartnersShowcase partners={partners} accent={palette.accent} title={t('who.partnersTitle')} />
            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="landing-cta-btn"
                onClick={() => { track('contact-us-click'); navigate('/contact-us'); }}
                style={{ background: `linear-gradient(90deg, ${palette.accent}, ${palette.highlight})`, color: '#000', fontSize: '0.9rem', padding: '13px 32px' }}
              >
                {t('who.contactCta')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile-only floating theme strip ── */}
      <div className="landing-theme-strip-mobile" style={{ background: palette.navBg, borderColor: palette.navBorder }}>
        <button
          type="button"
          className="landing-theme-strip-toggle"
          onClick={() => setThemePickerOpen((o) => !o)}
          aria-label="Toggle theme picker"
        >
          <span className="landing-theme-strip-emoji">{palette.emoji}</span>
        </button>
        {themePickerOpen && landingThemes.map((th, i) => (
          <button
            key={th.name}
            type="button"
            className={`landing-theme-swatch${i === selectedTheme ? ' landing-theme-swatch--active' : ''}`}
            onClick={() => { switchTheme(i); setThemePickerOpen(false); }}
            aria-label={th.name}
            style={{
              background: `conic-gradient(${th.background} 0deg 180deg, ${th.accent} 180deg 360deg)`,
              boxShadow: i === selectedTheme
                ? `0 0 0 2px #fff, 0 0 0 4px ${th.accent}88`
                : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
