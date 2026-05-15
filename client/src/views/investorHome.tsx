import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardResponse, getDashboardHome, logoutInvestor } from '../api/dashboardApi';

const POLLING_INTERVAL_MS = 10000;

type InvestorCurrency = 'YUAN' | 'TND' | 'EURO';

const CURRENCY_TO_ISO: Record<InvestorCurrency, string> = {
  YUAN: 'CNY',
  TND: 'TND',
  EURO: 'EUR',
};

function money(value: number, currency: InvestorCurrency): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: CURRENCY_TO_ISO[currency],
    maximumFractionDigits: 0,
  }).format(value);
}

function buildMapEmbedUrl(lat: number, lng: number): string {
  const offset = 4.2;
  const left = lng - offset;
  const right = lng + offset;
  const top = lat + offset;
  const bottom = lat - offset;

  const bbox = `${left},${bottom},${right},${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

const InvestorHome: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const payload = await getDashboardHome();
        if (!isMounted) {
          return;
        }

        setData(payload);
        setError(null);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Unable to load dashboard';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = window.setInterval(fetchData, POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const mapUrl = useMemo(() => {
    if (!data) {
      return '';
    }

    return buildMapEmbedUrl(data.cargo.location.lat, data.cargo.location.lng);
  }, [data]);

  const handleLogout = async () => {
    await logoutInvestor();
    navigate('/');
  };

  if (loading) {
    return <div className="investor-loading">Loading dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="investor-loading">
        <p>{error || 'Dashboard data not available.'}</p>
        <button type="button" onClick={() => navigate('/')}>Back to Login</button>
      </div>
    );
  }

  const { investor, cargo } = data;

  return (
    <main className="investor-dashboard-shell">
      <header className="investor-topbar">
        <h1>NomadMe Cargo Dashboard</h1>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="investor-grid">
        <article className="investor-panel investor-panel-left">
          <h2>Investor Profile</h2>
          <div className="investor-highlight">
            <span>Name</span>
            <strong>{investor.firstName} {investor.lastName}</strong>
          </div>
          <div className="investor-highlight">
            <span>Initial Investment</span>
            <strong>{money(investor.initialInvestment, investor.currency)}</strong>
          </div>
          <div className="investor-highlight">
            <span>Estimated Profit</span>
            <strong>{money(investor.projectedProfit, investor.currency)}</strong>
          </div>
          <div className="investor-highlight">
            <span>Projected Total Return</span>
            <strong>{money(investor.projectedPayout, investor.currency)}</strong>
          </div>
          <p className="investor-profit-rate">
            Expected ROI: {(investor.expectedProfitRate * 100).toFixed(0)}%
          </p>
        </article>

        <article className="investor-panel investor-panel-right">
          <h2>Cargo Tracking</h2>
          <div className="cargo-stats">
            <p><strong>Status:</strong> {cargo.info.status}</p>
            <p><strong>Vessel:</strong> {cargo.info.vesselName}</p>
            <p><strong>Origin:</strong> {cargo.info.origin}</p>
            <p><strong>Destination:</strong> {cargo.info.destination}</p>
            <p><strong>Current Zone:</strong> {cargo.location.currentLabel}</p>
            <p><strong>Next Zone:</strong> {cargo.location.nextLabel}</p>
            <p><strong>ETA:</strong> {cargo.info.estimatedArrivalInDays} day(s)</p>
          </div>

          <div className="cargo-map-wrapper">
            <iframe
              title="cargo-live-map"
              src={mapUrl}
              className="cargo-map"
            />
          </div>
        </article>
      </section>
    </main>
  );
};

export default InvestorHome;
