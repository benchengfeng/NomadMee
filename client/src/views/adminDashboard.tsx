import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminDashboard, logoutAdmin, AdminDashboardResponse } from '../api/portalApi';
import AdminCargosSection from '../components/admin/sections/AdminCargosSection';
import AdminInvestmentsSection from '../components/admin/sections/AdminInvestmentsSection';
import AdminInvestorsSection from '../components/admin/sections/AdminInvestorsSection';
import AdminMessagesSection from '../components/admin/sections/AdminMessagesSection';
import AdminOrdersSection from '../components/admin/sections/AdminOrdersSection';
import AdminContentSection from '../components/admin/sections/AdminContentSection';
import AdminProductsSection from '../components/admin/sections/AdminProductsSection';
import AdminPartnersSection from '../components/admin/sections/AdminPartnersSection';
import AdminAvatarsSection from '../components/admin/sections/AdminAvatarsSection';
import AdminRelationsSection from '../components/admin/sections/AdminRelationsSection';
import AdminBoutiquesSection from '../components/admin/sections/AdminBoutiquesSection';
import AdminBundlesSection from '../components/admin/sections/AdminBundlesSection';
import AdminJourneysSection from '../components/admin/sections/AdminJourneysSection';

type AdminSection = 'cargos' | 'investments' | 'investors' | 'products' | 'bundles' | 'orders' | 'partners' | 'boutiques' | 'relations' | 'content' | 'messages' | 'avatars' | 'journeys';

const SECTIONS: Array<{ id: AdminSection; label: string }> = [
  { id: 'cargos', label: '📦 Cargos' },
  { id: 'investments', label: '💼 Investments' },
  { id: 'investors', label: '👤 Investors' },
  { id: 'products', label: '🛒 Products' },
  { id: 'bundles', label: '📦 Bundles' },
  { id: 'orders', label: '🧾 Orders' },
  { id: 'partners', label: '🤝 Partners' },
  { id: 'boutiques', label: '🏪 Boutiques' },
  { id: 'relations', label: '🔗 Relations' },
  { id: 'content', label: '✏️ Site Content' },
  { id: 'messages', label: '💬 Messages' },
  { id: 'avatars', label: '🎭 Avatars' },
  { id: 'journeys', label: '🧭 Journeys' },
];

type Toast = { id: number; message: string; type: 'success' | 'error' };

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('cargos');
  const [unreadContactCount, setUnreadContactCount] = useState(0);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const toastIdRef = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const refresh = useCallback(async () => {
    const response = await getAdminDashboard();
    setData(response);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await getAdminDashboard();
        if (mounted) {
          setData(response);
          setUnreadContactCount(response.unreadContactCount ?? 0);
          setUnreadOrderCount(response.unreadOrderCount ?? 0);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load admin dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => { await logoutAdmin(); navigate('/admin'); };

  if (loading) return <div className="portal-loading">Loading admin dashboard...</div>;

  if (error || !data) {
    return (
      <div className="portal-loading">
        <p>{error || 'Admin dashboard unavailable.'}</p>
        <Link to="/admin">Back to admin login</Link>
      </div>
    );
  }

  return (
    <main className="portal-shell admin-shell">
      <header className="portal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo192.png" className="admin-header-logo" alt="nomadme" />
          <div>
            <h1>Admin Dashboard</h1>
            <p>{data.cargos.length} cargos · {data.investments.length} investments · {data.investors.length} investors</p>
          </div>
        </div>
        {confirmLogout ? (
          <div className="logout-confirm">
            <span>Log out?</span>
            <button type="button" onClick={handleLogout}>Yes</button>
            <button type="button" onClick={() => setConfirmLogout(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmLogout(true)}>Logout</button>
        )}
      </header>

      <nav className="admin-nav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`admin-nav-tab${activeSection === s.id ? ' admin-nav-tab--active' : ''}`}
            onClick={() => setActiveSection(s.id)}
            style={{ position: 'relative' }}
          >
            {s.label}
            {(() => {
              const badge = s.id === 'messages' ? unreadContactCount : s.id === 'orders' ? unreadOrderCount : 0;
              if (badge <= 0) return null;
              return (
                <span style={{
                  position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18,
                  borderRadius: 999, background: '#ef4444', color: '#fff', fontSize: '0.65rem',
                  fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', boxShadow: '0 0 0 2px #0a0c14',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              );
            })()}
          </button>
        ))}
      </nav>

      {activeSection === 'cargos' && (
        <AdminCargosSection cargos={data.cargos} showToast={showToast} refresh={refresh} />
      )}
      {activeSection === 'investments' && (
        <AdminInvestmentsSection investments={data.investments} cargos={data.cargos} showToast={showToast} refresh={refresh} />
      )}
      {activeSection === 'investors' && (
        <AdminInvestorsSection investors={data.investors} investments={data.investments} showToast={showToast} refresh={refresh} />
      )}
      {activeSection === 'messages' && (
        <AdminMessagesSection showToast={showToast} unreadCount={unreadContactCount} onUnreadChange={setUnreadContactCount} />
      )}
      {activeSection === 'orders' && (
        <AdminOrdersSection showToast={showToast} unreadCount={unreadOrderCount} onUnreadChange={setUnreadOrderCount} />
      )}
      {activeSection === 'content' && (
        <AdminContentSection showToast={showToast} />
      )}
      {activeSection === 'products' && (
        <AdminProductsSection showToast={showToast} />
      )}
      {activeSection === 'bundles' && (
        <AdminBundlesSection showToast={showToast} />
      )}
      {activeSection === 'partners' && (
        <AdminPartnersSection showToast={showToast} />
      )}
      {activeSection === 'boutiques' && (
        <AdminBoutiquesSection showToast={showToast} />
      )}
      {activeSection === 'avatars' && (
        <AdminAvatarsSection showToast={showToast} />
      )}
      {activeSection === 'relations' && (
        <AdminRelationsSection data={data} showToast={showToast} refresh={refresh} onNavigate={setActiveSection} />
      )}
      {activeSection === 'journeys' && (
        <AdminJourneysSection showToast={showToast} />
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </main>
  );
};

export default AdminDashboard;
