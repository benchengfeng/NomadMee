import React from 'react';
import type { SocialLink } from '../../api/portalApi';
import { SOCIAL_PLATFORMS, getPlatform } from '../common/socialPlatforms';

interface SocialLinksEditorProps {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

/**
 * Reusable admin tool for managing a list of social / external links.
 * Each link = platform + display label + URL. Drop it into any admin form.
 */
const SocialLinksEditor: React.FC<SocialLinksEditorProps> = ({ links, onChange }) => {
  const update = (i: number, patch: Partial<SocialLink>) =>
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const add = () => onChange([...links, { platform: 'instagram', label: '', url: '' }]);

  return (
    <div className="portal-multiselect" style={{ gap: 10 }}>
      {links.length === 0 && (
        <p className="relation-empty" style={{ margin: 0 }}>No links yet — add Instagram, TikTok, a website…</p>
      )}

      {links.map((link, i) => {
        const platform = getPlatform(link.platform);
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 150px 1fr auto',
              gap: 8,
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: 8,
            }}
          >
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8, fontSize: '1.05rem',
              background: `${platform.color}22`, color: platform.color, flexShrink: 0,
            }}>
              <platform.Icon />
            </span>

            <select value={link.platform} onChange={(e) => update(i, { platform: e.target.value })}>
              {SOCIAL_PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <input
                value={link.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder={`Link text (e.g. "see the journey here") — defaults to ${platform.label}`}
              />
              <input
                value={link.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder={platform.placeholder}
                autoComplete="off"
              />
            </div>

            <button type="button" className="portal-btn-delete" onClick={() => remove(i)} style={{ whiteSpace: 'nowrap', alignSelf: 'start' }}>✕</button>
          </div>
        );
      })}

      <button type="button" className="portal-btn-edit" onClick={add} style={{ width: 'fit-content' }}>+ Add link</button>
    </div>
  );
};

export default SocialLinksEditor;
