import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createCargo,
  updateCargo,
  deleteCargo,
  createInvestor,
  createInvestment,
  deleteInvestor,
  deleteInvestment,
  getAdminDashboard,
  getAdminContactRequests,
  updateContactRequestStatus,
  getPublicSiteContent,
  updateSiteContent,
  logoutAdmin,
  updateInvestor,
  updateInvestment,
  AdminDashboardResponse,
  Investment,
  InvestmentStatus,
  SiteContent,
  ContactRequest,
} from '../api/portalApi';
import { COUNTRIES } from '../utils/countries';
import MediaUploader from '../components/admin/MediaUploader';
import StoryMediaGallery from '../components/cargo/StoryMediaGallery';

const currencyOptions = ['USD', 'EUR', 'TND', 'CNY'] as const;

const shippingTypeOptions = [
  { value: 'sea', label: '🚢 Sea freight' },
  { value: 'air', label: '✈️ Air freight' },
  { value: 'land', label: '🚛 Land freight' },
] as const;

type AdminSection = 'cargos' | 'investments' | 'investors' | 'relations' | 'content' | 'messages';

const SECTIONS: Array<{ id: AdminSection; label: string }> = [
  { id: 'cargos', label: '📦 Cargos' },
  { id: 'investments', label: '💼 Investments' },
  { id: 'investors', label: '👤 Investors' },
  { id: 'relations', label: '🔗 Relations' },
  { id: 'content', label: '✏️ Site Content' },
  { id: 'messages', label: '💬 Messages' },
];

const STATUS_OPTIONS: Array<{ value: InvestmentStatus; label: string }> = [
  { value: 'active', label: '🟢 Active' },
  { value: 'in_progress', label: '🔵 In Progress' },
  { value: 'waiting', label: '🟡 Waiting' },
  { value: 'successful', label: '✅ Successful' },
];

const emptyCargoForm = {
  productBeingShipped: '',
  quantity: '',
  purchaseLocation: '',
  purchasePrice: '',
  currency: 'USD',
  shippingDestination: '',
  shippingPrice: '',
  otherExpenses: '',
  estimatedTimeOfArrival: '',
  estimatedTimeOfSelling: '',
  shippingType: 'sea' as 'sea' | 'air' | 'land',
  cargoDescription: '',
  storyText: '',
  storyMediaInput: '',
  storyMediaUrls: [] as string[],
};

const emptyInvestorForm = {
  name: '',
  username: '',
  password: '',
  investmentAmount: '',
  profitPercentageOnInvestment: '',
  currency: 'USD',
  location: '',
  investmentIds: [] as string[],
};

const emptyInvestmentForm = {
  title: '',
  description: '',
  currency: 'USD',
  minimumInvestment: '',
  cargoIds: [] as string[],
  status: 'active' as InvestmentStatus,
};

const currencyRatesToUSD: Record<string, number> = { USD: 1, EUR: 1.09, TND: 0.33, CNY: 0.14 };
function toUSD(amount: number, currency: string): number {
  return Math.round(amount * (currencyRatesToUSD[currency.toUpperCase()] ?? 1));
}

type Toast = { id: number; message: string; type: 'success' | 'error' };
type ConfirmDelete = { type: 'cargo' | 'investor' | 'investment'; id: string };

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('cargos');

  const [cargoForm, setCargoForm] = useState(emptyCargoForm);
  const [investorForm, setInvestorForm] = useState(emptyInvestorForm);
  const [investmentForm, setInvestmentForm] = useState(emptyInvestmentForm);
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [editingInvestorId, setEditingInvestorId] = useState<string | null>(null);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [savingCargo, setSavingCargo] = useState(false);
  const [savingInvestor, setSavingInvestor] = useState(false);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [siteContent, setSiteContent] = useState<SiteContent>({ key: 'who_are_we', title: '', body: '', mediaUrls: [] });
  const [savingSiteContent, setSavingSiteContent] = useState(false);
  const [unreadContactCount, setUnreadContactCount] = useState(0);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  // Toast notifications
  const toastIdRef = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Inline delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);

  // 3.1 Unsaved-changes guard
  const [pendingSection, setPendingSection] = useState<AdminSection | null>(null);
  // 3.2 Search filters
  const [cargoSearch, setCargoSearch] = useState('');
  const [investorSearch, setInvestorSearch] = useState('');
  // 3.3 Cargo story preview
  const [previewCargoId, setPreviewCargoId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    if (activeSection === 'cargos') return JSON.stringify(cargoForm) !== JSON.stringify(emptyCargoForm);
    if (activeSection === 'investments') return JSON.stringify(investmentForm) !== JSON.stringify(emptyInvestmentForm);
    if (activeSection === 'investors') return JSON.stringify(investorForm) !== JSON.stringify(emptyInvestorForm);
    return false;
  }, [activeSection, cargoForm, investorForm, investmentForm]);

  const refresh = async () => {
    const response = await getAdminDashboard();
    setData(response);
  };

  const resetCargoForm = () => { setCargoForm(emptyCargoForm); setEditingCargoId(null); };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [response, contentRes] = await Promise.all([
          getAdminDashboard(),
          getPublicSiteContent('who_are_we'),
        ]);
        if (mounted) {
          setData(response);
          setSiteContent(contentRes.content);
          setUnreadContactCount(response.unreadContactCount ?? 0);
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

  const cargoOptions = useMemo(() => data?.cargos ?? [], [data]);
  const investmentOptions = useMemo(() => data?.investments ?? [], [data]);

  const handleLogout = async () => { await logoutAdmin(); navigate('/admin'); };

  const resetInvestorForm = () => { setInvestorForm(emptyInvestorForm); setEditingInvestorId(null); };
  const resetInvestmentForm = () => { setInvestmentForm(emptyInvestmentForm); setEditingInvestmentId(null); };

  const cargoPayload = () => ({
    productBeingShipped: cargoForm.productBeingShipped,
    quantity: Number(cargoForm.quantity),
    purchaseLocation: cargoForm.purchaseLocation,
    purchasePrice: Number(cargoForm.purchasePrice),
    currency: cargoForm.currency,
    shippingDestination: cargoForm.shippingDestination,
    shippingPrice: Number(cargoForm.shippingPrice),
    otherExpenses: Number(cargoForm.otherExpenses),
    estimatedTimeOfArrival: cargoForm.estimatedTimeOfArrival,
    estimatedTimeOfSelling: cargoForm.estimatedTimeOfSelling,
    shippingType: cargoForm.shippingType,
    cargoDescription: cargoForm.cargoDescription,
    storyText: cargoForm.storyText,
    storyMediaUrls: cargoForm.storyMediaUrls,
  });

  const submitCargo = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingCargo(true);
    try {
      if (editingCargoId) {
        await updateCargo(editingCargoId, cargoPayload());
        showToast('Cargo updated!');
      } else {
        await createCargo(cargoPayload());
        showToast('Cargo created!');
      }
      resetCargoForm();
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save cargo', 'error');
    } finally { setSavingCargo(false); }
  };

  const startEditCargo = (cargo: NonNullable<AdminDashboardResponse>['cargos'][number]) => {
    setEditingCargoId(cargo._id);
    setCargoForm({
      productBeingShipped: cargo.productBeingShipped,
      quantity: cargo.quantity.toString(),
      purchaseLocation: cargo.purchaseLocation,
      purchasePrice: cargo.purchasePrice.toString(),
      currency: cargo.currency,
      shippingDestination: cargo.shippingDestination,
      shippingPrice: cargo.shippingPrice.toString(),
      otherExpenses: cargo.otherExpenses.toString(),
      estimatedTimeOfArrival: cargo.estimatedTimeOfArrival.split('T')[0] ?? '',
      estimatedTimeOfSelling: cargo.estimatedTimeOfSelling.split('T')[0] ?? '',
      shippingType: cargo.shippingType ?? 'sea',
      cargoDescription: cargo.cargoDescription ?? '',
      storyText: cargo.story?.text ?? '',
      storyMediaInput: '',
      storyMediaUrls: cargo.story?.mediaUrls ?? [],
    });
  };

  const removeCargo = async (cargoId: string) => {
    try {
      await deleteCargo(cargoId);
      if (editingCargoId === cargoId) resetCargoForm();
      await refresh();
      showToast('Cargo deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete cargo', 'error');
    }
  };

  const submitInvestor = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingInvestor(true);
    try {
      if (editingInvestorId) {
        await updateInvestor(editingInvestorId, {
          name: investorForm.name,
          username: investorForm.username,
          password: investorForm.password,
          investmentAmount: Number(investorForm.investmentAmount),
          profitPercentageOnInvestment: Number(investorForm.profitPercentageOnInvestment),
          currency: investorForm.currency,
          location: investorForm.location || undefined,
          investmentIds: investorForm.investmentIds,
        });
        showToast('Investor updated!');
      } else {
        await createInvestor({
          name: investorForm.name,
          username: investorForm.username,
          password: investorForm.password,
          investmentAmount: Number(investorForm.investmentAmount),
          profitPercentageOnInvestment: Number(investorForm.profitPercentageOnInvestment),
          currency: investorForm.currency,
          location: investorForm.location || undefined,
          investmentIds: investorForm.investmentIds,
        });
        showToast('Investor created!');
      }
      resetInvestorForm();
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save investor', 'error');
    } finally { setSavingInvestor(false); }
  };

  const submitInvestment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingInvestment(true);
    try {
      if (editingInvestmentId) {
        await updateInvestment(editingInvestmentId, {
          title: investmentForm.title,
          description: investmentForm.description,
          currency: investmentForm.currency,
          minimumInvestment: Number(investmentForm.minimumInvestment),
          cargoIds: investmentForm.cargoIds,
          status: investmentForm.status,
        });
        showToast('Investment updated!');
      } else {
        await createInvestment({
          title: investmentForm.title,
          description: investmentForm.description,
          currency: investmentForm.currency,
          minimumInvestment: Number(investmentForm.minimumInvestment),
          cargoIds: investmentForm.cargoIds,
          status: investmentForm.status,
        });
        showToast('Investment created!');
      }
      resetInvestmentForm();
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save investment', 'error');
    } finally { setSavingInvestment(false); }
  };

  const toggleInvestmentSelection = (id: string) => {
    setInvestorForm((cur) => ({
      ...cur,
      investmentIds: cur.investmentIds.includes(id)
        ? cur.investmentIds.filter((x) => x !== id)
        : [...cur.investmentIds, id],
    }));
  };

  const toggleInvestmentCargoSelection = (id: string) => {
    setInvestmentForm((cur) => ({
      ...cur,
      cargoIds: cur.cargoIds.includes(id)
        ? cur.cargoIds.filter((x) => x !== id)
        : [...cur.cargoIds, id],
    }));
  };

  const startEditInvestor = (investor: NonNullable<AdminDashboardResponse>['investors'][number]) => {
    setEditingInvestorId(investor._id);
    setActiveSection('investors');
    setInvestorForm({
      name: investor.name,
      username: investor.username,
      password: '',
      investmentAmount: investor.investmentAmount.toString(),
      profitPercentageOnInvestment: investor.profitPercentageOnInvestment.toString(),
      currency: investor.currency || 'USD',
      location: investor.location || '',
      investmentIds: investor.assignedInvestmentIds ?? [],
    });
  };

  const startEditInvestment = (investment: Investment) => {
    setEditingInvestmentId(investment._id);
    setActiveSection('investments');
    setInvestmentForm({
      title: investment.title,
      description: investment.description,
      currency: investment.currency,
      minimumInvestment: investment.minimumInvestment.toString(),
      cargoIds: investment.cargoIds || [],
      status: investment.status || 'active',
    });
  };

  const removeInvestor = async (investorId: string) => {
    try {
      await deleteInvestor(investorId);
      if (editingInvestorId === investorId) resetInvestorForm();
      await refresh();
      showToast('Investor deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete investor', 'error');
    }
  };

  const removeInvestment = async (investmentId: string) => {
    try {
      await deleteInvestment(investmentId);
      if (editingInvestmentId === investmentId) resetInvestmentForm();
      await refresh();
      showToast('Investment deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete investment', 'error');
    }
  };

  if (loading) return <div className="portal-loading">Loading admin dashboard...</div>;

  if (error || !data) {
    return (
      <div className="portal-loading">
        <p>{error || 'Admin dashboard unavailable.'}</p>
        <Link to="/admin">Back to admin login</Link>
      </div>
    );
  }

  const cargoMap = Object.fromEntries(data.cargos.map((c) => [c._id, c]));
  const investorMap = Object.fromEntries(data.investors.map((i) => [i._id, i]));

  const filteredCargos = cargoSearch
    ? data.cargos.filter((c) => c.productBeingShipped.toLowerCase().includes(cargoSearch.toLowerCase()))
    : data.cargos;
  const filteredInvestors = investorSearch
    ? data.investors.filter((i) =>
        i.name.toLowerCase().includes(investorSearch.toLowerCase()) ||
        i.username.toLowerCase().includes(investorSearch.toLowerCase()))
    : data.investors;

  return (
    <main className="portal-shell admin-shell">
      <header className="portal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo192.png" className="admin-header-logo" alt="NomadMee" />
          <div>
            <h1>Admin Dashboard</h1>
            <p>{data.cargos.length} cargos · {data.investments.length} investments · {data.investors.length} investors</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout}>Logout</button>
      </header>

      {/* Section tabs */}
      <nav className="admin-nav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`admin-nav-tab${activeSection === s.id ? ' admin-nav-tab--active' : ''}`}
            onClick={() => {
              if (hasUnsavedChanges && s.id !== activeSection) {
                setPendingSection(s.id);
                return;
              }
              setActiveSection(s.id);
              if (s.id === 'messages' && !contactsLoaded) {
                getAdminContactRequests()
                  .then((r) => { setContactRequests(r.requests); setContactsLoaded(true); })
                  .catch(() => {});
              }
            }}
            style={{ position: 'relative' }}
          >
            {s.label}
            {s.id === 'messages' && unreadContactCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -6,
                minWidth: 18,
                height: 18,
                borderRadius: 999,
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 0 0 2px #0a0c14',
              }}>
                {unreadContactCount > 99 ? '99+' : unreadContactCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── CARGOS ── */}
      {activeSection === 'cargos' && (
        <div className="admin-section-grid">
          <article className="portal-card">
            <h2>{editingCargoId ? 'Edit Cargo' : 'New Cargo'}</h2>
            <form className="portal-form" onSubmit={submitCargo}>
              <label>Product being shipped</label>
              <input value={cargoForm.productBeingShipped} onChange={(e) => setCargoForm({ ...cargoForm, productBeingShipped: e.target.value })} required />
              <label>Quantity</label>
              <input type="number" value={cargoForm.quantity} onChange={(e) => setCargoForm({ ...cargoForm, quantity: e.target.value })} required />
              <label>Purchase location</label>
              <input value={cargoForm.purchaseLocation} onChange={(e) => setCargoForm({ ...cargoForm, purchaseLocation: e.target.value })} required />
              <label>Purchase price</label>
              <div className="portal-amount-row">
                <input type="number" value={cargoForm.purchasePrice} onChange={(e) => setCargoForm({ ...cargoForm, purchasePrice: e.target.value })} required />
                <select value={cargoForm.currency} onChange={(e) => setCargoForm({ ...cargoForm, currency: e.target.value })}>
                  {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label>Shipping destination</label>
              <input value={cargoForm.shippingDestination} onChange={(e) => setCargoForm({ ...cargoForm, shippingDestination: e.target.value })} required />
              <label>Shipping type</label>
              <select value={cargoForm.shippingType} onChange={(e) => setCargoForm({ ...cargoForm, shippingType: e.target.value as 'sea' | 'air' | 'land' })}>
                {shippingTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label>Shipping price</label>
              <div className="portal-amount-row">
                <input type="number" value={cargoForm.shippingPrice} onChange={(e) => setCargoForm({ ...cargoForm, shippingPrice: e.target.value })} required />
                <select value={cargoForm.currency} onChange={(e) => setCargoForm({ ...cargoForm, currency: e.target.value })}>
                  {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label>Other expenses</label>
              <div className="portal-amount-row">
                <input type="number" value={cargoForm.otherExpenses} onChange={(e) => setCargoForm({ ...cargoForm, otherExpenses: e.target.value })} required />
                <select value={cargoForm.currency} onChange={(e) => setCargoForm({ ...cargoForm, currency: e.target.value })}>
                  {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label>ETA</label>
              <input type="date" value={cargoForm.estimatedTimeOfArrival} onChange={(e) => setCargoForm({ ...cargoForm, estimatedTimeOfArrival: e.target.value })} required />
              <label>Estimated time of selling</label>
              <input type="date" value={cargoForm.estimatedTimeOfSelling} onChange={(e) => setCargoForm({ ...cargoForm, estimatedTimeOfSelling: e.target.value })} required />
              <label>Description (shown to investor)</label>
              <textarea
                value={cargoForm.cargoDescription}
                onChange={(e) => setCargoForm({ ...cargoForm, cargoDescription: e.target.value })}
                placeholder="Optional: describe this cargo for investors..."
                rows={3}
              />
              <label style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>Story text</label>
              <textarea
                value={cargoForm.storyText}
                onChange={(e) => setCargoForm({ ...cargoForm, storyText: e.target.value })}
                placeholder="Write the cargo story — origin, sourcing process, quality notes..."
                rows={5}
              />
              <label>Photos &amp; videos</label>
              <MediaUploader
                urls={cargoForm.storyMediaUrls}
                onAdd={(url) => setCargoForm((f) => ({ ...f, storyMediaUrls: [...f.storyMediaUrls, url] }))}
                onRemove={(url) => setCargoForm((f) => ({ ...f, storyMediaUrls: f.storyMediaUrls.filter((u) => u !== url) }))}
              />
              <div className="portal-form-actions">
                <button type="submit" disabled={savingCargo}>{savingCargo ? 'Saving...' : editingCargoId ? 'Update Cargo' : 'Save Cargo'}</button>
                {editingCargoId && <button type="button" onClick={resetCargoForm}>Cancel</button>}
              </div>
            </form>
          </article>

          <article className="portal-card">
            <h2>All Cargos <span className="portal-item-badge">{data.cargos.length}</span></h2>
            {data.cargos.length > 3 && (
              <input
                className="admin-search"
                placeholder="Search cargos…"
                value={cargoSearch}
                onChange={(e) => setCargoSearch(e.target.value)}
              />
            )}
            <div className="portal-stack">
              {filteredCargos.length === 0 ? (
                <p className="relation-empty">{cargoSearch ? 'No cargos match your search.' : 'No cargos yet.'}</p>
              ) : filteredCargos.map((cargo) => (
                <div className="portal-item" key={cargo._id}>
                  <div className="portal-item-head">
                    <h3>{cargo.productBeingShipped}</h3>
                    {confirmDelete?.id === cargo._id ? (
                      <div className="portal-inline-confirm">
                        <span>Delete?</span>
                        <button type="button" className="portal-btn-delete" onClick={() => { void removeCargo(cargo._id); setConfirmDelete(null); }}>Yes</button>
                        <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="portal-item-actions">
                        {(cargo.story?.text || (cargo.story?.mediaUrls ?? []).length > 0) && (
                          <button type="button" className="portal-btn-preview" onClick={() => setPreviewCargoId(cargo._id)}>Story</button>
                        )}
                        <button type="button" className="portal-btn-edit" onClick={() => startEditCargo(cargo)}>Edit</button>
                        <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete({ type: 'cargo', id: cargo._id })}>Delete</button>
                      </div>
                    )}
                  </div>
                  <p className="portal-item-meta">
                    {cargo.shippingType === 'air' ? '✈️' : cargo.shippingType === 'land' ? '🚛' : '🚢'} {cargo.purchaseLocation} → {cargo.shippingDestination}
                  </p>
                  <p className="portal-item-meta">
                    {cargo.purchasePrice} {cargo.currency} · Qty {cargo.quantity}
                    <span className="portal-item-badge">ETA {new Date(cargo.estimatedTimeOfArrival).toLocaleDateString()}</span>
                  </p>
                  {cargo.cargoDescription && (
                    <p className="portal-item-meta" style={{ fontStyle: 'italic', marginTop: 4 }}>{cargo.cargoDescription}</p>
                  )}
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {/* ── INVESTMENTS ── */}
      {activeSection === 'investments' && (
        <div className="admin-section-grid">
          <article className="portal-card">
            <h2>{editingInvestmentId ? 'Edit Investment' : 'New Investment'}</h2>
            <form className="portal-form" onSubmit={submitInvestment}>
              <label>Title</label>
              <input value={investmentForm.title} onChange={(e) => setInvestmentForm({ ...investmentForm, title: e.target.value })} required />
              <label>Description</label>
              <textarea value={investmentForm.description} onChange={(e) => setInvestmentForm({ ...investmentForm, description: e.target.value })} required />
              <label>Minimum investment</label>
              <div className="portal-amount-row">
                <input type="number" value={investmentForm.minimumInvestment} onChange={(e) => setInvestmentForm({ ...investmentForm, minimumInvestment: e.target.value })} required />
                <select value={investmentForm.currency} onChange={(e) => setInvestmentForm({ ...investmentForm, currency: e.target.value })}>
                  {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label>Status</label>
              <select value={investmentForm.status} onChange={(e) => setInvestmentForm({ ...investmentForm, status: e.target.value as InvestmentStatus })}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="portal-multiselect">
                <span>Assign cargos</span>
                {cargoOptions.length === 0 ? (
                  <p className="relation-empty">No cargos yet — create one first.</p>
                ) : cargoOptions.map((cargo) => (
                  <label key={cargo._id} className="portal-checkbox">
                    <input
                      type="checkbox"
                      checked={investmentForm.cargoIds.includes(cargo._id)}
                      onChange={() => toggleInvestmentCargoSelection(cargo._id)}
                    />
                    {cargo.productBeingShipped} → {cargo.shippingDestination} ({cargo.currency})
                  </label>
                ))}
              </div>
              <div className="portal-form-actions">
                <button type="submit" disabled={savingInvestment}>{savingInvestment ? 'Saving...' : editingInvestmentId ? 'Update Investment' : 'Create Investment'}</button>
                {editingInvestmentId && <button type="button" onClick={resetInvestmentForm}>Cancel</button>}
              </div>
            </form>
          </article>

          <article className="portal-card">
            <h2>All Investments <span className="portal-item-badge">{data.investments.length}</span></h2>
            <div className="portal-stack">
              {data.investments.length === 0 ? <p className="relation-empty">No investments yet.</p> : data.investments.map((inv) => (
                <div className="portal-item" key={inv._id}>
                  <div className="portal-item-head">
                    <h3>{inv.title}</h3>
                    {confirmDelete?.id === inv._id ? (
                      <div className="portal-inline-confirm">
                        <span>Delete?</span>
                        <button type="button" className="portal-btn-delete" onClick={() => { void removeInvestment(inv._id); setConfirmDelete(null); }}>Yes</button>
                        <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="portal-item-actions">
                        <button type="button" className="portal-btn-edit" onClick={() => startEditInvestment(inv)}>Edit</button>
                        <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete({ type: 'investment', id: inv._id })}>Delete</button>
                      </div>
                    )}
                  </div>
                  <p className="portal-item-meta">{inv.description}</p>
                  <p className="portal-item-meta">
                    {inv.currency} · Min {inv.minimumInvestment}
                    <span className="portal-item-badge">{inv.cargoIds?.length ?? 0} cargos</span>
                    <span className="portal-item-badge">{inv.assignedInvestorIds.length} investors</span>
                    <span className="portal-item-badge">{STATUS_OPTIONS.find((s) => s.value === inv.status)?.label ?? '🟢 Active'}</span>
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {/* ── INVESTORS ── */}
      {activeSection === 'investors' && (
        <div className="admin-section-grid">
          <article className="portal-card">
            <h2>{editingInvestorId ? 'Edit Investor' : 'New Investor'}</h2>
            <form className="portal-form" onSubmit={submitInvestor}>
              <label>Name</label>
              <input value={investorForm.name} onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })} required />
              <label>Username</label>
              <input value={investorForm.username} onChange={(e) => setInvestorForm({ ...investorForm, username: e.target.value })} required />
              <label>Password {editingInvestorId ? '(blank = keep current)' : ''}</label>
              <input type="password" value={investorForm.password} onChange={(e) => setInvestorForm({ ...investorForm, password: e.target.value })} {...(editingInvestorId ? {} : { required: true })} />
              <label>Investment amount</label>
              <div className="portal-amount-row">
                <input type="number" value={investorForm.investmentAmount} onChange={(e) => setInvestorForm({ ...investorForm, investmentAmount: e.target.value })} required />
                <select value={investorForm.currency} onChange={(e) => setInvestorForm({ ...investorForm, currency: e.target.value })}>
                  {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label>Profit % on investment</label>
              <input type="number" value={investorForm.profitPercentageOnInvestment} onChange={(e) => setInvestorForm({ ...investorForm, profitPercentageOnInvestment: e.target.value })} required />
              <label>Location (country)</label>
              <input
                list="country-list"
                value={investorForm.location}
                onChange={(e) => setInvestorForm({ ...investorForm, location: e.target.value })}
                placeholder="Search country..."
                autoComplete="off"
              />
              <datalist id="country-list">
                {COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
              </datalist>
              <div className="portal-multiselect">
                <span>Assign investments</span>
                {investmentOptions.length === 0 ? (
                  <p className="relation-empty">No investments yet — create one first.</p>
                ) : investmentOptions.map((inv) => (
                  <label key={inv._id} className="portal-checkbox">
                    <input
                      type="checkbox"
                      checked={investorForm.investmentIds.includes(inv._id)}
                      onChange={() => toggleInvestmentSelection(inv._id)}
                    />
                    {inv.title} ({inv.currency})
                  </label>
                ))}
              </div>
              <div className="portal-form-actions">
                <button type="submit" disabled={savingInvestor}>{savingInvestor ? 'Saving...' : editingInvestorId ? 'Update Investor' : 'Create Investor'}</button>
                {editingInvestorId && <button type="button" onClick={resetInvestorForm}>Cancel</button>}
              </div>
            </form>
          </article>

          <article className="portal-card">
            <h2>All Investors <span className="portal-item-badge">{data.investors.length}</span></h2>
            {data.investors.length > 3 && (
              <input
                className="admin-search"
                placeholder="Search investors…"
                value={investorSearch}
                onChange={(e) => setInvestorSearch(e.target.value)}
              />
            )}
            <div className="portal-stack">
              {filteredInvestors.length === 0 ? (
                <p className="relation-empty">{investorSearch ? 'No investors match your search.' : 'No investors yet.'}</p>
              ) : filteredInvestors.map((investor) => (
                <div className="portal-item" key={investor._id}>
                  <div className="portal-item-head">
                    <h3>{investor.name}</h3>
                    {confirmDelete?.id === investor._id ? (
                      <div className="portal-inline-confirm">
                        <span>Delete?</span>
                        <button type="button" className="portal-btn-delete" onClick={() => { void removeInvestor(investor._id); setConfirmDelete(null); }}>Yes</button>
                        <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="portal-item-actions">
                        <button type="button" className="portal-btn-edit" onClick={() => startEditInvestor(investor)}>Edit</button>
                        <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete({ type: 'investor', id: investor._id })}>Delete</button>
                      </div>
                    )}
                  </div>
                  <p className="portal-item-meta">@{investor.username} {investor.location ? `· 📍 ${investor.location}` : ''}</p>
                  <p className="portal-item-meta">
                    {investor.investmentAmount.toLocaleString()} {investor.currency}
                    {investor.currency !== 'USD' && (
                      <span style={{ color: '#475569', fontSize: '0.78rem' }}> ≈ ${toUSD(investor.investmentAmount, investor.currency).toLocaleString()}</span>
                    )}
                    {' '}· {investor.profitPercentageOnInvestment}% profit
                    <span className="portal-item-badge">{investor.assignedInvestmentIds?.length ?? 0} investments</span>
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {/* ── MESSAGES ── */}
      {activeSection === 'messages' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.1rem' }}>Contact requests</h2>
            {unreadContactCount > 0 && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>
                {unreadContactCount} new
              </span>
            )}
          </div>

          {!contactsLoaded ? (
            <p style={{ color: '#475569' }}>Loading…</p>
          ) : contactRequests.length === 0 ? (
            <p style={{ color: '#334155', fontSize: '0.9rem' }}>No contact requests yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {contactRequests.map((req) => {
                const isExpanded = expandedContactId === req._id;
                const methodIcon = req.contactMethod === 'whatsapp' ? '📱' : '✉️';
                const statusColors: Record<string, string> = { new: '#22c55e', read: '#94a3b8', contacted: '#38bdf8' };
                const statusColor = statusColors[req.status] ?? '#94a3b8';

                const markStatus = async (status: ContactRequest['status']) => {
                  try {
                    await updateContactRequestStatus(req._id, status);
                    setContactRequests((prev) => prev.map((r) => r._id === req._id ? { ...r, status } : r));
                    if (status !== 'new') setUnreadContactCount((n) => Math.max(0, n - (req.status === 'new' ? 1 : 0)));
                    showToast(status === 'contacted' ? 'Marked as contacted ✓' : 'Marked as read');
                  } catch {
                    showToast('Failed to update status', 'error');
                  }
                };

                return (
                  <div
                    key={req._id}
                    className={`msg-card${req.status === 'new' ? ' msg-card--new' : ''}`}
                    onClick={() => {
                      const newId = isExpanded ? null : req._id;
                      setExpandedContactId(newId);
                      if (newId && req.status === 'new') void markStatus('read');
                    }}
                  >
                    <div className="msg-card-header">
                      <div>
                        <p className="msg-card-name">{methodIcon} {req.fullName}</p>
                        <p className="msg-card-investment">💼 {req.investmentTitle}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span className={`msg-status-badge msg-status-badge--${req.status}`} style={{ color: statusColor }}>
                          {req.status === 'new' ? '🔔 New' : req.status === 'read' ? 'Read' : '✓ Contacted'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                          {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="msg-card-body">
                      <div className="msg-detail-row">
                        <span>{req.contactMethod === 'whatsapp' ? '📱' : '✉️'}</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{req.contactDetail}</span>
                      </div>
                      <div className="msg-detail-row">
                        <span>📅</span>
                        <span>RDV: {new Date(req.rdvDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div onClick={(e) => e.stopPropagation()}>
                        {req.note && (
                          <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>Message</p>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>{req.note}</p>
                          </div>
                        )}
                        <div className="msg-card-actions">
                          {req.status !== 'contacted' && (
                            <button
                              type="button"
                              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                              onClick={() => void markStatus('contacted')}
                            >
                              ✓ Mark as contacted
                            </button>
                          )}
                          {req.contactMethod === 'whatsapp' && (
                            <a
                              href={`https://wa.me/${req.contactDetail.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              💬 Open WhatsApp
                            </a>
                          )}
                          {req.contactMethod === 'email' && (
                            <a
                              href={`mailto:${req.contactDetail}`}
                              style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              ✉️ Send email
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SITE CONTENT ── */}
      {activeSection === 'content' && (() => {
        const submitSiteContent = async (e: React.FormEvent) => {
          e.preventDefault();
          setSavingSiteContent(true);
          try {
            const res = await updateSiteContent('who_are_we', {
              title: siteContent.title,
              body: siteContent.body,
              mediaUrls: siteContent.mediaUrls,
            });
            setSiteContent(res.content);
            showToast('Content saved!');
          } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to save content', 'error');
          } finally { setSavingSiteContent(false); }
        };

        return (
          <div className="admin-section-grid">
            <article className="portal-card">
              <h2>Who Are We?</h2>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
                This content is displayed on the landing page "Who Are We?" section.
              </p>
              <form className="portal-form" onSubmit={submitSiteContent}>
                <label>Page title</label>
                <input
                  value={siteContent.title ?? ''}
                  onChange={(e) => setSiteContent((c) => ({ ...c, title: e.target.value }))}
                  placeholder="e.g. Our Story"
                />
                <label>Body text</label>
                <textarea
                  value={siteContent.body ?? ''}
                  onChange={(e) => setSiteContent((c) => ({ ...c, body: e.target.value }))}
                  placeholder="Tell your story — who you are, your mission, your values..."
                  rows={10}
                />
                <label>Photos &amp; videos</label>
                <MediaUploader
                  urls={siteContent.mediaUrls ?? []}
                  onAdd={(url) => setSiteContent((c) => ({ ...c, mediaUrls: [...(c.mediaUrls ?? []), url] }))}
                  onRemove={(url) => setSiteContent((c) => ({ ...c, mediaUrls: c.mediaUrls?.filter((u) => u !== url) }))}
                />
                <button type="submit" disabled={savingSiteContent}>{savingSiteContent ? 'Saving...' : 'Save Content'}</button>
              </form>
            </article>
            <article className="portal-card">
              <h2>Preview</h2>
              {siteContent.title && <h3 style={{ color: '#f1f5f9', marginTop: 0 }}>{siteContent.title}</h3>}
              {siteContent.body ? (
                <p style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.88rem' }}>{siteContent.body}</p>
              ) : (
                <p className="relation-empty">No body text yet.</p>
              )}
              {(siteContent.mediaUrls ?? []).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {(siteContent.mediaUrls ?? []).map((url) => (
                    <span key={url} className="relation-chip relation-chip--cargo" style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>🖼 {url}</span>
                  ))}
                </div>
              )}
            </article>
          </div>
        );
      })()}

      {/* ── RELATIONS ── */}
      {activeSection === 'relations' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
            Each investment card shows its linked cargos and investors at a glance.
          </p>

          {data.investments.length === 0 ? (
            <p className="relation-empty">No investments yet. Create investments and link cargos and investors to see relations here.</p>
          ) : (
            <div className="relation-stack">
              {data.investments.map((inv) => {
                const linkedCargos = (inv.cargoIds ?? []).map((id) => cargoMap[id]).filter(Boolean);
                const linkedInvestors = (inv.assignedInvestorIds ?? []).map((id) => investorMap[id]).filter(Boolean);
                const totalInvested = linkedInvestors.reduce((sum, i) => sum + (i?.investmentAmount ?? 0), 0);

                return (
                  <div className="relation-card" key={inv._id}>
                    <div className="relation-card-header">
                      <div>
                        <h3>{inv.title}</h3>
                        <p className="relation-card-meta">{inv.description}</p>
                        <div className="relation-summary-bar" style={{ marginTop: 6 }}>
                          <span className="portal-item-badge">Min {inv.minimumInvestment} {inv.currency}</span>
                          <span className="portal-item-badge">{linkedCargos.length} cargo{linkedCargos.length !== 1 ? 's' : ''}</span>
                          <span className="portal-item-badge">{linkedInvestors.length} investor{linkedInvestors.length !== 1 ? 's' : ''}</span>
                          {totalInvested > 0 && (
                            <span className="portal-item-badge">Total in: {totalInvested.toLocaleString()} {inv.currency}</span>
                          )}
                        </div>
                      </div>
                      {confirmDelete?.id === inv._id ? (
                        <div className="portal-inline-confirm">
                          <span>Delete?</span>
                          <button type="button" className="portal-btn-delete" onClick={() => { void removeInvestment(inv._id); setConfirmDelete(null); }}>Yes</button>
                          <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div className="portal-item-actions">
                          <button type="button" className="portal-btn-edit" onClick={() => startEditInvestment(inv)}>Edit</button>
                          <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete({ type: 'investment', id: inv._id })}>Delete</button>
                        </div>
                      )}
                    </div>

                    <div className="relation-columns">
                      <div>
                        <p className="relation-col-label">Cargos</p>
                        {linkedCargos.length === 0 ? (
                          <span className="relation-empty">No cargos linked</span>
                        ) : (
                          <div className="relation-chips">
                            {linkedCargos.map((cargo) => cargo && (
                              <span key={cargo._id} className="relation-chip relation-chip--cargo" title={`${cargo.purchasePrice} ${cargo.currency} · Qty ${cargo.quantity}`}>
                                {cargo.shippingType === 'air' ? '✈️' : cargo.shippingType === 'land' ? '🚛' : '🚢'}{' '}
                                {cargo.productBeingShipped} → {cargo.shippingDestination}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="relation-col-label">Investors</p>
                        {linkedInvestors.length === 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span className="relation-empty">No investors assigned</span>
                            <button
                              type="button"
                              className="portal-btn-edit"
                              style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                              onClick={() => {
                                setInvestorForm((f) => ({ ...f, investmentIds: f.investmentIds.includes(inv._id) ? f.investmentIds : [...f.investmentIds, inv._id] }));
                                setActiveSection('investors');
                              }}
                            >
                              Assign investor →
                            </button>
                          </div>
                        ) : (
                          <div className="relation-chips">
                            {linkedInvestors.map((investor) => investor && (
                              <span
                                key={investor._id}
                                className="relation-chip relation-chip--investor"
                                title={`@${investor.username}${investor.location ? ' · ' + investor.location : ''}`}
                              >
                                👤 {investor.name} — {investor.investmentAmount.toLocaleString()} {investor.currency}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3.1 Unsaved-changes guard */}
      {pendingSection && (
        <div className="unsaved-overlay" onClick={() => setPendingSection(null)}>
          <div className="unsaved-dialog" onClick={(e) => e.stopPropagation()}>
            <p>You have unsaved changes. Discard and continue?</p>
            <div className="unsaved-dialog-actions">
              <button type="button" onClick={() => setPendingSection(null)}>Stay</button>
              <button
                type="button"
                className="portal-btn-delete"
                onClick={() => {
                  if (activeSection === 'cargos') resetCargoForm();
                  if (activeSection === 'investors') resetInvestorForm();
                  if (activeSection === 'investments') resetInvestmentForm();
                  const next = pendingSection;
                  setPendingSection(null);
                  setActiveSection(next);
                  if (next === 'messages' && !contactsLoaded) {
                    getAdminContactRequests()
                      .then((r) => { setContactRequests(r.requests); setContactsLoaded(true); })
                      .catch(() => {});
                  }
                }}
              >
                Discard &amp; continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3.3 Cargo story preview modal */}
      {previewCargoId && (() => {
        const cargo = data.cargos.find((c) => c._id === previewCargoId);
        if (!cargo) return null;
        return (
          <div className="story-preview-overlay" onClick={() => setPreviewCargoId(null)}>
            <div className="story-preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="story-preview-header">
                <h3>{cargo.productBeingShipped}</h3>
                <button type="button" onClick={() => setPreviewCargoId(null)}>✕</button>
              </div>
              <div className="story-preview-body">
                {cargo.cargoDescription && (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>{cargo.cargoDescription}</p>
                )}
                {cargo.story?.text && (
                  <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 24, whiteSpace: 'pre-wrap' }}>{cargo.story.text}</p>
                )}
                {(cargo.story?.mediaUrls ?? []).length > 0 && (
                  <StoryMediaGallery urls={cargo.story!.mediaUrls!} accentColor="#38bdf8" />
                )}
                {!cargo.story?.text && !(cargo.story?.mediaUrls ?? []).length && (
                  <p style={{ color: '#475569', textAlign: 'center', padding: '40px 0' }}>No story content yet.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast notifications */}
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
