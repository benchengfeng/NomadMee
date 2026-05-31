import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiPackage, FiMap, FiTrendingUp, FiHeadphones, FiSettings } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { getInvestorHome, logoutInvestor, completeInvestorKyc, InvestorHomeResponse } from '../api/portalApi';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { setTheme } from '../redux/slices/themeSlice';
import { PanelId, setActivePanel, setSelectedCargoId } from '../redux/slices/dashboardUiSlice';
import type { DashboardTheme } from '../theme';
import { dashboardThemes } from '../theme';
import CargoMap from '../components/cargo/CargoMap';
import WorldMap from '../components/WorldMap';
import StoryMediaGallery from '../components/cargo/StoryMediaGallery';

const currencyRatesToUSD: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  TND: 0.33,
  CNY: 0.14,
};

const avatarBadgeMap: Record<string, string> = {
  popeye: '/assets/popeyesmall.png',
  olive: '/assets/olive1.jpeg',
  curto: '/assets/cortomaltese.png',
};

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function safeCurrency(currency: string | null | undefined): string {
  return (currency ?? 'USD').toUpperCase();
}

function convertCurrency(amount: number, sourceCurrency: string | null | undefined, targetCurrency: string | null | undefined): number {
  const sourceRate = currencyRatesToUSD[safeCurrency(sourceCurrency)] ?? 1;
  const targetRate = currencyRatesToUSD[safeCurrency(targetCurrency)] ?? 1;
  return (amount * sourceRate) / targetRate;
}

function formatCurrency(amount: number, currency: string | null | undefined): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: safeCurrency(currency),
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

function formatCurrencyWithConversion(amount: number, currency: string | null | undefined, convertedAmount: number, convertedCurrency: string | null | undefined): string {
  const base = formatCurrency(amount, currency);
  const converted = formatCurrency(convertedAmount, convertedCurrency);
  return `${base} • ${converted}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

const AVATAR_OPTIONS = [
  { key: 'popeye' as const, label: 'Popeye', src: '/assets/popeyesmall.png' },
  { key: 'olive' as const, label: 'Olive Oyl', src: '/assets/olive1.jpeg' },
  { key: 'curto' as const, label: 'Corto Maltese', src: '/assets/cortomaltese.png', secret: true },
];

const panelButtons: Array<{ id: PanelId; label: string; Icon: IconType }> = [
  { id: 'summary', label: 'Summary', Icon: FiHome },
  { id: 'cargos', label: 'Cargos', Icon: FiPackage },
  { id: 'map', label: 'Cargo map', Icon: FiMap },
  { id: 'story', label: 'Investment story', Icon: FiTrendingUp },
  { id: 'support', label: 'Support', Icon: FiHeadphones },
  { id: 'settings', label: 'Settings', Icon: FiSettings },
];

const InvestorHome: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activeTheme = useAppSelector((state: any) => state.theme.activeTheme);
  const activePanel = useAppSelector((state: any) => state.dashboardUi.activePanel);
  const selectedCargoId = useAppSelector((state: any) => state.dashboardUi.selectedCargoId);

  const [data, setData] = useState<InvestorHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'me' | 'globe'>('me');

  // Settings panel state
  const [settingsName, setSettingsName] = useState('');
  const [settingsAvatar, setSettingsAvatar] = useState<'popeye' | 'olive' | 'curto'>('popeye');
  const [showSecretAvatar, setShowSecretAvatar] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const theme: DashboardTheme = dashboardThemes[activeTheme] || dashboardThemes[0] || {
    background: '#091422',
    surface: '#14233B',
    accent: '#6FD4C8',
    accentSoft: '#3E8B92',
    text: '#F4F9FF',
    secondaryText: '#B9D1DD',
    panelGlow: 'rgba(111, 212, 200, 0.16)',
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await getInvestorHome();
        if (isMounted) {
          setData(response);
          setError(null);
          setSettingsName(response.investor.displayName || response.investor.name || '');
          const av = response.investor.avatar;
          if (av === 'popeye' || av === 'olive' || av === 'curto') {
            setSettingsAvatar(av);
            if (av === 'curto') setShowSecretAvatar(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load investor dashboard');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const firstCargoId = data?.cargos?.[0]?._id;
    if (firstCargoId && !selectedCargoId) {
      dispatch(setSelectedCargoId(firstCargoId));
    }
  }, [data, selectedCargoId, dispatch]);

  const handleLogout = async () => {
    await logoutInvestor();
    navigate('/');
  };

  const selectedCargo = useMemo(
    () => data?.cargos.find((item) => item._id === selectedCargoId) ?? data?.cargos[0] ?? null,
    [data, selectedCargoId]
  );

  const handlePanelChange = (panelId: PanelId) => {
    dispatch(setActivePanel(panelId));
  };

  const handleThemeChange = (index: number) => {
    dispatch(setTheme(index));
  };

  const renderSummary = () => {
    if (!data) return null;

    const investorCurrency = data.investor.currency || 'USD';
    const investedAmount = data.investor.investmentAmount || 0;
    const profitPct = data.investor.profitPercentageOnInvestment || 0;
    const expectedProfit = Number(((investedAmount * profitPct) / 100).toFixed(0));
    const projectedPayout = investedAmount + expectedProfit;

    return (
      <div className="summary-panel">
        <div className="dashboard-section hero-card" style={{ background: theme.surface, color: theme.text, boxShadow: `0 24px 70px ${theme.panelGlow}` }}>
          <div>
            <p className="hero-label">Investor companion</p>
            <h2>{data.investor.displayName || data.investor.name}</h2>
            <p className="hero-subtitle">Welcome back. Portfolio amounts shown in {investorCurrency}.</p>
          </div>
          <div className="hero-metric" style={{ borderColor: theme.accent }}>
            <span>Your tier</span>
            <strong>Portfolio Explorer</strong>
          </div>
        </div>

        <div className="dashboard-grid-stats">
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Invested</span>
            <strong>{formatCurrency(investedAmount, investorCurrency)}</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Projected profit</span>
            <strong>{formatCurrency(expectedProfit, investorCurrency)}</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Estimated ROI</span>
            <strong>{money(data.investor.estimatedROI ?? 0)}%</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Active cargos</span>
            <strong>{data.cargos.length}</strong>
          </div>
          <div className="stat-card stat-card-wide" style={{ background: theme.surface, color: theme.text }}>
            <span>Expected payout</span>
            <strong>{formatCurrency(projectedPayout, investorCurrency)}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderCargos = () => {
    if (!data) return null;

    const investorCurrency = data.investor.currency || 'USD';

    return (
      <div className="cargo-panel" style={{ color: theme.text }}>
        {data.cargos.length === 0 ? (
          <div className="empty-state" style={{ borderColor: theme.accent }}>
            <p>No cargos assigned yet.</p>
            <p>Once you have a shipment, it will appear here with route details and cost breakdown.</p>
          </div>
        ) : (
          <div className="cargo-list">
            {data.cargos.map((cargo) => {
              const totalCost = (cargo.purchasePrice || 0) + (cargo.shippingPrice || 0) + (cargo.otherExpenses || 0);
              const convertedTotal = convertCurrency(totalCost, cargo.currency, investorCurrency);
              const isSelected = selectedCargo?._id === cargo._id;

              return (
                <div
                  key={cargo._id}
                  role="button"
                  tabIndex={0}
                  className={`cargo-card ${isSelected ? 'cargo-card-selected' : ''}`}
                  style={{
                    background: isSelected ? theme.accent : theme.surface,
                    color: isSelected ? theme.background : theme.text,
                  }}
                  onClick={() => dispatch(setSelectedCargoId(cargo._id))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') dispatch(setSelectedCargoId(cargo._id));
                  }}
                >
                  <div className="cargo-card-title">{cargo.productBeingShipped}</div>
                  <div className="cargo-card-meta">{cargo.purchaseLocation} → {cargo.shippingDestination}</div>
                  <div className="cargo-card-footer">
                    {cargo.quantity} units · {formatCurrencyWithConversion(totalCost, cargo.currency, convertedTotal, investorCurrency)} · ETA {formatDate(cargo.estimatedTimeOfArrival)}
                  </div>
                  <div className="cargo-card-actions">
                    <button
                      type="button"
                      className="cargo-card-route-hint"
                      style={{
                        color: isSelected ? theme.background : theme.accent,
                        borderColor: isSelected ? theme.background : theme.accent,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(setSelectedCargoId(cargo._id));
                        dispatch(setActivePanel('map'));
                      }}
                    >
                      View route →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMap = () => {
    if (!selectedCargo) {
      return (
        <div className="map-panel" style={{ color: theme.text }}>
          <div className="empty-state" style={{ borderColor: theme.accent }}>
            <p>Select a cargo from the Cargos tab to see its live route map and journey animation.</p>
          </div>
        </div>
      );
    }

    const investorCurrency = data?.investor.currency || 'USD';

    return (
      <div className="map-panel" style={{ color: theme.text }}>
        {/* Admin-set cargo description */}
        {selectedCargo.cargoDescription && (
          <div className="cargo-desc-card" style={{ background: theme.surface }}>
            <p className="cargo-desc-label">About this cargo</p>
            <p className="cargo-desc-text">{selectedCargo.cargoDescription}</p>
          </div>
        )}

        {/* MapLibre map with journey animation */}
        <CargoMap
          cargo={selectedCargo}
          avatar={data?.investor.avatar}
          theme={theme}
        />

        {/* Cost breakdown */}
        <div className="map-details" style={{ background: theme.surface }}>
          <div>
            <span>Purchase price</span>
            <strong>{formatCurrencyWithConversion(selectedCargo.purchasePrice, selectedCargo.currency, convertCurrency(selectedCargo.purchasePrice, selectedCargo.currency, investorCurrency), investorCurrency)}</strong>
          </div>
          <div>
            <span>Shipping cost</span>
            <strong>{formatCurrencyWithConversion(selectedCargo.shippingPrice, selectedCargo.currency, convertCurrency(selectedCargo.shippingPrice, selectedCargo.currency, investorCurrency), investorCurrency)}</strong>
          </div>
          <div>
            <span>Other fees</span>
            <strong>{formatCurrencyWithConversion(selectedCargo.otherExpenses, selectedCargo.currency, convertCurrency(selectedCargo.otherExpenses, selectedCargo.currency, investorCurrency), investorCurrency)}</strong>
          </div>
          <div>
            <span>ETA</span>
            <strong>{formatDate(selectedCargo.estimatedTimeOfArrival)}</strong>
          </div>
          <div>
            <span>Sell window</span>
            <strong>{formatDate(selectedCargo.estimatedTimeOfSelling)}</strong>
          </div>
          <div>
            <span>Quantity</span>
            <strong>{selectedCargo.quantity} units</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderStory = () => {
    if (!data) return null;

    const cargoSteps = data.cargos;

    if (cargoSteps.length > 0) {
      return (
        <div className="story-panel" style={{ color: theme.text }}>
          <p className="story-intro">Each cargo below is a chapter in your investment journey.</p>
          <div className="story-timeline">
            {cargoSteps.map((cargo, index) => {
              const hasStory = cargo.story?.text || (cargo.story?.mediaUrls?.length ?? 0) > 0;
              return (
                <div key={cargo._id} className="story-step" style={{ background: theme.surface }}>
                  <div className="story-step-number" style={{ background: theme.accent }}>{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <strong>{cargo.productBeingShipped}</strong>
                    <p className="story-step-eta">{cargo.purchaseLocation} → {cargo.shippingDestination}</p>
                    <p className="story-step-eta">ETA {formatDate(cargo.estimatedTimeOfArrival)}</p>
                    {hasStory && (
                      <div style={{ marginTop: 16 }}>
                        {cargo.story?.text && (
                          <p style={{ fontSize: '0.87rem', color: theme.secondaryText, lineHeight: 1.8, margin: '0 0 20px', whiteSpace: 'pre-wrap' }}>
                            {cargo.story.text}
                          </p>
                        )}
                        <StoryMediaGallery
                          urls={cargo.story?.mediaUrls ?? []}
                          accentColor={theme.accent}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="story-status" style={{ background: theme.surface }}>
            <h3>Current mission</h3>
            <p>
              Monitor your {cargoSteps.length} active cargo{cargoSteps.length !== 1 ? 's' : ''} through the supply chain and track expected returns.
            </p>
            <div className="story-badges">
              <span style={{ borderColor: theme.accent }}>Active route</span>
              <span style={{ borderColor: theme.accent }}>Profit tracking</span>
              <span style={{ borderColor: theme.accent }}>Real-time ETA</span>
            </div>
          </div>
        </div>
      );
    }

    const steps = [
      'Investment funded',
      'Products sourced',
      'Shipment in transit',
      'Selling preparation',
    ];

    return (
      <div className="story-panel" style={{ color: theme.text }}>
        <p className="story-intro">Track your portfolio progress through the supply chain.</p>
        <div className="story-timeline">
          {steps.map((stepLabel, index) => (
            <div key={stepLabel} className="story-step" style={{ background: theme.surface }}>
              <div className="story-step-number" style={{ background: theme.accent }}>{index + 1}</div>
              <div>
                <strong>{stepLabel}</strong>
                <p className="story-step-eta">Stage {index + 1} of {steps.length}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="story-status" style={{ background: theme.surface }}>
          <h3>Your journey begins here</h3>
          <p>Once cargos are assigned, each shipment will appear as a step in your investment journey.</p>
          <div className="story-badges">
            <span style={{ borderColor: theme.accent }}>Ready</span>
            <span style={{ borderColor: theme.accent }}>Tracking</span>
            <span style={{ borderColor: theme.accent }}>Profit</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSupport = () => {
    return (
      <div className="support-panel" style={{ color: theme.text }}>
        <div className="support-card" style={{ background: theme.surface }}>
          <h3>Need help with a cargo?</h3>
          <p>Send a message to your account manager or review the most recent investment update.</p>
          <Link className="support-button" to="/contact" style={{ background: theme.accent, color: theme.background }}>
            Contact support
          </Link>
        </div>
        <div className="support-actions" style={{ background: theme.surface }}>
          <button
            type="button"
            className="support-action-item"
            onClick={() => dispatch(setActivePanel('cargos'))}
          >
            <span style={{ fontSize: '11px', color: theme.secondaryText, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Quick action</span>
            <p style={{ color: theme.text }}>View your cargos →</p>
          </button>
          <button
            type="button"
            className="support-action-item"
            onClick={() => dispatch(setActivePanel('map'))}
          >
            <span style={{ fontSize: '11px', color: theme.secondaryText, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Reminder</span>
            <p style={{ color: theme.text }}>Explore shipment route →</p>
          </button>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSettingsSaving(true);
      setSettingsError('');
      setSettingsSaved(false);
      try {
        const updatedInvestor = await completeInvestorKyc({
          avatar: settingsAvatar,
          displayName: settingsName.trim() || data?.investor.name || 'Investor',
        });
        setData((prev) => prev ? { ...prev, investor: { ...prev.investor, ...updatedInvestor } } : prev);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      } catch (err) {
        setSettingsError(err instanceof Error ? err.message : 'Failed to save settings.');
      } finally {
        setSettingsSaving(false);
      }
    };

    const currentAvatarSrc = avatarBadgeMap[settingsAvatar];

    return (
      <div className="story-panel" style={{ color: theme.text }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 24, alignItems: 'start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800 }}>Profile settings</h2>
            <p style={{ margin: '0 0 24px', color: theme.secondaryText, fontSize: '0.85rem' }}>
              Update your display name and avatar anytime.
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Display name */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.secondaryText }}>Display name</span>
                <input
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="Your investor name"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1px solid ${theme.accentSoft}`,
                    background: theme.surface,
                    color: theme.text,
                    fontSize: '0.95rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              {/* Avatar picker */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.secondaryText }}>
                  Choose avatar
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {AVATAR_OPTIONS.filter((a) => !a.secret || showSecretAvatar).map((av) => (
                    <button
                      key={av.key}
                      type="button"
                      onClick={() => setSettingsAvatar(av.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 16,
                        border: settingsAvatar === av.key ? `2px solid ${theme.accent}` : `1px solid rgba(255,255,255,0.1)`,
                        background: settingsAvatar === av.key ? `${theme.accent}22` : theme.surface,
                        color: theme.text,
                        cursor: 'pointer',
                        textAlign: 'left',
                        gridColumn: av.secret ? '1 / -1' : undefined,
                        transition: 'all 0.18s',
                      }}
                    >
                      <img src={av.src} alt={av.label} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${settingsAvatar === av.key ? theme.accent : 'transparent'}` }} />
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{av.label}</span>
                        {av.secret && <span style={{ fontSize: '0.68rem', color: theme.secondaryText }}>Secret avatar</span>}
                      </span>
                      {settingsAvatar === av.key && (
                        <span style={{ marginLeft: 'auto', color: theme.accent, fontSize: '1rem' }}>✓</span>
                      )}
                    </button>
                  ))}
                  {!showSecretAvatar && (
                    <button
                      type="button"
                      onClick={() => setShowSecretAvatar(true)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 16,
                        border: '1px dashed rgba(255,255,255,0.2)',
                        background: 'transparent',
                        color: theme.secondaryText,
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        gridColumn: '1 / -1',
                      }}
                    >
                      🔒 Reveal secret avatar
                    </button>
                  )}
                </div>
              </div>

              {settingsError && (
                <p style={{ margin: 0, color: '#f87171', fontSize: '0.82rem' }}>{settingsError}</p>
              )}

              <button
                type="submit"
                disabled={settingsSaving}
                style={{
                  padding: '13px',
                  borderRadius: 12,
                  border: 'none',
                  background: settingsSaved ? '#22c55e' : `linear-gradient(90deg, ${theme.accent}, ${theme.accentSoft})`,
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: settingsSaving ? 'wait' : 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                {settingsSaving ? 'Saving...' : settingsSaved ? '✓ Saved!' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* Live avatar preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${theme.accent}`,
              boxShadow: `0 0 0 4px ${theme.accent}33, 0 8px 24px rgba(0,0,0,0.5)`,
            }}>
              <img src={currentAvatarSrc} alt={settingsAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: theme.secondaryText, textAlign: 'center', maxWidth: 110, lineHeight: 1.4 }}>
              {settingsName || data?.investor.name || 'Investor'}
            </p>
          </div>
        </div>

        {/* Read-only account info */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid rgba(255,255,255,0.08)`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Username', value: `@${data?.investor.username ?? '—'}` },
            { label: 'Investment', value: data ? `${data.investor.investmentAmount ?? 0} ${data.investor.currency}` : '—' },
            { label: 'Profit rate', value: data ? `${data.investor.profitPercentageOnInvestment ?? 0}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: theme.surface, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ margin: 0, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.secondaryText, fontWeight: 700 }}>{label}</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '0.95rem' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="investor-loading" style={{ background: '#06131F' }}>
        <div className="investor-loading-inner">
          <div className="investor-loading-spinner" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="investor-loading">
        <p>{error || 'Dashboard data not available.'}</p>
        <Link to="/">Back to login</Link>
      </div>
    );
  }

  const avatarBadgeSrc = data.investor.avatar ? avatarBadgeMap[data.investor.avatar] : null;

  return (
    <main className="investor-dashboard-shell gamified-shell" style={{ background: theme.background, color: theme.text }}>
      <div className="investor-topbar gamified-topbar">
        <div>
          <p className="mini-label">NomadMee — investor portal</p>
          <h1>Welcome back, {data.investor.displayName || data.investor.name}</h1>
          <p className="mini-description">Select a section below to explore your portfolio.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View toggle */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn${viewMode === 'me' ? ' view-mode-btn--active' : ''}`}
              onClick={() => setViewMode('me')}
            >
              Me
            </button>
            <button
              type="button"
              className={`view-mode-btn${viewMode === 'globe' ? ' view-mode-btn--active' : ''}`}
              onClick={() => setViewMode('globe')}
            >
              The Globe
            </button>
          </div>
          {avatarBadgeSrc ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${theme.accentSoft}`,
              }}
            >
              <img
                src={avatarBadgeSrc}
                alt={data.investor.avatar}
                style={{ width: '28px', height: '28px', borderRadius: '999px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.68rem', color: theme.secondaryText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Investor</span>
                <strong style={{ fontSize: '0.8rem', color: theme.text }}>{data.investor.displayName || data.investor.name}</strong>
              </div>
            </div>
          ) : null}
          <button type="button" className="logout-button" onClick={handleLogout} style={{ background: theme.accent, color: theme.background }}>
            Logout
          </button>
        </div>
      </div>

      {viewMode === 'globe' && (
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <WorldMap accentColor={theme.accent} />
        </div>
      )}

      {viewMode === 'me' && <div className="gamified-grid">
        <aside className="dashboard-sidebar" style={{ background: theme.surface }}>
          <div className="sidebar-section">
            <h2>Explore</h2>
            <div className="dashboard-tabs">
              {panelButtons.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  className={`dashboard-tab ${panel.id === activePanel ? 'dashboard-tab-active' : ''}`}
                  onClick={() => handlePanelChange(panel.id)}
                  style={{
                    borderColor: panel.id === activePanel ? theme.accent : 'transparent',
                    color: panel.id === activePanel ? theme.background : theme.text,
                    background: panel.id === activePanel ? theme.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <panel.Icon size={15} />
                  {panel.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h2>Theme</h2>
            <div className="theme-picker">
              {dashboardThemes.map((themeOption, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Theme ${index + 1}`}
                  title={`Theme ${index + 1}`}
                  className={`theme-chip ${activeTheme === index ? 'theme-chip-active' : ''}`}
                  style={{
                    background: themeOption.accent,
                    boxShadow: activeTheme === index ? `0 0 0 3px ${themeOption.panelGlow}, 0 0 0 1px ${themeOption.accent}` : 'none',
                  }}
                  onClick={() => handleThemeChange(index)}
                />
              ))}
            </div>
          </div>

          <div className="sidebar-note" style={{ borderColor: theme.accentSoft }}>
            <p>Monitor your China → Côte d'Ivoire shipments, projected ROI, and cargo details in one place.</p>
          </div>
        </aside>

        <section className="dashboard-content">
          {activePanel === 'summary' && renderSummary()}
          {activePanel === 'cargos' && renderCargos()}
          {activePanel === 'map' && renderMap()}
          {activePanel === 'story' && renderStory()}
          {activePanel === 'support' && renderSupport()}
          {activePanel === 'settings' && renderSettings()}
        </section>
      </div>}
    </main>
  );
};

export default InvestorHome;
