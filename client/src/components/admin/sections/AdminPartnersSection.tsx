import React, { useEffect, useState } from 'react';
import {
  getAdminPartners,
  createPartner,
  updatePartner,
  deletePartner,
  Partner,
  PartnerInput,
} from '../../../api/portalApi';
import ImageCropUploader from '../ImageCropUploader';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const emptyForm = { name: '', logoUrl: '', title: '', description: '', active: true, location: '', locationLat: '', locationLng: '' };

const AdminPartnersSection: React.FC<Props> = ({ showToast }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    getAdminPartners()
      .then((r) => { setPartners(r.partners); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, []);

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: PartnerInput = {
        name: form.name.trim(),
        logoUrl: form.logoUrl,
        title: form.title.trim(),
        description: form.description.trim(),
        active: form.active,
        location: form.location.trim() || undefined,
        locationLat: form.locationLat ? parseFloat(form.locationLat) : undefined,
        locationLng: form.locationLng ? parseFloat(form.locationLng) : undefined,
      };
      if (editingId) {
        await updatePartner(editingId, payload);
        showToast('Partner updated!');
      } else {
        await createPartner(payload);
        showToast('Partner created!');
      }
      reset();
      const r = await getAdminPartners();
      setPartners(r.partners);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save partner', 'error');
    } finally { setSaving(false); }
  };

  const startEdit = (p: Partner) => {
    setEditingId(p._id);
    setForm({ name: p.name, logoUrl: p.logoUrl ?? '', title: p.title ?? '', description: p.description ?? '', active: p.active !== false, location: p.location ?? '', locationLat: String(p.locationLat ?? ''), locationLng: String(p.locationLng ?? '') });
  };

  const remove = async (id: string) => {
    try {
      await deletePartner(id);
      if (editingId === id) reset();
      const r = await getAdminPartners();
      setPartners(r.partners);
      showToast('Partner deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete partner', 'error');
    }
  };

  return (
    <div className="admin-section-grid">
      <article className="portal-card">
        <h2>{editingId ? 'Edit Partner' : 'New Partner'}</h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
          Shown at the bottom of the landing "Who Are We?" page. Visitors see the logo &amp; name; clicking flips the card to reveal the partnership title &amp; description.
        </p>
        <form className="portal-form" onSubmit={submit}>
          <ImageCropUploader
            value={form.logoUrl}
            onChange={(url) => setForm({ ...form, logoUrl: url })}
            aspect={1}
            label="Logo"
            previewHeight={120}
          />
          <label>Partner name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Port of Abidjan" />

          <label>Partnership title <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(shown on flip)</span></label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Official logistics partner" />

          <label>Short description <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(who they are)</span></label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A sentence or two about who they are and how you work together…" rows={4} />

          <label>Location <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(city, country — shown on globe)</span></label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Abidjan, Côte d'Ivoire" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Latitude</label>
              <input type="number" value={form.locationLat} onChange={(e) => setForm({ ...form, locationLat: e.target.value })} placeholder="5.36" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Longitude</label>
              <input type="number" value={form.locationLng} onChange={(e) => setForm({ ...form, locationLng: e.target.value })} placeholder="-4.00" />
            </div>
          </div>

          <label className="portal-hidden-toggle">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span>Active — visible on the site</span>
          </label>

          <div className="portal-form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Partner' : 'Create Partner'}</button>
            {editingId && <button type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </article>

      <article className="portal-card">
        <h2>All Partners <span className="portal-item-badge">{partners.length}</span></h2>
        {!loaded ? <p style={{ color: '#475569' }}>Loading…</p> : (
          <div className="portal-stack">
            {partners.length === 0 ? (
              <p className="relation-empty">No partners yet — add your first one.</p>
            ) : partners.map((p) => (
              <div className="portal-item" key={p._id}>
                <div className="portal-item-head">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.logoUrl
                      ? <img src={p.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 3, flexShrink: 0 }} />
                      : <span style={{ fontSize: '1.3rem' }}>🤝</span>}
                    {p.name}
                    {!p.active && <span className="hidden-badge">Inactive</span>}
                  </h3>
                  {confirmDelete === p._id ? (
                    <div className="portal-inline-confirm">
                      <span>Delete?</span>
                      <button type="button" className="portal-btn-delete" onClick={() => { void remove(p._id); setConfirmDelete(null); }}>Yes</button>
                      <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="portal-item-actions">
                      <button type="button" className="portal-btn-edit" onClick={() => startEdit(p)}>Edit</button>
                      <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete(p._id)}>Delete</button>
                    </div>
                  )}
                </div>
                {p.title && <p className="portal-item-meta" style={{ color: '#94a3b8', fontWeight: 600 }}>{p.title}</p>}
                {p.description && <p className="portal-item-meta">{p.description}</p>}
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

export default AdminPartnersSection;
