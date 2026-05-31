import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Cargo } from '../../api/portalApi';
import type { DashboardTheme } from '../../theme';
import { buildCargoRoute, getPositionAtProgress } from '../../utils/routeBuilder';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATAR_URLS: Record<string, string> = {
  popeye: '/assets/popeyesmall.png',
  olive: '/assets/olive1.jpeg',
  curto: '/assets/cortomaltese.png',
};

// Free dark vector tile style — no API key required
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const JOURNEY_DURATION_MS = 42000; // 42-second full-route animation

const SHIPPING_LABELS: Record<string, string> = {
  sea: '🚢 Sea freight',
  air: '✈️ Air freight',
  land: '🚛 Land freight',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CargoMapProps {
  cargo: Cargo;
  avatar?: string;
  theme: DashboardTheme;
}

const CargoMap: React.FC<CargoMapProps> = ({ cargo, avatar, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const rafRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const shippingType = cargo.shippingType ?? 'sea';

  const route = useMemo(
    () => buildCargoRoute(cargo.purchaseLocation, cargo.shippingDestination, shippingType),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cargo._id, shippingType]
  );

  // ------------------------------------------------------------------
  // Map initialisation (runs once)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: route[0],
        zoom: 2,
        attributionControl: false,
        fadeDuration: 0,
      });
    } catch {
      setMapError(true);
      return;
    }

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('error', () => setMapError(true));

    map.on('load', () => {
      // --- Route source ---
      map.addSource('cargo-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: route },
        },
      });

      // Ghost line (full path, faint)
      map.addLayer({
        id: 'route-ghost',
        type: 'line',
        source: 'cargo-route',
        paint: {
          'line-color': 'rgba(255,255,255,0.1)',
          'line-width': 2,
        },
      });

      // Dashed accent line
      map.addLayer({
        id: 'route-dashes',
        type: 'line',
        source: 'cargo-route',
        paint: {
          'line-color': theme.accent,
          'line-width': 2.5,
          'line-dasharray': [3, 5],
          'line-opacity': 0.8,
        },
      });

      // Origin marker
      const originEl = document.createElement('div');
      originEl.className = 'cargo-map-dot cargo-map-dot--origin';
      originEl.style.cssText = `
        width:12px;height:12px;border-radius:50%;
        background:${theme.accent};
        border:2px solid rgba(0,0,0,0.5);
        box-shadow:0 0 0 3px ${theme.accent}44;
      `;
      new maplibregl.Marker({ element: originEl, anchor: 'center' })
        .setLngLat(route[0] as [number, number])
        .setPopup(
          new maplibregl.Popup({ closeButton: false, className: 'cargo-popup' })
            .setText(`Origin: ${cargo.purchaseLocation}`)
        )
        .addTo(map);

      // Destination marker
      const destEl = document.createElement('div');
      destEl.className = 'cargo-map-dot cargo-map-dot--dest';
      destEl.style.cssText = `
        width:14px;height:14px;border-radius:50%;
        background:#ef4444;
        border:2px solid rgba(0,0,0,0.5);
        box-shadow:0 0 0 3px #ef444444;
      `;
      new maplibregl.Marker({ element: destEl, anchor: 'center' })
        .setLngLat(route[route.length - 1] as [number, number])
        .setPopup(
          new maplibregl.Popup({ closeButton: false, className: 'cargo-popup' })
            .setText(`Destination: ${cargo.shippingDestination}`)
        )
        .addTo(map);

      // Avatar marker
      const avatarEl = document.createElement('div');
      const avatarSrc = AVATAR_URLS[avatar ?? 'popeye'] ?? AVATAR_URLS['popeye']!;
      avatarEl.style.cssText = `
        width:38px;height:38px;border-radius:50%;
        background-image:url(${avatarSrc});
        background-size:cover;background-position:center;
        border:2.5px solid ${theme.accent};
        box-shadow:0 2px 12px rgba(0,0,0,0.7),0 0 0 2px rgba(0,0,0,0.3);
        cursor:pointer;
        transition:transform 0.15s;
      `;

      const marker = new maplibregl.Marker({ element: avatarEl, anchor: 'center' })
        .setLngLat(route[0] as [number, number])
        .addTo(map);

      markerRef.current = marker;

      // Fit bounds to full route
      const bounds = new maplibregl.LngLatBounds();
      route.forEach((c) => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 60, duration: 900, maxZoom: 8 });

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // React to cargo change — update route source + reset animation
  // ------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const source = map.getSource('cargo-route') as maplibregl.GeoJSONSource | undefined;
    source?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: route },
    });

    // Reset avatar to new origin
    markerRef.current?.setLngLat(route[0] as [number, number]);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setProgress(0);
    pausedAtRef.current = 0;

    const bounds = new maplibregl.LngLatBounds();
    route.forEach((c) => bounds.extend(c as [number, number]));
    map.fitBounds(bounds, { padding: 60, duration: 700, maxZoom: 8 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargo._id, mapReady]);

  // ------------------------------------------------------------------
  // Animation controls
  // ------------------------------------------------------------------
  const startJourney = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);

    // If at end, restart from beginning
    const startProgress = pausedAtRef.current >= 1 ? 0 : pausedAtRef.current;
    if (startProgress === 0) setProgress(0);

    const startTime = performance.now() - startProgress * JOURNEY_DURATION_MS;

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / JOURNEY_DURATION_MS, 1);
      const pos = getPositionAtProgress(route, t);
      markerRef.current?.setLngLat(pos as [number, number]);
      setProgress(t);
      pausedAtRef.current = t;

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [isPlaying, route]);

  const pauseJourney = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
  }, []);

  const resetJourney = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    markerRef.current?.setLngLat(route[0] as [number, number]);
    setIsPlaying(false);
    setProgress(0);
    pausedAtRef.current = 0;
  }, [route]);

  const jumpToCurrentLocation = useCallback(() => {
    const start = cargo.createdAt ? new Date(cargo.createdAt).getTime() : 0;
    const end = new Date(cargo.estimatedTimeOfArrival).getTime();
    const now = Date.now();
    const realProgress = start > 0 && end > start
      ? Math.max(0, Math.min(1, (now - start) / (end - start)))
      : 0;

    const pos = getPositionAtProgress(route, realProgress);

    // Stop any animation and jump avatar to real-world position
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setProgress(realProgress);
    pausedAtRef.current = realProgress;
    markerRef.current?.setLngLat(pos as [number, number]);

    // Fly the map to that position
    mapRef.current?.flyTo({
      center: pos as [number, number],
      zoom: 4,
      duration: 1200,
      essential: true,
    });
  }, [cargo.createdAt, cargo.estimatedTimeOfArrival, route]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const statusLabel = isPlaying
    ? 'Journey in progress...'
    : progress >= 1
    ? '✓ Arrived!'
    : 'Ready to depart';

  if (mapError) {
    return (
      <div className="cargo-map-error">
        <p>Map unavailable — check your connection.</p>
      </div>
    );
  }

  return (
    <div className="cargo-map-wrap">
      {/* Header bar */}
      <div className="cargo-map-header">
        <div className="cargo-map-header-left">
          <span className="cargo-map-route-text">
            {cargo.purchaseLocation} → {cargo.shippingDestination}
          </span>
          <span className="cargo-map-type-badge">
            {SHIPPING_LABELS[shippingType] ?? SHIPPING_LABELS['sea']}
          </span>
        </div>

        <div className="cargo-map-controls">
          {!isPlaying && (
            <button
              type="button"
              className="cargo-map-btn cargo-map-btn--play"
              style={{ background: theme.accent, color: theme.background }}
              onClick={startJourney}
            >
              {progress >= 1 ? '↺ Replay' : '▶ Play journey'}
            </button>
          )}
          {isPlaying && (
            <button
              type="button"
              className="cargo-map-btn cargo-map-btn--outline"
              style={{ borderColor: theme.accent, color: theme.accent }}
              onClick={pauseJourney}
            >
              ⏸ Pause
            </button>
          )}
          {mapReady && (
            <button
              type="button"
              className="cargo-map-btn cargo-map-btn--outline"
              style={{ borderColor: theme.accentSoft, color: theme.secondaryText }}
              onClick={jumpToCurrentLocation}
              title="Jump to estimated real-world position based on ETA"
            >
              📍 Current location
            </button>
          )}
          {progress > 0 && !isPlaying && (
            <button
              type="button"
              className="cargo-map-btn cargo-map-btn--outline"
              style={{ borderColor: theme.accentSoft, color: theme.secondaryText }}
              onClick={resetJourney}
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Map canvas */}
      <div ref={containerRef} className="cargo-map-canvas" />

      {/* Progress bar */}
      <div className="cargo-map-progress-track">
        <div
          className="cargo-map-progress-fill"
          style={{ width: `${progress * 100}%`, background: theme.accent }}
        />
      </div>

      {/* Footer */}
      <div className="cargo-map-footer">
        <span className="cargo-map-footer-origin">{cargo.purchaseLocation}</span>
        <span
          className="cargo-map-footer-status"
          style={{ color: isPlaying ? theme.accent : theme.secondaryText }}
        >
          {statusLabel}
        </span>
        <span className="cargo-map-footer-dest">{cargo.shippingDestination}</span>
      </div>
    </div>
  );
};

export default CargoMap;
