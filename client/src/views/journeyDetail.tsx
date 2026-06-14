import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPublicJourney, submitJourneyInterest, Journey } from '../api/portalApi';
import { track } from '../utils/analytics';
import '../styles/journeys.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const CLR_JOURNEY = '#f59e0b';

const JourneyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Interest form state
  const [fullName, setFullName] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [contactDetail, setContactDetail] = useState('');
  const [preferredDuration, setPreferredDuration] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [note, setNote] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Gallery lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Map
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPublicJourney(id)
      .then((r) => {
        setJourney(r.journey);
        track('journey_detail_viewed', { journeyId: id });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!journey || !mapContainerRef.current || mapRef.current) return;
    if (!journey.locationLat && !journey.locationLng) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [journey.locationLng, journey.locationLat],
      zoom: 4.5,
      attributionControl: false,
      interactive: true,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = map;

    map.on('load', () => {
      const el = document.createElement('div');
      el.style.cssText = `
        width:36px;height:36px;border-radius:50%;
        background:${CLR_JOURNEY};
        display:flex;align-items:center;justify-content:center;
        font-size:18px;cursor:pointer;
        box-shadow:0 0 0 4px ${CLR_JOURNEY}44,0 0 20px ${CLR_JOURNEY}66;
      `;
      el.textContent = '🧭';
      new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([journey.locationLng, journey.locationLat])
        .setPopup(
          new maplibregl.Popup({ offset: 20, className: 'world-map-popup' })
            .setHTML(`<strong>${journey.title}</strong><br/><span>📍 ${journey.location}</span>`)
        )
        .addTo(map);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [journey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journey || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitJourneyInterest({
        journeyId: journey._id,
        journeyTitle: journey.title,
        fullName,
        contactMethod,
        contactDetail,
        preferredDuration,
        preferredDates,
        note,
        website: honeypot,
      });
      setSubmitted(true);
      track('journey_interest_submitted', { journeyId: journey._id });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('journeys.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="journey-detail-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#475569', fontSize: '0.9rem' }}>Loading…</p>
      </div>
    );
  }

  if (notFound || !journey) {
    return (
      <div className="journey-detail-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
        <div style={{ fontSize: '3rem' }}>🧭</div>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('journeys.notFound')}</p>
        <button type="button" onClick={() => navigate('/')} style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.84rem' }}>
          ← {t('shop.backToSite')}
        </button>
      </div>
    );
  }

  const storyParagraphs = journey.story.split('\n\n').filter(Boolean);

  return (
    <div className="journey-detail-shell">

      {/* ── Back nav ── */}
      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 50 }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{ background: 'rgba(8,10,18,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '8px 16px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          ← nomadme
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="journey-detail-hero">
        {journey.coverVideoUrl ? (
          <video
            className="journey-detail-hero-media"
            src={journey.coverVideoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : journey.coverImageUrl ? (
          <img className="journey-detail-hero-media" src={journey.coverImageUrl} alt={journey.title} />
        ) : (
          <div className="journey-detail-hero-media" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1a3a 100%)' }} />
        )}
        <div className="journey-detail-hero-overlay" />
        <div className="journey-detail-hero-content">
          <p className="journey-detail-hero-eyebrow">
            🧭 {t('journeys.eyebrow')} · <span>📍 {journey.location}</span>
          </p>
          <h1 className="journey-detail-hero-title">{journey.title}</h1>
          {journey.tagline && (
            <p className="journey-detail-hero-tagline">{journey.tagline}</p>
          )}
        </div>
        <div className="journey-detail-hero-scroll-hint">
          <span>↓</span>
          <span>{t('journeys.scrollHint')}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="journey-detail-body">

        {/* Story */}
        <article className="journey-detail-story">
          {storyParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>

        {/* Guide */}
        {journey.guideName && (
          <section className="journey-guide-section" onClick={() => track('journey_guide_section_viewed', { journeyId: journey._id })}>
            <div className="journey-guide-header">
              {journey.guidePhoto ? (
                <img className="journey-guide-photo" src={journey.guidePhoto} alt={journey.guideName} style={{ borderColor: CLR_JOURNEY }} />
              ) : (
                <div className="journey-guide-photo" style={{ background: `${CLR_JOURNEY}22`, border: `2.5px solid ${CLR_JOURNEY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🥁</div>
              )}
              <div>
                <p className="journey-guide-name">{journey.guideName}</p>
                <p className="journey-guide-role">{t('journeys.guideRole')}</p>
              </div>
            </div>
            {journey.guideBio && <p className="journey-guide-bio">{journey.guideBio}</p>}
            {journey.guideQuote && (
              <blockquote className="journey-guide-quote" style={{ borderColor: CLR_JOURNEY }}>
                "{journey.guideQuote}"
              </blockquote>
            )}
          </section>
        )}

        {/* Details card */}
        <div className="journey-details-card">
          <div className="journey-details-row">
            <span className="journey-details-label">{t('journeys.detailLocation')}</span>
            <span className="journey-details-value">📍 {journey.location}</span>
          </div>
          <div className="journey-details-row">
            <span className="journey-details-label">{t('journeys.detailGroupSize')}</span>
            <span className="journey-details-value">{t('journeys.maxPeople', { count: journey.maxGroupSize })}</span>
          </div>
          {journey.availableDates.length > 0 && (
            <div className="journey-details-row">
              <span className="journey-details-label">{t('journeys.detailDates')}</span>
              <span className="journey-details-value">{journey.availableDates.join(' · ')}</span>
            </div>
          )}
          <div className="journey-details-row">
            <span className="journey-details-label">{t('journeys.detailStatus')}</span>
            <span className="journey-details-value" style={{ color: journey.status === 'full' ? '#fca5a5' : '#86efac' }}>
              {journey.status === 'full' ? t('journeys.full') : `${journey.spotsRemaining} ${t('journeys.spotsLeft')}`}
            </span>
          </div>
        </div>

        {/* Spots visual */}
        {journey.status !== 'full' && (
          <div className="journey-spots-remaining">
            <div className="journey-spots-dots">
              {Array.from({ length: journey.maxGroupSize }).map((_, i) => (
                <div key={i} className={`journey-spots-dot${i < (journey.maxGroupSize - journey.spotsRemaining) ? ' journey-spots-dot--taken' : ''}`} style={{ color: CLR_JOURNEY }} />
              ))}
            </div>
            <span>{journey.spotsRemaining} {t('journeys.spotsLeft')} {t('journeys.ofMax', { count: journey.maxGroupSize })}</span>
          </div>
        )}

        {/* Included / Not included */}
        {(journey.included.length > 0 || journey.notIncluded.length > 0) && (
          <div className="journey-included-grid">
            {journey.included.length > 0 && (
              <div className="journey-included-col">
                <h4 style={{ color: '#86efac' }}>{t('journeys.included')}</h4>
                <ul>
                  {journey.included.map((item, i) => (
                    <li key={i} style={{ color: '#94a3b8' }}><span style={{ color: '#86efac' }} />{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {journey.notIncluded.length > 0 && (
              <div className="journey-included-col journey-not-included">
                <h4 style={{ color: '#94a3b8' }}>{t('journeys.notIncluded')}</h4>
                <ul>
                  {journey.notIncluded.map((item, i) => (
                    <li key={i} style={{ color: '#64748b' }}><span />{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Gallery */}
        {journey.gallery.length > 0 && (
          <div className="journey-gallery">
            {journey.gallery.map((url, i) => (
              <div
                key={i}
                className="journey-gallery-item"
                onClick={() => setLightboxIdx(i)}
                style={{ cursor: 'zoom-in' }}
              >
                {url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={url} muted playsInline loop />
                ) : (
                  <img src={url} alt="" loading="lazy" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxIdx !== null && journey.gallery[lightboxIdx] && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setLightboxIdx(null)}
          >
            <button type="button" onClick={() => setLightboxIdx(null)} style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            {journey.gallery[lightboxIdx]!.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={journey.gallery[lightboxIdx]} controls autoPlay style={{ maxWidth: '92vw', maxHeight: '86vh', borderRadius: 10 }} onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={journey.gallery[lightboxIdx]} alt="" style={{ maxWidth: '92vw', maxHeight: '86vh', borderRadius: 10, objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
            )}
            {journey.gallery.length > 1 && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + journey.gallery.length) % journey.gallery.length); }} style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>‹</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % journey.gallery.length); }} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>›</button>
              </>
            )}
          </div>
        )}

        {/* Pricing */}
        {journey.durations.length > 0 && (
          <div>
            <h3 style={{ color: '#f1f5f9', fontSize: '1.05rem', fontWeight: 800, margin: '48px 0 16px', letterSpacing: '-0.01em' }}>{t('journeys.pricing')}</h3>
            <div className="journey-pricing">
              {journey.durations.map((d, i) => (
                <div key={i} className="journey-pricing-tier">
                  <div>
                    <p className="journey-pricing-label">{d.label}</p>
                    {d.description && <p className="journey-pricing-desc">{d.description}</p>}
                  </div>
                  <div className="journey-pricing-price" style={{ color: CLR_JOURNEY }}>
                    <span className="journey-pricing-currency">{d.currency}</span>
                    {d.price.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {(journey.locationLat || journey.locationLng) ? (
          <div>
            <h3 style={{ color: '#f1f5f9', fontSize: '1.05rem', fontWeight: 800, margin: '48px 0 16px' }}>{t('journeys.whereYoullBe')}</h3>
            <div className="journey-detail-map" ref={mapContainerRef} />
          </div>
        ) : null}

        {/* Expression of interest */}
        <div className="journey-interest-section" id="express-interest">
          {submitted ? (
            <div className="journey-interest-success">
              <span className="journey-interest-success-icon">🎉</span>
              <h3 className="journey-interest-success-title">{t('journeys.successTitle')}</h3>
              <p className="journey-interest-success-body">{t('journeys.successBody')}</p>
            </div>
          ) : (
            <>
              <h3 className="journey-interest-title">{t('journeys.interestTitle')}</h3>
              <p className="journey-interest-sub">{t('journeys.interestSub')}</p>

              <form className="journey-form" onSubmit={handleSubmit}>
                <input className="journey-form-honeypot" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

                <div className="journey-form-field">
                  <label className="journey-form-label">{t('shopUi.labelFullName')}</label>
                  <input className="journey-form-input" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                </div>

                <div className="journey-form-field">
                  <label className="journey-form-label">{t('shopUi.labelReachYou')}</label>
                  <div className="journey-contact-method-row">
                    <button type="button" className={`journey-contact-method-btn${contactMethod === 'email' ? ' journey-contact-method-btn--active' : ''}`} style={contactMethod === 'email' ? { borderColor: CLR_JOURNEY, color: CLR_JOURNEY } : {}} onClick={() => setContactMethod('email')}>
                      ✉️ {t('shopUi.methodEmail')}
                    </button>
                    <button type="button" className={`journey-contact-method-btn${contactMethod === 'whatsapp' ? ' journey-contact-method-btn--active' : ''}`} style={contactMethod === 'whatsapp' ? { borderColor: CLR_JOURNEY, color: CLR_JOURNEY } : {}} onClick={() => setContactMethod('whatsapp')}>
                      📱 {t('shopUi.methodWhatsapp')}
                    </button>
                  </div>
                </div>

                <div className="journey-form-field">
                  <label className="journey-form-label">{contactMethod === 'email' ? t('shopUi.labelEmailAddress') : t('shopUi.labelWhatsappNumber')}</label>
                  <input className="journey-form-input" type={contactMethod === 'email' ? 'email' : 'tel'} required value={contactDetail} onChange={(e) => setContactDetail(e.target.value)} placeholder={contactMethod === 'email' ? 'you@example.com' : '+1 234 567 890'} />
                </div>

                <div className="journey-form-row">
                  <div className="journey-form-field">
                    <label className="journey-form-label">{t('journeys.labelDuration')}</label>
                    <select className="journey-form-select" value={preferredDuration} onChange={(e) => setPreferredDuration(e.target.value)}>
                      <option value="">{t('journeys.durationAny')}</option>
                      {journey.durations.map((d, i) => (
                        <option key={i} value={d.label}>{d.label} — {d.price.toLocaleString()} {d.currency}</option>
                      ))}
                    </select>
                  </div>
                  <div className="journey-form-field">
                    <label className="journey-form-label">{t('journeys.labelDates')}</label>
                    <input className="journey-form-input" type="text" value={preferredDates} onChange={(e) => setPreferredDates(e.target.value)} placeholder={t('journeys.datesPlaceholder')} />
                  </div>
                </div>

                <div className="journey-form-field">
                  <label className="journey-form-label">{t('shopUi.labelMessage')}</label>
                  <textarea className="journey-form-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('journeys.notePlaceholder')} rows={3} />
                </div>

                {submitError && (
                  <p style={{ color: '#fca5a5', fontSize: '0.82rem', margin: 0 }}>{submitError}</p>
                )}

                <button type="submit" className="journey-form-submit" disabled={submitting} style={{ background: CLR_JOURNEY, color: '#000' }}>
                  {submitting ? t('shopUi.sending') : t('journeys.submitInterest')}
                </button>

                <p style={{ fontSize: '0.74rem', color: '#475569', margin: '4px 0 0', textAlign: 'center' }}>
                  {t('journeys.noPaymentYet')}
                </p>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default JourneyDetail;
