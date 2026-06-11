import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicProduct, PublicBundle, ShopGalleries } from '../../api/portalApi';
import ShopSection, { ShopTheme, shopThemeVars } from './ShopSection';
import ShopGallery from './ShopGallery';
import BundleSection from './BundleSection';
import '../../styles/shop.css';

export type ShopFamily = 'earth' | 'hands';

/**
 * Classify a product into one of the two shop families.
 * Primary signal is the explicit `section` field; legacy products without it
 * fall back to keyword matching on their category tag so nothing disappears.
 */
export function productFamily(p: { section?: string; category?: string }): ShopFamily {
  const section = (p.section || '').toLowerCase();
  if (section === 'artisanal') return 'hands';
  if (section === 'food') return 'earth';
  const c = (p.category || '').toLowerCase();
  if (/artisan|instrument|djembe|percuss|drum|craft|mask|kora|balafon|sculpt/.test(c)) return 'hands';
  return 'earth';
}

export interface ShopFamilyLabels {
  earthTitle: string;
  earthSub: string;
  handsTitle: string;
  handsSub: string;
  empty?: string;
  gallery?: string;
}

interface ShopSectionsProps {
  products: PublicProduct[];
  bundles?: PublicBundle[];
  loading?: boolean;
  theme?: ShopTheme;
  shipNote?: string;
  labels: ShopFamilyLabels;
  galleries?: ShopGalleries;
  initialProductId?: string;
  onActiveChange?: (product: PublicProduct | null) => void;
  onOrdered?: (product: PublicProduct) => void;
}

/**
 * Renders the shop as two distinct titled families — "From the Earth" (food /
 * organic) and "From the Hands" (artisanal / instruments) — reusing the exact
 * same ShopSection grid & card design. Empty families are hidden entirely.
 */
const HOW_STEPS = [
  { emoji: '🛍️', key: 'how.step1' },
  { emoji: '📋', key: 'how.step2' },
  { emoji: '🚀', key: 'how.step3' },
];

const ShopSections: React.FC<ShopSectionsProps> = ({
  products, bundles = [], loading, theme, shipNote, labels, galleries, initialProductId, onActiveChange, onOrdered,
}) => {
  const { t } = useTranslation('landing');
  const rootStyle = useMemo(() => shopThemeVars(theme), [theme]);

  const families = useMemo(() => {
    const earth = products.filter((p) => productFamily(p) === 'earth');
    const hands = products.filter((p) => productFamily(p) === 'hands');
    const earthBundles = bundles.filter((b) => (b.section ?? 'food') === 'food');
    const handsBundles = bundles.filter((b) => b.section === 'artisanal');
    return [
      { key: 'earth' as const, items: earth, bundles: earthBundles, title: labels.earthTitle, sub: labels.earthSub },
      { key: 'hands' as const, items: hands, bundles: handsBundles, title: labels.handsTitle, sub: labels.handsSub },
    ].filter((f) => f.items.length > 0 || f.bundles.length > 0);
  }, [products, bundles, labels]);

  // Loading or totally empty: defer to a single ShopSection (skeleton / empty copy).
  if (loading || products.length === 0) {
    return (
      <div className="shop-root" style={rootStyle}>
        <ShopSection products={[]} loading={loading} theme={theme} emptyLabel={labels.empty} />
      </div>
    );
  }

  return (
    <div className="shop-root" style={rootStyle}>
      <div className="shop-how-it-works">
        {HOW_STEPS.map((s, i) => (
          <div key={i} className="shop-how-step">
            {i > 0 && <span className="shop-how-arrow" aria-hidden="true">→</span>}
            <span className="shop-how-emoji">{s.emoji}</span>
            <span className="shop-how-label">{t(s.key)}</span>
          </div>
        ))}
      </div>
      {families.map((f) => (
        <section key={f.key} className="shop-family">
          <h3 className="shop-family-title">{f.title}</h3>
          <p className="shop-family-sub">{f.sub}</p>
          <BundleSection bundles={f.bundles} shipNote={shipNote} inline />
          {/* initialProductId is forwarded to both families; only the one that
              actually contains the product opens its modal. */}
          <ShopSection
            products={f.items}
            theme={theme}
            shipNote={shipNote}
            initialProductId={initialProductId}
            onActiveChange={onActiveChange}
            onOrdered={onOrdered}
          />
          <ShopGallery
            urls={f.key === 'earth' ? (galleries?.earth ?? []) : (galleries?.hands ?? [])}
            label={labels.gallery}
          />
        </section>
      ))}
    </div>
  );
};

export default ShopSections;
