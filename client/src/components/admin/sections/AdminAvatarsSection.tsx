import React, { useCallback, useRef, useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
  getAdminAvatars,
  createAvatar,
  updateAvatarMeta,
  deleteAvatar,
  uploadMedia,
  AvatarData,
} from '../../../api/portalApi';
import { dashboardThemes } from '../../../theme';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92));
}

const AdminAvatarsSection: React.FC<Props> = ({ showToast }) => {
  const [avatars, setAvatars] = useState<AvatarData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [name, setName] = useState('');
  const [theme, setTheme] = useState(0);
  const [secret, setSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAdminAvatars()
      .then((r) => { setAvatars(r.avatars); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, []);

  const resetForm = useCallback(() => {
    setRawSrc(null); setCroppedUrl(null); setCroppedBlob(null);
    setName(''); setTheme(0); setSecret(false); setEditingId(null);
  }, []);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateAvatarMeta(editingId, { name: name.trim(), defaultTheme: theme, secret });
        setAvatars((prev) => prev.map((a) => a._id === editingId ? updated : a));
        showToast('Avatar updated!');
      } else {
        if (!croppedBlob) return;
        const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
        const imageUrl = await uploadMedia(file);
        const created = await createAvatar({ name: name.trim(), imageUrl, defaultTheme: theme, secret });
        setAvatars((prev) => [...prev, created]);
        showToast('Avatar created!');
      }
      resetForm();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save avatar', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="admin-section-grid">
      <article className="portal-card">
        <h2>{editingId ? 'Edit Avatar' : 'New Avatar'}</h2>

        {!croppedUrl ? (
          <div>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 12 }}>
              Upload a photo, crop it to a circle, then fill in the details.
            </p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setRawSrc(URL.createObjectURL(f));
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }}
            />
            <button type="button" className="portal-btn-edit" style={{ width: '100%', padding: 12, fontSize: '0.85rem' }}
              onClick={() => fileRef.current?.click()}>
              📁 Choose image
            </button>

            {rawSrc && (
              <div style={{ marginTop: 16 }}>
                <div style={{ position: 'relative', height: 300, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                  <Cropper
                    image={rawSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_: Area, pixels: Area) => setCroppedPixels(pixels)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', flexShrink: 0 }}>Zoom</span>
                  <input type="range" min={1} max={3} step={0.01} value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={{ flex: 1 }} />
                </div>
                <button type="button" style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 10, background: '#38bdf8', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                  onClick={async () => {
                    if (!rawSrc || !croppedPixels) return;
                    const blob = await getCroppedImg(rawSrc, croppedPixels);
                    setCroppedBlob(blob);
                    setCroppedUrl(URL.createObjectURL(blob));
                  }}>
                  ✓ Apply crop
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Live themed preview */}
            {(() => {
              const t = dashboardThemes[theme] ?? dashboardThemes[0]!;
              return (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.accent}33`, boxShadow: `0 12px 30px ${t.panelGlow}`, transition: 'all 0.3s ease' }}>
                  <div style={{ background: t.background, padding: '18px 16px', transition: 'background 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={croppedUrl} alt="Preview" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${t.accent}`, boxShadow: `0 0 0 3px ${t.accent}33`, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.secondaryText, fontWeight: 700 }}>Investor preview</p>
                        <p style={{ margin: '3px 0 0', fontSize: '1rem', fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name.trim() || 'Avatar name'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <div style={{ flex: 1, background: t.surface, borderRadius: 10, padding: '10px 12px', transition: 'background 0.3s ease' }}>
                        <p style={{ margin: 0, fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: t.secondaryText, fontWeight: 700 }}>Invested</p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 800, color: t.text }}>$25,000</p>
                      </div>
                      <button type="button" style={{ border: 'none', borderRadius: 10, padding: '0 16px', background: t.accent, color: t.background, fontWeight: 800, fontSize: '0.78rem', cursor: 'default', transition: 'background 0.3s ease' }}>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button type="button" onClick={() => { setCroppedUrl(null); setCroppedBlob(null); }}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
              ↺ Re-crop image
            </button>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avatar name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Navigator"
                style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.9rem' }} />
            </label>

            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Default dashboard theme</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {dashboardThemes.map((t, i) => (
                  <button key={i} type="button" onClick={() => setTheme(i)} title={t.name}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 10, border: theme === i ? '2px solid #fff' : '2px solid transparent', background: theme === i ? 'rgba(255,255,255,0.08)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: t.accent, display: 'block', boxShadow: theme === i ? `0 0 0 2px ${t.accent}66` : 'none', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.58rem', color: theme === i ? '#f1f5f9' : '#475569', fontWeight: 600, lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
              {dashboardThemes[theme] && (
                <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: dashboardThemes[theme]!.accent, display: 'inline-block', flexShrink: 0 }} />
                  <strong style={{ color: '#f1f5f9' }}>{dashboardThemes[theme]!.name}</strong> activates when investor selects this avatar.
                </p>
              )}
            </div>

            <label className="portal-hidden-toggle" style={{ borderColor: secret ? 'rgba(168,85,247,0.4)' : undefined, background: secret ? 'rgba(168,85,247,0.06)' : undefined }}>
              <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
              <span>🔒 Secret avatar — hidden until investor reveals</span>
            </label>

            <div className="portal-form-actions">
              <button type="button" disabled={saving || !name.trim()}
                style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: '#38bdf8', color: '#000', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: !name.trim() ? 0.5 : 1 }}
                onClick={() => void save()}>
                {saving ? 'Saving...' : editingId ? 'Update avatar' : 'Save avatar'}
              </button>
              <button type="button" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        )}
      </article>

      <article className="portal-card">
        <h2>All Avatars <span className="portal-item-badge">{avatars.length}</span></h2>
        {!loaded ? <p style={{ color: '#475569' }}>Loading…</p> : (
          <div className="portal-stack">
            {avatars.length === 0 ? (
              <p className="relation-empty">No avatars yet — create your first one.</p>
            ) : avatars.map((av) => (
              <div className="portal-item" key={av._id} style={{ opacity: av.secret ? 0.75 : 1 }}>
                <div className="portal-item-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={av.imageUrl} alt={av.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${dashboardThemes[av.defaultTheme]?.accent ?? '#38bdf8'}` }} />
                    <div>
                      <h3 style={{ margin: 0 }}>
                        {av.name}
                        {av.secret && <span className="hidden-badge" style={{ background: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)', color: '#a855f7' }}>Secret</span>}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: dashboardThemes[av.defaultTheme]?.accent ?? '#38bdf8' }} />
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Theme {av.defaultTheme + 1}</span>
                      </div>
                    </div>
                  </div>
                  <div className="portal-item-actions">
                    <button type="button" className="portal-btn-edit" onClick={() => {
                      setEditingId(av._id);
                      setName(av.name);
                      setTheme(av.defaultTheme);
                      setSecret(av.secret);
                      setCroppedUrl(av.imageUrl);
                    }}>Edit</button>
                    <button type="button" className="portal-btn-delete" onClick={async () => {
                      try {
                        await deleteAvatar(av._id);
                        setAvatars((prev) => prev.filter((a) => a._id !== av._id));
                        showToast('Avatar deleted');
                      } catch { showToast('Failed to delete avatar', 'error'); }
                    }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

export default AdminAvatarsSection;
