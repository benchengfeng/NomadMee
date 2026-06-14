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

const SECTIONS = [
  { value: 'earth' as const, label: '🌍 From the Earth (food, agriculture)' },
  { value: 'hands' as const, label: '🤲 From the Hands (artisanal, instruments, art)' },
];

const emptyForm = {
  name: '',
  tagline: '',
  bio: '',
  originStory: '',
  location: '',
  locationLat: '',
  locationLng: '',
  coverImageUrl: '',
  profileImageUrl: '',
  logoUrl: '',
  galleryUrls: [] as string[],
  category: '',
  section: 'earth' as 'earth' | 'hands',
  accentColor: '#c8a06a',
  active: true,
  linkedJourneyIds: [] as string[],
  instagram: '',
  website: '',
};

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

  const buildPayload = (): BoutiqueInput => ({
    name: form.name.trim(),
    tagline: form.tagline.trim(),
    bio: form.bio.trim(),
    originStory: form.originStory.trim(),
    location: form.location.trim(),
    locationLat: form.locationLat ? Number(form.locationLat) : undefined,
    locationLng: form.locationLng ? Number(form.locationLng) : undefined,
    coverImageUrl: form.coverImageUrl,
    profileImageUrl: form.profileImageUrl,
    logoUrl: form.logoUrl,
    galleryUrls: form.galleryUrls,
    category: form.category.trim(),
    section: form.section,
    accentColor: form.accentColor.trim(),
    active: form.active,
    linkedJourneyIds: form.linkedJourneyIds,
    socialLinks: { instagram: form.instagram.trim(), website: form.website.trim() },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
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
    setForm({
      name: b.name,
      tagline: b.tagline ?? '',
      bio: b.bio ?? '',
      originStory: b.originStory ?? '',
      location: b.location ?? '',
      locationLat: b.locationLat != null ? String(b.locationLat) : '',
      locationLng: b.locationLng != null ? String(b.locationLng) : '',
      coverImageUrl: b.coverImageUrl ?? '',
      profileImageUrl: b.profileImageUrl ?? '',
      logoUrl: b.logoUrl ?? '',
      galleryUrls: b.galleryUrls ?? [],
      category: b.category ?? '',
      section: b.section ?? 'earth',
      accentColor: b.accentColor ?? '#c8a06a',
      active: b.active !== false,
      linkedJourneyIds: b.linkedJourneyIds ?? [],
      instagram: b.socialLinks?.instagram ?? '',
      website: b.socialLinks?.website ?? '',
    });
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

  const addGalleryUrl = () => setForm((f) => ({ ...f, galleryUrls: [...f.galleryUrls, ''] }));
  const setGalleryUrl = (i: number, val: string) =>
    setForm((f) => { const g = [...f.galleryUrls]; g[i] = val; return { ...f, galleryUrls: g }; });
  const removeGalleryUrl = (i: number) =>
    setForm((f) => ({ ...f, galleryUrls: f.galleryUrls.filter((_, idx) => idx !== i) }));

  return (
    <div className="admin-section-grid">
      <article className="portal-card">
        <h2>{editingId ? 'Edit Boutique' : 'New Boutique'}</h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
          Boutiques are artisan storefronts visible at <code>/shop</code> and as markers on the globe. Assign products via the Products section.
        </p>
        <form className="portal-form" onSubmit={submit}>

          {/* ── Identity ── */}
          <fieldset style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
            <legend style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', padding: '0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identity</legend>

            <label>Boutique name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Sigidya Percussion" />

            <label>Tagline <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(one-liner shown on card)</span></label>
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="The sound of Mali, in your hands." />

            <label>Bio <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(shown on boutique page, artisan strip)</span></label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Short bio of the artisan or boutique…" />

            <label>Origin Story <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(long form, Story tab)</span></label>
            <textarea value={form.originStory} onChange={(e) => setForm({ ...form, originStory: e.target.value })} rows={5} placeholder="The story behind this boutique, in the artisan's own words…" />

            <label>Category <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(tag shown on card)</span></label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Instruments, Organic Food, Paintings" />

            <label>Section</label>
            <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value as 'earth' | 'hands' })}>
              {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <label>Accent colour <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(hex, used for CTA + price)</span></label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} style={{ width: 44, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2, background: 'transparent' }} />
              <input value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} placeholder="#c8a06a" style={{ flex: 1 }} />
            </div>
          </fieldset>

          {/* ── Location ── */}
          <fieldset style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
            <legend style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', padding: '0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</legend>

            <label>City, Country <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(shown on card and boutique page)</span></label>
            <input
              list="boutique-country-list"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Bamako, Mali"
              autoComplete="off"
            />
            <datalist id="boutique-country-list">
              {COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}
            </datalist>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label>Latitude <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(globe pin)</span></label>
                <input type="number" step="any" value={form.locationLat} onChange={(e) => setForm({ ...form, locationLat: e.target.value })} placeholder="12.65" />
              </div>
              <div>
                <label>Longitude</label>
                <input type="number" step="any" value={form.locationLng} onChange={(e) => setForm({ ...form, locationLng: e.target.value })} placeholder="-8.00" />
              </div>
            </div>
          </fieldset>

          {/* ── Media ── */}
          <fieldset style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
            <legend style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', padding: '0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Media</legend>

            <label>Cover image <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(full-bleed on card + boutique page header)</span></label>
            <ImageCropUploader value={form.coverImageUrl} onChange={(url) => setForm({ ...form, coverImageUrl: url })} aspect={16 / 9} label="Cover image" previewHeight={160} />

            <label>Profile / artisan photo <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(round photo on boutique page)</span></label>
            <ImageCropUploader value={form.profileImageUrl} onChange={(url) => setForm({ ...form, profileImageUrl: url })} aspect={1} label="Artisan photo" previewHeight={100} />

            <label>Logo <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(appears over the card cover)</span></label>
            <ImageCropUploader value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} aspect={1} label="Logo" previewHeight={80} />

            <label>Gallery images <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(URL list, future use)</span></label>
            {form.galleryUrls.map((url, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={url} onChange={(e) => setGalleryUrl(i, e.target.value)} placeholder="https://…" style={{ flex: 1 }} />
                <button type="button" onClick={() => removeGalleryUrl(i)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addGalleryUrl} style={{ fontSize: '0.78rem', color: '#64748b', background: 'transparent', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', marginTop: 4 }}>
              + Add gallery image
            </button>
          </fieldset>

          {/* ── Social ── */}
          <fieldset style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
            <legend style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', padding: '0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Social links</legend>

            <label>Instagram URL</label>
            <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/…" />

            <label>Website URL</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" />
          </fieldset>

          <label className="portal-hidden-toggle">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span>Active — visible in the marketplace and on the globe</span>
          </label>

          <div className="portal-form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update Boutique' : 'Create Boutique'}</button>
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
                      <span className="portal-item-badge" style={{ marginLeft: 6, fontSize: '0.68rem' }}>{b.section === 'earth' ? '🌍' : '🤲'} {b.section}</span>
                      {b.location && <span className="portal-item-badge" style={{ marginLeft: 4, fontSize: '0.68rem' }}>📍 {b.location}</span>}
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
                {b.tagline && <p className="portal-item-meta">{b.tagline}</p>}
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

export default AdminBoutiquesSection;
