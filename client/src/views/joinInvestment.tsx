import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPublicInvestments, submitContactRequest, PublicInvestment } from '../api/portalApi';
import { landingThemes } from '../utils/landingThemes';
import '../styles/join.css';

const DEFAULT_ACCENT = landingThemes[0]?.accent ?? '#38bdf8';

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  active:      { label: 'Active',      color: '#22c55e' },
  in_progress: { label: 'In Progress', color: '#38bdf8' },
  waiting:     { label: 'Waiting',     color: '#fbbf24' },
};

const JoinInvestment: React.FC = () => {
  const { investmentId } = useParams<{ investmentId: string }>();
  const navigate = useNavigate();

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
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const st = investment ? (STATUS_STYLE[investment.status] ?? STATUS_STYLE['active']!) : null;

  return (
    <div className="join-shell" style={{ '--join-accent': accent } as React.CSSProperties}>
      {/* Nav */}
      <nav className="join-nav">
        <Link to="/" className="join-back-btn">← Back</Link>
        <span className="join-nav-brand" style={{ color: accent }}>NomadMee</span>
      </nav>

      {submitted ? (
        /* ── Success state ── */
        <div className="join-success">
          <div className="join-success-card">
            <span className="join-success-icon">🎉</span>
            <h2 className="join-success-title">Request received!</h2>
            <p className="join-success-sub">
              Our team will reach out to you via {contactMethod === 'whatsapp' ? 'WhatsApp' : 'email'} before your scheduled meeting.
            </p>
            <div className="join-success-rdv">
              📅 RDV scheduled for {new Date(rdvDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
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
              Back to home
            </button>
          </div>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#475569' }}>
          Loading…
        </div>
      ) : !investment ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 16 }}>
          <p style={{ color: '#475569' }}>Investment not found.</p>
          <Link to="/" className="join-back-btn">← Back to home</Link>
        </div>
      ) : (
        <div className="join-body">
          {/* ── Left: investment info ── */}
          <div className="join-info-card">
            <p className="join-info-eyebrow" style={{ color: accent }}>You're applying for</p>
            <h2 className="join-info-title">{investment.title}</h2>

            {st && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: `${st.color}18`, marginBottom: 16 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                <span style={{ color: st.color, fontWeight: 700, fontSize: '0.72rem' }}>{st.label}</span>
              </div>
            )}

            <div className="join-info-rows">
              <div className="join-info-row">
                <span className="join-info-row-label">Min. investment</span>
                <span className="join-info-row-value">{investment.minimumInvestment.toLocaleString()} {investment.currency}</span>
              </div>
              <div className="join-info-row">
                <span className="join-info-row-label">Active cargos</span>
                <span className="join-info-row-value">{investment.cargoCount}</span>
              </div>
              <div className="join-info-row">
                <span className="join-info-row-label">Investors in round</span>
                <span className="join-info-row-value">{investment.investorCount}</span>
              </div>
            </div>

            <p className="join-info-note">
              After submitting, our team will contact you on the date you choose to walk you through the investment details.
            </p>
          </div>

          {/* ── Right: form ── */}
          <div className="join-form-wrap">
            <h1 className="join-form-title">Join this round</h1>
            <p className="join-form-sub">Fill in your details and choose a date for your first meeting.</p>

            <form className="join-form" onSubmit={handleSubmit}>
              {/* Full name */}
              <div className="join-field">
                <label className="join-label">Full name</label>
                <input
                  className="join-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              {/* Contact method */}
              <div className="join-field">
                <label className="join-label">Preferred contact method</label>
                <div className="join-method-grid">
                  <button
                    type="button"
                    className={`join-method-card join-method-card--whatsapp${contactMethod === 'whatsapp' ? ' join-method-card--active' : ''}`}
                    onClick={() => { setContactMethod('whatsapp'); setContactDetail(''); }}
                  >
                    <span className="join-method-icon">📱</span>
                    <span className="join-method-name">WhatsApp</span>
                    <span className="join-method-desc">Quick & personal</span>
                  </button>
                  <button
                    type="button"
                    className={`join-method-card join-method-card--email${contactMethod === 'email' ? ' join-method-card--active' : ''}`}
                    onClick={() => { setContactMethod('email'); setContactDetail(''); }}
                  >
                    <span className="join-method-icon">✉️</span>
                    <span className="join-method-name">Email</span>
                    <span className="join-method-desc">Formal & documented</span>
                  </button>
                </div>
              </div>

              {/* Contact detail */}
              <div className="join-field">
                <label className="join-label">
                  {contactMethod === 'whatsapp' ? 'WhatsApp number' : 'Email address'}
                </label>
                <input
                  className="join-input"
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={contactDetail}
                  onChange={(e) => setContactDetail(e.target.value)}
                  placeholder={contactMethod === 'whatsapp' ? '+1 234 567 8900' : 'you@example.com'}
                  required
                />
              </div>

              {/* RDV date */}
              <div className="join-field">
                <label className="join-label">Preferred meeting date & time</label>
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
                <label className="join-label">Message (optional)</label>
                <textarea
                  className="join-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any questions or context you'd like to share..."
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
                {saving ? 'Sending request…' : '✓ Submit contact request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinInvestment;
