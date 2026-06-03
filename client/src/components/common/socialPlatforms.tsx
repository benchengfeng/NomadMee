import React from 'react';
import type { IconType } from 'react-icons';
import {
  FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaXTwitter,
  FaLinkedinIn, FaWhatsapp, FaTelegram, FaGlobe, FaEnvelope,
} from 'react-icons/fa6';
import type { SocialLink } from '../../api/portalApi';

export type SocialPlatform = {
  id: string;
  label: string;
  Icon: IconType;
  color: string;
  placeholder: string;
};

/** Single source of truth for supported social platforms (admin + landing). */
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', label: 'Instagram', Icon: FaInstagram,  color: '#E1306C', placeholder: 'instagram.com/yourhandle' },
  { id: 'facebook',  label: 'Facebook',  Icon: FaFacebookF,  color: '#1877F2', placeholder: 'facebook.com/yourpage' },
  { id: 'tiktok',    label: 'TikTok',    Icon: FaTiktok,     color: '#ff2d55', placeholder: 'tiktok.com/@yourhandle' },
  { id: 'youtube',   label: 'YouTube',   Icon: FaYoutube,    color: '#FF0000', placeholder: 'youtube.com/@yourchannel' },
  { id: 'twitter',   label: 'X',         Icon: FaXTwitter,   color: '#e7e9ea', placeholder: 'x.com/yourhandle' },
  { id: 'linkedin',  label: 'LinkedIn',  Icon: FaLinkedinIn, color: '#0A66C2', placeholder: 'linkedin.com/company/...' },
  { id: 'whatsapp',  label: 'WhatsApp',  Icon: FaWhatsapp,   color: '#25D366', placeholder: 'wa.me/21600000000' },
  { id: 'telegram',  label: 'Telegram',  Icon: FaTelegram,   color: '#229ED9', placeholder: 't.me/yourhandle' },
  { id: 'website',   label: 'Website',   Icon: FaGlobe,      color: '#94a3b8', placeholder: 'yoursite.com' },
  { id: 'email',     label: 'Email',     Icon: FaEnvelope,   color: '#94a3b8', placeholder: 'mailto:hello@nomadmee.com' },
];

export function getPlatform(id: string): SocialPlatform {
  return SOCIAL_PLATFORMS.find((p) => p.id === id)
    ?? SOCIAL_PLATFORMS.find((p) => p.id === 'website')!;
}

interface SocialLinksProps {
  links: SocialLink[];
  accent?: string;
  className?: string;
}

/** Presentational row of social link pills (used on the landing page). */
export const SocialLinks: React.FC<SocialLinksProps> = ({ links, accent, className }) => {
  const valid = (links || []).filter((l) => l.url);
  if (valid.length === 0) return null;

  return (
    <div className={`social-links${className ? ` ${className}` : ''}`}>
      {valid.map((l, i) => {
        const p = getPlatform(l.platform);
        return (
          <a
            key={`${l.platform}-${i}`}
            href={l.url}
            target="_blank"
            rel="noreferrer noopener"
            className="social-link"
            style={{ ['--sl-color' as string]: accent || p.color } as React.CSSProperties}
          >
            <span className="social-link-icon"><p.Icon /></span>
            <span className="social-link-label">{l.label || p.label}</span>
          </a>
        );
      })}
    </div>
  );
};
