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
import { getPublicInvestments, getPublicSiteContent, getPublicProducts, getPublicPartners, Partner, PublicInvestment, PublicProduct, PublicBundle, ShopGalleries, SiteContent } from '../api/portalApi';
import '../styles/landing.css';

type LandingSection = 'globe' | 'investments' | 'shop' | 'who';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  active:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  in_progress: { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  waiting:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

const NAV_ITEMS: Array<{ id: LandingSection; key: string }> = [
  { id: 'globe', key: 'nav.globe' },
  { id: 'investments', key: 'nav.investments' },
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
          <div className="landing-theme-swatches">
            {landingThemes.map((th, i) => (
              <button
                key={th.name}
                type="button"
                className={`landing-theme-swatch${i === selectedTheme ? ' landing-theme-swatch--active' : ''}`}
                onClick={() => switchTheme(i)}
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
              <div className="landing-trust-bar">
                {(t('globe.trustStats', { returnObjects: true }) as Array<{ value: string; label: string }>).map((s, i) => (
                  <div key={i} className="landing-trust-chip" style={{ borderColor: `${palette.accent}44` }}>
                    <span className="landing-trust-value" style={{ color: palette.accent }}>{s.value}</span>
                    <span className="landing-trust-label">{s.label}</span>
                  </div>
                ))}
              </div>
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
      <div className="landing-theme-strip-mobile">
        <span className="landing-theme-strip-emoji">{palette.emoji}</span>
        {landingThemes.map((th, i) => (
          <button
            key={th.name}
            type="button"
            className={`landing-theme-swatch${i === selectedTheme ? ' landing-theme-swatch--active' : ''}`}
            onClick={() => switchTheme(i)}
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
