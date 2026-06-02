import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome, FiPackage, FiMap, FiTrendingUp, FiHeadphones, FiSettings, FiShoppingBag } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { getInvestorHome, logoutInvestor, completeInvestorKyc, getPublicAvatars, changeInvestorPassword, getInvestorProducts, AvatarData, InvestorHomeResponse, PublicProduct } from '../api/portalApi';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { setTheme } from '../redux/slices/themeSlice';
import { PanelId, setActivePanel, setSelectedCargoId } from '../redux/slices/dashboardUiSlice';
import type { DashboardTheme } from '../theme';
import { dashboardThemes } from '../theme';
import CargoMap from '../components/cargo/CargoMap';
import WorldMap from '../components/WorldMap';
import StoryMediaGallery from '../components/cargo/StoryMediaGallery';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import ShopSection from '../components/shop/ShopSection';
import { track } from '../utils/analytics';

const currencyRatesToUSD: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  TND: 0.33,
  CNY: 0.14,
};

const LEGACY_AVATAR_MAP: Record<string, string> = {
  popeye: '/assets/popeyesmall.png',
  olive: '/assets/olive1.jpeg',
  curto: '/assets/cortomaltese.png',
};


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


function formatDate(value: string | null | undefined): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}


const panelButtons: Array<{ id: PanelId; labelKey: string; mobileKey: string; Icon: IconType }> = [
  { id: 'summary',  labelKey: 'nav.summary', mobileKey: 'nav.summaryShort',  Icon: FiHome },
  { id: 'cargos',   labelKey: 'nav.cargos',  mobileKey: 'nav.cargosShort',   Icon: FiPackage },
  { id: 'map',      labelKey: 'nav.map',     mobileKey: 'nav.mapShort',      Icon: FiMap },
  { id: 'shop',     labelKey: 'nav.shop',    mobileKey: 'nav.shopShort',     Icon: FiShoppingBag },
  { id: 'story',    labelKey: 'nav.story',   mobileKey: 'nav.storyShort',    Icon: FiTrendingUp },
  { id: 'support',  labelKey: 'nav.support', mobileKey: 'nav.supportShort',  Icon: FiHeadphones },
  { id: 'settings', labelKey: 'nav.settings',mobileKey: 'nav.settingsShort', Icon: FiSettings },
];

const InvestorHome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const dispatch = useAppDispatch();
  const activeTheme = useAppSelector((state: any) => state.theme.activeTheme);
  const activePanel = useAppSelector((state: any) => state.dashboardUi.activePanel);
  const selectedCargoId = useAppSelector((state: any) => state.dashboardUi.selectedCargoId);

  const [data, setData] = useState<InvestorHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'me' | 'globe'>('me');

  // Avatar data
  const [avatarOptions, setAvatarOptions] = useState<AvatarData[]>([]);
  const [showSecretAvatar, setShowSecretAvatar] = useState(false);

  // Shop products
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Settings panel state
  const [settingsName, setSettingsName] = useState('');
  const [settingsAvatar, setSettingsAvatar] = useState('');
  const [settingsCurrency, setSettingsCurrency] = useState('USD');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // Password change state
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const theme: DashboardTheme = dashboardThemes[activeTheme] ?? dashboardThemes[0]!;

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [response, avatarRes] = await Promise.all([getInvestorHome(), getPublicAvatars()]);
        if (isMounted) {
          setData(response);
          setError(null);
          setAvatarOptions(avatarRes.avatars);
          setSettingsName(response.investor.displayName || response.investor.name || '');
          setSettingsCurrency(response.investor.preferredCurrency || response.investor.currency || 'USD');
          const av = response.investor.avatar || '';
          setSettingsAvatar(av);
          const found = avatarRes.avatars.find((a) => a._id === av);
          if (found?.secret) setShowSecretAvatar(true);
          // Apply avatar's default theme
          if (found) dispatch(setTheme(found.defaultTheme ?? 0));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

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
    track('theme-change', { theme: dashboardThemes[index]?.name ?? index });
  };

  // Track entering the globe view (covers all toggle entry points)
  useEffect(() => {
    if (viewMode === 'globe') track('globe-open');
  }, [viewMode]);

  // Lazy-load shop products the first time the Shop panel is opened
  useEffect(() => {
    if (activePanel === 'shop' && !productsLoaded) {
      track('shop-open');
      setLoadingProducts(true);
      getInvestorProducts()
        .then((r) => { setProducts(r.products); setProductsLoaded(true); })
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
    }
  }, [activePanel, productsLoaded]);

  const renderSummary = () => {
    if (!data) return null;

    const displayCurrency = data.investor.preferredCurrency || data.investor.currency || 'USD';
    const investmentSourceCurrency = data.investor.currency || 'USD';
    const investedAmount = convertCurrency(data.investor.investmentAmount || 0, investmentSourceCurrency, displayCurrency);
    const profitPct = data.investor.profitPercentageOnInvestment || 0;
    const expectedProfit = Number(((investedAmount * profitPct) / 100).toFixed(0));
    const projectedPayout = investedAmount + expectedProfit;

    const investedUSD = convertCurrency(data.investor.investmentAmount || 0, investmentSourceCurrency, 'USD');
    void investedUSD; // tier label removed — kept for future use

    return (
      <div className="summary-panel">
        <div className="dashboard-section hero-card" style={{ background: theme.surface, color: theme.text, boxShadow: `0 24px 70px ${theme.panelGlow}` }}>
          <div>
            <p className="hero-label">{t('summary.companion')}</p>
            <h2>{data.investor.displayName || data.investor.name}</h2>
            <p className="hero-subtitle">{t('summary.welcomeAmounts', { currency: displayCurrency })}</p>
          </div>
          <div className="hero-metric hero-metric--avatar" style={{ borderColor: theme.accent, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 20px' }}>
            {avatarBadgeSrc && (
              <img
                src={avatarBadgeSrc}
                alt={data.investor.displayName || data.investor.name}
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme.accent}`, boxShadow: `0 0 0 3px ${theme.accent}33` }}
              />
            )}
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.secondaryText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              @{data.investor.username}
            </span>
          </div>
        </div>

        <div className="dashboard-grid-stats">
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>{t('summary.invested')}</span>
            <strong>{formatCurrency(investedAmount, displayCurrency)}</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>{t('summary.projectedProfit')}</span>
            <strong>{formatCurrency(expectedProfit, displayCurrency)}</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>{t('summary.profitRate')}</span>
            <strong>{data.investor.profitPercentageOnInvestment ?? 0}%</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>{t('summary.activeCargos')}</span>
            <strong>{data.cargos.length}</strong>
          </div>
          <div className="stat-card stat-card-wide" style={{ background: theme.surface, color: theme.text }}>
            <span>{t('summary.expectedPayout')}</span>
            <strong>{formatCurrency(projectedPayout, displayCurrency)}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderCargos = () => {
    if (!data) return null;

    const investorCurrency = data.investor.preferredCurrency || data.investor.currency || 'USD';

    return (
      <div className="cargo-panel" style={{ color: theme.text }}>
        {data.cargos.length === 0 ? (
          <div className="empty-state" style={{ borderColor: theme.accent }}>
            <p>{t('cargos.noneTitle')}</p>
            <p>{t('cargos.noneBody')}</p>
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
                  onClick={() => { dispatch(setSelectedCargoId(cargo._id)); track('cargo-open', { cargo: cargo.productBeingShipped }); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') dispatch(setSelectedCargoId(cargo._id));
                  }}
                >
                  {cargo.coverImageUrl && (
                    <img src={cargo.coverImageUrl} alt="" className="cargo-card-cover" />
                  )}
                  <div className="cargo-card-title">{cargo.productBeingShipped}</div>
                  <div className="cargo-card-meta">
                    {cargo.shippingType === 'air' ? '✈️' : cargo.shippingType === 'land' ? '🚛' : '🚢'}{' '}
                    {cargo.purchaseLocation} → {cargo.shippingDestination}
                  </div>
                  <div className="cargo-card-footer">
                    {cargo.quantity} {t('cargos.units')} · {formatCurrency(convertedTotal, investorCurrency)} {t('cargos.total')} · {t('cargos.eta')} {formatDate(cargo.estimatedTimeOfArrival)}
                  </div>
                  {(() => {
                    const createdMs = cargo.purchaseDate ? new Date(cargo.purchaseDate).getTime() : cargo.createdAt ? new Date(cargo.createdAt).getTime() : 0;
                    const etaMs = new Date(cargo.estimatedTimeOfArrival).getTime();
                    const nowMs = Date.now();
                    const progress = createdMs > 0 && etaMs > createdMs
                      ? Math.max(0, Math.min(1, (nowMs - createdMs) / (etaMs - createdMs)))
                      : 0;
                    const pct = Math.round(progress * 100);
                    return (
                      <div className="cargo-journey-progress">
                        <div className="cargo-journey-bar">
                          <div
                            className="cargo-journey-fill"
                            style={{ width: `${pct}%`, background: isSelected ? theme.background : theme.accent }}
                          />
                        </div>
                        <span className="cargo-journey-label" style={{ color: isSelected ? theme.background : theme.accent }}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })()}
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
                      {t('cargos.viewRoute')}
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
            <p>{t('map.selectPrompt')}</p>
          </div>
        </div>
      );
    }

    const investorCurrency = data?.investor.preferredCurrency || data?.investor.currency || 'USD';

    return (
      <div className="map-panel" style={{ color: theme.text }}>
        {/* Admin-set cargo description */}
        {selectedCargo.cargoDescription && (
          <div className="cargo-desc-card" style={{ background: theme.surface }}>
            <p className="cargo-desc-label">{t('map.about')}</p>
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
            <span>{t('map.purchasePrice')}</span>
            <strong>{formatCurrency(convertCurrency(selectedCargo.purchasePrice, selectedCargo.currency, investorCurrency), investorCurrency)}</strong>
          </div>
          <div>
            <span>{t('map.shippingCost')}</span>
            <strong>{formatCurrency(convertCurrency(selectedCargo.shippingPrice, selectedCargo.currency, investorCurrency), investorCurrency)}</strong>
          </div>
          <div>
            <span>{t('map.otherFees')}</span>
            <strong>{formatCurrency(convertCurrency(selectedCargo.otherExpenses, selectedCargo.currency, investorCurrency), investorCurrency)}</strong>
          </div>
          <div>
            <span>{t('map.eta')}</span>
            <strong>{formatDate(selectedCargo.estimatedTimeOfArrival)}</strong>
          </div>
          <div>
            <span>{t('map.sellWindow')}</span>
            <strong>{formatDate(selectedCargo.estimatedTimeOfSelling)}</strong>
          </div>
          <div>
            <span>{t('map.quantity')}</span>
            <strong>{selectedCargo.quantity} {t('cargos.units')}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderShop = () => {
    return (
      <div className="shop-investor-panel" style={{ color: theme.text }}>
        <div style={{ marginBottom: 22 }}>
          <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.accent }}>
            {t('shop.eyebrow')}
          </p>
          <h2 style={{ margin: '6px 0 6px', fontSize: '1.35rem', fontWeight: 800 }}>{t('shop.title')}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: theme.secondaryText, lineHeight: 1.6, maxWidth: 560 }}>
            {t('shop.sub')}
          </p>
        </div>
        <ShopSection
          products={products}
          loading={loadingProducts}
          emptyLabel={t('shop.none')}
          theme={{
            accent: theme.accent,
            card: theme.surface,
            text: theme.text,
            muted: theme.secondaryText,
            border: 'rgba(255,255,255,0.08)',
            modalBg: theme.background,
          }}
          onOrdered={(p) => track('order-submit', { product: p.name })}
        />
      </div>
    );
  };

  const renderStory = () => {
    if (!data) return null;

    const cargoSteps = data.cargos;

    if (cargoSteps.length > 0) {
      return (
        <div className="story-panel" style={{ color: theme.text }}>
          <p className="story-intro">{t('story.intro')}</p>
          <div className="story-timeline">
            {cargoSteps.map((cargo, index) => {
              const hasStory = cargo.story?.text || (cargo.story?.mediaUrls?.length ?? 0) > 0;
              return (
                <div key={cargo._id} className="story-step" style={{ background: theme.surface }}>
                  <div className="story-step-number" style={{ background: theme.accent }}>{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <strong>{cargo.productBeingShipped}</strong>
                    <p className="story-step-eta">{cargo.purchaseLocation} → {cargo.shippingDestination}</p>
                    <p className="story-step-eta">{t('story.eta')} {formatDate(cargo.estimatedTimeOfArrival)}</p>
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
            <h3>{t('story.currentMission')}</h3>
            <p>
              {t('story.monitor', { count: cargoSteps.length })}
            </p>
            <div className="story-badges">
              <span style={{ borderColor: theme.accent }}>{t('story.activeRoute')}</span>
              <span style={{ borderColor: theme.accent }}>{t('story.profitTracking')}</span>
              <span style={{ borderColor: theme.accent }}>{t('story.realtimeEta')}</span>
            </div>
          </div>
        </div>
      );
    }

    const steps = t('story.emptySteps', { returnObjects: true }) as string[];

    return (
      <div className="story-panel" style={{ color: theme.text }}>
        <p className="story-intro">{t('story.trackProgress')}</p>
        <div className="story-timeline">
          {steps.map((stepLabel, index) => (
            <div key={stepLabel} className="story-step" style={{ background: theme.surface }}>
              <div className="story-step-number" style={{ background: theme.accent }}>{index + 1}</div>
              <div>
                <strong>{stepLabel}</strong>
                <p className="story-step-eta">{t('story.stage', { n: index + 1, total: steps.length })}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="story-status" style={{ background: theme.surface }}>
          <h3>{t('story.beginsTitle')}</h3>
          <p>{t('story.beginsBody')}</p>
          <div className="story-badges">
            <span style={{ borderColor: theme.accent }}>{t('story.ready')}</span>
            <span style={{ borderColor: theme.accent }}>{t('story.tracking')}</span>
            <span style={{ borderColor: theme.accent }}>{t('story.profit')}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSupport = () => {
    return (
      <div className="support-panel" style={{ color: theme.text }}>
        <div className="support-card" style={{ background: theme.surface }}>
          <h3>{t('support.needHelp')}</h3>
          <p>{t('support.sendMessage')}</p>
          <a
            href={`mailto:contact@nomadmee.com?subject=Support%20%E2%80%94%20%40${data?.investor.username ?? ''}`}
            target="_blank"
            rel="noreferrer"
            className="support-button"
            style={{ background: theme.accent, color: theme.background }}
          >
            {t('support.contactSupport')}
          </a>
        </div>
        <div className="support-actions" style={{ background: theme.surface }}>
          <button
            type="button"
            className="support-action-item"
            onClick={() => dispatch(setActivePanel('cargos'))}
          >
            <span style={{ fontSize: '11px', color: theme.secondaryText, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{t('support.quickAction')}</span>
            <p style={{ color: theme.text }}>{t('support.viewCargos')}</p>
          </button>
          <button
            type="button"
            className="support-action-item"
            onClick={() => dispatch(setActivePanel('map'))}
          >
            <span style={{ fontSize: '11px', color: theme.secondaryText, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{t('support.reminder')}</span>
            <p style={{ color: theme.text }}>{t('support.exploreRoute')}</p>
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
          preferredCurrency: settingsCurrency,
        });
        setData((prev) => prev ? { ...prev, investor: { ...prev.investor, ...updatedInvestor } } : prev);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      } catch (err) {
        setSettingsError(err instanceof Error ? err.message : t('settings.pwFailed'));
      } finally {
        setSettingsSaving(false);
      }
    };

    const currentAvatarSrc = avatarBadgeMap[settingsAvatar] ?? '/logo192.png';
    const visibleAvatars = avatarOptions.filter((a) => !a.secret || showSecretAvatar);
    const hasSecrets = avatarOptions.some((a) => a.secret);

    const handlePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setPwError('');
      if (pwNew !== pwConfirm) { setPwError(t('settings.pwMismatch')); return; }
      if (pwNew.length < 6) { setPwError(t('settings.pwTooShort')); return; }
      setPwSaving(true);
      try {
        await changeInvestorPassword({ currentPassword: pwCurrent, newPassword: pwNew });
        setPwSaved(true);
        setPwCurrent(''); setPwNew(''); setPwConfirm('');
        setTimeout(() => setPwSaved(false), 3000);
      } catch (err) {
        setPwError(err instanceof Error ? err.message : t('settings.pwFailed'));
      } finally {
        setPwSaving(false);
      }
    };

    return (
      <div className="story-panel" style={{ color: theme.text }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 24, alignItems: 'start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800 }}>{t('settings.title')}</h2>
            <p style={{ margin: '0 0 24px', color: theme.secondaryText, fontSize: '0.85rem' }}>
              {t('settings.subtitle')}
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Display name */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.secondaryText }}>{t('settings.displayName')}</span>
                <input
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder={t('settings.displayNamePlaceholder')}
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

              {/* Display currency */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.secondaryText }}>{t('settings.displayCurrency')}</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {['USD', 'EUR', 'TND', 'CNY'].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setSettingsCurrency(cur)}
                      style={{
                        padding: '10px 0',
                        borderRadius: 10,
                        border: settingsCurrency === cur ? `2px solid ${theme.accent}` : `1px solid rgba(255,255,255,0.1)`,
                        background: settingsCurrency === cur ? `${theme.accent}22` : theme.surface,
                        color: settingsCurrency === cur ? theme.accent : theme.secondaryText,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: theme.secondaryText, opacity: 0.7 }}>
                  {t('settings.currencyHint', { currency: settingsCurrency })}
                </p>
              </label>

              {/* Avatar picker — dynamic */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.secondaryText }}>
                  {t('settings.chooseAvatar')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {visibleAvatars.map((av) => (
                    <button
                      key={av._id}
                      type="button"
                      onClick={() => { setSettingsAvatar(av._id); dispatch(setTheme(av.defaultTheme ?? 0)); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 16,
                        border: settingsAvatar === av._id ? `2px solid ${theme.accent}` : `1px solid rgba(255,255,255,0.1)`,
                        background: settingsAvatar === av._id ? `${theme.accent}22` : theme.surface,
                        color: theme.text, cursor: 'pointer', textAlign: 'left',
                        gridColumn: av.secret ? '1 / -1' : undefined, transition: 'all 0.18s',
                      }}
                    >
                      <img src={av.imageUrl} alt={av.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${settingsAvatar === av._id ? theme.accent : 'transparent'}` }} />
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{av.name}</span>
                        {av.secret && <span style={{ fontSize: '0.68rem', color: theme.secondaryText }}>{t('settings.secretAvatar')}</span>}
                      </span>
                      {settingsAvatar === av._id && <span style={{ marginLeft: 'auto', color: theme.accent, fontSize: '1rem' }}>✓</span>}
                    </button>
                  ))}
                  {hasSecrets && !showSecretAvatar && (
                    <button type="button" onClick={() => setShowSecretAvatar(true)}
                      style={{ padding: '10px 12px', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: theme.secondaryText, cursor: 'pointer', fontSize: '0.82rem', gridColumn: '1 / -1' }}>
                      {t('settings.revealSecret')}
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
                {settingsSaving ? t('settings.saving') : settingsSaved ? t('settings.saved') : t('settings.save')}
              </button>
            </form>

            {/* Password change */}
            <form onSubmit={handlePasswordChange} style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid rgba(255,255,255,0.08)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.secondaryText }}>{t('settings.changePassword')}</p>
              {[
                { label: t('settings.currentPassword'), value: pwCurrent, set: setPwCurrent, id: 'pw-current' },
                { label: t('settings.newPassword'), value: pwNew, set: setPwNew, id: 'pw-new' },
                { label: t('settings.confirmPassword'), value: pwConfirm, set: setPwConfirm, id: 'pw-confirm' },
              ].map(({ label, value, set, id }) => (
                <label key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.secondaryText, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  <input id={id} type="password" value={value} onChange={(e) => set(e.target.value)} autoComplete={id === 'pw-current' ? 'current-password' : 'new-password'}
                    style={{ padding: '11px 14px', background: `${theme.surface}cc`, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, color: theme.text, fontSize: '0.88rem', outline: 'none' }} />
                </label>
              ))}
              {pwError && <p style={{ margin: 0, color: '#f87171', fontSize: '0.82rem' }}>{pwError}</p>}
              <button type="submit" disabled={pwSaving} style={{ padding: '11px', borderRadius: 10, border: 'none', background: pwSaved ? '#22c55e' : 'rgba(255,255,255,0.08)', color: pwSaved ? '#000' : theme.text, fontWeight: 700, fontSize: '0.85rem', cursor: pwSaving ? 'wait' : 'pointer', transition: 'background 0.3s' }}>
                {pwSaving ? t('settings.saving') : pwSaved ? t('settings.passwordUpdated') : t('settings.updatePassword')}
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
            { label: t('account.username'), value: `@${data?.investor.username ?? '—'}` },
            { label: t('account.investment'), value: data ? formatCurrency(convertCurrency(data.investor.investmentAmount ?? 0, data.investor.currency, settingsCurrency || data.investor.preferredCurrency || 'USD'), settingsCurrency || data.investor.preferredCurrency || 'USD') : '—' },
            { label: t('account.profitRate'), value: data ? `${data.investor.profitPercentageOnInvestment ?? 0}%` : '—' },
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
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="investor-loading">
        <p>{error || t('error.unavailable')}</p>
        <Link to="/">{t('error.backToLogin')}</Link>
      </div>
    );
  }

  const avatarBadgeMap: Record<string, string> = { ...LEGACY_AVATAR_MAP };
  for (const av of avatarOptions) avatarBadgeMap[av._id] = av.imageUrl;
  const avatarBadgeSrc = data.investor.avatar ? (avatarBadgeMap[data.investor.avatar] ?? null) : null;

  return (
    <main className={`investor-dashboard-shell gamified-shell${viewMode === 'globe' ? ' gamified-shell--globe' : ''}`} style={{ background: theme.background, color: theme.text }}>
      <div className="investor-topbar gamified-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo192.png" className="topbar-brand-logo" alt="NomadMee" />
          <div>
            <p className="mini-label">{t('topbar.portal')}</p>
            <h1>{t('topbar.welcome', { name: data.investor.displayName || data.investor.name })}</h1>
            <p className="mini-description">{t('topbar.subtitle')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View toggle */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn${viewMode === 'me' ? ' view-mode-btn--active' : ''}`}
              onClick={() => setViewMode('me')}
            >
              {t('topbar.me')}
            </button>
            <button
              type="button"
              className={`view-mode-btn${viewMode === 'globe' ? ' view-mode-btn--active' : ''}`}
              onClick={() => setViewMode('globe')}
            >
              {t('topbar.globe')}
            </button>
          </div>
          <LanguageSwitcher variant="ghost" accentColor={theme.accent} />
          {/* Mobile-only: compact globe toggle */}
          <button
            type="button"
            className="mobile-globe-btn"
            onClick={() => setViewMode(viewMode === 'globe' ? 'me' : 'globe')}
            style={{ background: viewMode === 'globe' ? `${theme.accent}22` : 'rgba(255,255,255,0.06)', color: viewMode === 'globe' ? theme.accent : theme.secondaryText, borderColor: viewMode === 'globe' ? `${theme.accent}55` : 'rgba(255,255,255,0.12)' }}
          >
            🌍
          </button>
          {avatarBadgeSrc ? (
            <div
              className="topbar-avatar-badge"
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
                <span style={{ fontSize: '0.68rem', color: theme.secondaryText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('topbar.investor')}</span>
                <strong style={{ fontSize: '0.8rem', color: theme.text }}>{data.investor.displayName || data.investor.name}</strong>
              </div>
            </div>
          ) : null}
          <button type="button" className="logout-button" onClick={handleLogout} style={{ background: theme.accent, color: theme.background }}>
            {t('topbar.logout')}
          </button>
        </div>
      </div>

      {viewMode === 'globe' && (
        <div className="globe-view-wrap" style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <WorldMap accentColor={theme.accent} />
        </div>
      )}

      {viewMode === 'me' && <div className="gamified-grid">
        <aside className="dashboard-sidebar" style={{ background: theme.surface }}>
          <div className="sidebar-section">
            <h2>{t('sidebar.explore')}</h2>
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
                  {t(panel.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h2>{t('sidebar.theme')}</h2>
            <p style={{ margin: '-8px 0 10px', fontSize: '0.72rem', color: theme.secondaryText, opacity: 0.7 }}>
              {dashboardThemes[activeTheme]?.name}
            </p>
            <div className="theme-picker">
              {dashboardThemes.map((themeOption, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={themeOption.name}
                  title={themeOption.name}
                  className={`theme-chip${activeTheme === index ? ' theme-chip-active' : ''}`}
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
            <p>{t('sidebar.note')}</p>
          </div>
        </aside>

        <section className="dashboard-content">
          {activePanel === 'summary' && renderSummary()}
          {activePanel === 'cargos' && renderCargos()}
          {activePanel === 'map' && renderMap()}
          {activePanel === 'shop' && renderShop()}
          {activePanel === 'story' && renderStory()}
          {activePanel === 'support' && renderSupport()}
          {activePanel === 'settings' && renderSettings()}
        </section>
      </div>}

      {/* ── Mobile bottom navigation bar (hidden on desktop) ── */}
      <nav
        className="mobile-bottom-nav"
        style={{ background: `${theme.surface}f4`, borderTopColor: `rgba(255,255,255,0.07)` }}
      >
        {panelButtons.map((panel) => {
          const isActive = viewMode === 'me' && activePanel === panel.id;
          return (
            <button
              key={panel.id}
              type="button"
              className={`mobile-nav-btn${isActive ? ' mobile-nav-btn--active' : ''}`}
              style={{ color: isActive ? theme.accent : theme.secondaryText }}
              onClick={() => { setViewMode('me'); handlePanelChange(panel.id); }}
            >
              <panel.Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{t(panel.mobileKey)}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`mobile-nav-btn${viewMode === 'globe' ? ' mobile-nav-btn--active' : ''}`}
          style={{ color: viewMode === 'globe' ? theme.accent : theme.secondaryText }}
          onClick={() => setViewMode(viewMode === 'globe' ? 'me' : 'globe')}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>🌍</span>
          <span>{t('nav.globe')}</span>
        </button>
      </nav>
    </main>
  );
};

export default InvestorHome;
