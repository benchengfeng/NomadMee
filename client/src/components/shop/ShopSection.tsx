import React, { useEffect, useMemo, useState } from 'react';
import { PublicProduct, ProductVariant, submitProductOrder } from '../../api/portalApi';
import { COUNTRIES } from '../../utils/countries';
import '../../styles/shop.css';

export interface ShopTheme {
  accent?: string;
  surface?: string;
  card?: string;
  text?: string;
  muted?: string;
  border?: string;
  modalBg?: string;
}

/** Maps a ShopTheme into the CSS custom properties consumed by `.shop-root`. */
export function shopThemeVars(theme?: ShopTheme): React.CSSProperties {
  const s: Record<string, string> = {};
  if (theme?.accent) s['--shop-accent'] = theme.accent;
  if (theme?.surface) s['--shop-surface'] = theme.surface;
  if (theme?.card) s['--shop-card'] = theme.card;
  if (theme?.text) s['--shop-text'] = theme.text;
  if (theme?.muted) s['--shop-muted'] = theme.muted;
  if (theme?.border) s['--shop-border'] = theme.border;
  if (theme?.modalBg) s['--shop-modal-bg'] = theme.modalBg;
  return s as React.CSSProperties;
}

interface ShopSectionProps {
  products: PublicProduct[];
  loading?: boolean;
  theme?: ShopTheme;
  emptyLabel?: string;
  /** Small shipping notice shown under the price. */
  shipNote?: string;
  /** Open this product's modal on mount (deep-linking, e.g. /shop/:id). */
  initialProductId?: string;
  /** Fired when the open product changes — lets a host page sync the URL. */
  onActiveChange?: (product: PublicProduct | null) => void;
  /** Fired when a buyer successfully places an order (for analytics). */
  onOrdered?: (product: PublicProduct) => void;
}

// The symbol always matches the currency the product is stored in, so the
// displayed price can never disagree with the amount recorded on the order.
const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', TND: 'DT', CNY: '¥', GBP: '£' };
function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[(currency || '').toUpperCase()] ?? currency;
}

function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString()} ${currencySymbol(currency)}`;
}

// A little gamified flavour: a glyph per category (matched loosely, with a
// friendly fallback) so the filter chips feel playful rather than utilitarian.
const CATEGORY_EMOJI: Array<[RegExp, string]> = [
  [/superfood|super/i, '🌱'],
  [/tea|herbal|infusion/i, '🍵'],
  [/spice|pepper|chili|chilli/i, '🌶️'],
  [/grain|cereal|rice|sorghum|millet/i, '🌾'],
  [/nut|tiger ?nut|seed/i, '🥜'],
  [/oil|butter|shea/i, '🫗'],
  [/snack|bar|bite/i, '🍪'],
  [/fruit|dried/i, '🥭'],
  [/honey|sweet/i, '🍯'],
  [/coffee|cocoa|cacao/i, '☕'],
];

function categoryEmoji(category: string): string {
  for (const [re, emoji] of CATEGORY_EMOJI) if (re.test(category)) return emoji;
  return '🏷️';
}

const ShopSection: React.FC<ShopSectionProps> = ({ products, loading, theme, emptyLabel, shipNote, initialProductId, onActiveChange, onOrdered }) => {
  const [active, setActive] = useState<PublicProduct | null>(null);
  const [category, setCategory] = useState<string>('all');

  // Distinct categories present in the catalogue, with product counts.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const c = (p.category || '').trim();
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [products]);

  // Reset the filter if the selected category disappears (e.g. after a reload).
  useEffect(() => {
    if (category !== 'all' && !categories.some((c) => c.name === category)) setCategory('all');
  }, [categories, category]);

  const visibleProducts = useMemo(
    () => (category === 'all' ? products : products.filter((p) => (p.category || '').trim() === category)),
    [products, category],
  );

  // User-driven open/close — also notifies the host so it can update the URL.
  const selectProduct = (product: PublicProduct | null) => {
    setActive(product);
    onActiveChange?.(product);
  };

  // URL → state: open the deep-linked product once it's available.
  useEffect(() => {
    if (!initialProductId) return;
    const found = products.find((p) => p._id === initialProductId);
    setActive((prev) => (found && prev?._id !== found._id ? found : prev));
  }, [initialProductId, products]);

  const rootStyle = useMemo(() => shopThemeVars(theme), [theme]);

  return (
    <div className="shop-root" style={rootStyle}>
      {loading ? (
        <div className="shop-grid">
          <div className="shop-skeleton" />
          <div className="shop-skeleton" />
          <div className="shop-skeleton" />
        </div>
      ) : products.length === 0 ? (
        <p className="shop-empty">{emptyLabel ?? 'Products coming soon.'}</p>
      ) : (
        <>
          {categories.length > 1 && (
            <div className="shop-filter" role="tablist" aria-label="Filter by category">
              <button
                type="button"
                role="tab"
                aria-selected={category === 'all'}
                className={`shop-chip${category === 'all' ? ' shop-chip--active' : ''}`}
                onClick={() => setCategory('all')}
              >
                <span className="shop-chip-emoji">✨</span>
                All
                <span className="shop-chip-count">{products.length}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  role="tab"
                  aria-selected={category === c.name}
                  className={`shop-chip${category === c.name ? ' shop-chip--active' : ''}`}
                  onClick={() => setCategory(c.name)}
                >
                  <span className="shop-chip-emoji">{categoryEmoji(c.name)}</span>
                  {c.name}
                  <span className="shop-chip-count">{c.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* keyed by category so cards re-run their staggered entrance on filter */}
          <div className="shop-grid" key={category}>
          {visibleProducts.map((p, i) => {
            const out = p.stock <= 0;
            return (
              <button
                key={p._id}
                type="button"
                className="shop-card"
                style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
                onClick={() => selectProduct(p)}
              >
                <div className="shop-card-media">
                  {p.coverImageUrl ? (
                    <img src={p.coverImageUrl} alt={p.name} loading="lazy" />
                  ) : (
                    <div className="shop-card-media-empty">🌿</div>
                  )}
                  {p.category && <span className="shop-card-cat">{p.category}</span>}
                  {out && <span className="shop-card-out">Out of stock</span>}
                </div>
                <div className="shop-card-body">
                  <h3 className="shop-card-name">{p.name}</h3>
                  <p className="shop-card-desc">{p.description}</p>
                  <div className="shop-card-footer">
                    <span className="shop-card-price">
                      {p.price.toLocaleString()}<small>{currencySymbol(p.currency)}</small>
                    </span>
                    <span className="shop-card-btn">Order Now</span>
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </>
      )}

      {active && (
        <ProductModal
          product={active}
          shipNote={shipNote}
          onClose={() => selectProduct(null)}
          onOrdered={() => onOrdered?.(active)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Product detail + order modal
// ---------------------------------------------------------------------------

interface ProductModalProps {
  product: PublicProduct;
  shipNote?: string;
  onClose: () => void;
  onOrdered: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, shipNote, onClose, onOrdered }) => {
  const gallery = useMemo(
    () => [product.coverImageUrl, ...(product.images || [])].filter(Boolean),
    [product]
  );
  const [activeImg, setActiveImg] = useState(0);
  const [variant, setVariant] = useState<ProductVariant | null>(product.variants?.[0] ?? null);
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState<'detail' | 'form' | 'done'>('detail');

  const [fullName, setFullName] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [contactDetail, setContactDetail] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — must stay empty
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const unitPrice = variant ? variant.price : product.price;
  const total = unitPrice * qty;
  const out = product.stock <= 0;

  // Canonical, shareable link to this product on the public shop page —
  // works no matter which surface the modal was opened from.
  const shareUrl = `${window.location.origin}/shop/${product._id}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('input');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitProductOrder({
        productId: product._id,
        variant: variant?.label,
        quantity: qty,
        fullName: fullName.trim(),
        contactMethod,
        contactDetail: contactDetail.trim(),
        country: country.trim(),
        message: message.trim(),
        website,
      });
      onOrdered();
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shop-modal-overlay" onClick={onClose}>
      <div className="shop-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="shop-modal-close" onClick={onClose} aria-label="Close">✕</button>

        {step === 'done' ? (
          <div className="shop-success">
            <div className="shop-success-icon">✓</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800 }}>Thank you for your order!</h3>
            <p style={{ margin: '0 auto', maxWidth: 400, fontSize: '0.88rem', color: 'var(--shop-muted)', lineHeight: 1.65 }}>
              {fullName.split(' ')[0] ? `Thanks, ${fullName.split(' ')[0]} — your` : 'Your'} request for <strong style={{ color: 'var(--shop-text)' }}>{product.name}</strong> is in.
              We’ll contact you on {contactMethod === 'whatsapp' ? 'WhatsApp' : 'email'} at <strong style={{ color: 'var(--shop-text)' }}>{contactDetail}</strong> within 24 hours to confirm shipping costs to your location and share payment details. We ship worldwide. 🌍
            </p>
            <button type="button" className="shop-order-btn" style={{ marginTop: 22, width: '100%', maxWidth: 240 }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <div className="shop-modal-grid">
            {/* Media */}
            <div className="shop-modal-media">
              {gallery.length > 0 ? (
                <img className="shop-modal-cover" src={gallery[activeImg]} alt={product.name} />
              ) : (
                <div className="shop-modal-cover-empty">🌿</div>
              )}
              {gallery.length > 1 && (
                <div className="shop-modal-thumbs">
                  {gallery.map((src, i) => (
                    <img
                      key={src + i}
                      src={src}
                      alt=""
                      className={`shop-modal-thumb${i === activeImg ? ' shop-modal-thumb--active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="shop-modal-body">
              {product.category && <span className="shop-modal-cat">{product.category}</span>}
              <h2 className="shop-modal-name">{product.name}</h2>

              {step === 'detail' ? (
                <>
                  <div className="shop-modal-price">
                    {formatPrice(unitPrice, product.currency)}
                    {variant && <small>· {variant.label}</small>}
                  </div>
                  {shipNote && <p className="shop-ship-note">🚚 {shipNote}</p>}

                  <button type="button" className={`shop-share-btn${copied ? ' shop-share-btn--done' : ''}`} onClick={copyLink}>
                    {copied ? '✓ Link copied!' : '🔗 Copy share link'}
                  </button>

                  {product.description && <p className="shop-modal-desc">{product.description}</p>}

                  {product.originStory && (
                    <>
                      <p className="shop-modal-section-label">🌍 From the source</p>
                      <p className="shop-modal-origin">{product.originStory}</p>
                    </>
                  )}

                  {product.variants && product.variants.length > 0 && (
                    <>
                      <p className="shop-modal-section-label">Choose a size</p>
                      <div className="shop-variants">
                        {product.variants.map((v) => (
                          <button
                            key={v.label}
                            type="button"
                            className={`shop-variant${variant?.label === v.label ? ' shop-variant--active' : ''}`}
                            onClick={() => setVariant(v)}
                          >
                            {v.label} · {formatPrice(v.price, product.currency)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <p className="shop-modal-section-label">Quantity</p>
                  <div className="shop-qty">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
                  </div>

                  <button
                    type="button"
                    className="shop-order-btn"
                    disabled={out}
                    onClick={() => setStep('form')}
                  >
                    {out ? 'Out of stock' : `Order Now · ${formatPrice(total, product.currency)}`}
                  </button>
                </>
              ) : (
                <form className="shop-form" onSubmit={submit}>
                  {/* Honeypot — hidden from humans; bots that fill it are dropped server-side. */}
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                  />
                  <button type="button" className="shop-form-back" onClick={() => setStep('detail')}>← Back to product</button>

                  <div className="shop-order-summary">
                    <strong>{product.name}</strong>{variant ? ` · ${variant.label}` : ''} × {qty}
                    <br />Total: <strong>{formatPrice(total, product.currency)}</strong>
                  </div>

                  <div>
                    <label>Full name</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
                  </div>
                  <div>
                    <label>How should we reach you?</label>
                    <div className="shop-variants" style={{ marginTop: 2 }}>
                      <button
                        type="button"
                        className={`shop-variant${contactMethod === 'email' ? ' shop-variant--active' : ''}`}
                        onClick={() => setContactMethod('email')}
                      >
                        ✉️ Email
                      </button>
                      <button
                        type="button"
                        className={`shop-variant${contactMethod === 'whatsapp' ? ' shop-variant--active' : ''}`}
                        onClick={() => setContactMethod('whatsapp')}
                      >
                        📱 WhatsApp
                      </button>
                    </div>
                  </div>
                  <div>
                    <label>{contactMethod === 'email' ? 'Email address' : 'WhatsApp number'}</label>
                    <input
                      type={contactMethod === 'email' ? 'email' : 'tel'}
                      value={contactDetail}
                      onChange={(e) => setContactDetail(e.target.value)}
                      required
                      placeholder={contactMethod === 'email' ? 'you@example.com' : '+216 12 345 678'}
                    />
                  </div>
                  <div>
                    <label>Country</label>
                    <input list="shop-country-list" value={country} onChange={(e) => setCountry(e.target.value)} required autoComplete="off" placeholder="Where should we ship?" />
                    <datalist id="shop-country-list">
                      {COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label>Message (optional)</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Anything we should know?" />
                  </div>

                  {error && <p className="shop-error">{error}</p>}

                  <button type="submit" className="shop-order-btn" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Place order'}
                  </button>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--shop-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    No payment now — we’ll contact you to confirm &amp; arrange delivery.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopSection;
