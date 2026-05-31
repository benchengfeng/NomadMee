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
  const icon = (url: string) => isYouTube(url) ? '▶️' : isVideo(url) ? '🎬' : isImage(url) ? '🖼️' : '🔗';

  return (
    <div className="media-uploader-wrap">
      {/* URL input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste image / YouTube / video URL..."
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
        />
        <button type="button" className="mu-add-btn" onClick={addUrl}>+ URL</button>
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
          className="mu-upload-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '⏳ Uploading...' : '📁 Upload from device (image or video)'}
        </button>
        {uploadError && (
          <p style={{ color: '#f87171', fontSize: '0.75rem', margin: '4px 0 0' }}>{uploadError}</p>
        )}
      </div>

      {/* Media list */}
      {urls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {urls.map((url) => (
            <div key={url} className="mu-item">
              {isImage(url)
                ? <img src={url} alt="" className="mu-thumb" />
                : <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon(url)}</span>
              }
              <span className="mu-item-label">{url}</span>
              <button type="button" className="mu-remove-btn" onClick={() => onRemove(url)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
