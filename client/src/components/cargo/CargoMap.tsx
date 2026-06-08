import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Cargo } from '../../api/portalApi';
import type { DashboardTheme } from '../../theme';
import { buildCargoRoute, getPositionAtProgress } from '../../utils/routeBuilder';

// Matches WorldMap.tsx CARGO_COLORS exactly
const CARGO_COLORS: Record<string, string> = {
  sea:  '#38bdf8',
  air:  '#a78bfa',
  land: '#fb923c',
};

const SHIPPING_LABELS: Record<string, string> = {
  sea:  '🚢 Sea freight',
  air:  '✈️ Air freight',
  land: '🚛 Land freight',
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const JOURNEY_DURATION_MS = 42000;

function cargoRealProgress(cargo: Cargo): number {
  const startSrc = cargo.purchaseDate || cargo.createdAt;
  const start = startSrc ? new Date(startSrc).getTime() : 0;
  const end   = new Date(cargo.estimatedTimeOfArrival).getTime();
  const now   = Date.now();
  if (!(start > 0) || !(end > start)) return 0;
  return Math.max(0, Math.min(1, (now - start) / (end - start)));
}

// Makes a globe-style cargo marker element — same look as WorldMap.tsx
function makeCargoMarkerEl(shippingType: string, arrived: boolean, selected: boolean): HTMLDivElement {
  const color   = CARGO_COLORS[shippingType] ?? CARGO_COLORS['sea']!;
  const emoji   = shippingType === 'air' ? '✈️' : shippingType === 'land' ? '🚛' : '🚢';
  const size    = selected ? 38 : 30;
  const border  = selected ? 2.5 : 1.5;
  const fontSize = selected ? 17 : 13;

  const wrap = document.createElement('div');
  wrap.style.cssText = `width:${size}px;height:${size}px;cursor:pointer;position:relative;`;

  const inner = document.createElement('div');
  inner.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    background:rgba(8,10,18,0.88);
    border:${border}px solid ${color};
    display:flex;align-items:center;justify-content:center;
    font-size:${fontSize}px;line-height:1;
    box-shadow:0 0 ${selected ? 14 : 8}px ${color}${selected ? '88' : '44'},0 3px 10px rgba(0,0,0,0.75);
    transition:transform 0.15s,box-shadow 0.15s;
  `;
  inner.textContent = emoji;
  wrap.appendChild(inner);

  if (!arrived) {
    const ring = document.createElement('div');
    ring.style.cssText = `
      position:absolute;top:-4px;left:-4px;
      width:${size + 8}px;height:${size + 8}px;
      border-radius:50%;border:2px solid ${color};
      animation:worldMapPulse 2.8s ease-out infinite;opacity:0.4;
      pointer-events:none;
    `;
    wrap.appendChild(ring);
  }

  return wrap;
}

// ---------------------------------------------------------------------------

interface CargoMapProps {
  cargos: Cargo[];
  selectedCargoId: string;
  onSelectCargo: (id: string) => void;
  theme: DashboardTheme;
}

const CargoMap: React.FC<CargoMapProps> = ({ cargos, selectedCargoId, onSelectCargo, theme }) => {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<maplibregl.Map | null>(null);
  const markersRef    = useRef<Map<string, maplibregl.Marker>>(new Map());
  const rafRef        = useRef<number | null>(null);
  const pausedAtRef   = useRef<number>(0);

  const [isPlaying, setIsPlaying]   = useState(false);
  const [progress,  setProgress]    = useState(0);
  const [mapReady,  setMapReady]    = useState(false);
  const [mapError,  setMapError]    = useState(false);

  const selectedCargo = useMemo(
    () => cargos.find((c) => c._id === selectedCargoId) ?? cargos[0] ?? null,
    [cargos, selectedCargoId],
  );

  const shippingType = selectedCargo?.shippingType ?? 'sea';
  const accentColor  = CARGO_COLORS[shippingType] ?? theme.accent;

  const selectedRoute = useMemo(
    () => selectedCargo
      ? buildCargoRoute(selectedCargo.purchaseLocation, selectedCargo.shippingDestination, selectedCargo.shippingType ?? 'sea')
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCargo?._id, shippingType],
  );

  const computeRealProgress = useCallback((): number => {
    if (!selectedCargo) return 0;
    return cargoRealProgress(selectedCargo);
  }, [selectedCargo]);

  // ------------------------------------------------------------------
  // Map init — run once
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !selectedRoute) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: selectedRoute[0],
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
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Sync all cargo routes + markers when map is ready or cargos change
  // ------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Remove markers for cargos that no longer exist
    for (const [id, marker] of markersRef.current) {
      if (!cargos.find((c) => c._id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    // Add/update a route layer + cargo marker for every cargo
    for (const cargo of cargos) {
      const isSelected = cargo._id === selectedCargoId;
      const type       = cargo.shippingType ?? 'sea';
      const color      = CARGO_COLORS[type] ?? CARGO_COLORS['sea']!;
      const route      = buildCargoRoute(cargo.purchaseLocation, cargo.shippingDestination, type);
      const prog       = cargoRealProgress(cargo);
      const pos        = getPositionAtProgress(route, prog);
      const arrived    = prog >= 1;

      // Route layers
      const ghostId   = `route-ghost-${cargo._id}`;
      const dashId    = `route-dash-${cargo._id}`;
      const sourceId  = `route-${cargo._id}`;

      const routeGeoJSON = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: route },
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(routeGeoJSON);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: routeGeoJSON });
        map.addLayer({
          id: ghostId, type: 'line', source: sourceId,
          paint: { 'line-color': isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', 'line-width': isSelected ? 2 : 1 },
        });
        map.addLayer({
          id: dashId, type: 'line', source: sourceId,
          paint: {
            'line-color': color,
            'line-width': isSelected ? 2.5 : 1.2,
            'line-dasharray': [3, 5],
            'line-opacity': isSelected ? 0.85 : 0.35,
          },
        });
      }

      // Update line style when selection changes
      if (map.getLayer(ghostId)) {
        map.setPaintProperty(ghostId, 'line-opacity', isSelected ? 1 : 0.4);
        map.setPaintProperty(ghostId, 'line-width', isSelected ? 2 : 1);
      }
      if (map.getLayer(dashId)) {
        map.setPaintProperty(dashId, 'line-width', isSelected ? 2.5 : 1.2);
        map.setPaintProperty(dashId, 'line-opacity', isSelected ? 0.85 : 0.35);
      }

      // Cargo marker
      const existing = markersRef.current.get(cargo._id);
      if (existing) {
        existing.remove();
      }

      const el = makeCargoMarkerEl(type, arrived, isSelected);

      // Hover effects
      const inner = el.firstChild as HTMLDivElement;
      el.addEventListener('mouseenter', () => {
        inner.style.transform = 'scale(1.18)';
        inner.style.boxShadow = `0 0 18px ${color}99,0 4px 14px rgba(0,0,0,0.9)`;
      });
      el.addEventListener('mouseleave', () => {
        inner.style.transform = 'scale(1)';
        inner.style.boxShadow = `0 0 ${isSelected ? 14 : 8}px ${color}${isSelected ? '88' : '44'},0 3px 10px rgba(0,0,0,0.75)`;
      });
      el.addEventListener('click', () => onSelectCargo(cargo._id));

      const eta = new Date(cargo.estimatedTimeOfArrival).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const popup = new maplibregl.Popup({ closeButton: false, offset: 18, className: 'world-map-popup' })
        .setHTML(
          `<strong>${cargo.productBeingShipped}</strong>` +
          `<br/><span style="color:#94a3b8">${cargo.purchaseLocation} → ${cargo.shippingDestination}</span>` +
          `<br/><span style="color:${color}">${arrived ? '✓ Arrived' : `${Math.round(prog * 100)}% · ETA ${eta}`}</span>`
        );

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(pos as [number, number])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.set(cargo._id, marker);
    }

    // Origin + destination dots for selected cargo
    ['origin-dot', 'dest-dot'].forEach((id) => {
      const existing = markersRef.current.get(id);
      if (existing) { existing.remove(); markersRef.current.delete(id); }
    });

    if (selectedRoute && selectedCargo) {
      const originEl = document.createElement('div');
      originEl.style.cssText = `
        width:11px;height:11px;border-radius:50%;
        background:${accentColor};border:2px solid rgba(0,0,0,0.5);
        box-shadow:0 0 0 3px ${accentColor}44;
      `;
      const originMarker = new maplibregl.Marker({ element: originEl, anchor: 'center' })
        .setLngLat(selectedRoute[0] as [number, number])
        .setPopup(new maplibregl.Popup({ closeButton: false, className: 'cargo-popup' }).setText(`Origin: ${selectedCargo.purchaseLocation}`))
        .addTo(map);
      markersRef.current.set('origin-dot', originMarker);

      const destEl = document.createElement('div');
      destEl.style.cssText = `
        width:13px;height:13px;border-radius:50%;
        background:#ef4444;border:2px solid rgba(0,0,0,0.5);
        box-shadow:0 0 0 3px #ef444444;
      `;
      const destMarker = new maplibregl.Marker({ element: destEl, anchor: 'center' })
        .setLngLat(selectedRoute[selectedRoute.length - 1] as [number, number])
        .setPopup(new maplibregl.Popup({ closeButton: false, className: 'cargo-popup' }).setText(`Destination: ${selectedCargo.shippingDestination}`))
        .addTo(map);
      markersRef.current.set('dest-dot', destMarker);
    }

    // Fit to selected route
    if (selectedRoute) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setIsPlaying(false);
      const realProg = computeRealProgress();
      setProgress(realProg);
      pausedAtRef.current = realProg;

      const bounds = new maplibregl.LngLatBounds();
      selectedRoute.forEach((c) => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 60, duration: 700, maxZoom: 8 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargos, selectedCargoId, mapReady]);

  // ------------------------------------------------------------------
  // Animation controls (animate the selected cargo marker)
  // ------------------------------------------------------------------
  const startJourney = useCallback(() => {
    if (isPlaying || !selectedRoute) return;
    setIsPlaying(true);

    const startProgress = pausedAtRef.current >= 1 ? 0 : pausedAtRef.current;
    if (startProgress === 0) setProgress(0);

    const startTime = performance.now() - startProgress * JOURNEY_DURATION_MS;

    const tick = (now: number) => {
      const t   = Math.min((now - startTime) / JOURNEY_DURATION_MS, 1);
      const pos = getPositionAtProgress(selectedRoute, t);
      markersRef.current.get(selectedCargoId)?.setLngLat(pos as [number, number]);
      setProgress(t);
      pausedAtRef.current = t;

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [isPlaying, selectedRoute, selectedCargoId]);

  const pauseJourney = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
  }, []);

  const resetJourney = useCallback(() => {
    if (!selectedRoute) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    markersRef.current.get(selectedCargoId)?.setLngLat(selectedRoute[0] as [number, number]);
    setIsPlaying(false);
    setProgress(0);
    pausedAtRef.current = 0;
  }, [selectedRoute, selectedCargoId]);

  const jumpToCurrentLocation = useCallback(() => {
    if (!selectedRoute) return;
    const realProg = computeRealProgress();
    const pos      = getPositionAtProgress(selectedRoute, realProg);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setProgress(realProg);
    pausedAtRef.current = realProg;
    markersRef.current.get(selectedCargoId)?.setLngLat(pos as [number, number]);

    mapRef.current?.flyTo({ center: pos as [number, number], zoom: 4, duration: 1200, essential: true });
  }, [computeRealProgress, selectedRoute, selectedCargoId]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (mapError) {
    return (
      <div className="cargo-map-error">
        <p>Map unavailable — check your connection.</p>
      </div>
    );
  }

  if (!selectedCargo) return null;

  const statusLabel = isPlaying
    ? 'Journey in progress...'
    : progress >= 1
    ? '✓ Arrived!'
    : 'Ready to depart';

  return (
    <div className="cargo-map-wrap">
      <div className="cargo-map-header">
        <div className="cargo-map-header-left">
          <span className="cargo-map-route-text">
            {selectedCargo.purchaseLocation} → {selectedCargo.shippingDestination}
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
              style={{ background: accentColor, color: theme.background }}
              onClick={startJourney}
            >
              {progress >= 1 ? '↺ Replay' : '▶ Play journey'}
            </button>
          )}
          {isPlaying && (
            <button
              type="button"
              className="cargo-map-btn cargo-map-btn--outline"
              style={{ borderColor: accentColor, color: accentColor }}
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

      <div ref={containerRef} className="cargo-map-canvas" />

      <div className="cargo-map-progress-track">
        <div
          className="cargo-map-progress-fill"
          style={{ width: `${progress * 100}%`, background: accentColor }}
        />
      </div>

      <div className="cargo-map-footer">
        <span className="cargo-map-footer-origin">{selectedCargo.purchaseLocation}</span>
        <span
          className="cargo-map-footer-status"
          style={{ color: isPlaying ? accentColor : theme.secondaryText }}
        >
          {statusLabel}
        </span>
        <span className="cargo-map-footer-dest">{selectedCargo.shippingDestination}</span>
      </div>
    </div>
  );
};

export default CargoMap;
