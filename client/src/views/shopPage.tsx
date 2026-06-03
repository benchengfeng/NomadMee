import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ShopSection from '../components/shop/ShopSection';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { track } from '../utils/analytics';
import { getPublicProducts, PublicProduct } from '../api/portalApi';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'NomadMee — Shop';
    track('shop-open');
    getPublicProducts()
      .then((r) => setProducts(r.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="shop-page">
      <nav className="shop-page-nav">
        <Link to="/" className="shop-page-brand" style={{ color: ACCENT }}>
          <img src="/logo192.png" className="shop-page-logo" alt="" />
          NomadMee
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
        <ShopSection
          products={products}
          loading={loading}
          emptyLabel={t('shop.none')}
          shipNote={t('shop.shipNote')}
          initialProductId={productId}
          onActiveChange={(p) => navigate(p ? `/shop/${p._id}` : '/shop', { replace: true })}
          onOrdered={(p) => track('order-submit', { product: p.name, source: 'shop-page' })}
        />
      </main>

      <footer className="shop-page-footer">
        <span>© {new Date().getFullYear()} NomadMee</span>
        <Link to="/login" className="shop-page-footer-link">{t('cta.login')}</Link>
      </footer>
    </div>
  );
};

export default ShopPage;
