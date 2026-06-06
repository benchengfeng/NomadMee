import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPublicMapData, PublicMapCargo, PublicMapInvestor, PublicMapInvestment, PublicMapBoutique, PublicMapData } from '../api/portalApi';
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
  const [boutiqueCount, setBoutiqueCount] = useState(0);

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
      let boutiques: PublicMapBoutique[] = [];

      try {
        const data = await getPublicMapData();
        investors = data.investors;
        cargos = data.cargos;
        investments = data.investments ?? [];
        boutiques = data.boutiques ?? [];
        onDataLoaded?.(data);
      } catch {
        // Map still shows even if data fetch fails
      }
      setDataLoaded(true);

      // ---- Investor markers (clustered by country) ----
      // Group all investors sharing a country into a single cluster marker so
      // they never overlap into a blur when zoomed out.
      const groups = new Map<string, PublicMapInvestor[]>();
      for (const inv of investors) {
        if (!findCountryCoords(inv.location)) continue;
        const key = inv.location.trim().toLowerCase();
        const arr = groups.get(key);
        if (arr) arr.push(inv);
        else groups.set(key, [inv]);
      }

      const esc = (s: string) =>
        s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

      let visibleInvestors = 0;
      for (const [, group] of groups) {
        const coords = findCountryCoords(group[0]!.location)!;
        const count = group.length;
        visibleInvestors += count;

        // Marker root — MapLibre owns its position/transform (never set position here).
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'cursor:pointer;width:40px;height:40px;';

        // Inner element holds all visuals + hover scaling.
        const inner = document.createElement('div');
        inner.style.cssText = `
          position:relative;width:40px;height:40px;
          transition:transform 0.16s ease;
        `;

        if (count === 1) {
          // ── Solo investor — clean single avatar ──
          const av = document.createElement('div');
          av.style.cssText = `
            width:36px;height:36px;margin:2px;border-radius:50%;
            background-image:url(${group[0]!.avatarImageUrl || '/logo192.png'});
            background-size:cover;background-position:center;
            border:2.5px solid ${accentColor};
            box-shadow:0 0 0 3px ${accentColor}44,0 4px 14px rgba(0,0,0,0.8);
          `;
          inner.appendChild(av);
        } else {
          // ── Cluster — stacked "deck" of up to 3 avatars + count badge ──
          const shown = group.slice(0, 3);
          shown.forEach((inv, i) => {
            const card = document.createElement('div');
            const offset = i * 5;
            card.style.cssText = `
              position:absolute;
              top:${4 - i}px;left:${offset}px;
              width:32px;height:32px;border-radius:50%;
              background-image:url(${inv.avatarImageUrl || '/logo192.png'});
              background-size:cover;background-position:center;
              border:2px solid #0a0c14;
              box-shadow:0 0 0 1.5px ${accentColor}88, 0 3px 10px rgba(0,0,0,0.7);
              z-index:${10 - i};
            `;
            inner.appendChild(card);
          });
          // Count badge
          const badge = document.createElement('div');
          badge.style.cssText = `
            position:absolute;top:-4px;right:-6px;z-index:20;
            min-width:20px;height:20px;padding:0 5px;border-radius:999px;
            background:${accentColor};color:#0a0c14;
            font-size:0.68rem;font-weight:800;line-height:20px;text-align:center;
            box-shadow:0 0 0 2px #0a0c14,0 2px 8px rgba(0,0,0,0.6);
          `;
          badge.textContent = count > 99 ? '99+' : String(count);
          inner.appendChild(badge);
        }
        wrapper.appendChild(inner);

        // ── Hover tooltip ──
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position:absolute;bottom:calc(100% + 12px);left:50%;
          transform:translateX(-50%);
          background:rgba(10,12,20,0.97);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:12px;padding:9px 13px;white-space:nowrap;
          pointer-events:none;opacity:0;transition:opacity 0.18s;
          box-shadow:0 8px 24px rgba(0,0,0,0.7);z-index:200;
        `;
        if (count === 1) {
          const ic = group[0]!.investmentCount ?? 0;
          tooltip.innerHTML =
            `<div style="font-weight:800;color:#f1f5f9;font-size:0.82rem;margin-bottom:3px;">${esc(group[0]!.name)}</div>` +
            `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(group[0]!.location)} · 💼 ${ic} investment${ic !== 1 ? 's' : ''}</div>`;
        } else {
          tooltip.innerHTML =
            `<div style="font-weight:800;color:${accentColor};font-size:0.82rem;margin-bottom:2px;">${count} investors</div>` +
            `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(group[0]!.location)} · click to view</div>`;
        }
        wrapper.appendChild(tooltip);

        wrapper.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.16)';
          tooltip.style.opacity = '1';
        });
        wrapper.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
          tooltip.style.opacity = '0';
        });

        const marker = new maplibregl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat(coords as [number, number]);

        // ── Click → expandable popup listing every investor in the country ──
        if (count > 1) {
          const rows = group.map((inv) => {
            const ic = inv.investmentCount ?? 0;
            return (
              `<div style="display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid rgba(255,255,255,0.06);">` +
                `<img src="${inv.avatarImageUrl || '/logo192.png'}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:1.5px solid ${accentColor};flex-shrink:0;" />` +
                `<div style="min-width:0;">` +
                  `<div style="color:#f1f5f9;font-size:0.78rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(inv.name)}</div>` +
                  `<div style="color:#64748b;font-size:0.66rem;">💼 ${ic} investment${ic !== 1 ? 's' : ''}</div>` +
                `</div>` +
              `</div>`
            );
          }).join('');
          const popup = new maplibregl.Popup({ closeButton: true, offset: 22, className: 'world-map-popup world-map-cluster-popup', maxWidth: '260px' })
            .setHTML(
              `<div style="font-weight:800;color:#f1f5f9;font-size:0.86rem;margin-bottom:2px;">📍 ${esc(group[0]!.location)}</div>` +
              `<div style="color:${accentColor};font-size:0.72rem;font-weight:700;margin-bottom:8px;">${count} investors</div>` +
              `<div style="max-height:200px;overflow-y:auto;margin:0 -4px;">${rows}</div>`
            );
          marker.setPopup(popup);
        }

        marker.addTo(map);
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

      // ---- Boutique markers ----
      let visibleBoutiques = 0;
      const boutiqueColor = '#f59e0b';
      for (const boutique of boutiques) {
        if (!boutique.location) continue;
        const coords = findCountryCoords(boutique.location);
        if (!coords) continue;
        visibleBoutiques++;

        // Offset slightly from investor markers if same country by shifting lng a bit
        const lng = (coords[0] as number) + 0.8;
        const lat = (coords[1] as number) - 0.8;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'cursor:pointer;width:44px;height:44px;';

        const inner = document.createElement('div');
        inner.style.cssText = `
          position:relative;width:44px;height:44px;
          transition:transform 0.16s ease;
        `;

        // Square logo avatar for boutiques (rounded square to distinguish from round investor avatars)
        const av = document.createElement('div');
        av.style.cssText = `
          width:40px;height:40px;margin:2px;border-radius:10px;
          ${boutique.logoUrl
            ? `background-image:url(${boutique.logoUrl});background-size:cover;background-position:center;`
            : `background:#1e2535;display:flex;align-items:center;justify-content:center;font-size:18px;`
          }
          border:2.5px solid ${boutiqueColor};
          box-shadow:0 0 0 3px ${boutiqueColor}44,0 4px 14px rgba(0,0,0,0.8);
        `;
        if (!boutique.logoUrl) av.textContent = '🏪';
        inner.appendChild(av);
        wrapper.appendChild(inner);

        // Hover tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position:absolute;bottom:calc(100% + 12px);left:50%;
          transform:translateX(-50%);
          background:rgba(10,12,20,0.97);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:12px;padding:9px 13px;white-space:nowrap;
          pointer-events:none;opacity:0;transition:opacity 0.18s;
          box-shadow:0 8px 24px rgba(0,0,0,0.7);z-index:200;
        `;
        tooltip.innerHTML =
          `<div style="font-weight:800;color:#f1f5f9;font-size:0.82rem;margin-bottom:3px;">🏪 ${esc(boutique.name)}</div>` +
          `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(boutique.location)}</div>`;
        wrapper.appendChild(tooltip);

        wrapper.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.16)'; tooltip.style.opacity = '1'; });
        wrapper.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)'; tooltip.style.opacity = '0'; });

        const boutiquePopup = new maplibregl.Popup({
          closeButton: false,
          offset: 14,
          className: 'world-map-popup',
        }).setHTML(
          `<strong>🏪 ${esc(boutique.name)}</strong><br/>` +
          `<span>📍 ${esc(boutique.location)}</span>` +
          (boutique.description ? `<br/><span style="color:#94a3b8">${esc(boutique.description)}</span>` : '')
        );

        new maplibregl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat([lng, lat] as [number, number])
          .setPopup(boutiquePopup)
          .addTo(map);
      }
      setBoutiqueCount(visibleBoutiques);
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
        .world-map-cluster-popup .maplibregl-popup-content { padding: 12px 14px; }
        .world-map-cluster-popup .maplibregl-popup-content > div:last-child::-webkit-scrollbar { width: 5px; }
        .world-map-cluster-popup .maplibregl-popup-content > div:last-child::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 99px; }
        .world-map-cluster-popup .maplibregl-popup-close-button { color: #94a3b8; font-size: 18px; padding: 2px 7px; }
        .world-map-cluster-popup .maplibregl-popup-close-button:hover { background: rgba(255,255,255,0.08); color: #fff; }
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
      {(investorCount > 0 || cargoCount > 0 || investmentCount > 0 || boutiqueCount > 0) && (
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
          {boutiqueCount > 0 && (
            <span style={{
              background: 'rgba(15,18,28,0.88)',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: '0.72rem',
              color: '#f59e0b',
              fontWeight: 600,
            }}>
              {boutiqueCount} boutique{boutiqueCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default WorldMap;
