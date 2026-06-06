import React, { useState } from 'react';
import {
  createInvestment,
  updateInvestment,
  deleteInvestment,
  AdminDashboardResponse,
  Investment,
  InvestmentStatus,
} from '../../../api/portalApi';
import ImageCropUploader from '../ImageCropUploader';
import { COUNTRIES } from '../../../utils/countries';

type Cargo = AdminDashboardResponse['cargos'][number];

interface Props {
  investments: Investment[];
  cargos: Cargo[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  refresh: () => Promise<void>;
}

const currencyOptions = ['USD', 'EUR', 'TND', 'CNY'] as const;

const STATUS_OPTIONS: Array<{ value: InvestmentStatus; label: string }> = [
  { value: 'active', label: '🟢 Active' },
  { value: 'in_progress', label: '🔵 In Progress' },
  { value: 'waiting', label: '🟡 Waiting' },
  { value: 'successful', label: '✅ Successful' },
];

const emptyForm = {
  title: '',
  description: '',
  currency: 'USD',
  minimumInvestment: '',
  cargoIds: [] as string[],
  status: 'active' as InvestmentStatus,
  currentStatus: '',
  hidden: false,
  coverImageUrl: '',
  location: '',
};

type ConfirmDelete = { id: string };

const AdminInvestmentsSection: React.FC<Props> = ({ investments, cargos, showToast, refresh }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const toggleCargo = (id: string) => setForm((f) => ({
    ...f,
    cargoIds: f.cargoIds.includes(id) ? f.cargoIds.filter((x) => x !== id) : [...f.cargoIds, id],
  }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        currency: form.currency,
        minimumInvestment: Number(form.minimumInvestment),
        cargoIds: form.cargoIds,
        status: form.status,
        currentStatus: form.currentStatus,
        hidden: form.hidden,
        coverImageUrl: form.coverImageUrl,
        location: form.location,
      };
      if (editingId) {
        await updateInvestment(editingId, payload);
        showToast('Investment updated!');
      } else {
        await createInvestment(payload);
        showToast('Investment created!');
      }
      reset();
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save investment', 'error');
    } finally { setSaving(false); }
  };

  const startEdit = (inv: Investment) => {
    setEditingId(inv._id);
    setForm({
      title: inv.title,
      description: inv.description,
      currency: inv.currency,
      minimumInvestment: inv.minimumInvestment.toString(),
      cargoIds: inv.cargoIds || [],
      status: inv.status || 'active',
      currentStatus: inv.currentStatus ?? '',
      hidden: inv.hidden ?? false,
      coverImageUrl: inv.coverImageUrl ?? '',
      location: inv.location ?? '',
    });
  };

  const remove = async (id: string) => {
    try {
      await deleteInvestment(id);
      if (editingId === id) reset();
      await refresh();
      showToast('Investment deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete investment', 'error');
    }
  };

  return (
    <div className="admin-section-grid">
      <article className="portal-card">
        <h2>{editingId ? 'Edit Investment' : 'New Investment'}</h2>
        <form className="portal-form" onSubmit={submit}>
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <ImageCropUploader
            value={form.coverImageUrl}
            onChange={(url) => setForm({ ...form, coverImageUrl: url })}
            aspect={16 / 9}
            label="Cover image"
          />
          <label>Minimum investment</label>
          <div className="portal-amount-row">
            <input type="number" value={form.minimumInvestment} onChange={(e) => setForm({ ...form, minimumInvestment: e.target.value })} required />
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label>Location (shown on globe 📍)</label>
          <input
            list="inv-country-list"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Country where this investment is based…"
            autoComplete="off"
          />
          <datalist id="inv-country-list">
            {COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
          </datalist>
          <label>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InvestmentStatus })}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label>Current status <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(live line shown to investors)</span></label>
          <input
            value={form.currentStatus}
            onChange={(e) => setForm({ ...form, currentStatus: e.target.value })}
            placeholder="e.g. Currently sailing the Pacific · Being transported from Ghana to Abidjan…"
            maxLength={140}
          />
          <div className="portal-multiselect">
            <span>Assign cargos</span>
            {cargos.length === 0 ? (
              <p className="relation-empty">No cargos yet — create one first.</p>
            ) : cargos.map((cargo) => (
              <label key={cargo._id} className="portal-checkbox">
                <input
                  type="checkbox"
                  checked={form.cargoIds.includes(cargo._id)}
                  onChange={() => toggleCargo(cargo._id)}
                />
                {cargo.productBeingShipped} → {cargo.shippingDestination} ({cargo.currency})
              </label>
            ))}
          </div>
          <label className="portal-hidden-toggle">
            <input type="checkbox" checked={form.hidden} onChange={(e) => setForm({ ...form, hidden: e.target.checked })} />
            <span>Hidden — investors cannot see this investment</span>
          </label>
          <div className="portal-form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Investment' : 'Create Investment'}</button>
            {editingId && <button type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </article>

      <article className="portal-card">
        <h2>All Investments <span className="portal-item-badge">{investments.length}</span></h2>
        <div className="portal-stack">
          {investments.length === 0 ? <p className="relation-empty">No investments yet.</p> : investments.map((inv) => (
            <div className="portal-item" key={inv._id}>
              {inv.coverImageUrl && (
                <img src={inv.coverImageUrl} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: '8px 8px 0 0', marginBottom: 8, display: 'block' }} />
              )}
              <div className="portal-item-head">
                <h3>
                  {inv.title}
                  {inv.hidden && <span className="hidden-badge">Hidden</span>}
                </h3>
                {confirmDelete?.id === inv._id ? (
                  <div className="portal-inline-confirm">
                    <span>Delete?</span>
                    <button type="button" className="portal-btn-delete" onClick={() => { void remove(inv._id); setConfirmDelete(null); }}>Yes</button>
                    <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="portal-item-actions">
                    <button type="button" className="portal-btn-edit" onClick={() => startEdit(inv)}>Edit</button>
                    <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete({ id: inv._id })}>Delete</button>
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
  );
};

export default AdminInvestmentsSection;
