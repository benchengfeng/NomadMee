import React, { useMemo } from 'react';
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
const ShopSections: React.FC<ShopSectionsProps> = ({
  products, bundles = [], loading, theme, shipNote, labels, galleries, initialProductId, onActiveChange, onOrdered,
}) => {
  const rootStyle = useMemo(() => shopThemeVars(theme), [theme]);

  const families = useMemo(() => {
    const earth = products.filter((p) => productFamily(p) === 'earth');
    const hands = products.filter((p) => productFamily(p) === 'hands');
    return [
      { key: 'earth' as const, items: earth, title: labels.earthTitle, sub: labels.earthSub },
      { key: 'hands' as const, items: hands, title: labels.handsTitle, sub: labels.handsSub },
    ].filter((f) => f.items.length > 0);
  }, [products, labels]);

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
      <BundleSection bundles={bundles} shipNote={shipNote} />
      {families.map((f) => (
        <section key={f.key} className="shop-family">
          <h3 className="shop-family-title">{f.title}</h3>
          <p className="shop-family-sub">{f.sub}</p>
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
