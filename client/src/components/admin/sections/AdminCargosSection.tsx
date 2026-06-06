import React, { useState } from 'react';
import { createCargo, updateCargo, deleteCargo, AdminDashboardResponse } from '../../../api/portalApi';
import MediaUploader from '../MediaUploader';
import ImageCropUploader from '../ImageCropUploader';
import StoryMediaGallery from '../../cargo/StoryMediaGallery';

type Cargo = AdminDashboardResponse['cargos'][number];

interface Props {
  cargos: Cargo[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  refresh: () => Promise<void>;
}

const currencyOptions = ['USD', 'EUR', 'TND', 'CNY'] as const;
const shippingTypeOptions = [
  { value: 'sea', label: '🚢 Sea freight' },
  { value: 'air', label: '✈️ Air freight' },
  { value: 'land', label: '🚛 Land freight' },
] as const;

const emptyForm = {
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
  hidden: false,
  coverImageUrl: '',
  purchaseDate: '',
};

type ConfirmDelete = { id: string };

const AdminCargosSection: React.FC<Props> = ({ cargos, showToast, refresh }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [previewCargoId, setPreviewCargoId] = useState<string | null>(null);
  const [cargoRightTab, setCargoRightTab] = useState<'list' | 'preview'>('preview');
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const cargoPayload = () => ({
    productBeingShipped: form.productBeingShipped,
    quantity: Number(form.quantity),
    purchaseLocation: form.purchaseLocation,
    purchasePrice: Number(form.purchasePrice),
    currency: form.currency,
    shippingDestination: form.shippingDestination,
    shippingPrice: Number(form.shippingPrice),
    otherExpenses: Number(form.otherExpenses),
    estimatedTimeOfArrival: form.estimatedTimeOfArrival,
    estimatedTimeOfSelling: form.estimatedTimeOfSelling,
    shippingType: form.shippingType,
    cargoDescription: form.cargoDescription,
    storyText: form.storyText,
    storyMediaUrls: form.storyMediaUrls,
    hidden: form.hidden,
    coverImageUrl: form.coverImageUrl,
    purchaseDate: form.purchaseDate || undefined,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateCargo(editingId, cargoPayload());
        showToast('Cargo updated!');
      } else {
        await createCargo(cargoPayload());
        showToast('Cargo created!');
      }
      reset();
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save cargo', 'error');
    } finally { setSaving(false); }
  };

  const startEdit = (cargo: Cargo) => {
    setEditingId(cargo._id);
    setForm({
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
      hidden: cargo.hidden ?? false,
      coverImageUrl: cargo.coverImageUrl ?? '',
      purchaseDate: cargo.purchaseDate ? cargo.purchaseDate.split('T')[0]! : '',
    });
  };

  const remove = async (cargoId: string) => {
    try {
      await deleteCargo(cargoId);
      if (editingId === cargoId) reset();
      await refresh();
      showToast('Cargo deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete cargo', 'error');
    }
  };

  const filteredCargos = search
    ? cargos.filter((c) => c.productBeingShipped.toLowerCase().includes(search.toLowerCase()))
    : cargos;

  const shippingIcon = (t: string) => t === 'air' ? '✈️' : t === 'land' ? '🚛' : '🚢';

  return (
    <>
      <div className="admin-section-grid">
        <article className="portal-card">
          <h2>{editingId ? 'Edit Cargo' : 'New Cargo'}</h2>
          <form className="portal-form" onSubmit={submit}>
            <label>Product being shipped</label>
            <input value={form.productBeingShipped} onChange={(e) => setForm({ ...form, productBeingShipped: e.target.value })} required />
            <label>Quantity</label>
            <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <label>Purchase location</label>
            <input value={form.purchaseLocation} onChange={(e) => setForm({ ...form, purchaseLocation: e.target.value })} required />
            <label>Purchase price</label>
            <div className="portal-amount-row">
              <input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required />
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label>Date of purchase <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(used for globe route estimation)</span></label>
            <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            <label>Shipping destination</label>
            <input value={form.shippingDestination} onChange={(e) => setForm({ ...form, shippingDestination: e.target.value })} required />
            <label>Shipping type</label>
            <select value={form.shippingType} onChange={(e) => setForm({ ...form, shippingType: e.target.value as 'sea' | 'air' | 'land' })}>
              {shippingTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <label>Shipping price</label>
            <div className="portal-amount-row">
              <input type="number" value={form.shippingPrice} onChange={(e) => setForm({ ...form, shippingPrice: e.target.value })} required />
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label>Other expenses</label>
            <div className="portal-amount-row">
              <input type="number" value={form.otherExpenses} onChange={(e) => setForm({ ...form, otherExpenses: e.target.value })} required />
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label>ETA</label>
            <input type="date" value={form.estimatedTimeOfArrival} onChange={(e) => setForm({ ...form, estimatedTimeOfArrival: e.target.value })} required />
            <label>Estimated time of selling</label>
            <input type="date" value={form.estimatedTimeOfSelling} onChange={(e) => setForm({ ...form, estimatedTimeOfSelling: e.target.value })} required />
            <label>Description (shown to investor)</label>
            <textarea
              value={form.cargoDescription}
              onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })}
              placeholder="Optional: describe this cargo for investors..."
              rows={3}
            />
            <ImageCropUploader
              value={form.coverImageUrl}
              onChange={(url) => setForm({ ...form, coverImageUrl: url })}
              aspect={16 / 9}
              label="Cover image"
            />
            <label style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>Story text</label>
            <textarea
              value={form.storyText}
              onChange={(e) => setForm({ ...form, storyText: e.target.value })}
              placeholder="Write the cargo story — origin, sourcing process, quality notes..."
              rows={5}
            />
            <label>Photos &amp; videos</label>
            <MediaUploader
              urls={form.storyMediaUrls}
              onAdd={(url) => setForm((f) => ({ ...f, storyMediaUrls: [...f.storyMediaUrls, url] }))}
              onRemove={(url) => setForm((f) => ({ ...f, storyMediaUrls: f.storyMediaUrls.filter((u) => u !== url) }))}
            />
            <label className="portal-hidden-toggle">
              <input type="checkbox" checked={form.hidden} onChange={(e) => setForm({ ...form, hidden: e.target.checked })} />
              <span>Hidden — investors cannot see this cargo</span>
            </label>
            <div className="portal-form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Cargo' : 'Save Cargo'}</button>
              {editingId && <button type="button" onClick={reset}>Cancel</button>}
            </div>
          </form>
        </article>

        <article className="portal-card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['preview', 'list'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setCargoRightTab(t)}
                style={{ padding: '6px 16px', borderRadius: 8, border: cargoRightTab === t ? 'none' : '1px solid rgba(255,255,255,0.1)', background: cargoRightTab === t ? '#38bdf8' : 'transparent', color: cargoRightTab === t ? '#000' : '#94a3b8', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                {t === 'preview' ? '👁 Preview' : `📋 All Cargos (${cargos.length})`}
              </button>
            ))}
          </div>

          {cargoRightTab === 'preview' && (() => {
            const f = form;
            const etaMs = f.estimatedTimeOfArrival ? new Date(f.estimatedTimeOfArrival).getTime() : 0;
            const nowMs = Date.now();
            const pct = etaMs > nowMs ? 0 : etaMs > 0 ? Math.min(100, Math.round(((nowMs - etaMs) / (etaMs - nowMs + 1)) * 100)) : 0;
            const hasContent = !!f.productBeingShipped;
            return hasContent ? (
              <div className="cargo-live-preview">
                <p className="clp-label">Investor card preview</p>
                <div className="cargo-card clp-card" style={{ background: '#0F2434', borderColor: 'rgba(78,211,201,0.3)', padding: 0, overflow: 'hidden' }}>
                  {f.coverImageUrl && (
                    <img src={f.coverImageUrl} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    <div className="cargo-card-title" style={{ color: '#F3F7FB' }}>{f.productBeingShipped}</div>
                    <div className="cargo-card-meta" style={{ color: '#B8D9EA' }}>{shippingIcon(f.shippingType)} {f.purchaseLocation || '—'} → {f.shippingDestination || '—'}</div>
                    <div className="cargo-card-footer" style={{ color: '#B8D9EA' }}>
                      {f.quantity || '0'} units · {f.purchasePrice || '0'} {f.currency} · ETA {f.estimatedTimeOfArrival || '—'}
                    </div>
                    <div className="cargo-journey-progress">
                      <div className="cargo-journey-bar"><div className="cargo-journey-fill" style={{ width: `${pct}%`, background: '#4ED3C9' }} /></div>
                      <span className="cargo-journey-label" style={{ color: '#4ED3C9' }}>{pct}%</span>
                    </div>
                  </div>
                </div>
                {f.cargoDescription && (
                  <div className="clp-section">
                    <p className="clp-section-label">Description (investor sees this)</p>
                    <p className="clp-body">{f.cargoDescription}</p>
                  </div>
                )}
                {f.storyText && (
                  <div className="clp-section">
                    <p className="clp-section-label">Story text</p>
                    <p className="clp-body" style={{ whiteSpace: 'pre-wrap' }}>{f.storyText}</p>
                  </div>
                )}
                {f.storyMediaUrls.length > 0 && (
                  <div className="clp-section">
                    <p className="clp-section-label">Story media ({f.storyMediaUrls.length} item{f.storyMediaUrls.length !== 1 ? 's' : ''})</p>
                    <StoryMediaGallery urls={f.storyMediaUrls} accentColor="#4ED3C9" />
                  </div>
                )}
                {!f.storyText && f.storyMediaUrls.length === 0 && (
                  <p style={{ color: '#334155', fontSize: '0.8rem', marginTop: 12, textAlign: 'center' }}>No story content yet — fill in the story fields to preview.</p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10 }}>
                <span style={{ fontSize: '2rem' }}>📦</span>
                <p style={{ color: '#334155', fontSize: '0.82rem', textAlign: 'center' }}>Fill in the cargo form to see the investor perspective here.</p>
              </div>
            );
          })()}

          {cargoRightTab === 'list' && <>
            <h2 style={{ margin: '0 0 12px' }}>All Cargos <span className="portal-item-badge">{cargos.length}</span></h2>
            {cargos.length > 3 && (
              <input
                className="admin-search"
                placeholder="Search cargos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
            <div className="portal-stack">
              {filteredCargos.length === 0 ? (
                <p className="relation-empty">{search ? 'No cargos match your search.' : 'No cargos yet.'}</p>
              ) : filteredCargos.map((cargo) => (
                <div className="portal-item" key={cargo._id}>
                  {cargo.coverImageUrl && (
                    <img src={cargo.coverImageUrl} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: '8px 8px 0 0', marginBottom: 8, display: 'block' }} />
                  )}
                  <div className="portal-item-head">
                    <h3>
                      {cargo.productBeingShipped}
                      {cargo.hidden && <span className="hidden-badge">Hidden</span>}
                    </h3>
                    {confirmDelete?.id === cargo._id ? (
                      <div className="portal-inline-confirm">
                        <span>Delete?</span>
                        <button type="button" className="portal-btn-delete" onClick={() => { void remove(cargo._id); setConfirmDelete(null); }}>Yes</button>
                        <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="portal-item-actions">
                        {(cargo.story?.text || (cargo.story?.mediaUrls ?? []).length > 0) && (
                          <button type="button" className="portal-btn-preview" onClick={() => setPreviewCargoId(cargo._id)}>Story</button>
                        )}
                        <button type="button" className="portal-btn-edit" onClick={() => startEdit(cargo)}>Edit</button>
                        <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete({ id: cargo._id })}>Delete</button>
                      </div>
                    )}
                  </div>
                  <p className="portal-item-meta">
                    {shippingIcon(cargo.shippingType ?? 'sea')} {cargo.purchaseLocation} → {cargo.shippingDestination}
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
          </>}
        </article>
      </div>

      {/* Cargo story preview modal */}
      {previewCargoId && (() => {
        const cargo = cargos.find((c) => c._id === previewCargoId);
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
    </>
  );
};

export default AdminCargosSection;
