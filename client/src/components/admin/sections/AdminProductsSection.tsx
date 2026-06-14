import React, { useEffect, useState } from 'react';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  getAdminBoutiques,
  Product,
  ProductInput,
  Boutique,
} from '../../../api/portalApi';
import ImageCropUploader from '../ImageCropUploader';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type ProductSectionKey = 'food' | 'artisanal';

const currencyOptions = ['USD', 'EUR', 'TND', 'CNY'] as const;

const PRODUCT_SECTIONS: Array<{ value: ProductSectionKey; label: string }> = [
  { value: 'food', label: '🌱 Organic Food' },
  { value: 'artisanal', label: '🥁 Artisanal & Instruments' },
];

const SECTION_FIELDS: Record<ProductSectionKey, {
  categories: string[];
  storyLabel: string;
  storyPlaceholder: string;
  variantsLabel: string;
  variantsHint: string;
  variantLabelPlaceholder: string;
  descriptionPlaceholder: string;
}> = {
  food: {
    categories: ['Superfood', 'Herbal tea', 'Spice', 'Grain', 'Snack', 'Oil', 'Other'],
    storyLabel: 'Origin / sourcing story',
    storyPlaceholder: "Where it grows, who farms it, the harvest, why it's special…",
    variantsLabel: 'Weight / size variants',
    variantsHint: '(optional — e.g. 250g, 500g, 1kg)',
    variantLabelPlaceholder: 'Label (e.g. 500g)',
    descriptionPlaceholder: 'Short description shown on the card…',
  },
  artisanal: {
    categories: ['Djembe', 'Percussion', 'Drum', 'String instrument', 'Mask', 'Sculpture', 'Decor', 'Textile', 'Other'],
    storyLabel: 'Craft story / the artisan',
    storyPlaceholder: 'Who handcrafts it, the workshop, the wood & skins, the technique, how long it takes…',
    variantsLabel: 'Sizes / variants',
    variantsHint: '(optional — e.g. 12", 13", Standard, Pro)',
    variantLabelPlaceholder: 'Label (e.g. 13" head)',
    descriptionPlaceholder: 'Short description shown on the card…',
  },
};

const emptyForm = {
  name: '',
  description: '',
  origin: '',
  originStory: '',
  price: '',
  currency: 'EUR',
  stock: '',
  section: 'food' as ProductSectionKey,
  category: '',
  coverImageUrl: '',
  active: true,
  boutiqueId: '',
  variants: [] as Array<{ label: string; price: string }>,
  images: [] as string[],
  priceMatrix: [] as Array<{ label: string; options: Array<{ label: string; price: string; currency: string }> }>,
  customOrderAvailable: false,
  customOrderNote: '',
};

const AdminProductsSection: React.FC<Props> = ({ showToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<Product[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    Promise.all([getAdminProducts(), getAdminBoutiques()])
      .then(([pr, br]) => { setProducts(pr.products); setBoutiques(br.boutiques); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, []);

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const refreshProducts = async () => {
    const r = await getAdminProducts();
    setProducts(r.products);
  };

  const enterReorder = () => { setReorderList([...products]); setReorderMode(true); };
  const cancelReorder = () => setReorderMode(false);

  const moveProduct = (from: number, to: number) => {
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
      await reorderProducts(reorderList.map((p, i) => ({ id: p._id, position: i })));
      setProducts(reorderList);
      setReorderMode(false);
      showToast('Product order saved!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save order', 'error');
    } finally { setSavingOrder(false); }
  };

  const payload = (): ProductInput => ({
    name: form.name.trim(),
    description: form.description.trim(),
    origin: form.origin.trim(),
    originStory: form.originStory.trim(),
    price: Number(form.price),
    currency: form.currency,
    variants: form.variants.filter((v) => v.label.trim()).map((v) => ({ label: v.label.trim(), price: Number(v.price) || 0 })),
    priceMatrix: form.priceMatrix
      .filter((r) => r.label.trim())
      .map((r) => ({
        label: r.label.trim(),
        options: r.options.filter((o) => o.label.trim()).map((o) => ({
          label: o.label.trim(),
          price: Number(o.price) || 0,
          currency: o.currency || 'USD',
        })),
      })),
    customOrderAvailable: form.customOrderAvailable,
    customOrderNote: form.customOrderNote.trim(),
    stock: Number(form.stock) || 0,
    coverImageUrl: form.coverImageUrl,
    images: form.images,
    section: form.section,
    category: form.category.trim(),
    active: form.active,
    boutiqueId: form.boutiqueId || undefined,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload());
        showToast('Product updated!');
      } else {
        await createProduct(payload());
        showToast('Product created!');
      }
      reset();
      await refreshProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save product', 'error');
    } finally { setSaving(false); }
  };

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description ?? '',
      origin: (p as any).origin ?? '',
      originStory: p.originStory ?? '',
      price: p.price.toString(),
      currency: p.currency,
      stock: (p.stock ?? 0).toString(),
      section: p.section === 'artisanal' ? 'artisanal' : 'food',
      category: p.category ?? '',
      coverImageUrl: p.coverImageUrl ?? '',
      active: p.active !== false,
      boutiqueId: p.boutiqueId ?? '',
      variants: (p.variants ?? []).map((v) => ({ label: v.label, price: v.price.toString() })),
      images: p.images ?? [],
      priceMatrix: (p.priceMatrix ?? []).map((r) => ({
        label: r.label,
        options: r.options.map((o) => ({ label: o.label, price: o.price.toString(), currency: o.currency })),
      })),
      customOrderAvailable: p.customOrderAvailable ?? false,
      customOrderNote: p.customOrderNote ?? '',
    });
  };

  const remove = async (id: string) => {
    try {
      await deleteProduct(id);
      if (editingId === id) reset();
      await refreshProducts();
      showToast('Product deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete product', 'error');
    }
  };

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { label: '', price: '' }] }));
  const updateVariant = (i: number, key: 'label' | 'price', value: string) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [key]: value } : v) }));
  const removeVariant = (i: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  const addImage = (url: string) =>
    setForm((f) => f.images.length >= 4 ? f : ({ ...f, images: [...f.images, url] }));
  const removeImage = (i: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category ?? '').toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div className="admin-section-grid">
      <article className="portal-card">
        <h2>{editingId ? 'Edit Product' : 'New Product'}</h2>
        <form className="portal-form" onSubmit={submit}>
          <label>Product section <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(which shop family this belongs to)</span></label>
          <select
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value as ProductSectionKey, category: '' })}
          >
            {PRODUCT_SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <label>Product name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <label>Origin <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(shown on card — e.g. "Yunnan Province · Handcrafted")</span></label>
          <input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Province, region or craft descriptor…" />

          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={SECTION_FIELDS[form.section].descriptionPlaceholder} />

          <label>{SECTION_FIELDS[form.section].storyLabel}</label>
          <textarea value={form.originStory} onChange={(e) => setForm({ ...form, originStory: e.target.value })} placeholder={SECTION_FIELDS[form.section].storyPlaceholder} />

          <ImageCropUploader
            value={form.coverImageUrl}
            onChange={(url) => setForm({ ...form, coverImageUrl: url })}
            aspect={4 / 3}
            label="Cover image"
          />

          <label>Additional images <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(up to 4)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {form.images.map((url, i) => (
              <div key={url + i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#0a0c14' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ))}
            {form.images.length < 4 && (
              <div style={{ width: 180 }}>
                <ImageCropUploader value="" onChange={addImage} aspect={1} label="image" previewHeight={72} />
              </div>
            )}
          </div>

          <label>Price</label>
          <div className="portal-amount-row">
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <label>{SECTION_FIELDS[form.section].variantsLabel} <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>{SECTION_FIELDS[form.section].variantsHint}</span></label>
          <div className="portal-multiselect" style={{ gap: 8 }}>
            {form.variants.length === 0 && (
              <p className="relation-empty" style={{ margin: 0 }}>No variants — the base price is used.</p>
            )}
            {form.variants.map((v, i) => (
              <div key={i} className="portal-amount-row" style={{ gridTemplateColumns: '1fr 1fr auto', display: 'grid', gap: 8, alignItems: 'center' }}>
                <input placeholder={SECTION_FIELDS[form.section].variantLabelPlaceholder} value={v.label} onChange={(e) => updateVariant(i, 'label', e.target.value)} />
                <input type="number" min="0" step="0.01" placeholder="Price" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} />
                <button type="button" className="portal-btn-delete" onClick={() => removeVariant(i)} style={{ whiteSpace: 'nowrap' }}>✕</button>
              </div>
            ))}
            <button type="button" className="portal-btn-edit" onClick={addVariant} style={{ width: 'fit-content' }}>+ Add variant</button>
          </div>

          <label>Stock quantity</label>
          <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />

          <label>Category tag</label>
          <input
            list="product-category-list"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder={`e.g. ${SECTION_FIELDS[form.section].categories.slice(0, 3).join(', ')}…`}
            autoComplete="off"
          />
          <datalist id="product-category-list">
            {SECTION_FIELDS[form.section].categories.map((c) => <option key={c} value={c} />)}
          </datalist>

          <label>Boutique <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(optional — pins this product to a boutique on the globe)</span></label>
          <select value={form.boutiqueId} onChange={(e) => setForm({ ...form, boutiqueId: e.target.value })}>
            <option value="">— No boutique —</option>
            {boutiques.filter((b) => b.active !== false).map((b) => (
              <option key={b._id} value={b._id}>{b.name}{b.location ? ` (${b.location})` : ''}</option>
            ))}
          </select>

          <label className="portal-hidden-toggle">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span>Active — visible in the shop</span>
          </label>

          <div className="portal-form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}</button>
            {editingId && <button type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </article>

      <article className="portal-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>All Products <span className="portal-item-badge">{products.length}</span></h2>
          {!reorderMode && products.length > 1 && (
            <button type="button" className="portal-btn-edit" onClick={enterReorder} style={{ whiteSpace: 'nowrap' }}>
              ↕ Reorder
            </button>
          )}
        </div>

        {reorderMode ? (
          <>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 12 }}>
              Drag with ▲/▼ to set the order products appear in the shop.
            </p>
            <div className="portal-stack">
              {reorderList.map((p, i) => (
                <div className="portal-item" key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mu-position-badge" style={{ flexShrink: 0 }}>{i + 1}</span>
                  {p.coverImageUrl
                    ? <img src={p.coverImageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    : <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🌿</span>}
                  <span style={{ flex: 1, color: '#f1f5f9', fontSize: '0.88rem', fontWeight: 600 }}>{p.name}</span>
                  {!p.active && <span className="hidden-badge">Inactive</span>}
                  <div className="mu-move-btns">
                    <button type="button" className="mu-move-btn" onClick={() => moveProduct(i, i - 1)} disabled={i === 0} title="Move up">▲</button>
                    <button type="button" className="mu-move-btn" onClick={() => moveProduct(i, i + 1)} disabled={i === reorderList.length - 1} title="Move down">▼</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="portal-form-actions" style={{ marginTop: 16 }}>
              <button type="button" onClick={() => void saveOrder()} disabled={savingOrder}>
                {savingOrder ? 'Saving…' : 'Save order'}
              </button>
              <button type="button" onClick={cancelReorder}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            {!loaded ? <p style={{ color: '#475569' }}>Loading…</p> : (
              <>
                {products.length > 0 && (
                  <input
                    className="admin-search"
                    placeholder="Search products…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />
                )}
                <div className="portal-stack">
                  {products.length === 0 ? (
                    <p className="relation-empty">No products yet — create your first one.</p>
                  ) : filtered.length === 0 ? (
                    <p className="relation-empty">No products match "{search}".</p>
                  ) : filtered.map((p) => (
                    <div className="portal-item" key={p._id}>
                      <div className="portal-item-head">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.coverImageUrl
                            ? <img src={p.coverImageUrl} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            : <span style={{ fontSize: '1.3rem' }}>🌿</span>}
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
                      {p.description && <p className="portal-item-meta">{p.description}</p>}
                      <p className="portal-item-meta">
                        {p.price.toLocaleString()} {p.currency}
                        <span className="portal-item-badge">{p.section === 'artisanal' ? '🥁 Artisanal' : '🌱 Food'}</span>
                        {p.category && <span className="portal-item-badge">{p.category}</span>}
                        <span className="portal-item-badge">Stock {p.stock ?? 0}</span>
                        {p.variants?.length > 0 && <span className="portal-item-badge">{p.variants.length} variants</span>}
                        {p.boutiqueId && (() => { const b = boutiques.find((b) => b._id === p.boutiqueId); return b ? <span className="portal-item-badge">🏪 {b.name}</span> : null; })()}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </article>
    </div>
  );
};

export default AdminProductsSection;
