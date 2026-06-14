import React, { useEffect, useState } from 'react';
import {
  getAdminJourneys,
  createJourney,
  updateJourney,
  deleteJourney,
  Journey,
} from '../../../api/portalApi';
import ImageCropUploader from '../ImageCropUploader';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const STATUS_OPTIONS = ['draft', 'active', 'full', 'past'] as const;
const CURRENCY_OPTIONS = ['USD', 'EUR', 'TND', 'CNY'] as const;

const emptyDuration = { label: '', description: '', price: 0, currency: 'USD' as const };

type DurationRow = { label: string; description: string; price: number; currency: string };

const emptyForm = {
  title: '',
  tagline: '',
  story: '',
  location: '',
  locationLat: '',
  locationLng: '',
  coverImageUrl: '',
  coverVideoUrl: '',
  maxGroupSize: '',
  spotsRemaining: '',
  guideName: '',
  guidePhoto: '',
  guideBio: '',
  guideQuote: '',
  availableDates: '',
  status: 'draft' as typeof STATUS_OPTIONS[number],
  included: '',
  notIncluded: '',
};

const AdminJourneysSection: React.FC<Props> = ({ showToast }) => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Journey | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [gallery, setGallery] = useState<string[]>([]);
  const [durations, setDurations] = useState<DurationRow[]>([{ ...emptyDuration }]);

  const load = () => {
    setLoading(true);
    getAdminJourneys()
      .then((r) => setJourneys(r.journeys))
      .catch(() => showToast('Failed to load journeys', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setGallery([]);
    setDurations([{ ...emptyDuration }]);
    setShowForm(true);
  };

  const openEdit = (j: Journey) => {
    setEditing(j);
    setForm({
      title: j.title,
      tagline: j.tagline ?? '',
      story: j.story,
      location: j.location,
      locationLat: String(j.locationLat ?? ''),
      locationLng: String(j.locationLng ?? ''),
      coverImageUrl: j.coverImageUrl ?? '',
      coverVideoUrl: j.coverVideoUrl ?? '',
      maxGroupSize: String(j.maxGroupSize ?? ''),
      spotsRemaining: String(j.spotsRemaining ?? ''),
      guideName: j.guideName ?? '',
      guidePhoto: j.guidePhoto ?? '',
      guideBio: j.guideBio ?? '',
      guideQuote: j.guideQuote ?? '',
      availableDates: (j.availableDates ?? []).join('\n'),
      status: j.status,
      included: (j.included ?? []).join('\n'),
      notIncluded: (j.notIncluded ?? []).join('\n'),
    });
    setGallery(j.gallery ?? []);
    setDurations(
      j.durations.length > 0
        ? j.durations.map((d) => ({ label: d.label, description: d.description, price: d.price, currency: d.currency }))
        : [{ ...emptyDuration }]
    );
    setShowForm(true);
  };

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addGalleryImg = () => setGallery((g) => [...g, '']);
  const setGalleryImg = (i: number, url: string) =>
    setGallery((g) => { const n = [...g]; n[i] = url; return n; });
  const removeGalleryImg = (i: number) =>
    setGallery((g) => g.filter((_, idx) => idx !== i));

  const setDur = (i: number, k: keyof DurationRow, v: string | number) =>
    setDurations((ds) => ds.map((d, idx) => idx === i ? { ...d, [k]: v } : d));

  const addDur = () => setDurations((ds) => [...ds, { ...emptyDuration }]);
  const removeDur = (i: number) => setDurations((ds) => ds.filter((_, idx) => idx !== i));

  const buildPayload = () => ({
    title: form.title.trim(),
    tagline: form.tagline.trim(),
    story: form.story.trim(),
    location: form.location.trim(),
    locationLat: parseFloat(form.locationLat) || 0,
    locationLng: parseFloat(form.locationLng) || 0,
    coverImageUrl: form.coverImageUrl.trim(),
    coverVideoUrl: form.coverVideoUrl.trim(),
    gallery: gallery.filter(Boolean),
    durations: durations.filter((d) => d.label).map((d) => ({
      label: d.label,
      description: d.description,
      price: Number(d.price),
      currency: d.currency,
    })),
    included: form.included.split('\n').map((s) => s.trim()).filter(Boolean),
    notIncluded: form.notIncluded.split('\n').map((s) => s.trim()).filter(Boolean),
    maxGroupSize: parseInt(form.maxGroupSize) || 0,
    spotsRemaining: parseInt(form.spotsRemaining) || 0,
    guideName: form.guideName.trim(),
    guidePhoto: form.guidePhoto.trim(),
    guideBio: form.guideBio.trim(),
    guideQuote: form.guideQuote.trim(),
    availableDates: form.availableDates.split('\n').map((s) => s.trim()).filter(Boolean),
    status: form.status,
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.story.trim() || !form.location.trim()) {
      showToast('Title, story, and location are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await updateJourney(editing._id, payload);
        showToast('Journey updated');
      } else {
        await createJourney(payload);
        showToast('Journey created');
      }
      setShowForm(false);
      load();
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (j: Journey) => {
    if (!window.confirm(`Delete "${j.title}"? This cannot be undone.`)) return;
    try {
      await deleteJourney(j._id);
      showToast('Journey deleted');
      load();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const statusColor = (s: string) =>
    s === 'active' ? '#22c55e' : s === 'draft' ? '#94a3b8' : s === 'full' ? '#f59e0b' : '#ef4444';

  if (showForm) {
    return (
      <div style={{ padding: 24, maxWidth: 780 }}>
        <button onClick={() => setShowForm(false)} style={{ marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', color: '#94a3b8' }}>
          ← Back to journeys
        </button>
        <h2 style={{ marginBottom: 24, fontSize: '1.1rem', fontWeight: 700 }}>
          {editing ? `Edit: ${editing.title}` : 'New Journey'}
        </h2>

        <Section label="Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value)} style={selectStyle}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Section>

        <Section label="Title *">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} style={inputStyle} placeholder="The Sahara Crossing" />
        </Section>

        <Section label="Tagline">
          <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} style={inputStyle} placeholder="A short teaser shown on the card" />
        </Section>

        <Section label="Story / editorial body *">
          <textarea value={form.story} onChange={(e) => set('story', e.target.value)} rows={6} style={inputStyle} placeholder="The full narrative — show on detail page" />
        </Section>

        <Section label="Location *">
          <input value={form.location} onChange={(e) => set('location', e.target.value)} style={inputStyle} placeholder="Tassili n'Ajjer, Algeria" />
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Section label="Latitude">
            <input type="number" value={form.locationLat} onChange={(e) => set('locationLat', e.target.value)} style={inputStyle} placeholder="24.56" />
          </Section>
          <Section label="Longitude">
            <input type="number" value={form.locationLng} onChange={(e) => set('locationLng', e.target.value)} style={inputStyle} placeholder="8.43" />
          </Section>
        </div>

        <Section label="Cover image">
          <ImageCropUploader
            value={form.coverImageUrl}
            onChange={(url) => set('coverImageUrl', url)}
            aspect={16 / 9}
            label="Cover image"
            previewHeight={160}
          />
        </Section>

        <Section label="Cover video URL (optional)">
          <input value={form.coverVideoUrl} onChange={(e) => set('coverVideoUrl', e.target.value)} style={inputStyle} placeholder="https://res.cloudinary.com/…/video.mp4" />
        </Section>

        <Section label="Gallery images">
          {gallery.map((url, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <ImageCropUploader
                  value={url}
                  onChange={(newUrl) => setGalleryImg(i, newUrl)}
                  aspect={4 / 3}
                  label={`Gallery image ${i + 1}`}
                  previewHeight={110}
                />
              </div>
              <button onClick={() => removeGalleryImg(i)} style={{ background: 'none', border: '1px solid #334155', borderRadius: 8, padding: '5px 10px', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', marginTop: 4, flexShrink: 0 }}>✕</button>
            </div>
          ))}
          <button onClick={addGalleryImg} style={{ fontSize: '0.82rem', color: '#94a3b8', background: 'none', border: '1px dashed #334155', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', marginTop: 4 }}>
            + Add gallery image
          </button>
        </Section>

        <Section label="Duration options">
          {durations.map((d, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input value={d.label} onChange={(e) => setDur(i, 'label', e.target.value)} style={inputStyle} placeholder="Label (e.g. 7 Days)" />
              <input value={d.description} onChange={(e) => setDur(i, 'description', e.target.value)} style={inputStyle} placeholder="Short note (e.g. Full circuit)" />
              <input type="number" value={d.price} onChange={(e) => setDur(i, 'price', e.target.value)} style={inputStyle} placeholder="Price" />
              <select value={d.currency} onChange={(e) => setDur(i, 'currency', e.target.value)} style={selectStyle}>
                {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => removeDur(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.1rem' }}>×</button>
            </div>
          ))}
          <button onClick={addDur} style={{ fontSize: '0.82rem', color: '#94a3b8', background: 'none', border: '1px dashed #334155', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', marginTop: 4 }}>
            + Add duration
          </button>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Section label="Max group size">
            <input type="number" value={form.maxGroupSize} onChange={(e) => set('maxGroupSize', e.target.value)} style={inputStyle} placeholder="12" />
          </Section>
          <Section label="Spots remaining">
            <input type="number" value={form.spotsRemaining} onChange={(e) => set('spotsRemaining', e.target.value)} style={inputStyle} placeholder="12" />
          </Section>
        </div>

        <Section label="What's included (one per line)">
          <textarea value={form.included} onChange={(e) => set('included', e.target.value)} rows={4} style={inputStyle} placeholder={"Expert local guide\nCamping gear\nAll meals"} />
        </Section>

        <Section label="Not included (one per line)">
          <textarea value={form.notIncluded} onChange={(e) => set('notIncluded', e.target.value)} rows={3} style={inputStyle} placeholder={"International flights\nTravel insurance"} />
        </Section>

        <Section label="Available dates (one per line, e.g. March 2026)">
          <textarea value={form.availableDates} onChange={(e) => set('availableDates', e.target.value)} rows={3} style={inputStyle} placeholder={"March 2026\nOctober 2026"} />
        </Section>

        <Section label="Guide name">
          <input value={form.guideName} onChange={(e) => set('guideName', e.target.value)} style={inputStyle} placeholder="Youssef El Amine" />
        </Section>

        <Section label="Guide photo">
          <ImageCropUploader
            value={form.guidePhoto}
            onChange={(url) => set('guidePhoto', url)}
            aspect={1}
            cropShape="round"
            label="Guide photo"
            previewHeight={100}
          />
        </Section>

        <Section label="Guide bio">
          <textarea value={form.guideBio} onChange={(e) => set('guideBio', e.target.value)} rows={3} style={inputStyle} placeholder="Local expert with 15 years in the desert…" />
        </Section>

        <Section label="Guide quote">
          <input value={form.guideQuote} onChange={(e) => set('guideQuote', e.target.value)} style={inputStyle} placeholder="The desert teaches patience…" />
        </Section>

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button onClick={handleSave} disabled={saving} style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Update Journey' : 'Create Journey'}
          </button>
          <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>🧭 Journeys</h2>
        <button onClick={openNew} style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 10, padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
          + New Journey
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Loading…</p>
      ) : journeys.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No journeys yet. Create the first one!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {journeys.map((j) => (
            <div key={j._id} style={{ background: '#1e293b', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {j.coverImageUrl && (
                <img src={j.coverImageUrl} alt={j.title} style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: `${statusColor(j.status)}22`, color: statusColor(j.status), border: `1px solid ${statusColor(j.status)}44`, textTransform: 'uppercase', flexShrink: 0 }}>{j.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  📍 {j.location} &nbsp;·&nbsp; {j.durations.length} duration{j.durations.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {j.spotsRemaining}/{j.maxGroupSize} spots
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => openEdit(j)} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontSize: '0.82rem' }}>Edit</button>
                <button onClick={() => handleDelete(j)} style={{ background: 'none', border: '1px solid #dc262633', color: '#ef4444', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontSize: '0.82rem' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
  padding: '9px 14px', color: '#f1f5f9', fontSize: '0.88rem', boxSizing: 'border-box',
  resize: 'vertical' as const,
};

const selectStyle: React.CSSProperties = {
  width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
  padding: '9px 14px', color: '#f1f5f9', fontSize: '0.88rem',
};

export default AdminJourneysSection;
