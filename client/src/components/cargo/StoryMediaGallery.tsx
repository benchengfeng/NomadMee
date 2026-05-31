import React, { useState } from 'react';

interface StoryMediaGalleryProps {
  urls: string[];
  accentColor: string;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

type MediaType = 'image' | 'youtube' | 'video';

function detectType(url: string): MediaType {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (/\.(mp4|webm|mov|ogg)$/i.test(url)) return 'video';
  return 'image';
}

const StoryMediaGallery: React.FC<StoryMediaGalleryProps> = ({ urls, accentColor }) => {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!urls.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <style>{`
        @keyframes storyFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .story-media-item {
          animation: storyFadeUp 0.55s ease-out both;
        }
        .story-media-item:nth-child(1) { animation-delay: 0.05s; }
        .story-media-item:nth-child(2) { animation-delay: 0.15s; }
        .story-media-item:nth-child(3) { animation-delay: 0.25s; }
        .story-media-item:nth-child(4) { animation-delay: 0.35s; }
        .story-img-wrap:hover .story-img-overlay { opacity: 1; }
        .story-img-wrap:hover img { transform: scale(1.03); }
      `}</style>

      {urls.map((url, i) => {
        const type = detectType(url);
        const ytId = type === 'youtube' ? getYouTubeId(url) : null;

        return (
          <div
            key={url}
            className="story-media-item"
            style={{
              marginBottom: i < urls.length - 1 ? 32 : 0,
            }}
          >
            {type === 'image' && (
              <div
                className="story-img-wrap"
                onClick={() => setLightbox(url)}
                style={{
                  position: 'relative',
                  borderRadius: 18,
                  overflow: 'hidden',
                  cursor: 'zoom-in',
                  boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)`,
                }}
              >
                <img
                  src={url}
                  alt=""
                  style={{
                    width: '100%',
                    display: 'block',
                    maxHeight: 420,
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                  }}
                />
                {/* Bottom gradient */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                  pointerEvents: 'none',
                }} />
                {/* Hover overlay */}
                <div
                  className="story-img-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    opacity: 0,
                    transition: 'opacity 0.25s',
                    fontSize: '2rem',
                  }}
                >
                  🔍
                </div>
                {/* Accent corner glow */}
                <div style={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
              </div>
            )}

            {type === 'youtube' && ytId && (
              <div style={{
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px ${accentColor}22`,
                background: '#000',
                position: 'relative',
              }}>
                {/* Accent glow frame */}
                <div style={{
                  position: 'absolute',
                  inset: -1,
                  borderRadius: 19,
                  background: `linear-gradient(135deg, ${accentColor}44, transparent 60%)`,
                  pointerEvents: 'none',
                  zIndex: 1,
                }} />
                <iframe
                  title={`Story video ${i + 1}`}
                  src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                  style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block', position: 'relative', zIndex: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {type === 'video' && (
              <div style={{
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px ${accentColor}22`,
              }}>
                <video
                  src={url}
                  controls
                  style={{ width: '100%', display: 'block', maxHeight: 480, background: '#000' }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            cursor: 'zoom-out',
            animation: 'storyFadeUp 0.2s ease-out',
          }}
        >
          <img
            src={lightbox}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: 16,
              boxShadow: `0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1)`,
              objectFit: 'contain',
            }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              fontSize: '1.2rem',
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryMediaGallery;
