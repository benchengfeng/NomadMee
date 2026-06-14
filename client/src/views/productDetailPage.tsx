import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { track } from '../utils/analytics';
import {
  getPublicBoutiqueProducts,
  getPublicBoutique,
  submitProductOrder,
  PublicProduct,
  Boutique,
} from '../api/portalApi';
import '../styles/boutique.css';

const DEFAULT_ACCENT = '#c8a06a';

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { boutiqueId, productId } = useParams<{ boutiqueId: string; productId: string }>();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Gallery
  const [activeImg, setActiveImg] = useState(0);

  // Price matrix selection
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);
  const [selectedOptIdx, setSelectedOptIdx] = useState<number | null>(null);

  // Simple variant selection
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);

  // Custom order toggle
  const [showCustomOrder, setShowCustomOrder] = useState(false);

  // Order form
  const [ofName, setOfName] = useState('');
  const [ofMethod, setOfMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [ofContact, setOfContact] = useState('');
  const [ofQty, setOfQty] = useState(1);
  const [ofMessage, setOfMessage] = useState('');
  const [ofHoney, setOfHoney] = useState('');
  const [ofSending, setOfSending] = useState(false);
  const [ofSent, setOfSent] = useState(false);

  useEffect(() => {
    if (!boutiqueId || !productId) return;
    setLoading(true);
    Promise.all([
      getPublicBoutique(boutiqueId),
      getPublicBoutiqueProducts(boutiqueId),
    ])
      .then(([{ boutique: b }, { products }]) => {
        const p = products.find((x) => x._id === productId);
        if (!p) { setLoadError(true); return; }
        setBoutique(b);
        setProduct(p);
        document.title = `NomadMe — ${p.name}`;
        track('boutique_product_clicked', { boutique: b.name, product: p.name });
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [boutiqueId, productId]);

  if (loading) {
    return (
      <div className="product-detail-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎁</div>
          <p style={{ fontSize: '0.85rem' }}>Loading product…</p>
        </div>
      </div>
    );
  }

  if (loadError || !product || !boutique) {
    return (
      <div className="product-detail-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>Could not load this product.</p>
          <button type="button" onClick={() => navigate(`/shop/boutique/${boutiqueId}`)} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${DEFAULT_ACCENT}55`, background: 'transparent', color: DEFAULT_ACCENT, cursor: 'pointer', fontWeight: 700 }}>
            ← Back to boutique
          </button>
        </div>
      </div>
    );
  }

  const accent = boutique.accentColor || DEFAULT_ACCENT;

  const hasMatrix = product.priceMatrix && product.priceMatrix.length > 0;
  const hasVariants = product.variants && product.variants.length > 0;

  // Compute the displayed price
  let displayPrice: number | null = product.price;
  let displayCurrency = product.currency;
  let priceIsFrom = false;

  if (hasMatrix) {
    if (selectedRowIdx !== null && selectedOptIdx !== null) {
      const opt = product.priceMatrix[selectedRowIdx]?.options[selectedOptIdx];
      if (opt) { displayPrice = opt.price; displayCurrency = opt.currency; }
    } else {
      const all = product.priceMatrix.flatMap((r) => r.options.map((o) => o.price));
      displayPrice = all.length ? Math.min(...all) : product.price;
      priceIsFrom = true;
    }
  } else if (hasVariants && selectedVariantIdx !== null) {
    displayPrice = product.variants[selectedVariantIdx]?.price ?? product.price;
  }

  // Gallery images
  const allImages = [product.coverImageUrl, ...(product.images || [])].filter(Boolean);

  // Determine order variant string
  function buildVariantLabel(): string {
    if (hasMatrix && selectedRowIdx !== null && selectedOptIdx !== null) {
      const row = product!.priceMatrix[selectedRowIdx];
      const opt = row?.options[selectedOptIdx];
      return [row?.label, opt?.label].filter(Boolean).join(' / ');
    }
    if (hasVariants && selectedVariantIdx !== null) {
      return product!.variants[selectedVariantIdx]?.label ?? '';
    }
    return '';
  }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (ofHoney) return;
    setOfSending(true);
    try {
      await submitProductOrder({
        productId: product!._id,
        variant: buildVariantLabel(),
        quantity: ofQty,
        fullName: ofName,
        contactMethod: ofMethod,
        contactDetail: ofContact,
        country: '',
        message: ofMessage,
        website: ofHoney,
      });
      setOfSent(true);
      track('order-submit', { product: product!.name, boutique: boutique!.name, variant: buildVariantLabel() });
    } catch {
      setOfSent(true);
    } finally {
      setOfSending(false);
    }
  }

  return (
    <div
      className="product-detail-shell"
      style={{ '--boutique-accent': accent } as React.CSSProperties}
    >
      {/* Nav */}
      <nav className="boutique-nav">
        <Link to="/shop" className="boutique-nav-brand" style={{ color: accent }} onClick={() => track('nav-click', { label: 'marketplace', from: 'product' })}>
          <img src="/logo192.png" className="boutique-nav-logo" alt="" />
          NomadMe
        </Link>
        <div className="boutique-nav-right">
          <LanguageSwitcher variant="ghost" accentColor={accent} />
          <Link to={`/shop/boutique/${boutiqueId}`} className="boutique-nav-back">
            ← {boutique.name}
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="product-breadcrumb">
        <Link to="/shop">Marketplace</Link>
        <span className="product-breadcrumb-sep">›</span>
        <Link to={`/shop/boutique/${boutiqueId}`}>{boutique.name}</Link>
        <span className="product-breadcrumb-sep">›</span>
        <span>{product.name}</span>
      </div>

      {/* Two-column layout */}
      <div className="product-detail-layout">

        {/* Gallery */}
        <div className="product-gallery">
          <div className="product-gallery-main">
            {allImages.length > 0
              ? <img src={allImages[activeImg]} alt={product.name} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', opacity: 0.2 }}>🎁</div>
            }
          </div>
          {allImages.length > 1 && (
            <div className="product-gallery-thumbs">
              {allImages.map((url, i) => (
                <img
                  key={i}
                  className={`product-gallery-thumb${activeImg === i ? ' active' : ''}`}
                  src={url}
                  alt=""
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="product-info-panel">
          <Link
            to={`/shop/boutique/${boutiqueId}`}
            className="product-info-boutique-tag"
            style={{ color: accent }}
          >
            {boutique.name} ↗
          </Link>

          <h1 className="product-info-name">{product.name}</h1>

          {product.origin && (
            <p className="product-info-origin">📍 {product.origin}</p>
          )}

          {/* Price */}
          <div className="product-price-display">
            {displayPrice !== null && (
              <span className="product-price-amount" style={{ color: accent }}>
                {priceIsFrom && <span style={{ fontSize: '0.6em', fontWeight: 600, opacity: 0.7, marginRight: 4 }}>from</span>}
                {displayPrice}
              </span>
            )}
            <span className="product-price-currency">{displayCurrency}</span>
          </div>

          {/* Price matrix */}
          {hasMatrix && (
            <div className="product-matrix-section">
              {product.priceMatrix.map((row, ri) => (
                <div key={ri}>
                  <p className="product-matrix-label">{row.label}</p>
                  <div className="product-matrix-row-grid">
                    <button
                      key={ri}
                      type="button"
                      className={`product-matrix-row-btn${selectedRowIdx === ri ? ' selected' : ''}`}
                      style={selectedRowIdx === ri ? { background: accent, borderColor: accent, color: '#000' } : {}}
                      onClick={() => {
                        setSelectedRowIdx(ri);
                        setSelectedOptIdx(null);
                        track('product_size_selected', { product: product.name, size: row.label });
                      }}
                    >
                      {row.label}
                    </button>
                  </div>
                </div>
              ))}

              {selectedRowIdx !== null && (
                <div>
                  <p className="product-matrix-label">Finish / Option</p>
                  <div className="product-matrix-option-grid">
                    {(product.priceMatrix[selectedRowIdx]?.options ?? []).map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        className={`product-matrix-option-btn${selectedOptIdx === oi ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedOptIdx(oi);
                          track('product_option_selected', { product: product.name, option: opt.label });
                        }}
                      >
                        {opt.label}
                        <span className="product-matrix-option-price">{opt.price} {opt.currency}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simple variants */}
          {!hasMatrix && hasVariants && (
            <div>
              <p className="product-matrix-label">Options</p>
              <div className="product-variants-grid">
                {product.variants.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`product-variant-btn${selectedVariantIdx === i ? ' selected' : ''}`}
                    onClick={() => setSelectedVariantIdx(i)}
                  >
                    {v.label} — {v.price} {product.currency}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.originStory && (
            <p className="product-info-story">{product.originStory}</p>
          )}

          {/* Custom order banner */}
          {product.customOrderAvailable && !showCustomOrder && (
            <div className="product-custom-order">
              <span className="product-custom-order-icon">✏️</span>
              <div className="product-custom-order-text">
                {product.customOrderNote || 'Custom orders available. Get in touch to discuss a unique piece made just for you.'}
                <button
                  type="button"
                  className="product-custom-order-btn"
                  style={{ color: accent }}
                  onClick={() => {
                    setShowCustomOrder(true);
                    track('product_custom_order_clicked', { product: product.name });
                  }}
                >
                  Request a custom order
                </button>
              </div>
            </div>
          )}

          {/* Order form */}
          <div className="product-order-section">
            {ofSent
              ? (
                <div className="product-order-success">
                  <div className="product-order-success-icon">✅</div>
                  <h3 className="product-order-success-title">Order request sent</h3>
                  <p className="product-order-success-body">
                    {boutique.name} will reach out via {ofMethod === 'whatsapp' ? 'WhatsApp' : 'email'} within 48 hours to confirm your order.
                  </p>
                </div>
              )
              : (
                <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Honeypot */}
                  <input type="text" name="website" value={ofHoney} onChange={(e) => setOfHoney(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                  {showCustomOrder && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(200,160,106,0.08)', border: `1px dashed ${accent}55`, fontSize: '0.8rem', color: '#94a3b8' }}>
                      You're requesting a custom order. Please describe what you're looking for in the message below.
                    </div>
                  )}

                  <div>
                    <label className="product-order-label">Your name</label>
                    <input
                      className="product-order-input"
                      type="text"
                      required
                      value={ofName}
                      onChange={(e) => setOfName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="product-order-label">Contact method</label>
                    <div className="product-order-method-row">
                      {(['whatsapp', 'email'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`product-order-method-btn${ofMethod === m ? ' active' : ''}`}
                          onClick={() => setOfMethod(m)}
                        >
                          {m === 'whatsapp' ? '📱 WhatsApp' : '✉️ Email'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="product-order-label">
                      {ofMethod === 'whatsapp' ? 'WhatsApp number' : 'Email address'}
                    </label>
                    <input
                      className="product-order-input"
                      type={ofMethod === 'email' ? 'email' : 'tel'}
                      required
                      value={ofContact}
                      onChange={(e) => setOfContact(e.target.value)}
                      placeholder={ofMethod === 'whatsapp' ? '+1 234 567 8900' : 'you@example.com'}
                    />
                  </div>

                  {!showCustomOrder && (
                    <div>
                      <label className="product-order-label">Quantity</label>
                      <select
                        className="product-order-select"
                        value={ofQty}
                        onChange={(e) => setOfQty(Number(e.target.value))}
                      >
                        {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="product-order-label">Message {showCustomOrder ? '' : '(optional)'}</label>
                    <textarea
                      className="product-order-textarea"
                      rows={4}
                      value={ofMessage}
                      onChange={(e) => setOfMessage(e.target.value)}
                      placeholder={showCustomOrder
                        ? 'Describe your custom order: size, colours, inscription, intended use…'
                        : 'Any special requests or questions?'}
                      required={showCustomOrder}
                    />
                  </div>

                  <button
                    type="submit"
                    className="product-order-cta"
                    style={{ background: accent }}
                    disabled={ofSending || !ofName || !ofContact || (hasMatrix && (selectedRowIdx === null || selectedOptIdx === null))}
                  >
                    {ofSending ? 'Sending…' : showCustomOrder ? 'Send Custom Request' : 'Place Order Request'}
                  </button>

                  {hasMatrix && (selectedRowIdx === null || selectedOptIdx === null) && (
                    <p style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center' }}>
                      Please select a size and finish above
                    </p>
                  )}

                  <p className="product-order-no-payment">
                    No payment now. {boutique.name} will confirm via {ofMethod === 'whatsapp' ? 'WhatsApp' : 'email'}.
                  </p>
                </form>
              )
            }
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '24px', fontSize: '0.76rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to={`/shop/boutique/${boutiqueId}`} style={{ color: '#64748b', textDecoration: 'none' }}>← {boutique.name}</Link>
        <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
        <span>© {new Date().getFullYear()} NomadMe</span>
      </footer>
    </div>
  );
};

export default ProductDetailPage;
