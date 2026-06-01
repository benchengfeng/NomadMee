import React, { useCallback, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { uploadMedia } from '../../api/portalApi';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92));
}

interface ImageCropUploaderProps {
  value: string;
  onChange: (url: string) => void;
  aspect?: number;
  label?: string;
  cropShape?: 'rect' | 'round';
  previewHeight?: number;
}

const ImageCropUploader: React.FC<ImageCropUploaderProps> = ({
  value,
  onChange,
  aspect = 16 / 9,
  label = 'Cover image',
  cropShape = 'rect',
  previewHeight = 110,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedPixels(pixels);
  }, []);

  const applyAndUpload = async () => {
    if (!rawSrc || !croppedPixels) return;
    setUploading(true);
    setError('');
    try {
      const blob = await getCroppedBlob(rawSrc, croppedPixels);
      const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
      const url = await uploadMedia(file);
      onChange(url);
      setRawSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>

      {/* Current image preview */}
      {value && !rawSrc && (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#0a0c14' }}>
          <img src={value} alt="Cover" style={{ width: '100%', height: previewHeight, objectFit: 'cover', display: 'block' }} />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
          >
            🔄 Replace
          </button>
        </div>
      )}

      {/* Crop UI */}
      {rawSrc ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ position: 'relative', height: 220, borderRadius: 10, overflow: 'hidden', background: '#000' }}>
            <Cropper
              image={rawSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#64748b', fontSize: '0.72rem', flexShrink: 0 }}>Zoom</span>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled={uploading}
              onClick={applyAndUpload}
              style={{ flex: 1, padding: '9px', borderRadius: 9, background: '#38bdf8', border: 'none', color: '#000', fontWeight: 700, cursor: uploading ? 'wait' : 'pointer', fontSize: '0.82rem' }}
            >
              {uploading ? '⏳ Uploading…' : '✓ Apply & upload'}
            </button>
            <button
              type="button"
              onClick={() => { setRawSrc(null); setError(''); }}
              style={{ padding: '9px 14px', borderRadius: 9, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              Cancel
            </button>
          </div>
          {error && <p style={{ margin: 0, color: '#f87171', fontSize: '0.75rem' }}>{error}</p>}
        </div>
      ) : (
        !value && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setRawSrc(URL.createObjectURL(f));
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ padding: '10px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', textAlign: 'center' }}
            >
              📁 Upload {label.toLowerCase()}
            </button>
          </>
        )
      )}

      {/* Hidden file input for replace action */}
      {value && !rawSrc && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setRawSrc(URL.createObjectURL(f));
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          }}
        />
      )}
    </div>
  );
};

export default ImageCropUploader;
