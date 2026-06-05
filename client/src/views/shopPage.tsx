import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ShopSections from '../components/shop/ShopSections';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { track } from '../utils/analytics';
import { getPublicProducts, PublicProduct, ShopGalleries } from '../api/portalApi';
import '../styles/shop.css';

const ACCENT = '#c8a06a';

/**
 * Standalone, shareable shop page.
 *   /shop             → product grid
 *   /shop/:productId  → grid with that product's order modal open
 * Public (no auth) so it can be linked directly from social media.
 */
const ShopPage: React.FC = () => {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();

  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [galleries, setGalleries] = useState<ShopGalleries>({ earth: [], hands: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'NomadMe — Shop';
    track('shop-open');
    getPublicProducts()
      .then((r) => { setProducts(r.products); setGalleries(r.galleries); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="shop-page">
      <nav className="shop-page-nav">
        <Link to="/" className="shop-page-brand" style={{ color: ACCENT }}>
          <img src="/logo192.png" className="shop-page-logo" alt="" />
          NomadMe
        </Link>
        <div className="shop-page-nav-right">
          <LanguageSwitcher variant="ghost" accentColor={ACCENT} />
          <Link to="/" className="shop-page-back">{t('shop.backToSite', 'Back to site')}</Link>
        </div>
      </nav>

      <header className="shop-page-hero">
        <p className="shop-page-eyebrow" style={{ color: ACCENT }}>{t('shop.eyebrow')}</p>
        <h1 className="shop-page-title">{t('shop.title')}</h1>
        <p className="shop-page-sub">{t('shop.sub')}</p>
      </header>

      <main className="shop-page-body">
        <ShopSections
          products={products}
          loading={loading}
          galleries={galleries}
          shipNote={t('shop.shipNote')}
          labels={{
            earthTitle: t('shop.earthTitle'),
            earthSub: t('shop.earthSub'),
            handsTitle: t('shop.handsTitle'),
            handsSub: t('shop.handsSub'),
            empty: t('shop.none'),
            gallery: t('shop.gallery'),
          }}
          initialProductId={productId}
          onActiveChange={(p) => navigate(p ? `/shop/${p._id}` : '/shop', { replace: true })}
          onOrdered={(p) => track('order-submit', { product: p.name, source: 'shop-page' })}
        />
      </main>

      <footer className="shop-page-footer">
        <span>© {new Date().getFullYear()} NomadMe</span>
        <Link to="/login" className="shop-page-footer-link">{t('cta.login')}</Link>
      </footer>
    </div>
  );
};

export default ShopPage;
