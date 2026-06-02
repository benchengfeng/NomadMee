import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPublicMapData, PublicMapCargo, PublicMapInvestor, PublicMapInvestment, PublicMapData } from '../api/portalApi';
import { buildCargoRoute, getPositionAtProgress } from '../utils/routeBuilder';
import { findCountryCoords } from '../utils/countries';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';


const CARGO_COLORS: Record<string, string> = {
  sea: '#38bdf8',
  air: '#a78bfa',
  land: '#fb923c',
};

function cargoProgress(cargo: PublicMapCargo): number {
  const start = new Date(cargo.purchaseDate || cargo.createdAt).getTime();
  const end = new Date(cargo.estimatedTimeOfArrival).getTime();
  const now = Date.now();
  if (end <= start) return 1;
  return Math.max(0, Math.min(1, (now - start) / (end - start)));
}

interface WorldMapProps {
  accentColor?: string;
  onDataLoaded?: (data: PublicMapData) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ accentColor = '#38bdf8', onDataLoaded }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [investorCount, setInvestorCount] = useState(0);
  const [cargoCount, setCargoCount] = useState(0);
  const [investmentCount, setInvestmentCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [20, 15],
        zoom: 1.6,
        attributionControl: false,
        fadeDuration: 300,
        minZoom: 1,
        maxZoom: 12,
      });
    } catch {
      setMapError(true);
      return;
    }

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('error', () => setMapError(true));

    map.on('load', async () => {
      let investors: PublicMapInvestor[] = [];
      let cargos: PublicMapCargo[] = [];
      let investments: PublicMapInvestment[] = [];

      try {
        const data = await getPublicMapData();
        investors = data.investors;
        cargos = data.cargos;
        investments = data.investments ?? [];
        onDataLoaded?.(data);
      } catch {
        // Map still shows even if data fetch fails
      }
      setDataLoaded(true);

      // ---- Investor markers ----
      // Group investors by country so we can deterministically fan out
      // those sharing the same location instead of randomly jittering them.
      const investorsByLocation = new Map<string, number>();

      let visibleInvestors = 0;
      for (const inv of investors) {
        const coords = findCountryCoords(inv.location);
        if (!coords) continue;
        visibleInvestors++;

        // Stable index of this investor within its country (0, 1, 2, …)
        const locKey = inv.location.trim().toLowerCase();
        const indexInCountry = investorsByLocation.get(locKey) ?? 0;
        investorsByLocation.set(locKey, indexInCountry + 1);

        // Deterministic position: the first investor sits exactly on the
        // country coordinate; additional ones fan out in a small fixed circle.
        let position: [number, number] = [coords[0], coords[1]];
        if (indexInCountry > 0) {
          const ring = Math.floor((indexInCountry - 1) / 8) + 1; // 8 per ring
          const slot = (indexInCountry - 1) % 8;
          const angle = (slot / 8) * Math.PI * 2;
          const radius = 0.45 * ring; // ~0.45° per ring — tight cluster near country
          position = [
            coords[0] + Math.cos(angle) * radius,
            coords[1] + Math.sin(angle) * radius,
          ];
        }

        // Wrapper — MapLibre owns this element's position/transform.
        // Do NOT set position here: MapLibre's .maplibregl-marker class sets
        // position:absolute, and overriding it breaks marker placement.
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          width:36px;height:36px;
          cursor:pointer;
        `;

        // Inner avatar — we apply hover scale here, NOT on wrapper
        const inner = document.createElement('div');
        const src = inv.avatarImageUrl || '/logo192.png';
        inner.style.cssText = `
          width:36px;height:36px;border-radius:50%;
          background-image:url(${src});
          background-size:cover;background-position:center;
          border:2.5px solid ${accentColor};
          box-shadow:0 0 0 3px ${accentColor}44,0 4px 14px rgba(0,0,0,0.8);
          transition:transform 0.15s, box-shadow 0.15s;
        `;
        wrapper.appendChild(inner);

        // Tooltip div — shown on hover
        const investCount = inv.investmentCount ?? 0;
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position:absolute;
          bottom:calc(100% + 10px);
          left:50%;
          transform:translateX(-50%);
          background:rgba(10,12,20,0.96);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:12px;
          padding:10px 14px;
          white-space:nowrap;
          pointer-events:none;
          opacity:0;
          transition:opacity 0.18s;
          box-shadow:0 8px 24px rgba(0,0,0,0.7);
          z-index:100;
        `;
        tooltip.innerHTML = `
          <div style="font-weight:800;color:#f1f5f9;font-size:0.82rem;margin-bottom:3px;">${inv.name}</div>
          <div style="color:#64748b;font-size:0.72rem;margin-bottom:6px;">📍 ${inv.location}</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="color:#94a3b8;font-size:0.7rem;">💼 ${investCount} investment${investCount !== 1 ? 's' : ''}</span>
            <span style="display:flex;align-items:center;gap:4px;font-size:0.7rem;">
              <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 4px #22c55e;"></span>
              <span style="color:#22c55e;font-weight:700;">Active</span>
            </span>
          </div>
        `;
        wrapper.appendChild(tooltip);

        wrapper.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.18)';
          inner.style.boxShadow = `0 0 0 4px ${accentColor}66, 0 6px 18px rgba(0,0,0,0.9)`;
          tooltip.style.opacity = '1';
        });
        wrapper.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
          inner.style.boxShadow = `0 0 0 3px ${accentColor}44, 0 4px 14px rgba(0,0,0,0.8)`;
          tooltip.style.opacity = '0';
        });

        new maplibregl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat(position)
          .addTo(map);
      }
      setInvestorCount(visibleInvestors);

      // ---- Cargo markers ----
      let visibleCargos = 0;
      for (const cargo of cargos) {
        const shippingType = cargo.shippingType ?? 'sea';
        const route = buildCargoRoute(cargo.purchaseLocation, cargo.shippingDestination, shippingType);
        const progress = cargoProgress(cargo);
        const pos = getPositionAtProgress(route, progress);
        const color = CARGO_COLORS[shippingType] ?? CARGO_COLORS['sea']!;
        const arrived = progress >= 1;

        visibleCargos++;

        // Cargo icon marker (ship / plane / truck).
        // ROOT element is owned entirely by MapLibre (position + transform).
        // All visuals + hover scaling live on an INNER element so we never
        // overwrite MapLibre's positioning transform.
        const emojiIcon = shippingType === 'air' ? '✈️' : shippingType === 'land' ? '🚛' : '🚢';
        const pulseEl = document.createElement('div');
        pulseEl.style.cssText = `width:32px;height:32px;cursor:pointer;`;
        const cargoInner = document.createElement('div');
        cargoInner.style.cssText = `
          width:32px;height:32px;border-radius:50%;
          background:rgba(8,10,18,0.88);
          border:2px solid ${color};
          display:flex;align-items:center;justify-content:center;
          font-size:15px;line-height:1;
          box-shadow:0 0 10px ${color}55, 0 3px 10px rgba(0,0,0,0.75);
          transition:transform 0.15s, box-shadow 0.15s;
        `;
        cargoInner.textContent = emojiIcon;
        pulseEl.appendChild(cargoInner);

        const icon = shippingType === 'air' ? '✈' : shippingType === 'land' ? '🚛' : '🚢';
        const eta = new Date(cargo.estimatedTimeOfArrival).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const statusText = arrived
          ? 'Arrived'
          : `${Math.round(progress * 100)}% — ETA ${eta}`;

        const popup = new maplibregl.Popup({
          closeButton: false,
          offset: 14,
          className: 'world-map-popup',
        }).setHTML(
          `<strong>${icon} ${cargo.productBeingShipped}</strong><br/>` +
          `<span>${cargo.purchaseLocation} → ${cargo.shippingDestination}</span><br/>` +
          `<span style="color:${color}">${statusText}</span>`
        );

        pulseEl.addEventListener('mouseenter', () => { cargoInner.style.transform = 'scale(1.2)'; cargoInner.style.boxShadow = `0 0 16px ${color}88, 0 4px 14px rgba(0,0,0,0.9)`; });
        pulseEl.addEventListener('mouseleave', () => { cargoInner.style.transform = 'scale(1)'; cargoInner.style.boxShadow = `0 0 10px ${color}55, 0 3px 10px rgba(0,0,0,0.75)`; });

        new maplibregl.Marker({ element: pulseEl, anchor: 'center' })
          .setLngLat(pos as [number, number])
          .setPopup(popup)
          .addTo(map);
      }
      setCargoCount(visibleCargos);

      // ---- Investment markers ----
      let visibleInvestments = 0;
      for (const inv of investments) {
        if (!inv.location) continue;
        const coords = findCountryCoords(inv.location);
        if (!coords) continue;
        visibleInvestments++;

        const invColor = '#38bdf8';

        // Pulsing dot — same visual style as cargo was before.
        // No position:relative — MapLibre's .maplibregl-marker sets
        // position:absolute, which also serves as the ring's containing block.
        const invEl = document.createElement('div');
        invEl.style.cssText = `
          width:22px;height:22px;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
        `;

        const invRing = document.createElement('div');
        invRing.style.cssText = `
          position:absolute;width:22px;height:22px;border-radius:50%;
          border:2px solid ${invColor};
          animation:worldMapPulse 2.2s ease-out infinite;
          opacity:0.55;
        `;

        const invDot = document.createElement('div');
        invDot.style.cssText = `
          width:10px;height:10px;border-radius:50%;
          background:${invColor};
          box-shadow:0 0 8px ${invColor}99;
        `;

        invEl.appendChild(invRing);
        invEl.appendChild(invDot);

        const eta = inv.status.replace('_', ' ');
        const invPopup = new maplibregl.Popup({
          closeButton: false,
          offset: 14,
          className: 'world-map-popup',
        }).setHTML(
          `<strong>💼 ${inv.title}</strong><br/>` +
          `<span>📍 ${inv.location}</span><br/>` +
          `<span style="color:${invColor}">` +
          `${inv.cargoCount} cargo${inv.cargoCount !== 1 ? 's' : ''} · ${inv.investorCount} investor${inv.investorCount !== 1 ? 's' : ''} · ${eta}` +
          `</span>`
        );

        new maplibregl.Marker({ element: invEl, anchor: 'center' })
          .setLngLat(coords as [number, number])
          .setPopup(invPopup)
          .addTo(map);
      }
      setInvestmentCount(visibleInvestments);
    });

    map.once('idle', () => setMapReady(true));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mapError) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.9rem' }}>
        Map unavailable — check your connection.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      {/* Pulse keyframe injected once */}
      <style>{`
        @keyframes worldMapPulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes globeSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .world-map-popup .maplibregl-popup-content {
          background: rgba(15,18,28,0.96);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #e2e8f0;
          font-size: 0.8rem;
          line-height: 1.5;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        }
        .world-map-popup .maplibregl-popup-content strong { color: #fff; display: block; margin-bottom: 2px; }
        .world-map-popup .maplibregl-popup-tip { border-top-color: rgba(15,18,28,0.96) !important; }
        .maplibregl-ctrl-bottom-right { bottom: 28px !important; right: 10px !important; }
      `}</style>
      {/* Map canvas — fades in once tiles are ready */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, opacity: mapReady ? 1 : 0, transition: 'opacity 0.7s ease' }} />
      {/* Loading / empty overlay */}
      {!mapReady && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0c14', gap: 16, zIndex: 1,
        }}>
          <img
            src="/logo192.png"
            alt=""
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', opacity: 0.7 }}
          />
          <p style={{ color: '#475569', fontSize: '0.82rem', margin: 0 }}>Loading investor map…</p>
        </div>
      )}
      {/* Empty state — after load, no investors */}
      {mapReady && dataLoaded && investorCount === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', gap: 10,
        }}>
          <img
            src="/logo192.png"
            alt=""
            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', opacity: 0.35 }}
          />
          <p style={{ color: '#334155', fontSize: '0.78rem', margin: 0 }}>No investors on the map yet</p>
        </div>
      )}
      {/* Stats overlay */}
      {(investorCount > 0 || cargoCount > 0 || investmentCount > 0) && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          display: 'flex',
          gap: 8,
          pointerEvents: 'none',
        }}>
          {investorCount > 0 && (
            <span style={{
              background: 'rgba(15,18,28,0.88)',
              border: `1px solid ${accentColor}44`,
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: '0.72rem',
              color: accentColor,
              fontWeight: 700,
            }}>
              {investorCount} investor{investorCount !== 1 ? 's' : ''} live
            </span>
          )}
          {cargoCount > 0 && (
            <span style={{
              background: 'rgba(15,18,28,0.88)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: '0.72rem',
              color: '#94a3b8',
              fontWeight: 600,
            }}>
              {cargoCount} cargo{cargoCount !== 1 ? 's' : ''} in transit
            </span>
          )}
          {investmentCount > 0 && (
            <span style={{
              background: 'rgba(15,18,28,0.88)',
              border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: '0.72rem',
              color: '#fbbf24',
              fontWeight: 600,
            }}>
              {investmentCount} investment{investmentCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default WorldMap;
