import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPublicInvestments, submitContactRequest, PublicInvestment } from '../api/portalApi';
import { landingThemes } from '../utils/landingThemes';
import { track } from '../utils/analytics';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import '../styles/join.css';

const DEFAULT_ACCENT = landingThemes[0]?.accent ?? '#38bdf8';

const STATUS_COLOR: Record<string, string> = {
  active: '#22c55e',
  in_progress: '#38bdf8',
  waiting: '#fbbf24',
};

const JoinInvestment: React.FC = () => {
  const { investmentId } = useParams<{ investmentId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('join');

  const [investment, setInvestment] = useState<PublicInvestment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [contactDetail, setContactDetail] = useState('');
  const [rdvDate, setRdvDate] = useState('');
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — must stay empty

  const accent = DEFAULT_ACCENT;

  useEffect(() => {
    getPublicInvestments()
      .then((r) => {
        const found = r.investments.find((inv) => inv._id === investmentId);
        setInvestment(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [investmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentId || !investment) return;

    setError('');
    setSaving(true);
    try {
      await submitContactRequest({
        investmentId,
        investmentTitle: investment.title,
        fullName: fullName.trim(),
        contactMethod,
        contactDetail: contactDetail.trim(),
        rdvDate,
        note: note.trim(),
        website,
      });
      track('join-submit', { investmentId, contactMethod });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.generic'));
    } finally {
      setSaving(false);
    }
  };

  const statusColor = investment ? (STATUS_COLOR[investment.status] ?? STATUS_COLOR['active']!) : null;

  return (
    <div className="join-shell" style={{ '--join-accent': accent } as React.CSSProperties}>
      {/* Nav */}
      <nav className="join-nav">
        <Link to="/" className="join-back-btn">← {t('back')}</Link>
        <span className="join-nav-brand" style={{ color: accent }}>
          <img src="/logo192.png" className="brand-logo" alt="" />
          NomadMe
        </span>
        <LanguageSwitcher variant="ghost" accentColor={accent} />
      </nav>

      {submitted ? (
        /* ── Success state ── */
        <div className="join-success">
          <div className="join-success-card">
            <span className="join-success-icon">🎉</span>
            <h2 className="join-success-title">{t('success.title')}</h2>
            <p className="join-success-sub">
              {contactMethod === 'whatsapp' ? t('success.subWhatsapp') : t('success.subEmail')}
            </p>
            <div className="join-success-rdv">
              {t('success.rdv', { date: new Date(rdvDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) })}
            </div>
            <br />
            <button
              type="button"
              onClick={() => navigate('/')}
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
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#475569' }}>
          {t('loading')}
        </div>
      ) : !investment ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 16 }}>
          <p style={{ color: '#475569' }}>{t('notFound')}</p>
          <Link to="/" className="join-back-btn">← {t('backHome')}</Link>
        </div>
      ) : (
        <div className="join-body">
          {/* ── Left: investment info ── */}
          <div className="join-info-card">
            <p className="join-info-eyebrow" style={{ color: accent }}>{t('info.eyebrow')}</p>
            <h2 className="join-info-title">{investment.title}</h2>

            {statusColor && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: `${statusColor}18`, marginBottom: 16 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                <span style={{ color: statusColor, fontWeight: 700, fontSize: '0.72rem' }}>{t(`status.${investment.status}`)}</span>
              </div>
            )}

            <div className="join-info-rows">
              <div className="join-info-row">
                <span className="join-info-row-label">{t('info.minInvestment')}</span>
                <span className="join-info-row-value">{investment.minimumInvestment.toLocaleString()} {investment.currency}</span>
              </div>
              <div className="join-info-row">
                <span className="join-info-row-label">{t('info.activeCargos')}</span>
                <span className="join-info-row-value">{investment.cargoCount}</span>
              </div>
              <div className="join-info-row">
                <span className="join-info-row-label">{t('info.investorsInRound')}</span>
                <span className="join-info-row-value">{investment.investorCount}</span>
              </div>
            </div>

            <p className="join-info-note">
              {t('info.note')}
            </p>
          </div>

          {/* ── Right: form ── */}
          <div className="join-form-wrap">
            <h1 className="join-form-title">{t('form.title')}</h1>
            <p className="join-form-sub">{t('form.sub')}</p>

            <form className="join-form" onSubmit={handleSubmit}>
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
              {/* Full name */}
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

              {/* Contact method */}
              <div className="join-field">
                <label className="join-label">{t('form.contactMethod')}</label>
                <div className="join-method-grid">
                  <button
                    type="button"
                    className={`join-method-card join-method-card--whatsapp${contactMethod === 'whatsapp' ? ' join-method-card--active' : ''}`}
                    onClick={() => { setContactMethod('whatsapp'); setContactDetail(''); }}
                  >
                    <span className="join-method-icon">📱</span>
                    <span className="join-method-name">{t('form.whatsapp')}</span>
                    <span className="join-method-desc">{t('form.whatsappDesc')}</span>
                  </button>
                  <button
                    type="button"
                    className={`join-method-card join-method-card--email${contactMethod === 'email' ? ' join-method-card--active' : ''}`}
                    onClick={() => { setContactMethod('email'); setContactDetail(''); }}
                  >
                    <span className="join-method-icon">✉️</span>
                    <span className="join-method-name">{t('form.email')}</span>
                    <span className="join-method-desc">{t('form.emailDesc')}</span>
                  </button>
                </div>
              </div>

              {/* Contact detail */}
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

              {/* RDV date */}
              <div className="join-field">
                <label className="join-label">{t('form.meetingDate')}</label>
                <input
                  className="join-input"
                  type="datetime-local"
                  value={rdvDate}
                  onChange={(e) => setRdvDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              {/* Note */}
              <div className="join-field">
                <label className="join-label">{t('form.message')}</label>
                <textarea
                  className="join-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('form.messagePlaceholder')}
                  rows={3}
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

export default JoinInvestment;
