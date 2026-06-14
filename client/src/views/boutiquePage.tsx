import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { track } from '../utils/analytics';
import {
  getPublicBoutique,
  getPublicBoutiqueProducts,
  getPublicBoutiqueJourneys,
  submitProductOrder,
  Boutique,
  PublicProduct,
  Journey,
} from '../api/portalApi';
import '../styles/boutique.css';

const DEFAULT_ACCENT = '#c8a06a';

type Tab = 'products' | 'story' | 'journeys' | 'contact';

function minPrice(p: PublicProduct): number {
  if (p.priceMatrix && p.priceMatrix.length > 0) {
    const all = p.priceMatrix.flatMap((r) => r.options.map((o) => o.price));
    return all.length ? Math.min(...all) : p.price;
  }
  if (p.variants && p.variants.length > 0) {
    return Math.min(...p.variants.map((v) => v.price));
  }
  return p.price;
}

function hasMatrix(p: PublicProduct) {
  return p.priceMatrix && p.priceMatrix.length > 0;
}

const BoutiquePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Contact form
  const [cfName, setCfName] = useState('');
  const [cfMethod, setCfMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [cfContact, setCfContact] = useState('');
  const [cfMessage, setCfMessage] = useState('');
  const [cfHoney, setCfHoney] = useState('');
  const [cfSending, setCfSending] = useState(false);
  const [cfSent, setCfSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getPublicBoutique(id),
      getPublicBoutiqueProducts(id),
      getPublicBoutiqueJourneys(id),
    ])
      .then(([{ boutique: b }, { products: ps }, { journeys: js }]) => {
        setBoutique(b);
        setProducts(ps);
        setJourneys(js);
        document.title = `NomadMe — ${b.name}`;
        track('boutique_page_viewed', { boutique: b.name });
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const accent = boutique?.accentColor || DEFAULT_ACCENT;

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (cfHoney) return;
    if (!boutique) return;
    setCfSending(true);
    track('boutique_contact_clicked', { boutique: boutique.name, method: cfMethod });
    // Submit as a general contact request via existing product order endpoint —
    // use boutiqueId as productId so admin sees which boutique it came from.
    try {
      await submitProductOrder({
        productId: boutique._id,
        quantity: 1,
        fullName: cfName,
        contactMethod: cfMethod,
        contactDetail: cfContact,
        country: '',
        message: `[Boutique enquiry — ${boutique.name}]\n${cfMessage}`,
        website: cfHoney,
      });
      setCfSent(true);
    } catch {
      // still mark as sent to not leak error details
      setCfSent(true);
    } finally {
      setCfSending(false);
    }
  }

  if (loading) {
    return (
      <div className="boutique-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🏪</div>
          <p style={{ fontSize: '0.85rem' }}>Loading boutique…</p>
        </div>
      </div>
    );
  }

  if (loadError || !boutique) {
    return (
      <div className="boutique-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>Could not load this boutique.</p>
          <button type="button" onClick={() => navigate('/shop')} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${accent}55`, background: 'transparent', color: accent, cursor: 'pointer', fontWeight: 700 }}>
            ← Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const tabs: Tab[] = ['products', ...(boutique.originStory ? ['story' as Tab] : []), ...(journeys.length > 0 ? ['journeys' as Tab] : []), 'contact'];
  const TAB_LABELS: Record<Tab, string> = {
    products: `Products (${products.length})`,
    story: 'Our Story',
    journeys: `Journeys (${journeys.length})`,
    contact: 'Contact',
  };

  return (
    <div className="boutique-page" style={{ '--boutique-accent': accent } as React.CSSProperties}>
      {/* Nav */}
      <nav className="boutique-nav">
        <Link to="/shop" className="boutique-nav-brand" style={{ color: accent }} onClick={() => track('nav-click', { label: 'marketplace', from: 'boutique' })}>
          <img src="/logo192.png" className="boutique-nav-logo" alt="" />
          NomadMe
        </Link>
        <div className="boutique-nav-right">
          <LanguageSwitcher variant="ghost" accentColor={accent} />
          <Link to="/shop" className="boutique-nav-back" onClick={() => track('nav-click', { label: 'back-to-marketplace', from: 'boutique' })}>
            ← Marketplace
          </Link>
        </div>
      </nav>

      {/* Cover */}
      <div className="boutique-cover">
        {boutique.coverImageUrl
          ? <img src={boutique.coverImageUrl} alt={boutique.name} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b 0%, #0a0c14 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', opacity: 0.2 }}>
              {boutique.section === 'earth' ? '🌍' : '🤲'}
            </div>
        }
        <div className="boutique-cover-overlay" />
        <div className="boutique-cover-brand">
          <h1 className="boutique-cover-name">{boutique.name}</h1>
          {boutique.location && (
            <p className="boutique-cover-location">{boutique.location}</p>
          )}
        </div>
      </div>

      {/* Artisan strip */}
      <div className="boutique-artisan-strip">
        {boutique.profileImageUrl
          ? <img className="boutique-artisan-photo" src={boutique.profileImageUrl} alt={boutique.name} />
          : <div className="boutique-artisan-photo-placeholder">{boutique.section === 'earth' ? '🌱' : '✋'}</div>
        }
        <div className="boutique-artisan-info">
          <h2 className="boutique-artisan-name">{boutique.name}</h2>
          {boutique.tagline && (
            <p className="boutique-artisan-tagline">"{boutique.tagline}"</p>
          )}
          {boutique.bio && (
            <p className="boutique-artisan-bio">{boutique.bio}</p>
          )}
          {(boutique.socialLinks?.instagram || boutique.socialLinks?.website) && (
            <div className="boutique-artisan-social">
              {boutique.socialLinks.instagram && (
                <a
                  className="boutique-social-link"
                  href={boutique.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('boutique_contact_clicked', { boutique: boutique.name, via: 'instagram' })}
                >
                  Instagram
                </a>
              )}
              {boutique.socialLinks.website && (
                <a
                  className="boutique-social-link"
                  href={boutique.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('boutique_contact_clicked', { boutique: boutique.name, via: 'website' })}
                >
                  Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="boutique-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`boutique-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="boutique-body">

        {/* Products tab */}
        {activeTab === 'products' && (
          <div className="boutique-products-grid">
            {products.length === 0 && (
              <div className="boutique-empty" style={{ gridColumn: '1 / -1' }}>
                <div className="boutique-empty-icon">📦</div>
                <p className="boutique-empty-text">No products listed yet.</p>
              </div>
            )}
            {products.map((p) => {
              const lo = minPrice(p);
              const matrix = hasMatrix(p);
              return (
                <Link
                  key={p._id}
                  to={`/shop/boutique/${id}/product/${p._id}`}
                  className="boutique-product-card"
                  onClick={() => track('boutique_product_clicked', { boutique: boutique.name, product: p.name })}
                >
                  {p.coverImageUrl
                    ? <img className="boutique-product-thumb" src={p.coverImageUrl} alt={p.name} loading="lazy" />
                    : <div className="boutique-product-thumb-empty">🎁</div>
                  }
                  <div className="boutique-product-info">
                    <p className="boutique-product-name">{p.name}</p>
                    {p.origin && <p className="boutique-product-origin">{p.origin}</p>}
                    <p className="boutique-product-price">
                      {matrix && <span className="boutique-product-price-from">from </span>}
                      {lo} {p.currency}
                      {matrix && <span className="boutique-product-matrix-badge">matrix</span>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Story tab */}
        {activeTab === 'story' && boutique.originStory && (
          <div className="boutique-story">
            {boutique.originStory.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* Journeys tab */}
        {activeTab === 'journeys' && (
          <div className="boutique-products-grid">
            {journeys.map((j) => (
              <Link
                key={j._id}
                to={`/journeys/${j._id}`}
                className="boutique-product-card"
                onClick={() => track('boutique_journey_clicked', { boutique: boutique.name, journey: j.title })}
              >
                {j.coverImageUrl
                  ? <img className="boutique-product-thumb" src={j.coverImageUrl} alt={j.title} loading="lazy" />
                  : <div className="boutique-product-thumb-empty">🌍</div>
                }
                <div className="boutique-product-info">
                  <p className="boutique-product-name">{j.title}</p>
                  {j.location && <p className="boutique-product-origin">{j.location}</p>}
                  {j.durations?.[0] && (
                    <p className="boutique-product-price">
                      <span className="boutique-product-price-from">from </span>
                      {j.durations[0].price} {j.durations[0].currency}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Contact tab */}
        {activeTab === 'contact' && (
          cfSent
            ? (
              <div className="boutique-contact-success">
                <div className="boutique-contact-success-icon">✉️</div>
                <h3 className="boutique-contact-success-title">Message sent</h3>
                <p className="boutique-contact-success-body">
                  {boutique.name} will reach out via your preferred contact method.
                </p>
              </div>
            )
            : (
              <form className="boutique-contact-form" onSubmit={handleContact}>
                {/* Honeypot */}
                <input type="text" name="website" value={cfHoney} onChange={(e) => setCfHoney(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                <div className="boutique-contact-field">
                  <label className="boutique-contact-label">Your name</label>
                  <input
                    className="boutique-contact-input"
                    type="text"
                    required
                    value={cfName}
                    onChange={(e) => setCfName(e.target.value)}
                    placeholder="Amina Traoré"
                  />
                </div>

                <div className="boutique-contact-field">
                  <label className="boutique-contact-label">Preferred contact</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['whatsapp', 'email'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`boutique-filter-tab${cfMethod === m ? ' active' : ''}`}
                        style={{ flex: 1 }}
                        onClick={() => setCfMethod(m)}
                      >
                        {m === 'whatsapp' ? '📱 WhatsApp' : '✉️ Email'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="boutique-contact-field">
                  <label className="boutique-contact-label">
                    {cfMethod === 'whatsapp' ? 'WhatsApp number' : 'Email address'}
                  </label>
                  <input
                    className="boutique-contact-input"
                    type={cfMethod === 'email' ? 'email' : 'tel'}
                    required
                    value={cfContact}
                    onChange={(e) => setCfContact(e.target.value)}
                    placeholder={cfMethod === 'whatsapp' ? '+1 234 567 8900' : 'you@example.com'}
                  />
                </div>

                <div className="boutique-contact-field">
                  <label className="boutique-contact-label">Message</label>
                  <textarea
                    className="boutique-contact-textarea"
                    rows={5}
                    value={cfMessage}
                    onChange={(e) => setCfMessage(e.target.value)}
                    placeholder="Tell the boutique what you're looking for…"
                  />
                </div>

                <button
                  type="submit"
                  className="boutique-contact-submit"
                  style={{ background: accent }}
                  disabled={cfSending || !cfName || !cfContact}
                >
                  {cfSending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )
        )}
      </div>

      <footer style={{ textAlign: 'center', padding: '24px', fontSize: '0.76rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/shop" style={{ color: '#64748b', textDecoration: 'none' }}>← Marketplace</Link>
        <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
        <span>© {new Date().getFullYear()} NomadMe</span>
      </footer>
    </div>
  );
};

export default BoutiquePage;
