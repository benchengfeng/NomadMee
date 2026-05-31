import React, { useEffect, useMemo, useState } from 'react';
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
  getPublicSiteContent,
  updateSiteContent,
  logoutAdmin,
  updateInvestor,
  updateInvestment,
  AdminDashboardResponse,
  Investment,
  InvestmentStatus,
  SiteContent,
} from '../api/portalApi';
import { COUNTRIES } from '../utils/countries';
import MediaUploader from '../components/admin/MediaUploader';

const currencyOptions = ['USD', 'EUR', 'TND', 'CNY'] as const;

const shippingTypeOptions = [
  { value: 'sea', label: '🚢 Sea freight' },
  { value: 'air', label: '✈️ Air freight' },
  { value: 'land', label: '🚛 Land freight' },
] as const;

type AdminSection = 'cargos' | 'investments' | 'investors' | 'relations' | 'content';

const SECTIONS: Array<{ id: AdminSection; label: string }> = [
  { id: 'cargos', label: '📦 Cargos' },
  { id: 'investments', label: '💼 Investments' },
  { id: 'investors', label: '👤 Investors' },
  { id: 'relations', label: '🔗 Relations' },
  { id: 'content', label: '✏️ Site Content' },
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
    setSavingCargo(true); setError(null);
    try {
      if (editingCargoId) {
        await updateCargo(editingCargoId, cargoPayload());
      } else {
        await createCargo(cargoPayload());
      }
      resetCargoForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cargo');
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
    if (!window.confirm('Delete this cargo? This action cannot be undone.')) return;
    setError(null);
    try {
      await deleteCargo(cargoId);
      if (editingCargoId === cargoId) resetCargoForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cargo');
    }
  };

  const submitInvestor = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingInvestor(true); setError(null);
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
      }
      resetInvestorForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save investor');
    } finally { setSavingInvestor(false); }
  };

  const submitInvestment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingInvestment(true); setError(null);
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
      } else {
        await createInvestment({
          title: investmentForm.title,
          description: investmentForm.description,
          currency: investmentForm.currency,
          minimumInvestment: Number(investmentForm.minimumInvestment),
          cargoIds: investmentForm.cargoIds,
          status: investmentForm.status,
        });
      }
      resetInvestmentForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save investment');
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
    if (!window.confirm('Delete this investor? This action cannot be undone.')) return;
    setError(null);
    try {
      await deleteInvestor(investorId);
      if (editingInvestorId === investorId) resetInvestorForm();
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete investor'); }
  };

  const removeInvestment = async (investmentId: string) => {
    if (!window.confirm('Delete this investment? This action cannot be undone.')) return;
    setError(null);
    try {
      await deleteInvestment(investmentId);
      if (editingInvestmentId === investmentId) resetInvestmentForm();
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete investment'); }
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

  return (
    <main className="portal-shell admin-shell">
      <header className="portal-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>{data.cargos.length} cargos · {data.investments.length} investments · {data.investors.length} investors</p>
        </div>
        <button type="button" onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="portal-error">{error}</div>}

      {/* Section tabs */}
      <nav className="admin-nav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`admin-nav-tab${activeSection === s.id ? ' admin-nav-tab--active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
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
              <input type="number" value={cargoForm.purchasePrice} onChange={(e) => setCargoForm({ ...cargoForm, purchasePrice: e.target.value })} required />
              <label>Currency</label>
              <select value={cargoForm.currency} onChange={(e) => setCargoForm({ ...cargoForm, currency: e.target.value })}>
                {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label>Shipping destination</label>
              <input value={cargoForm.shippingDestination} onChange={(e) => setCargoForm({ ...cargoForm, shippingDestination: e.target.value })} required />
              <label>Shipping type</label>
              <select value={cargoForm.shippingType} onChange={(e) => setCargoForm({ ...cargoForm, shippingType: e.target.value as 'sea' | 'air' | 'land' })}>
                {shippingTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label>Shipping price</label>
              <input type="number" value={cargoForm.shippingPrice} onChange={(e) => setCargoForm({ ...cargoForm, shippingPrice: e.target.value })} required />
              <label>Other expenses</label>
              <input type="number" value={cargoForm.otherExpenses} onChange={(e) => setCargoForm({ ...cargoForm, otherExpenses: e.target.value })} required />
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
            <div className="portal-stack">
              {data.cargos.length === 0 ? <p className="relation-empty">No cargos yet.</p> : data.cargos.map((cargo) => (
                <div className="portal-item" key={cargo._id}>
                  <div className="portal-item-head">
                    <h3>{cargo.productBeingShipped}</h3>
                    <div className="portal-item-actions">
                      <button type="button" className="portal-btn-edit" onClick={() => startEditCargo(cargo)}>Edit</button>
                      <button type="button" className="portal-btn-delete" onClick={() => removeCargo(cargo._id)}>Delete</button>
                    </div>
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
              <label>Currency</label>
              <select value={investmentForm.currency} onChange={(e) => setInvestmentForm({ ...investmentForm, currency: e.target.value })}>
                {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label>Minimum investment</label>
              <input type="number" value={investmentForm.minimumInvestment} onChange={(e) => setInvestmentForm({ ...investmentForm, minimumInvestment: e.target.value })} required />
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
                    <div className="portal-item-actions">
                      <button type="button" className="portal-btn-edit" onClick={() => startEditInvestment(inv)}>Edit</button>
                      <button type="button" className="portal-btn-delete" onClick={() => removeInvestment(inv._id)}>Delete</button>
                    </div>
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
              <input type="number" value={investorForm.investmentAmount} onChange={(e) => setInvestorForm({ ...investorForm, investmentAmount: e.target.value })} required />
              <label>Profit % on investment</label>
              <input type="number" value={investorForm.profitPercentageOnInvestment} onChange={(e) => setInvestorForm({ ...investorForm, profitPercentageOnInvestment: e.target.value })} required />
              <label>Currency</label>
              <select value={investorForm.currency} onChange={(e) => setInvestorForm({ ...investorForm, currency: e.target.value })}>
                {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
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
            <div className="portal-stack">
              {data.investors.length === 0 ? <p className="relation-empty">No investors yet.</p> : data.investors.map((investor) => (
                <div className="portal-item" key={investor._id}>
                  <div className="portal-item-head">
                    <h3>{investor.name}</h3>
                    <div className="portal-item-actions">
                      <button type="button" className="portal-btn-edit" onClick={() => startEditInvestor(investor)}>Edit</button>
                      <button type="button" className="portal-btn-delete" onClick={() => removeInvestor(investor._id)}>Delete</button>
                    </div>
                  </div>
                  <p className="portal-item-meta">@{investor.username} {investor.location ? `· 📍 ${investor.location}` : ''}</p>
                  <p className="portal-item-meta">
                    {investor.investmentAmount} {investor.currency} · {investor.profitPercentageOnInvestment}% profit
                    <span className="portal-item-badge">{investor.assignedInvestmentIds?.length ?? 0} investments</span>
                  </p>
                </div>
              ))}
            </div>
          </article>
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
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save content');
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
                      <div className="portal-item-actions">
                        <button type="button" className="portal-btn-edit" onClick={() => startEditInvestment(inv)}>Edit</button>
                        <button type="button" className="portal-btn-delete" onClick={() => removeInvestment(inv._id)}>Delete</button>
                      </div>
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
                          <span className="relation-empty">No investors assigned</span>
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
    </main>
  );
};

export default AdminDashboard;
