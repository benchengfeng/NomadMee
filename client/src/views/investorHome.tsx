import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvestorHome, logoutInvestor, InvestorHomeResponse } from '../api/portalApi';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { setTheme } from '../redux/slices/themeSlice';
import { PanelId, setActivePanel, setSelectedCargoId } from '../redux/slices/dashboardUiSlice';
import type { DashboardTheme } from '../theme';
import { dashboardThemes } from '../theme';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

const panelButtons: Array<{ id: PanelId; label: string }> = [
  { id: 'summary', label: 'Summary' },
  { id: 'cargos', label: 'Cargos' },
  { id: 'map', label: 'Cargo map' },
  { id: 'story', label: 'Investment story' },
  { id: 'support', label: 'Support' },
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

  const handlePanelChange = (panelId: 'summary' | 'cargos' | 'map' | 'story' | 'support') => {
    dispatch(setActivePanel(panelId));
  };

  const handleThemeChange = (index: number) => {
    dispatch(setTheme(index));
  };

  const renderSummary = () => {
    if (!data) return null;

    const expectedProfit = Number(((data.investor.investmentAmount * data.investor.profitPercentageOnInvestment) / 100).toFixed(0));
    const projectedPayout = data.investor.investmentAmount + expectedProfit;

    return (
      <>
        <div className="dashboard-section hero-card" style={{ background: theme.surface, color: theme.text, boxShadow: `0 24px 70px ${theme.panelGlow}` }}>
          <div>
            <p className="hero-label">Investor companion</p>
            <h2>{data.investor.name}</h2>
            <p className="hero-subtitle">Welcome back. Your cargo portfolio is ready for review.</p>
          </div>
          <div className="hero-metric" style={{ borderColor: theme.accent }}>
            <span>Your tier</span>
            <strong>Portfolio Explorer</strong>
          </div>
        </div>

        <div className="dashboard-grid-stats">
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Invested</span>
            <strong>${money(data.investor.investmentAmount)}</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Projected profit</span>
            <strong>${money(expectedProfit)}</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Reloaded ROI</span>
            <strong>${money(data.investor.estimatedROI)}</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Active cargos</span>
            <strong>{data.cargos.length}</strong>
          </div>
          <div className="stat-card" style={{ background: theme.surface, color: theme.text }}>
            <span>Expected payout</span>
            <strong>${money(projectedPayout)}</strong>
          </div>
        </div>
      </>
    );
  };

  const renderCargos = () => {
    if (!data) return null;
    return (
      <div className="cargo-panel" style={{ color: theme.text }}>
        {data.cargos.length === 0 ? (
          <div className="empty-state" style={{ borderColor: theme.accent }}>
            <p>No cargos assigned yet.</p>
            <p>Once you have a shipment, it will appear here with route details and cost breakdown.</p>
          </div>
        ) : (
          <div className="cargo-list">
            {data.cargos.map((cargo) => (
              <button
                key={cargo._id}
                type="button"
                className={`cargo-card ${selectedCargo?._id === cargo._id ? 'cargo-card-selected' : ''}`}
                style={{ background: selectedCargo?._id === cargo._id ? theme.accent : theme.surface, color: selectedCargo?._id === cargo._id ? theme.background : theme.text }}
                onClick={() => dispatch(setSelectedCargoId(cargo._id))}
              >
                <div className="cargo-card-title">{cargo.productBeingShipped}</div>
                <div className="cargo-card-meta">{cargo.purchaseLocation} → {cargo.shippingDestination}</div>
                <div className="cargo-card-footer">{cargo.quantity} units · ETA {formatDate(cargo.estimatedTimeOfArrival)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMap = () => {
    if (!selectedCargo) {
      return <p>Select a cargo to explore its route and status.</p>;
    }

    return (
      <div className="map-panel" style={{ color: theme.text }}>
        <div className="map-summary" style={{ background: theme.surface }}>
          <p className="map-label">Cargo route</p>
          <h3>{selectedCargo.productBeingShipped}</h3>
          <p>{selectedCargo.purchaseLocation} → {selectedCargo.shippingDestination}</p>
        </div>
        <div className="map-details" style={{ background: theme.surface }}>
          <div>
            <span>Purchase price</span>
            <strong>${money(selectedCargo.purchasePrice)}</strong>
          </div>
          <div>
            <span>Shipping cost</span>
            <strong>${money(selectedCargo.shippingPrice)}</strong>
          </div>
          <div>
            <span>Other fees</span>
            <strong>${money(selectedCargo.otherExpenses)}</strong>
          </div>
          <div>
            <span>ETA</span>
            <strong>{formatDate(selectedCargo.estimatedTimeOfArrival)}</strong>
          </div>
          <div>
            <span>Sell window</span>
            <strong>{formatDate(selectedCargo.estimatedTimeOfSelling)}</strong>
          </div>
        </div>
        <div className="route-visual" style={{ borderColor: theme.accent }}>
          <span className="route-dot" style={{ background: theme.accent }} />
          <span>China: {selectedCargo.purchaseLocation}</span>
          <div className="route-line" style={{ background: theme.accentSoft }} />
          <span className="route-dot" style={{ background: theme.accent }} />
          <span>Côte d'Ivoire: {selectedCargo.shippingDestination}</span>
        </div>
      </div>
    );
  };

  const renderStory = () => {
    const steps = [
      'Investment funded',
      'Products sourced',
      'Shipment in transit',
      'Selling preparation',
    ];

    return (
      <div className="story-panel" style={{ color: theme.text }}>
        <p className="story-intro">Track your portfolio progress in a friendly game layer.</p>
        <div className="story-timeline">
          {steps.map((stepLabel, index) => (
            <div key={stepLabel} className="story-step" style={{ background: theme.surface }}>
              <div className="story-step-number" style={{ background: theme.accent }}>{index + 1}</div>
              <div>
                <strong>{stepLabel}</strong>
                <p>Stage {index + 1} of {steps.length}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="story-status" style={{ background: theme.surface }}>
          <h3>Current mission</h3>
          <p>Keep your cargos moving and watch your investment progress through the supply chain.</p>
          <div className="story-badges">
            <span style={{ borderColor: theme.accent }}>Ready to move</span>
            <span style={{ borderColor: theme.accent }}>Shipment tracking</span>
            <span style={{ borderColor: theme.accent }}>Profit visibility</span>
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
          <div>
            <span>Quick action</span>
            <p>Review next cargo</p>
          </div>
          <div>
            <span>Reminder</span>
            <p>Check shipment ETA</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="investor-loading">Loading investor dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="investor-loading">
        <p>{error || 'Dashboard data not available.'}</p>
        <Link to="/">Back to login</Link>
      </div>
    );
  }

  return (
    <main className="investor-dashboard-shell gamified-shell" style={{ background: theme.background, color: theme.text }}>
      <div className="investor-topbar gamified-topbar">
        <div>
          <p className="mini-label">NomadMee for modern investors</p>
          <h1>Welcome back, {data.investor.name}</h1>
          <p className="mini-description">Tap the sections to switch your dashboard view.</p>
        </div>
        <button type="button" className="logout-button" onClick={handleLogout} style={{ background: theme.accent, color: theme.background }}>
          Logout
        </button>
      </div>

      <div className="gamified-grid">
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
                  }}
                >
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
                  className={`theme-chip ${activeTheme === index ? 'theme-chip-active' : ''}`}
                  style={{
                    background: themeOption.accent,
                    boxShadow: activeTheme === index ? `0 0 0 3px ${themeOption.panelGlow}` : 'none',
                  }}
                  onClick={() => handleThemeChange(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-note" style={{ borderColor: theme.accentSoft }}>
            <p>Use this dashboard to monitor your China → Côte d'Ivoire shipments, projected ROI, and cargo details in one game-style view.</p>
          </div>
        </aside>

        <section className="dashboard-content">
          {activePanel === 'summary' && renderSummary()}
          {activePanel === 'cargos' && renderCargos()}
          {activePanel === 'map' && renderMap()}
          {activePanel === 'story' && renderStory()}
          {activePanel === 'support' && renderSupport()}
        </section>
      </div>
    </main>
  );
};

export default InvestorHome;

