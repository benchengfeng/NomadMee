import React, { useState } from 'react';
import {
  createInvestor,
  updateInvestor,
  deleteInvestor,
  AdminDashboardResponse,
  Investment,
} from '../../../api/portalApi';
import { COUNTRIES } from '../../../utils/countries';

type Investor = AdminDashboardResponse['investors'][number];

interface Props {
  investors: Investor[];
  investments: Investment[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  refresh: () => Promise<void>;
}

const currencyOptions = ['USD', 'EUR', 'TND', 'CNY'] as const;

const emptyForm = {
  name: '',
  username: '',
  password: '',
  investmentAmount: '',
  profitPercentageOnInvestment: '',
  currency: 'USD',
  location: '',
  investmentIds: [] as string[],
};

type ConfirmDelete = { id: string };

const currencyRatesToUSD: Record<string, number> = { USD: 1, EUR: 1.09, TND: 0.33, CNY: 0.14 };
function toUSD(amount: number, currency: string): number {
  return Math.round(amount * (currencyRatesToUSD[currency.toUpperCase()] ?? 1));
}

const AdminInvestorsSection: React.FC<Props> = ({ investors, investments, showToast, refresh }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const toggleInvestment = (id: string) => setForm((f) => ({
    ...f,
    investmentIds: f.investmentIds.includes(id) ? f.investmentIds.filter((x) => x !== id) : [...f.investmentIds, id],
  }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        username: form.username,
        password: form.password,
        investmentAmount: Number(form.investmentAmount),
        profitPercentageOnInvestment: Number(form.profitPercentageOnInvestment),
        currency: form.currency,
        location: form.location || undefined,
        investmentIds: form.investmentIds,
      };
      if (editingId) {
        await updateInvestor(editingId, payload);
        showToast('Investor updated!');
      } else {
        await createInvestor(payload);
        showToast('Investor created!');
      }
      reset();
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save investor', 'error');
    } finally { setSaving(false); }
  };

  const startEdit = (investor: Investor) => {
    setEditingId(investor._id);
    setForm({
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

  const remove = async (id: string) => {
    try {
      await deleteInvestor(id);
      if (editingId === id) reset();
      await refresh();
      showToast('Investor deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete investor', 'error');
    }
  };

  const filtered = search
    ? investors.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.username.toLowerCase().includes(search.toLowerCase()))
    : investors;

  return (
    <div className="admin-section-grid">
      <article className="portal-card">
        <h2>{editingId ? 'Edit Investor' : 'New Investor'}</h2>
        <form className="portal-form" onSubmit={submit}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <label>Username</label>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <label>Password {editingId ? '(blank = keep current)' : ''}</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} {...(editingId ? {} : { required: true })} />
          <label>Investment amount</label>
          <div className="portal-amount-row">
            <input type="number" value={form.investmentAmount} onChange={(e) => setForm({ ...form, investmentAmount: e.target.value })} required />
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label>Profit % on investment</label>
          <input type="number" value={form.profitPercentageOnInvestment} onChange={(e) => setForm({ ...form, profitPercentageOnInvestment: e.target.value })} required />
          <label>Location (country)</label>
          <input
            list="country-list"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Search country..."
            autoComplete="off"
          />
          <datalist id="country-list">
            {COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
          </datalist>
          <div className="portal-multiselect">
            <span>Assign investments</span>
            {investments.length === 0 ? (
              <p className="relation-empty">No investments yet — create one first.</p>
            ) : investments.map((inv) => (
              <label key={inv._id} className="portal-checkbox">
                <input
                  type="checkbox"
                  checked={form.investmentIds.includes(inv._id)}
                  onChange={() => toggleInvestment(inv._id)}
                />
                {inv.title} ({inv.currency})
              </label>
            ))}
          </div>
          <div className="portal-form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Investor' : 'Create Investor'}</button>
            {editingId && <button type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </article>

      <article className="portal-card">
        <h2>All Investors <span className="portal-item-badge">{investors.length}</span></h2>
        {investors.length > 3 && (
          <input
            className="admin-search"
            placeholder="Search investors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        <div className="portal-stack">
          {filtered.length === 0 ? (
            <p className="relation-empty">{search ? 'No investors match your search.' : 'No investors yet.'}</p>
          ) : filtered.map((investor) => (
            <div className="portal-item" key={investor._id}>
              <div className="portal-item-head">
                <h3>{investor.name}</h3>
                {confirmDelete?.id === investor._id ? (
                  <div className="portal-inline-confirm">
                    <span>Delete?</span>
                    <button type="button" className="portal-btn-delete" onClick={() => { void remove(investor._id); setConfirmDelete(null); }}>Yes</button>
                    <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="portal-item-actions">
                    <button type="button" className="portal-btn-edit" onClick={() => startEdit(investor)}>Edit</button>
                    <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete({ id: investor._id })}>Delete</button>
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
  );
};

export default AdminInvestorsSection;
