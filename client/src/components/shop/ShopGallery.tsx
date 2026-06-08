import React, { useRef, useState } from 'react';
import { track } from '../../utils/analytics';

type MediaKind = 'image' | 'video' | 'youtube';

function youTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function mediaKind(url: string): MediaKind {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (/\.(mp4|webm|mov|ogg)$/i.test(url)) return 'video';
  return 'image';
}

interface ShopGalleryProps {
  urls: string[];
  label?: string;
}

/**
 * A smooth horizontal "showcase reel" for a shop section. Photos zoom on hover,
 * video clips autoplay muted & looping (alive, no sound), and anything opens in
 * a focused lightbox. Themed via the surrounding `--shop-accent`.
 */
const ShopGallery: React.FC<ShopGalleryProps> = ({ urls, label }) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const lastScrollFire = useRef(0);

  const media = (urls || []).filter(Boolean);
  if (media.length === 0) return null;

  const galleryLabel = label ?? 'Showcase';

  const scrollBy = (dir: 1 | -1) => {
    const el = stripRef.current;
    if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 600), behavior: 'smooth' });
    track('gallery-scroll', { direction: dir === 1 ? 'right' : 'left', method: 'arrow', gallery: galleryLabel });
  };

  const handleStripScroll = () => {
    const now = Date.now();
    if (now - lastScrollFire.current > 1200) {
      lastScrollFire.current = now;
      track('gallery-scroll', { method: 'drag', gallery: galleryLabel });
    }
  };

  const openLightbox = (url: string, kind: MediaKind, index: number) => {
    setLightbox(url);
    track('gallery-item-open', { kind, index, gallery: galleryLabel });
  };

  return (
    <div className="shop-gallery">
      <div className="shop-gallery-head">
        <span className="shop-gallery-kicker">✦ {label ?? 'Showcase'}</span>
        {media.length > 2 && (
          <div className="shop-gallery-nav">
            <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)}>‹</button>
            <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)}>›</button>
          </div>
        )}
      </div>

      <div className="shop-gallery-strip" ref={stripRef} onScroll={handleStripScroll}>
        {media.map((url, i) => {
          const kind = mediaKind(url);
          const yt = kind === 'youtube' ? youTubeId(url) : null;
          const thumb = yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : url;

          return (
            <button
              key={url + i}
              type="button"
              className="shop-gallery-tile"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              onClick={() => openLightbox(url, kind, i)}
            >
              {kind === 'video' ? (
                <video src={url} muted loop autoPlay playsInline preload="metadata" />
              ) : (
                <img src={thumb} alt="" loading="lazy" />
              )}
              {(kind === 'video' || kind === 'youtube') && (
                <span className="shop-gallery-play" aria-hidden="true">▶</span>
              )}
              <span className="shop-gallery-tile-glow" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {lightbox && (
        <div className="shop-gallery-lightbox" onClick={() => setLightbox(null)}>
          <button type="button" className="shop-gallery-close" aria-label="Close" onClick={() => setLightbox(null)}>✕</button>
          <div className="shop-gallery-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const kind = mediaKind(lightbox);
              const yt = kind === 'youtube' ? youTubeId(lightbox) : null;
              if (kind === 'youtube' && yt) {
                return (
                  <iframe
                    title="Showcase video"
                    src={`https://www.youtube.com/embed/${yt}?rel=0&autoplay=1&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              }
              if (kind === 'video') {
                return <video src={lightbox} controls autoPlay playsInline />;
              }
              return <img src={lightbox} alt="" />;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopGallery;
