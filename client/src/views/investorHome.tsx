import React, { useEffect, useState, useMemo } from 'react';
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

function buildMapUrlForShips(ships: Array<{ lat: number; lng: number }>): string {
  if (ships.length === 0) {
    // Default to world view if no ships
    return `https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90&layer=mapnik`;
  }

  if (ships.length === 1) {
    const ship = ships[0]!;
    const offset = 4.2;
    const left = ship.lng - offset;
    const right = ship.lng + offset;
    const top = ship.lat + offset;
    const bottom = ship.lat - offset;
    const bbox = `${left},${bottom},${right},${top}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${ship.lat},${ship.lng}`)}`;
  }

  // Multiple ships: calculate bounding box that includes all
  const lats = ships.map(s => s.lat);
  const lngs = ships.map(s => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Add padding
  const latPadding = (maxLat - minLat) * 0.1 || 1;
  const lngPadding = (maxLng - minLng) * 0.1 || 1;
  
  const bbox = `${minLng - lngPadding},${minLat - latPadding},${maxLng + lngPadding},${maxLat + latPadding}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`;
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

  const handleLogout = async () => {
    await logoutInvestor();
    navigate('/');
  };

  // Calculate map URL early (before conditionals)
  const filteredShips = useMemo(() => {
    if (!data || !data.aisstream.trackedMmsiList || data.aisstream.trackedMmsiList.length === 0) {
      return [];
    }
    const trackedMmsiSet = new Set(data.aisstream.trackedMmsiList.map(m => Number(m)));
    return (data.aisstream.ships || []).filter(ship => trackedMmsiSet.has(ship.mmsi));
  }, [data]);

  const mapUrl = useMemo(() => {
    return buildMapUrlForShips(filteredShips);
  }, [filteredShips]);

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

  // Show loader while waiting for AISStream data
  if (data.aisstream.isLoading) {
    return (
      <div className="investor-loading">
        <p>Loading AISStream data...</p>
        <p style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>Connecting to live vessel tracking...</p>
      </div>
    );
  }

  const { investor, aisstream } = data;

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
          <h2>Live Ship Tracking</h2>
          <div className="cargo-stats">
            <p><strong>Tracked MMSI:</strong> {aisstream.trackedMmsiList?.join(', ') || 'None'}</p>
            <p><strong>Ships Found:</strong> {filteredShips?.length || 0}</p>
            <p><strong>Last Updated:</strong> {aisstream.receivedAt || 'Waiting...'}</p>
          </div>

          <div className="cargo-map-wrapper">
            <iframe
              title="ais-live-ships-map"
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
