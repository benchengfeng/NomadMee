import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createCargo,
  createInvestor,
  getAdminDashboard,
  logoutAdmin,
  AdminDashboardResponse,
} from '../api/portalApi';

const emptyCargoForm = {
  productBeingShipped: '',
  quantity: '',
  purchaseLocation: '',
  purchasePrice: '',
  shippingDestination: '',
  shippingPrice: '',
  otherExpenses: '',
  estimatedTimeOfArrival: '',
  estimatedTimeOfSelling: '',
};

const emptyInvestorForm = {
  name: '',
  username: '',
  password: '',
  investmentAmount: '',
  profitPercentageOnInvestment: '',
  cargoIds: [] as string[],
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cargoForm, setCargoForm] = useState(emptyCargoForm);
  const [investorForm, setInvestorForm] = useState(emptyInvestorForm);
  const [savingCargo, setSavingCargo] = useState(false);
  const [savingInvestor, setSavingInvestor] = useState(false);

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

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin');
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
        shippingDestination: cargoForm.shippingDestination,
        shippingPrice: Number(cargoForm.shippingPrice),
        otherExpenses: Number(cargoForm.otherExpenses),
        estimatedTimeOfArrival: cargoForm.estimatedTimeOfArrival,
        estimatedTimeOfSelling: cargoForm.estimatedTimeOfSelling,
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
      await createInvestor({
        name: investorForm.name,
        username: investorForm.username,
        password: investorForm.password,
        investmentAmount: Number(investorForm.investmentAmount),
        profitPercentageOnInvestment: Number(investorForm.profitPercentageOnInvestment),
        cargoIds: investorForm.cargoIds,
      });
      setInvestorForm(emptyInvestorForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create investor');
    } finally {
      setSavingInvestor(false);
    }
  };

  const toggleCargoSelection = (cargoId: string) => {
    setInvestorForm((current) => {
      const exists = current.cargoIds.includes(cargoId);
      return {
        ...current,
        cargoIds: exists ? current.cargoIds.filter((id) => id !== cargoId) : [...current.cargoIds, cargoId],
      };
    });
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
          <p>Manage cargos and assign investors.</p>
        </div>
        <button type="button" onClick={handleLogout}>Logout</button>
      </header>

      <section className="portal-grid admin-grid">
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
            <button type="submit" disabled={savingCargo}>{savingCargo ? 'Saving...' : 'Save Cargo'}</button>
          </form>
        </article>

        <article className="portal-card">
          <h2>Add Investor</h2>
          <form className="portal-form" onSubmit={submitInvestor}>
            <label>Name</label>
            <input value={investorForm.name} onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })} required />
            <label>Username</label>
            <input value={investorForm.username} onChange={(e) => setInvestorForm({ ...investorForm, username: e.target.value })} required />
            <label>Password</label>
            <input type="password" value={investorForm.password} onChange={(e) => setInvestorForm({ ...investorForm, password: e.target.value })} required />
            <label>Investment amount</label>
            <input type="number" value={investorForm.investmentAmount} onChange={(e) => setInvestorForm({ ...investorForm, investmentAmount: e.target.value })} required />
            <label>Profit percentage on investment</label>
            <input type="number" value={investorForm.profitPercentageOnInvestment} onChange={(e) => setInvestorForm({ ...investorForm, profitPercentageOnInvestment: e.target.value })} required />

            <div className="portal-multiselect">
              <span>Assign cargos</span>
              {cargoOptions.length === 0 ? (
                <p>No cargos available yet.</p>
              ) : (
                cargoOptions.map((cargo) => (
                  <label key={cargo._id} className="portal-checkbox">
                    <input
                      type="checkbox"
                      checked={investorForm.cargoIds.includes(cargo._id)}
                      onChange={() => toggleCargoSelection(cargo._id)}
                    />
                    {cargo.productBeingShipped} → {cargo.shippingDestination}
                  </label>
                ))
              )}
            </div>

            <button type="submit" disabled={savingInvestor}>{savingInvestor ? 'Saving...' : 'Save Investor'}</button>
          </form>
        </article>
      </section>

      <section className="portal-grid admin-grid secondary">
        <article className="portal-card">
          <h2>Cargos</h2>
          <div className="portal-stack">
            {data.cargos.length === 0 ? <p>No cargos saved yet.</p> : data.cargos.map((cargo) => (
              <div className="portal-item" key={cargo._id}>
                <h3>{cargo.productBeingShipped}</h3>
                <p>{cargo.quantity} units</p>
                <p>{cargo.purchaseLocation} → {cargo.shippingDestination}</p>
                <p>Assigned investors: {cargo.assignedInvestorIds.length}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="portal-card">
          <h2>Investors</h2>
          <div className="portal-stack">
            {data.investors.length === 0 ? <p>No investors saved yet.</p> : data.investors.map((investor) => (
              <div className="portal-item" key={investor._id}>
                <h3>{investor.name}</h3>
                <p>@{investor.username}</p>
                <p>Investment: {investor.investmentAmount}</p>
                <p>ROI: {investor.estimatedROI}</p>
                <p>Assigned cargos: {investor.assignedCargoIds.length}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
};

export default AdminDashboard;
