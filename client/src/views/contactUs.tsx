import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { submitContactRequest } from '../api/portalApi';
import { landingThemes } from '../utils/landingThemes';
import { track } from '../utils/analytics';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import '../styles/join.css';

const DEFAULT_ACCENT = landingThemes[0]?.accent ?? '#38bdf8';

const ContactUs: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('contact');

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [contactDetail, setContactDetail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot

  const accent = DEFAULT_ACCENT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await submitContactRequest({
        type: 'contact_us',
        fullName: fullName.trim(),
        contactMethod,
        contactDetail: contactDetail.trim(),
        note: message.trim(),
        website,
      });
      track('contact-us-submit', { contactMethod });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="join-shell" style={{ '--join-accent': accent } as React.CSSProperties}>
      <nav className="join-nav">
        <Link to="/" className="join-back-btn" onClick={() => track('nav-click', { label: 'back-home', from: 'contact-us' })}>← {t('back')}</Link>
        <span className="join-nav-brand" style={{ color: accent }}>
          <img src="/logo192.png" className="brand-logo" alt="" />
          NomadMe
        </span>
        <LanguageSwitcher variant="ghost" accentColor={accent} />
      </nav>

      {submitted ? (
        <div className="join-success">
          <div className="join-success-card">
            <span className="join-success-icon">🎉</span>
            <h2 className="join-success-title">{t('success.title')}</h2>
            <p className="join-success-sub">
              {contactMethod === 'whatsapp' ? t('success.subWhatsapp') : t('success.subEmail')}
            </p>
            <br />
            <button
              type="button"
              onClick={() => { track('nav-click', { label: 'back-home', from: 'contact-us-success' }); navigate('/'); }}
              style={{
                padding: '12px 28px',
                borderRadius: 12,
                border: 'none',
                background: `linear-gradient(90deg, ${accent}, #a78bfa)`,
                color: '#000',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              {t('backHome')}
            </button>
          </div>
        </div>
      ) : (
        <div className="join-body join-body--single">
          <div className="join-form-wrap">
            <h1 className="join-form-title">{t('form.title')}</h1>
            <p className="join-form-sub">{t('form.sub')}</p>

            <form className="join-form" onSubmit={handleSubmit}>
              {/* Honeypot */}
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

              <div className="join-field">
                <label className="join-label">{t('form.fullName')}</label>
                <input
                  className="join-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('form.fullNamePlaceholder')}
                  required
                />
              </div>

              <div className="join-field">
                <label className="join-label">{t('form.contactMethod')}</label>
                <div className="join-method-grid">
                  <button
                    type="button"
                    className={`join-method-card join-method-card--whatsapp${contactMethod === 'whatsapp' ? ' join-method-card--active' : ''}`}
                    onClick={() => { setContactMethod('whatsapp'); setContactDetail(''); track('contact-method-select', { method: 'whatsapp' }); }}
                  >
                    <span className="join-method-icon">📱</span>
                    <span className="join-method-name">{t('form.whatsapp')}</span>
                    <span className="join-method-desc">{t('form.whatsappDesc')}</span>
                  </button>
                  <button
                    type="button"
                    className={`join-method-card join-method-card--email${contactMethod === 'email' ? ' join-method-card--active' : ''}`}
                    onClick={() => { setContactMethod('email'); setContactDetail(''); track('contact-method-select', { method: 'email' }); }}
                  >
                    <span className="join-method-icon">✉️</span>
                    <span className="join-method-name">{t('form.email')}</span>
                    <span className="join-method-desc">{t('form.emailDesc')}</span>
                  </button>
                </div>
              </div>

              <div className="join-field">
                <label className="join-label">
                  {contactMethod === 'whatsapp' ? t('form.whatsappNumber') : t('form.emailAddress')}
                </label>
                <input
                  className="join-input"
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={contactDetail}
                  onChange={(e) => setContactDetail(e.target.value)}
                  placeholder={contactMethod === 'whatsapp' ? '+1 234 567 8900' : t('form.emailPlaceholder')}
                  required
                />
                {contactMethod === 'whatsapp' && (
                  <p className="join-field-hint">{t('form.countryCodeHint')}</p>
                )}
              </div>

              <div className="join-field">
                <label className="join-label">{t('form.message')}</label>
                <textarea
                  className="join-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('form.messagePlaceholder')}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {error && <p className="join-error">{error}</p>}

              <button
                type="submit"
                className="join-submit-btn"
                disabled={saving}
                style={{ background: `linear-gradient(90deg, ${accent}, #a78bfa)`, color: '#000' }}
              >
                {saving ? t('form.submitting') : t('form.submit')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;
