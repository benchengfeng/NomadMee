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
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090D', color: '#fff', padding: '24px' }}>
      <section style={{ width: 'min(960px, 100%)', background: 'rgba(10,12,18,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '26px', padding: '24px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        <div>
          <p style={{ margin: 0, color: '#F4D06F', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Initial KYC</p>
          <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(2.2rem, 6vw, 3.6rem)' }}>Welcome futur investor</h1>
          <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.5 }}>Choose your adventure buddy, set your investor name, and we'll take you straight into your portfolio.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.9)' }}>
              <span style={{ fontWeight: 700 }}>Investor username</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your investor name" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.16)', background: '#0E1018', color: '#fff' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.9)' }}>
              <span style={{ fontWeight: 700 }}>Display currency</span>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>All amounts in your dashboard will be shown in this currency.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {CURRENCIES.map((cur) => (
                  <button key={cur} type="button" onClick={() => setPreferredCurrency(cur)} style={{ padding: '10px 0', borderRadius: '12px', border: preferredCurrency === cur ? '2px solid #F4D06F' : '1px solid rgba(255,255,255,0.14)', background: preferredCurrency === cur ? 'rgba(244,208,111,0.15)' : '#10131C', color: preferredCurrency === cur ? '#F4D06F' : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {cur}
                  </button>
                ))}
              </div>
            </label>

            <div>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>Choose your avatar</p>
              {avatars.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>No avatars available yet — contact support.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px' }}>
                  {visibleAvatars.map((av) => (
                    <button key={av._id} type="button" onClick={() => setSelectedAvatarId(av._id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '18px', border: selectedAvatarId === av._id ? '2px solid #F4D06F' : '1px solid rgba(255,255,255,0.14)', background: selectedAvatarId === av._id ? 'rgba(244,208,111,0.1)' : '#10131C', color: '#fff', cursor: 'pointer', textAlign: 'left', gridColumn: av.secret ? '1 / span 2' : undefined }}>
                      <img src={av.imageUrl} alt={av.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 800 }}>{av.name}</span>
                        {av.secret && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Secret avatar</span>}
                      </span>
                      {selectedAvatarId === av._id && <span style={{ marginLeft: 'auto', color: '#F4D06F' }}>✓</span>}
                    </button>
                  ))}
                  {hasSecrets && !showSecretAvatars && (
                    <button type="button" onClick={() => setShowSecretAvatars(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', borderRadius: '18px', border: '1px dashed rgba(255,255,255,0.18)', background: '#10131C', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', gridColumn: '1 / span 2', fontSize: '0.82rem' }}>
                      🔒 Reveal secret avatar
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && <p style={{ margin: 0, color: '#FF8A8A' }}>{error}</p>}
            <button type="submit" disabled={saving || !selectedAvatarId} style={{ marginTop: '8px', padding: '14px 16px', borderRadius: '999px', border: 'none', background: 'linear-gradient(90deg, #A70000, #F4D06F)', color: '#000', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: !selectedAvatarId ? 0.5 : 1 }}>
              {saving ? 'Saving...' : 'Finish KYC'}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '24px', padding: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {selectedAvatar ? (
              <img src={selectedAvatar.imageUrl} alt={selectedAvatar.name} style={{ width: '100%', maxWidth: '200px', maxHeight: '200px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #F4D06F', boxShadow: '0 0 0 4px rgba(244,208,111,0.2)' }} />
            ) : (
              <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>No avatar</div>
            )}
          </div>
          <div style={{ width: '100%', display: 'grid', gap: '10px' }}>
            {[
              { label: 'Name', value: displayName || 'Future investor' },
              { label: 'Avatar', value: selectedAvatar?.name || '—' },
              { label: 'Currency', value: preferredCurrency },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 14px', borderRadius: '14px', background: '#0E1018' }}>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                <p style={{ margin: '6px 0 0', fontSize: '1.1rem', fontWeight: 800 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default KycOnboarding;
