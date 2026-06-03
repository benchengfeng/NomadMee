import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { landingThemes } from '../utils/landingThemes';
import WorldMap from '../components/WorldMap';
import StoryMediaGallery from '../components/cargo/StoryMediaGallery';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { SocialLinks } from '../components/common/socialPlatforms';
import ShopSection from '../components/shop/ShopSection';
import { track } from '../utils/analytics';
import { getPublicInvestments, getPublicSiteContent, getPublicProducts, PublicInvestment, PublicProduct, SiteContent } from '../api/portalApi';
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
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [investments, setInvestments] = useState<PublicInvestment[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);

  const idx = Math.min(Math.max(selectedTheme, 0), landingThemes.length - 1);
  const palette = landingThemes[idx] as (typeof landingThemes)[number];

  useEffect(() => {
    if (section === 'investments' && investments.length === 0) {
      setLoadingInvestments(true);
      getPublicInvestments()
        .then((r) => setInvestments(r.investments))
        .catch(() => {})
        .finally(() => setLoadingInvestments(false));
    }
    if (section === 'shop' && !productsLoaded) {
      setLoadingProducts(true);
      getPublicProducts()
        .then((r) => { setProducts(r.products); setProductsLoaded(true); })
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
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
        <span className="landing-brand" style={{ color: palette.accent }}>
          <img src="/logo192.png" className="brand-logo" alt="" />
          NomadMee
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
        {section === 'globe' && <WorldMap accentColor={palette.accent} />}

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
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${palette.accent}55`)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
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
                        style={{ border: `1px solid ${palette.accent}55`, color: palette.accent }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${palette.accent}18`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
            <p className="landing-section-eyebrow" style={{ color: '#c8a06a' }}>{t('shop.eyebrow')}</p>
            <h2 className="landing-section-title">{t('shop.title')}</h2>
            <p className="landing-section-sub">{t('shop.sub')}</p>
            <ShopSection
              products={products}
              loading={loadingProducts}
              emptyLabel={t('shop.none')}
              shipNote={t('shop.shipNote')}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
