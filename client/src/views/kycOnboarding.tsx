import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeInvestorKyc, getInvestorHome } from '../api/portalApi';

const CURRENCIES = ['USD', 'EUR', 'TND', 'CNY'] as const;

const characterAssets: Record<string, string> = {
  popeye: '/assets/popeyesmall.png',
  olive: '/assets/olive1.jpeg',
  curto: '/assets/cortomaltese.png',
};

const characterLabels: Record<string, string> = {
  popeye: 'Popeye',
  olive: 'Olive Oyl',
  curto: 'Curto Maltese',
};

const KycOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState<'popeye' | 'olive' | 'curto'>('popeye');
  const [showSecretCharacter, setShowSecretCharacter] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const profile = await getInvestorHome();
        if (!isMounted) return;

        setDisplayName(profile.investor.displayName || profile.investor.username || '');
        if (profile.investor.avatar && ['popeye', 'olive', 'curto'].includes(profile.investor.avatar)) {
          setSelectedCharacter(profile.investor.avatar as 'popeye' | 'olive' | 'curto');
        }
        if (profile.investor.avatar === 'curto') {
          setShowSecretCharacter(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load your investor profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const characterPreview = useMemo(() => characterAssets[selectedCharacter], [selectedCharacter]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await completeInvestorKyc({
        avatar: selectedCharacter,
        displayName: displayName.trim() || 'Future investor',
        preferredCurrency,
      });
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete your onboarding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="portal-loading">Loading your onboarding...</div>;
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090D', color: '#fff', padding: '24px' }}>
      <section style={{ width: 'min(960px, 100%)', background: 'rgba(10, 12, 18, 0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '26px', padding: '24px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        <div>
          <p style={{ margin: 0, color: '#F4D06F', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Initial KYC</p>
          <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(2.2rem, 6vw, 3.6rem)' }}>Welcome futur investor</h1>
          <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.5 }}>
            Choose your adventure buddy, set your investor name, and we’ll take you straight into your portfolio.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.9)' }}>
              <span style={{ fontWeight: 700 }}>Investor username</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your investor name"
                style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.16)', background: '#0E1018', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.9)' }}>
              <span style={{ fontWeight: 700 }}>Display currency</span>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>All amounts in your dashboard will be shown in this currency.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {CURRENCIES.map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setPreferredCurrency(cur)}
                    style={{
                      padding: '10px 0',
                      borderRadius: '12px',
                      border: preferredCurrency === cur ? '2px solid #F4D06F' : '1px solid rgba(255,255,255,0.14)',
                      background: preferredCurrency === cur ? 'rgba(244,208,111,0.15)' : '#10131C',
                      color: preferredCurrency === cur ? '#F4D06F' : 'rgba(255,255,255,0.7)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginTop: '6px' }}>
              {(['popeye', 'olive'] as const).map((characterKey) => (
                <button
                  key={characterKey}
                  type="button"
                  onClick={() => setSelectedCharacter(characterKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '18px',
                    border: selectedCharacter === characterKey ? '2px solid #F4D06F' : '1px solid rgba(255,255,255,0.14)',
                    background: selectedCharacter === characterKey ? '#A70000' : '#10131C',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <img
                    src={characterAssets[characterKey]}
                    alt={characterLabels[characterKey]}
                    style={{ width: '42px', height: '42px', borderRadius: '999px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 800 }}>{characterLabels[characterKey]}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>Avatar option</span>
                  </span>
                </button>
              ))}
              {!showSecretCharacter ? (
                <button
                  type="button"
                  onClick={() => setShowSecretCharacter(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 12px',
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: '#10131C',
                    color: '#fff',
                    cursor: 'pointer',
                    gridColumn: '1 / span 2',
                  }}
                >
                  Reveal secret avatar
                </button>
              ) : (
                <button
                  key="curto"
                  type="button"
                  onClick={() => setSelectedCharacter('curto')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '18px',
                    border: selectedCharacter === 'curto' ? '2px solid #F4D06F' : '1px solid rgba(255,255,255,0.14)',
                    background: selectedCharacter === 'curto' ? '#2A5A7A' : '#10131C',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gridColumn: '1 / span 2',
                  }}
                >
                  <img
                    src={characterAssets['curto']}
                    alt={characterLabels['curto']}
                    style={{ width: '42px', height: '42px', borderRadius: '999px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 800 }}>{characterLabels['curto']}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>Secret avatar</span>
                  </span>
                </button>
              )}
            </div>

            {error && <p style={{ margin: 0, color: '#FF8A8A' }}>{error}</p>}

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '8px',
                padding: '14px 16px',
                borderRadius: '999px',
                border: 'none',
                background: 'linear-gradient(90deg, #A70000, #F4D06F)',
                color: '#000',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Finish KYC'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '24px', padding: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img src={characterPreview} alt={selectedCharacter} style={{ width: '100%', maxWidth: '300px', borderRadius: '20px', objectFit: 'contain' }} />
          </div>

          <div style={{ width: '100%', display: 'grid', gap: '10px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#0E1018' }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profile setup</p>
              <p style={{ margin: '6px 0 0', fontSize: '1.1rem', fontWeight: 800 }}>{displayName || 'Future investor'}</p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#0E1018' }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Avatar</p>
              <p style={{ margin: '6px 0 0', fontSize: '1.1rem', fontWeight: 800, textTransform: 'capitalize' }}>{selectedCharacter}</p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#0E1018' }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Currency</p>
              <p style={{ margin: '6px 0 0', fontSize: '1.1rem', fontWeight: 800 }}>{preferredCurrency}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default KycOnboarding;
