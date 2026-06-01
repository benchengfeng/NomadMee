import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeInvestorKyc, getInvestorHome, getPublicAvatars, AvatarData } from '../api/portalApi';

const CURRENCIES = ['USD', 'EUR', 'TND', 'CNY'] as const;

const KycOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [avatars, setAvatars] = useState<AvatarData[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const [showSecretAvatars, setShowSecretAvatars] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const [profile, avatarRes] = await Promise.all([getInvestorHome(), getPublicAvatars()]);
        if (!isMounted) return;
        setDisplayName(profile.investor.displayName || profile.investor.username || '');
        const fetched = avatarRes.avatars;
        setAvatars(fetched);
        if (profile.investor.avatar) {
          const existing = fetched.find((a) => a._id === profile.investor.avatar);
          if (existing) {
            setSelectedAvatarId(existing._id);
            if (existing.secret) setShowSecretAvatars(true);
          } else if (fetched.length > 0) {
            setSelectedAvatarId(fetched[0]!._id);
          }
        } else if (fetched.length > 0) {
          setSelectedAvatarId(fetched[0]!._id);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load your investor profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void bootstrap();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await completeInvestorKyc({ avatar: selectedAvatarId, displayName: displayName.trim() || 'Future investor', preferredCurrency });
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete your onboarding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="portal-loading">Loading your onboarding...</div>;

  const visibleAvatars = avatars.filter((a) => !a.secret || showSecretAvatars);
  const selectedAvatar = avatars.find((a) => a._id === selectedAvatarId);
  const hasSecrets = avatars.some((a) => a.secret);

  return (
    <main className="kyc-shell">
      <section className="kyc-card">

        {/* ── Left: form ── */}
        <div className="kyc-form-col">
          <p className="kyc-eyebrow">Initial KYC</p>
          <h1 className="kyc-title">Welcome futur investor</h1>
          <p className="kyc-subtitle">Choose your adventure buddy, set your investor name, and we'll take you straight into your portfolio.</p>

          {/* Mobile-only compact avatar preview */}
          {selectedAvatar && (
            <div className="kyc-mobile-avatar">
              <img src={selectedAvatar.imageUrl} alt={selectedAvatar.name} />
              <span>{selectedAvatar.name}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="kyc-form">
            <label className="kyc-field">
              <span>Investor name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your investor name"
                autoComplete="name"
              />
            </label>

            <div className="kyc-field">
              <span className="kyc-field-label">Display currency</span>
              <p className="kyc-field-hint">All amounts in your dashboard will be shown in this currency.</p>
              <div className="kyc-currency-grid">
                {CURRENCIES.map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setPreferredCurrency(cur)}
                    className={`kyc-currency-btn${preferredCurrency === cur ? ' kyc-currency-btn--active' : ''}`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            <div className="kyc-field">
              <span className="kyc-field-label">Choose your avatar</span>
              {avatars.length === 0 ? (
                <p className="kyc-field-hint">No avatars available yet — contact support.</p>
              ) : (
                <div className="kyc-avatar-grid">
                  {visibleAvatars.map((av) => (
                    <button
                      key={av._id}
                      type="button"
                      onClick={() => setSelectedAvatarId(av._id)}
                      className={`kyc-avatar-btn${selectedAvatarId === av._id ? ' kyc-avatar-btn--active' : ''}${av.secret ? ' kyc-avatar-btn--wide' : ''}`}
                    >
                      <img src={av.imageUrl} alt={av.name} />
                      <span className="kyc-avatar-btn-info">
                        <span>{av.name}</span>
                        {av.secret && <span className="kyc-secret-label">Secret avatar</span>}
                      </span>
                      {selectedAvatarId === av._id && <span className="kyc-check">✓</span>}
                    </button>
                  ))}
                  {hasSecrets && !showSecretAvatars && (
                    <button
                      type="button"
                      onClick={() => setShowSecretAvatars(true)}
                      className="kyc-reveal-btn"
                    >
                      🔒 Reveal secret avatar
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && <p className="kyc-error">{error}</p>}

            <button
              type="submit"
              disabled={saving || !selectedAvatarId}
              className="kyc-submit"
            >
              {saving ? 'Saving...' : 'Finish KYC →'}
            </button>
          </form>
        </div>

        {/* ── Right: live preview (desktop only) ── */}
        <div className="kyc-preview-col">
          <div className="kyc-preview-avatar">
            {selectedAvatar ? (
              <img src={selectedAvatar.imageUrl} alt={selectedAvatar.name} />
            ) : (
              <div className="kyc-preview-placeholder">No avatar</div>
            )}
          </div>
          <div className="kyc-preview-stats">
            {[
              { label: 'Name', value: displayName || 'Future investor' },
              { label: 'Avatar', value: selectedAvatar?.name || '—' },
              { label: 'Currency', value: preferredCurrency },
            ].map(({ label, value }) => (
              <div key={label} className="kyc-preview-stat">
                <p>{label}</p>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  );
};

export default KycOnboarding;
