import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Partner } from '../../api/portalApi';

interface PartnersShowcaseProps {
  partners: Partner[];
  accent: string;
  title?: string;
}

/**
 * Partner logos wall. Each card shows just the logo + name; if there's a story
 * to tell (title/description), clicking flips the card to reveal it. Cards with
 * no story stay static (no misleading flip affordance).
 */
const PartnersShowcase: React.FC<PartnersShowcaseProps> = ({ partners, accent, title }) => {
  const list = (partners || []).filter((p) => p.name || p.logoUrl);
  if (list.length === 0) return null;

  return (
    <div className="partners-showcase">
      {title && <h3 className="partners-heading">{title}</h3>}
      <div className="partners-grid">
        {list.map((p, i) => (
          <PartnerCard key={p._id} partner={p} accent={accent} index={i} />
        ))}
      </div>
    </div>
  );
};

const PartnerCard: React.FC<{ partner: Partner; accent: string; index: number }> = ({ partner, accent, index }) => {
  const { t } = useTranslation('landing');
  const [flipped, setFlipped] = useState(false);
  const hasStory = Boolean(partner.title?.trim() || partner.description?.trim());

  const toggle = () => { if (hasStory) setFlipped((f) => !f); };

  return (
    <div
      className={`partner-card${hasStory ? ' partner-card--interactive' : ''}${flipped ? ' partner-card--flipped' : ''}`}
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms`, ['--p-accent' as string]: accent } as React.CSSProperties}
      onClick={toggle}
      role={hasStory ? 'button' : undefined}
      tabIndex={hasStory ? 0 : undefined}
      aria-label={hasStory ? `${partner.name} — tap to learn more` : partner.name}
      onKeyDown={(e) => { if (hasStory && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(); } }}
    >
      <div className="partner-card-inner">
        {/* Front — logo + name */}
        <div className="partner-face partner-face--front">
          <div className="partner-logo-wrap">
            {partner.logoUrl
              ? <img src={partner.logoUrl} alt={partner.name} loading="lazy" />
              : <span className="partner-logo-fallback">{partner.name.charAt(0)}</span>}
          </div>
          <span className="partner-name">{partner.name}</span>
          {hasStory && <span className="partner-hint">{t('partners.tapToLearn')}</span>}
        </div>

        {/* Back — the story */}
        {hasStory && (
          <div className="partner-face partner-face--back">
            {partner.title && <span className="partner-back-title">{partner.title}</span>}
            <strong className="partner-back-name">{partner.name}</strong>
            {partner.description && <p className="partner-back-desc">{partner.description}</p>}
            <span className="partner-hint partner-hint--back">{t('partners.tapToFlip')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnersShowcase;
