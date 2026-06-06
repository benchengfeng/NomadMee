import React, { useEffect, useState } from 'react';
import {
  getAdminBoutiques,
  createBoutique,
  updateBoutique,
  deleteBoutique,
  Boutique,
  BoutiqueInput,
} from '../../../api/portalApi';
import ImageCropUploader from '../ImageCropUploader';
import { COUNTRIES } from '../../../utils/countries';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const emptyForm = { name: '', logoUrl: '', description: '', location: '', active: true };

const AdminBoutiquesSection: React.FC<Props> = ({ showToast }) => {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    getAdminBoutiques()
      .then((r) => { setBoutiques(r.boutiques); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, []);

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const refresh = async () => {
    const r = await getAdminBoutiques();
    setBoutiques(r.boutiques);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: BoutiqueInput = {
        name: form.name.trim(),
        logoUrl: form.logoUrl,
        description: form.description.trim(),
        location: form.location.trim(),
        active: form.active,
      };
      if (editingId) {
        await updateBoutique(editingId, payload);
        showToast('Boutique updated!');
      } else {
        await createBoutique(payload);
        showToast('Boutique created!');
      }
      reset();
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save boutique', 'error');
    } finally { setSaving(false); }
  };

  const startEdit = (b: Boutique) => {
    setEditingId(b._id);
    setForm({ name: b.name, logoUrl: b.logoUrl ?? '', description: b.description ?? '', location: b.location ?? '', active: b.active !== false });
  };

  const remove = async (id: string) => {
    try {
      await deleteBoutique(id);
      if (editingId === id) reset();
      await refresh();
      showToast('Boutique deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete boutique', 'error');
    }
  };

  return (
    <div className="admin-section-grid">
      <article className="portal-card">
        <h2>{editingId ? 'Edit Boutique' : 'New Boutique'}</h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
          Boutiques appear as logo markers on the globe in their country. Assign products to them when creating or editing a product.
        </p>
        <form className="portal-form" onSubmit={submit}>
          <ImageCropUploader
            value={form.logoUrl}
            onChange={(url) => setForm({ ...form, logoUrl: url })}
            aspect={1}
            label="Logo"
            previewHeight={120}
          />

          <label>Boutique name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. NomadMe Abidjan" />

          <label>Country <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(used to pin it on the globe)</span></label>
          <input
            list="boutique-country-list"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Search country…"
            autoComplete="off"
          />
          <datalist id="boutique-country-list">
            {COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
          </datalist>

          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="A short description of this boutique location…"
            rows={3}
          />

          <label className="portal-hidden-toggle">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span>Active — visible on the globe</span>
          </label>

          <div className="portal-form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Boutique' : 'Create Boutique'}</button>
            {editingId && <button type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </article>

      <article className="portal-card">
        <h2>All Boutiques <span className="portal-item-badge">{boutiques.length}</span></h2>
        {!loaded ? <p style={{ color: '#475569' }}>Loading…</p> : (
          <div className="portal-stack">
            {boutiques.length === 0 ? (
              <p className="relation-empty">No boutiques yet — add your first one.</p>
            ) : boutiques.map((b) => (
              <div className="portal-item" key={b._id}>
                <div className="portal-item-head">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {b.logoUrl
                      ? <img src={b.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      : <span style={{ width: 40, height: 40, borderRadius: 8, background: '#1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🏪</span>}
                    <div>
                      {b.name}
                      {!b.active && <span className="hidden-badge" style={{ marginLeft: 6 }}>Inactive</span>}
                      {b.location && <span className="portal-item-badge" style={{ marginLeft: 6, fontSize: '0.68rem' }}>📍 {b.location}</span>}
                    </div>
                  </h3>
                  {confirmDelete === b._id ? (
                    <div className="portal-inline-confirm">
                      <span>Delete?</span>
                      <button type="button" className="portal-btn-delete" onClick={() => { void remove(b._id); setConfirmDelete(null); }}>Yes</button>
                      <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="portal-item-actions">
                      <button type="button" className="portal-btn-edit" onClick={() => startEdit(b)}>Edit</button>
                      <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete(b._id)}>Delete</button>
                    </div>
                  )}
                </div>
                {b.description && <p className="portal-item-meta">{b.description}</p>}
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

export default AdminBoutiquesSection;
