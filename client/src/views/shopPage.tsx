import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { track } from '../utils/analytics';
import { getPublicBoutiques, PublicBoutique } from '../api/portalApi';
import '../styles/boutique.css';

const ACCENT = '#c8a06a';

type SectionFilter = 'all' | 'earth' | 'hands';

function BoutiqueCardSkeleton() {
  return (
    <div className="boutique-skeleton">
      <div className="boutique-skeleton-cover" />
      <div className="boutique-skeleton-body">
        <div className="boutique-skeleton-line" style={{ height: 12, width: '45%' }} />
        <div className="boutique-skeleton-line" style={{ height: 18, width: '75%' }} />
        <div className="boutique-skeleton-line" style={{ height: 12, width: '90%' }} />
        <div className="boutique-skeleton-line" style={{ height: 12, width: '60%' }} />
      </div>
    </div>
  );
}

function BoutiqueCard({ boutique }: { boutique: PublicBoutique }) {
  const accentRgba = boutique.accentColor
    ? `${boutique.accentColor}66`
    : 'rgba(200,160,106,0.4)';

  return (
    <Link
      to={`/shop/boutique/${boutique._id}`}
      className="boutique-card"
      style={{ '--card-accent': accentRgba } as React.CSSProperties}
      onClick={() => track('boutique_card_clicked', { boutique: boutique.name, section: boutique.section })}
    >
      <div className="boutique-card-cover">
        {boutique.coverImageUrl
          ? <img src={boutique.coverImageUrl} alt={boutique.name} loading="lazy" />
          : <div className="boutique-card-cover-empty">{boutique.section === 'earth' ? '🌍' : '🤲'}</div>
        }
        {boutique.logoUrl && (
          <img className="boutique-card-logo" src={boutique.logoUrl} alt="" />
        )}
      </div>

      <div className="boutique-card-body">
        {boutique.location && (
          <p className="boutique-card-location">{boutique.location}</p>
        )}
        <h2 className="boutique-card-name">{boutique.name}</h2>
        {boutique.tagline && (
          <p className="boutique-card-tagline">{boutique.tagline}</p>
        )}
        <div className="boutique-card-tags">
          {boutique.category && (
            <span className="boutique-tag">{boutique.category}</span>
          )}
          <span className="boutique-tag">
            {boutique.section === 'earth' ? 'From the Earth' : 'From the Hands'}
          </span>
        </div>

        <div className="boutique-card-footer">
          <span className="boutique-card-count">
            {boutique.productCount > 0
              ? `${boutique.productCount} product${boutique.productCount !== 1 ? 's' : ''}`
              : 'Opening soon'}
          </span>
          <span
            className="boutique-card-cta"
            style={{ background: boutique.accentColor || ACCENT }}
          >
            Visit Boutique →
          </span>
        </div>
      </div>
    </Link>
  );
}

const ShopPage: React.FC = () => {
  const { t } = useTranslation('landing');
  const [boutiques, setBoutiques] = useState<PublicBoutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SectionFilter>('all');
  const [loadError, setLoadError] = useState(false);

  const fetchBoutiques = () => {
    setLoading(true);
    setLoadError(false);
    getPublicBoutiques()
      .then((r) => setBoutiques(r.boutiques))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = 'NomadMe — Boutique Marketplace';
    track('boutique_directory_viewed');
    fetchBoutiques();
  }, []);

  const visible = boutiques.filter(
    (b) => filter === 'all' || b.section === filter
  );

  return (
    <div className="boutique-page">
      <nav className="boutique-nav">
        <Link
          to="/"
          className="boutique-nav-brand"
          style={{ color: ACCENT }}
          onClick={() => track('nav-click', { label: 'brand', from: 'shop' })}
        >
          <img src="/logo192.png" className="boutique-nav-logo" alt="" />
          NomadMe
        </Link>
        <div className="boutique-nav-right">
          <LanguageSwitcher variant="ghost" accentColor={ACCENT} />
          <Link
            to="/"
            className="boutique-nav-back"
            onClick={() => track('nav-click', { label: 'back-to-site', from: 'shop' })}
          >
            {t('shop.backToSite', 'Back to site')}
          </Link>
        </div>
      </nav>

      <header className="boutique-dir-hero">
        <p className="boutique-dir-eyebrow" style={{ color: ACCENT }}>
          {t('shop.eyebrow', 'The Marketplace')}
        </p>
        <h1 className="boutique-dir-title">
          {t('shop.marketplaceTitle', 'Curated Boutiques')}
        </h1>
        <p className="boutique-dir-sub">
          {t('shop.marketplaceSub', 'Every item comes from someone who made it with their hands. We know them by name.')}
        </p>
      </header>

      <div className="boutique-filter-bar">
        {(['all', 'earth', 'hands'] as SectionFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`boutique-filter-tab${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All Boutiques'
              : s === 'earth' ? '🌍 From the Earth'
              : '🤲 From the Hands'}
          </button>
        ))}
      </div>

      <main className="boutique-grid">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <BoutiqueCardSkeleton key={i} />
        ))}

        {!loading && loadError && (
          <div className="boutique-empty">
            <div className="boutique-empty-icon">⚠️</div>
            <p className="boutique-empty-text">
              {t('shopUi.loadError', 'Could not load boutiques.')}
            </p>
            <button
              type="button"
              onClick={fetchBoutiques}
              style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: `1px solid ${ACCENT}55`, background: 'transparent', color: ACCENT, cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}
            >
              {t('shopUi.retry', 'Retry')}
            </button>
          </div>
        )}

        {!loading && !loadError && visible.length === 0 && (
          <div className="boutique-empty">
            <div className="boutique-empty-icon">🏪</div>
            <p className="boutique-empty-text">
              {filter === 'all'
                ? 'No boutiques yet.'
                : `No boutiques in this section yet.`}
            </p>
          </div>
        )}

        {!loading && !loadError && visible.map((b) => (
          <BoutiqueCard key={b._id} boutique={b} />
        ))}
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', fontSize: '0.76rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span>© {new Date().getFullYear()} NomadMe</span>
        <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
        <Link to="/login" style={{ color: '#64748b', textDecoration: 'none' }} onClick={() => track('nav-click', { label: 'login', from: 'shop-footer' })}>
          {t('cta.login', 'Investor Login')}
        </Link>
      </footer>
    </div>
  );
};

export default ShopPage;
