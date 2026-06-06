import React, { useEffect, useState } from 'react';
import { getPublicSiteContent, updateSiteContent, SiteContent } from '../../../api/portalApi';
import MediaUploader from '../MediaUploader';
import SocialLinksEditor from '../SocialLinksEditor';
import { SocialLinks } from '../../common/socialPlatforms';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const AdminContentSection: React.FC<Props> = ({ showToast }) => {
  const [siteContent, setSiteContent] = useState<SiteContent>({ key: 'who_are_we', title: '', body: '', mediaUrls: [] });
  const [saving, setSaving] = useState(false);
  const [earthGallery, setEarthGallery] = useState<string[]>([]);
  const [handsGallery, setHandsGallery] = useState<string[]>([]);
  const [savingGallery, setSavingGallery] = useState<'earth' | 'hands' | null>(null);

  useEffect(() => {
    Promise.all([
      getPublicSiteContent('who_are_we'),
      getPublicSiteContent('shop_gallery_earth'),
      getPublicSiteContent('shop_gallery_hands'),
    ]).then(([contentRes, earthRes, handsRes]) => {
      setSiteContent(contentRes.content);
      setEarthGallery(earthRes.content.mediaUrls ?? []);
      setHandsGallery(handsRes.content.mediaUrls ?? []);
    }).catch(() => {});
  }, []);

  const submitSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSiteContent('who_are_we', {
        title: siteContent.title,
        body: siteContent.body,
        mediaUrls: siteContent.mediaUrls,
        links: siteContent.links ?? [],
      });
      setSiteContent(res.content);
      showToast('Content saved!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save content', 'error');
    } finally { setSaving(false); }
  };

  const saveGallery = async (which: 'earth' | 'hands') => {
    setSavingGallery(which);
    try {
      const key = which === 'earth' ? 'shop_gallery_earth' : 'shop_gallery_hands';
      const urls = which === 'earth' ? earthGallery : handsGallery;
      await updateSiteContent(key, { title: '', body: '', mediaUrls: urls });
      showToast('Gallery saved!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save gallery', 'error');
    } finally { setSavingGallery(null); }
  };

  const galleryCards: Array<{ which: 'earth' | 'hands'; title: string; hint: string; urls: string[]; set: React.Dispatch<React.SetStateAction<string[]>> }> = [
    { which: 'earth', title: '🌱 Shop · From the Earth gallery', hint: 'Photos & videos showcased at the bottom of the "From the Earth" shop section.', urls: earthGallery, set: setEarthGallery },
    { which: 'hands', title: '🥁 Shop · From the Hands gallery', hint: 'Photos & videos showcased at the bottom of the "From the Hands" shop section.', urls: handsGallery, set: setHandsGallery },
  ];

  return (
    <>
      <div className="admin-section-grid">
        <article className="portal-card">
          <h2>Who Are We?</h2>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
            This content is displayed on the landing page "Who Are We?" section.
          </p>
          <form className="portal-form" onSubmit={submitSiteContent}>
            <label>Page title</label>
            <input
              value={siteContent.title ?? ''}
              onChange={(e) => setSiteContent((c) => ({ ...c, title: e.target.value }))}
              placeholder="e.g. Our Story"
            />
            <label>Body text</label>
            <textarea
              value={siteContent.body ?? ''}
              onChange={(e) => setSiteContent((c) => ({ ...c, body: e.target.value }))}
              placeholder="Tell your story — who you are, your mission, your values..."
              rows={10}
            />
            <label>Photos &amp; videos</label>
            <MediaUploader
              urls={siteContent.mediaUrls ?? []}
              onAdd={(url) => setSiteContent((c) => ({ ...c, mediaUrls: [...(c.mediaUrls ?? []), url] }))}
              onRemove={(url) => setSiteContent((c) => ({ ...c, mediaUrls: c.mediaUrls?.filter((u) => u !== url) }))}
            />
            <label style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
              Social &amp; external links <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>(shown under the story)</span>
            </label>
            <SocialLinksEditor
              links={siteContent.links ?? []}
              onChange={(links) => setSiteContent((c) => ({ ...c, links }))}
            />
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Content'}</button>
          </form>
        </article>
        <article className="portal-card">
          <h2>Preview</h2>
          {siteContent.title && <h3 style={{ color: '#f1f5f9', marginTop: 0 }}>{siteContent.title}</h3>}
          {siteContent.body ? (
            <p style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.88rem' }}>{siteContent.body}</p>
          ) : (
            <p className="relation-empty">No body text yet.</p>
          )}
          {(siteContent.mediaUrls ?? []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {(siteContent.mediaUrls ?? []).map((url) => (
                <span key={url} className="relation-chip relation-chip--cargo" style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>🖼 {url}</span>
              ))}
            </div>
          )}
          {(siteContent.links ?? []).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <SocialLinks links={siteContent.links ?? []} />
            </div>
          )}
        </article>
      </div>

      <div className="admin-section-grid" style={{ marginTop: 24 }}>
        {galleryCards.map((g) => (
          <article className="portal-card" key={g.which}>
            <h2>{g.title}</h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>{g.hint}</p>
            <form className="portal-form" onSubmit={(e) => { e.preventDefault(); void saveGallery(g.which); }}>
              <label>Photos &amp; videos</label>
              <MediaUploader
                urls={g.urls}
                onAdd={(url) => g.set((prev) => [...prev, url])}
                onRemove={(url) => g.set((prev) => prev.filter((u) => u !== url))}
              />
              <button type="submit" disabled={savingGallery === g.which}>
                {savingGallery === g.which ? 'Saving…' : 'Save gallery'}
              </button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
};

export default AdminContentSection;
