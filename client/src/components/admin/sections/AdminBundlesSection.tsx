import React, { useEffect, useState } from 'react';
import {
  getAdminBundles,
  getAdminProducts,
  createBundle,
  updateBundle,
  deleteBundle,
  reorderBundles,
  Bundle,
  BundleInput,
  Product,
} from '../../../api/portalApi';
import ImageCropUploader from '../ImageCropUploader';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const CURRENCY_OPTIONS = ['EUR', 'USD', 'TND', 'CNY'];

const emptyForm: BundleInput = {
  name: '',
  imageUrl: '',
  description: '',
  price: 0,
  currency: 'EUR',
  productIds: [],
  active: true,
};

const AdminBundlesSection: React.FC<Props> = ({ showToast }) => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<BundleInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<Bundle[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    Promise.all([getAdminBundles(), getAdminProducts()])
      .then(([br, pr]) => { setBundles(br.bundles); setProducts(pr.products); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const refresh = async () => {
    const r = await getAdminBundles();
    setBundles(r.bundles);
  };

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const toggleProduct = (id: string) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((p) => p !== id)
        : [...f.productIds, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateBundle(editingId, form);
        showToast('Bundle updated!');
      } else {
        await createBundle(form);
        showToast('Bundle created!');
      }
      reset();
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save bundle', 'error');
    } finally { setSaving(false); }
  };

  const startEdit = (b: Bundle) => {
    setEditingId(b._id);
    setForm({
      name: b.name,
      imageUrl: b.imageUrl ?? '',
      description: b.description ?? '',
      price: b.price,
      currency: b.currency,
      productIds: b.productIds ?? [],
      active: b.active !== false,
    });
  };

  const remove = async (id: string) => {
    try {
      await deleteBundle(id);
      if (editingId === id) reset();
      await refresh();
      showToast('Bundle deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete bundle', 'error');
    }
  };

  const enterReorder = () => { setReorderList([...bundles]); setReorderMode(true); };
  const cancelReorder = () => setReorderMode(false);

  const moveBundle = (from: number, to: number) => {
    setReorderList((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await reorderBundles(reorderList.map((b, i) => ({ id: b._id, position: i })));
      setBundles(reorderList);
      setReorderMode(false);
      showToast('Bundle order saved!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save order', 'error');
    } finally { setSavingOrder(false); }
  };

  const selectedNames = form.productIds
    .map((id) => products.find((p) => p._id === id)?.name)
    .filter(Boolean);

  return (
    <div className="admin-section-grid">
      <article className="portal-card">
        <h2>{editingId ? 'Edit Bundle' : 'New Bundle'}</h2>
        <form className="portal-form" onSubmit={submit}>
          <ImageCropUploader
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            aspect={4 / 3}
            label="Bundle cover image"
          />

          <label>Bundle name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Wellness Starter Kit" />

          <label>Description <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's in the bundle and why it's special..." rows={3} />

          <label>Price</label>
          <div className="portal-amount-row">
            <input
              type="number" min="0" step="0.01"
              value={form.price || ''}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              required
            />
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <label>Included products</label>
          {!loaded ? (
            <p style={{ color: '#475569', fontSize: '0.82rem' }}>Loading products…</p>
          ) : products.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '0.82rem' }}>No products yet — create some first.</p>
          ) : (
            <div className="portal-multiselect" style={{ maxHeight: 220, overflowY: 'auto', gap: 6 }}>
              {products.filter((p) => p.active !== false).map((p) => {
                const checked = form.productIds.includes(p._id);
                return (
                  <label key={p._id} className="portal-hidden-toggle" style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: 8, background: checked ? 'rgba(200,160,106,0.12)' : 'transparent', border: `1px solid ${checked ? 'rgba(200,160,106,0.35)' : 'transparent'}` }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleProduct(p._id)} />
                    <span style={{ color: checked ? '#c8a06a' : '#94a3b8' }}>
                      {p.coverImageUrl && <img src={p.coverImageUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', marginRight: 6, verticalAlign: 'middle' }} />}
                      {p.name}
                      {p.category && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#475569' }}>{p.category}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {selectedNames.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
              Selected: {selectedNames.join(', ')}
            </p>
          )}

          <label className="portal-hidden-toggle" style={{ marginTop: 4 }}>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span>Active — visible in the shop</span>
          </label>

          <div className="portal-form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Bundle' : 'Create Bundle'}</button>
            {editingId && <button type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </article>

      <article className="portal-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>All Bundles <span className="portal-item-badge">{bundles.length}</span></h2>
          {!reorderMode && bundles.length > 1 && (
            <button type="button" className="portal-btn-edit" onClick={enterReorder} style={{ whiteSpace: 'nowrap' }}>↕ Reorder</button>
          )}
        </div>

        {reorderMode ? (
          <>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 12 }}>Use ▲/▼ to set the display order.</p>
            <div className="portal-stack">
              {reorderList.map((b, i) => (
                <div className="portal-item" key={b._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mu-position-badge" style={{ flexShrink: 0 }}>{i + 1}</span>
                  {b.imageUrl
                    ? <img src={b.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    : <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📦</span>}
                  <span style={{ flex: 1, color: '#f1f5f9', fontSize: '0.88rem', fontWeight: 600 }}>{b.name}</span>
                  {!b.active && <span className="hidden-badge">Inactive</span>}
                  <div className="mu-move-btns">
                    <button type="button" className="mu-move-btn" onClick={() => moveBundle(i, i - 1)} disabled={i === 0}>▲</button>
                    <button type="button" className="mu-move-btn" onClick={() => moveBundle(i, i + 1)} disabled={i === reorderList.length - 1}>▼</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="portal-form-actions" style={{ marginTop: 16 }}>
              <button type="button" onClick={() => void saveOrder()} disabled={savingOrder}>{savingOrder ? 'Saving…' : 'Save order'}</button>
              <button type="button" onClick={cancelReorder}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            {!loaded ? <p style={{ color: '#475569' }}>Loading…</p> : bundles.length === 0 ? (
              <p className="relation-empty">No bundles yet — create your first one.</p>
            ) : (
              <div className="portal-stack">
                {bundles.map((b) => {
                  const includedNames = (b.productIds ?? [])
                    .map((id) => products.find((p) => p._id === id)?.name)
                    .filter(Boolean);
                  return (
                    <div className="portal-item" key={b._id}>
                      <div className="portal-item-head">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {b.imageUrl
                            ? <img src={b.imageUrl} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            : <span style={{ fontSize: '1.3rem' }}>📦</span>}
                          {b.name}
                          {!b.active && <span className="hidden-badge">Inactive</span>}
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
                      <p className="portal-item-meta">
                        {b.price.toLocaleString()} {b.currency}
                        <span className="portal-item-badge">{(b.productIds ?? []).length} products</span>
                      </p>
                      {includedNames.length > 0 && (
                        <p className="portal-item-meta" style={{ color: '#475569', fontSize: '0.75rem' }}>
                          {includedNames.join(' · ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </article>
    </div>
  );
};

export default AdminBundlesSection;
