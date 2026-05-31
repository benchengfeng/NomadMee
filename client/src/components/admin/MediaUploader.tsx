import React, { useRef, useState } from 'react';
import { uploadMedia } from '../../api/portalApi';

interface MediaUploaderProps {
  urls: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ urls, onAdd, onRemove }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const addUrl = () => {
    const url = urlInput.trim();
    if (url && !urls.includes(url)) { onAdd(url); setUrlInput(''); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadMedia(file);
      onAdd(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|mov|ogg)$/i.test(url);
  const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* URL input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste image / YouTube / video URL..."
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={addUrl} style={{ whiteSpace: 'nowrap' }}>+ URL</button>
      </div>

      {/* Upload from device */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            border: '1px dashed rgba(255,255,255,0.2)',
            borderRadius: 10,
            padding: '10px',
            background: 'rgba(255,255,255,0.04)',
            color: '#64748b',
            fontSize: '0.8rem',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.18s',
          }}
          onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#94a3b8'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#64748b'; }}
        >
          {uploading ? '⏳ Uploading...' : '📁 Upload from device (image or video)'}
        </button>
        {uploadError && <p style={{ color: '#f87171', fontSize: '0.75rem', margin: '4px 0 0' }}>{uploadError}</p>}
      </div>

      {/* Media list */}
      {urls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {urls.map((url) => {
            const icon = isYouTube(url) ? '▶️' : isVideo(url) ? '🎬' : isImage(url) ? '🖼️' : '🔗';
            return (
              <div key={url} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px' }}>
                {isImage(url)
                  ? <img src={url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  : <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                }
                <span style={{ flex: 1, fontSize: '0.73rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, padding: '0 4px' }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
