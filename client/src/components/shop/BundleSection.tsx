import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicBundle, BundleOrderInput, submitBundleOrder } from '../../api/portalApi';
import { COUNTRIES } from '../../utils/countries';

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', TND: 'DT', CNY: '¥', GBP: '£' };
function currencySymbol(c: string) { return CURRENCY_SYMBOLS[(c || '').toUpperCase()] ?? c; }
function formatPrice(price: number, currency: string) { return `${price.toLocaleString()} ${currencySymbol(currency)}`; }

interface BundleSectionProps {
  bundles: PublicBundle[];
  shipNote?: string;
  /** When true, renders only the card grid (no section wrapper / title). Use when embedding inside a family section. */
  inline?: boolean;
  onOrdered?: (bundle: PublicBundle) => void;
}

const BundleSection: React.FC<BundleSectionProps> = ({ bundles, shipNote, inline, onOrdered }) => {
  const { t } = useTranslation('landing');
  const [active, setActive] = useState<PublicBundle | null>(null);

  if (bundles.length === 0) return null;

  const grid = (
    <div className="shop-grid">
      {bundles.map((b, i) => (
        <button
          key={b._id}
          type="button"
          className="shop-card"
          style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
          onClick={() => setActive(b)}
        >
          <div className="shop-card-media">
            {b.imageUrl
              ? <img src={b.imageUrl} alt={b.name} loading="lazy" />
              : <div className="shop-card-media-empty">📦</div>
            }
            <span className="shop-card-cat">✨ Bundle</span>
          </div>
          <div className="shop-card-body">
            <h3 className="shop-card-name">{b.name}</h3>
            {b.includedProducts.length > 0 && (
              <ul className="shop-bundle-includes">
                {b.includedProducts.map((p) => (
                  <li key={p._id}>· {p.name}</li>
                ))}
              </ul>
            )}
            {b.description && <p className="shop-card-desc">{b.description}</p>}
            <div className="shop-card-footer">
              <span className="shop-card-price">
                {b.price.toLocaleString()}<small>{currencySymbol(b.currency)}</small>
              </span>
              <span className="shop-card-btn">{t('shop.orderBundle', 'Order Bundle')}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <>
      {inline ? (
        <div className="shop-bundles-inline">
          <p className="shop-bundles-inline-label">{t('shop.bundlesTitle', 'Bundles')}</p>
          {grid}
        </div>
      ) : (
        <section className="shop-family" style={{ marginBottom: 8 }}>
          <h3 className="shop-family-title">{t('shop.bundlesTitle', 'Bundles')}</h3>
          <p className="shop-family-sub">{t('shop.bundlesSub', 'Curated sets — everything you need, ready to order.')}</p>
          {grid}
        </section>
      )}

      {active && (
        <BundleModal
          bundle={active}
          shipNote={shipNote}
          onClose={() => setActive(null)}
          onOrdered={() => { onOrdered?.(active); }}
        />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Bundle order modal
// ---------------------------------------------------------------------------

interface BundleModalProps {
  bundle: PublicBundle;
  shipNote?: string;
  onClose: () => void;
  onOrdered: () => void;
}

const BundleModal: React.FC<BundleModalProps> = ({ bundle, shipNote, onClose, onOrdered }) => {
  const { t } = useTranslation('landing');
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState<'detail' | 'form' | 'done'>('detail');
  const [fullName, setFullName] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [contactDetail, setContactDetail] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = bundle.price * qty;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload: BundleOrderInput = {
        bundleId: bundle._id,
        quantity: qty,
        fullName: fullName.trim(),
        contactMethod,
        contactDetail: contactDetail.trim(),
        country: country.trim(),
        message: message.trim(),
        website,
      };
      await submitBundleOrder(payload);
      onOrdered();
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shopUi.orderError'));
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
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800 }}>{t('shopUi.successTitle')}</h3>
            <p style={{ margin: '0 auto', maxWidth: 400, fontSize: '0.88rem', color: 'var(--shop-muted)', lineHeight: 1.65 }}>
              {fullName.split(' ')[0]
                ? t('shopUi.successLine1WithName', { firstName: fullName.split(' ')[0], product: bundle.name })
                : t('shopUi.successLine1Anon', { product: bundle.name })}
              {' '}
              {t('shopUi.successLine2', {
                method: contactMethod === 'whatsapp' ? t('shopUi.methodWhatsapp') : t('shopUi.methodEmail'),
                contact: contactDetail,
              })}
            </p>
            <button type="button" className="shop-order-btn" style={{ marginTop: 22, width: '100%', maxWidth: 240 }} onClick={onClose}>
              {t('shopUi.done')}
            </button>
          </div>
        ) : (
          <div className="shop-modal-grid">
            <div className="shop-modal-media">
              {bundle.imageUrl
                ? <img className="shop-modal-cover" src={bundle.imageUrl} alt={bundle.name} />
                : <div className="shop-modal-cover-empty">📦</div>
              }
            </div>

            <div className="shop-modal-body">
              <span className="shop-modal-cat">✨ Bundle</span>
              <h2 className="shop-modal-name">{bundle.name}</h2>

              {step === 'detail' ? (
                <>
                  <div className="shop-modal-price">{formatPrice(bundle.price, bundle.currency)}</div>
                  {shipNote && <p className="shop-ship-note">🚚 {shipNote}</p>}

                  {bundle.includedProducts.length > 0 && (
                    <>
                      <p className="shop-modal-section-label">{t('shop.bundleIncludes', 'What\'s included')}</p>
                      <ul className="shop-bundle-includes shop-bundle-includes--modal">
                        {bundle.includedProducts.map((p) => (
                          <li key={p._id}>✓ {p.name}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {bundle.description && <p className="shop-modal-desc">{bundle.description}</p>}

                  <p className="shop-modal-section-label">{t('shopUi.quantityLabel')}</p>
                  <div className="shop-qty">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
                  </div>

                  <button type="button" className="shop-order-btn" onClick={() => setStep('form')}>
                    {`${t('shop.orderBundle', 'Order Bundle')} · ${formatPrice(total, bundle.currency)}`}
                  </button>
                </>
              ) : (
                <form className="shop-form" onSubmit={submit}>
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
                  <button type="button" className="shop-form-back" onClick={() => setStep('detail')}>{t('shopUi.backToProduct')}</button>

                  <div className="shop-order-summary">
                    <strong>{bundle.name}</strong> × {qty}
                    <br />{t('shopUi.total')} <strong>{formatPrice(total, bundle.currency)}</strong>
                  </div>

                  <div>
                    <label>{t('shopUi.labelFullName')}</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
                  </div>
                  <div>
                    <label>{t('shopUi.labelReachYou')}</label>
                    <div className="shop-variants" style={{ marginTop: 2 }}>
                      <button type="button" className={`shop-variant${contactMethod === 'email' ? ' shop-variant--active' : ''}`} onClick={() => setContactMethod('email')}>{t('shopUi.contactEmail')}</button>
                      <button type="button" className={`shop-variant${contactMethod === 'whatsapp' ? ' shop-variant--active' : ''}`} onClick={() => setContactMethod('whatsapp')}>{t('shopUi.contactWhatsapp')}</button>
                    </div>
                  </div>
                  <div>
                    <label>{contactMethod === 'email' ? t('shopUi.labelEmailAddress') : t('shopUi.labelWhatsappNumber')}</label>
                    <input type={contactMethod === 'email' ? 'email' : 'tel'} value={contactDetail} onChange={(e) => setContactDetail(e.target.value)} required placeholder={contactMethod === 'email' ? 'you@example.com' : '+216 12 345 678'} />
                  </div>
                  <div>
                    <label>{t('shopUi.labelCountry')}</label>
                    <input list="bundle-country-list" value={country} onChange={(e) => setCountry(e.target.value)} required autoComplete="off" placeholder={t('shopUi.placeholderCountry')} />
                    <datalist id="bundle-country-list">
                      {COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label>{t('shopUi.labelMessage')}</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('shopUi.placeholderMessage')} />
                  </div>

                  {error && <p className="shop-error">{error}</p>}

                  <button type="submit" className="shop-order-btn" disabled={submitting}>
                    {submitting ? t('shopUi.sending') : t('shopUi.placeOrder')}
                  </button>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--shop-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    {t('shopUi.noPayment')}
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

export default BundleSection;
