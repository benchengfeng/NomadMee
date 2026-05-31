import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createCargo,
  createInvestor,
  createInvestment,
  deleteInvestor,
  deleteInvestment,
  getAdminDashboard,
  logoutAdmin,
  updateInvestor,
  updateInvestment,
  AdminDashboardResponse,
  Investment,
} from '../api/portalApi';
import { COUNTRIES } from '../utils/countries';

const currencyOptions = ['USD', 'EUR', 'TND', 'CNY'] as const;

const shippingTypeOptions = [
  { value: 'sea', label: '🚢 Sea freight' },
  { value: 'air', label: '✈️ Air freight' },
  { value: 'land', label: '🚛 Land freight' },
] as const;

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
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cargoForm, setCargoForm] = useState(emptyCargoForm);
  const [investorForm, setInvestorForm] = useState(emptyInvestorForm);
  const [investmentForm, setInvestmentForm] = useState(emptyInvestmentForm);
  const [editingInvestorId, setEditingInvestorId] = useState<string | null>(null);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [savingCargo, setSavingCargo] = useState(false);
  const [savingInvestor, setSavingInvestor] = useState(false);
  const [savingInvestment, setSavingInvestment] = useState(false);

  const refresh = async () => {
    const response = await getAdminDashboard();
    setData(response);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await getAdminDashboard();
        if (mounted) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load admin dashboard');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const cargoOptions = useMemo(() => data?.cargos ?? [], [data]);
  const investmentOptions = useMemo(() => data?.investments ?? [], [data]);

  const investorAssignedCargoCounts = useMemo(() => {
    const cargoSets: Record<string, Set<string>> = {};

    data?.investments.forEach((investment) => {
      const cargoIds = investment.cargoIds || [];
      investment.assignedInvestorIds?.forEach((investorId) => {
        const assignedSet = cargoSets[investorId] ?? new Set<string>();
        cargoIds.forEach((cargoId) => assignedSet.add(cargoId));
        cargoSets[investorId] = assignedSet;
      });
    });

    return Object.fromEntries(
      Object.entries(cargoSets).map(([investorId, cargoSet]) => [investorId, cargoSet.size])
    );
  }, [data]);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin');
  };

  const resetInvestorForm = () => {
    setInvestorForm(emptyInvestorForm);
    setEditingInvestorId(null);
  };

  const resetInvestmentForm = () => {
    setInvestmentForm(emptyInvestmentForm);
    setEditingInvestmentId(null);
  };

  const submitCargo = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingCargo(true);
    setError(null);

    try {
      await createCargo({
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
      });
      setCargoForm(emptyCargoForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cargo');
    } finally {
      setSavingCargo(false);
    }
  };

  const submitInvestor = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingInvestor(true);
    setError(null);

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
    } finally {
      setSavingInvestor(false);
    }
  };

  const submitInvestment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingInvestment(true);
    setError(null);

    try {
      if (editingInvestmentId) {
        await updateInvestment(editingInvestmentId, {
          title: investmentForm.title,
          description: investmentForm.description,
          currency: investmentForm.currency,
          minimumInvestment: Number(investmentForm.minimumInvestment),
          cargoIds: investmentForm.cargoIds,
        });
      } else {
        await createInvestment({
          title: investmentForm.title,
          description: investmentForm.description,
          currency: investmentForm.currency,
          minimumInvestment: Number(investmentForm.minimumInvestment),
          cargoIds: investmentForm.cargoIds,
        });
      }
      resetInvestmentForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save investment');
    } finally {
      setSavingInvestment(false);
    }
  };

  const toggleInvestmentSelection = (investmentId: string) => {
    setInvestorForm((current) => {
      const exists = current.investmentIds.includes(investmentId);
      return {
        ...current,
        investmentIds: exists ? current.investmentIds.filter((id) => id !== investmentId) : [...current.investmentIds, investmentId],
      };
    });
  };

  const toggleInvestmentCargoSelection = (cargoId: string) => {
    setInvestmentForm((current) => {
      const exists = current.cargoIds.includes(cargoId);
      return {
        ...current,
        cargoIds: exists ? current.cargoIds.filter((id) => id !== cargoId) : [...current.cargoIds, cargoId],
      };
    });
  };

  const startEditInvestor = (investor: NonNullable<AdminDashboardResponse>['investors'][number]) => {
    setEditingInvestorId(investor._id);
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
    setInvestmentForm({
      title: investment.title,
      description: investment.description,
      currency: investment.currency,
      minimumInvestment: investment.minimumInvestment.toString(),
      cargoIds: investment.cargoIds || [],
    });
  };

  const removeInvestor = async (investorId: string) => {
    if (!window.confirm('Delete this investor? This action cannot be undone.')) return;
    setError(null);
    try {
      await deleteInvestor(investorId);
      if (editingInvestorId === investorId) {
        resetInvestorForm();
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete investor');
    }
  };

  const removeInvestment = async (investmentId: string) => {
    if (!window.confirm('Delete this investment? This action cannot be undone.')) return;
    setError(null);
    try {
      await deleteInvestment(investmentId);
      if (editingInvestmentId === investmentId) {
        resetInvestmentForm();
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete investment');
    }
  };

  if (loading) {
    return <div className="portal-loading">Loading admin dashboard...</div>;
  }

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
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage investments, investors, and cargos from one place.</p>
        </div>
        <button type="button" onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="portal-error">{error}</div>}

      <section className="admin-forms-grid">
        <article className="portal-card">
          <h2>Add Cargo</h2>
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
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <label>Shipping destination</label>
            <input value={cargoForm.shippingDestination} onChange={(e) => setCargoForm({ ...cargoForm, shippingDestination: e.target.value })} required />
            <label>Shipping price</label>
            <input type="number" value={cargoForm.shippingPrice} onChange={(e) => setCargoForm({ ...cargoForm, shippingPrice: e.target.value })} required />
            <label>Other expenses</label>
            <input type="number" value={cargoForm.otherExpenses} onChange={(e) => setCargoForm({ ...cargoForm, otherExpenses: e.target.value })} required />
            <label>Estimated time of arrival</label>
            <input type="date" value={cargoForm.estimatedTimeOfArrival} onChange={(e) => setCargoForm({ ...cargoForm, estimatedTimeOfArrival: e.target.value })} required />
            <label>Estimated time of selling</label>
            <input type="date" value={cargoForm.estimatedTimeOfSelling} onChange={(e) => setCargoForm({ ...cargoForm, estimatedTimeOfSelling: e.target.value })} required />
            <label>Shipping type</label>
            <select value={cargoForm.shippingType} onChange={(e) => setCargoForm({ ...cargoForm, shippingType: e.target.value as 'sea' | 'air' | 'land' })}>
              {shippingTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>Cargo description (shown to investor)</label>
            <textarea
              value={cargoForm.cargoDescription}
              onChange={(e) => setCargoForm({ ...cargoForm, cargoDescription: e.target.value })}
              placeholder="Optional: describe this cargo for investors — product origin, quality, expected demand..."
              rows={3}
            />
            <button type="submit" disabled={savingCargo}>{savingCargo ? 'Saving...' : 'Save Cargo'}</button>
          </form>
        </article>

        <article className="portal-card">
          <h2>{editingInvestmentId ? 'Edit Investment' : 'Add Investment'}</h2>
          <form className="portal-form" onSubmit={submitInvestment}>
            <label>Title</label>
            <input value={investmentForm.title} onChange={(e) => setInvestmentForm({ ...investmentForm, title: e.target.value })} required />
            <label>Description</label>
            <textarea value={investmentForm.description} onChange={(e) => setInvestmentForm({ ...investmentForm, description: e.target.value })} required />
            <label>Currency</label>
            <select value={investmentForm.currency} onChange={(e) => setInvestmentForm({ ...investmentForm, currency: e.target.value })}>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <label>Minimum investment</label>
            <input type="number" value={investmentForm.minimumInvestment} onChange={(e) => setInvestmentForm({ ...investmentForm, minimumInvestment: e.target.value })} required />
            <div className="portal-multiselect">
              <span>Assign cargos to investment</span>
              {cargoOptions.length === 0 ? (
                <p>No cargos available yet.</p>
              ) : (
                cargoOptions.map((cargo) => (
                  <label key={cargo._id} className="portal-checkbox">
                    <input
                      type="checkbox"
                      checked={investmentForm.cargoIds.includes(cargo._id)}
                      onChange={() => toggleInvestmentCargoSelection(cargo._id)}
                    />
                    {cargo.productBeingShipped} → {cargo.shippingDestination} ({cargo.currency})
                  </label>
                ))
              )}
            </div>
            <div className="portal-form-actions">
              <button type="submit" disabled={savingInvestment}>{savingInvestment ? 'Saving...' : editingInvestmentId ? 'Update Investment' : 'Create Investment'}</button>
              {editingInvestmentId && <button type="button" onClick={resetInvestmentForm}>Cancel</button>}
            </div>
          </form>
        </article>

        <article className="portal-card">
          <h2>{editingInvestorId ? 'Edit Investor' : 'Add Investor'}</h2>
          <form className="portal-form" onSubmit={submitInvestor}>
            <label>Name</label>
            <input value={investorForm.name} onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })} required />
            <label>Username</label>
            <input value={investorForm.username} onChange={(e) => setInvestorForm({ ...investorForm, username: e.target.value })} required />
            <label>Password {editingInvestorId ? '(leave blank to keep current)' : ''}</label>
            <input type="password" value={investorForm.password} onChange={(e) => setInvestorForm({ ...investorForm, password: e.target.value })} {...(editingInvestorId ? {} : { required: true })} />
            <label>Investment amount</label>
            <input type="number" value={investorForm.investmentAmount} onChange={(e) => setInvestorForm({ ...investorForm, investmentAmount: e.target.value })} required />
            <label>Profit percentage on investment</label>
            <input type="number" value={investorForm.profitPercentageOnInvestment} onChange={(e) => setInvestorForm({ ...investorForm, profitPercentageOnInvestment: e.target.value })} required />
            <label>Currency</label>
            <select value={investorForm.currency} onChange={(e) => setInvestorForm({ ...investorForm, currency: e.target.value })}>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
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
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} />
              ))}
            </datalist>

            <div className="portal-multiselect">
              <span>Assign investments</span>
              {investmentOptions.length === 0 ? (
                <p>No investments available yet.</p>
              ) : (
                investmentOptions.map((investment) => (
                  <label key={investment._id} className="portal-checkbox">
                    <input
                      type="checkbox"
                      checked={investorForm.investmentIds.includes(investment._id)}
                      onChange={() => toggleInvestmentSelection(investment._id)}
                    />
                    {investment.title} ({investment.currency})
                  </label>
                ))
              )}
            </div>

            <div className="portal-form-actions">
              <button type="submit" disabled={savingInvestor}>{savingInvestor ? 'Saving...' : editingInvestorId ? 'Update Investor' : 'Create Investor'}</button>
              {editingInvestorId && <button type="button" onClick={resetInvestorForm}>Cancel</button>}
            </div>
          </form>
        </article>
      </section>

      <section className="portal-grid admin-grid secondary">
        <article className="portal-card">
          <h2>Investments</h2>
          <div className="portal-stack">
            {data.investments.length === 0 ? <p>No investments saved yet.</p> : data.investments.map((investment) => (
              <div className="portal-item" key={investment._id}>
                <div className="portal-item-head">
                  <h3>{investment.title}</h3>
                  <div className="portal-item-actions">
                    <button type="button" className="portal-btn-edit" onClick={() => startEditInvestment(investment)}>Edit</button>
                    <button type="button" className="portal-btn-delete" onClick={() => removeInvestment(investment._id)}>Delete</button>
                  </div>
                </div>
                <p className="portal-item-meta">{investment.description}</p>
                <p className="portal-item-meta">
                  {investment.currency} · Min {investment.minimumInvestment}
                  <span className="portal-item-badge">{investment.cargoIds?.length ?? 0} cargos</span>
                  <span className="portal-item-badge">{investment.assignedInvestorIds.length} investors</span>
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="portal-card">
          <h2>Investors</h2>
          <div className="portal-stack">
            {data.investors.length === 0 ? <p>No investors saved yet.</p> : data.investors.map((investor) => (
              <div className="portal-item" key={investor._id}>
                <div className="portal-item-head">
                  <h3>{investor.name}</h3>
                  <div className="portal-item-actions">
                    <button type="button" className="portal-btn-edit" onClick={() => startEditInvestor(investor)}>Edit</button>
                    <button type="button" className="portal-btn-delete" onClick={() => removeInvestor(investor._id)}>Delete</button>
                  </div>
                </div>
                <p className="portal-item-meta">@{investor.username}</p>
                <p className="portal-item-meta">
                  {investor.investmentAmount} {investor.currency} · ROI {investor.estimatedROI}%
                  <span className="portal-item-badge">{investorAssignedCargoCounts[investor._id] ?? 0} cargos</span>
                  <span className="portal-item-badge">{investor.assignedInvestmentIds?.length ?? 0} investments</span>
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
};

export default AdminDashboard;
