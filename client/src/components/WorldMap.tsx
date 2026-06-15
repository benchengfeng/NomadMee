import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPublicMapData, PublicMapCargo, PublicMapInvestor, PublicMapInvestment, PublicMapBoutique, PublicMapData, PublicMapJourney, PublicMapPartner } from '../api/portalApi';
import { buildCargoRoute, getPositionAtProgress } from '../utils/routeBuilder';
import { findCountryCoords } from '../utils/countries';
import { track } from '../utils/analytics';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { GlobeLayer, setGlobeLayer } from '../redux/slices/globeLayerSlice';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const CLR_INVESTOR  = '#38bdf8';
const CLR_INVEST    = '#e879f9';
const CLR_BOUTIQUE  = '#f59e0b';
const CLR_JOURNEY   = '#f59e0b';
const CLR_PARTNER   = '#4ade80';
const CARGO_COLORS: Record<string, string> = {
  sea: '#38bdf8',
  air: '#a78bfa',
  land: '#fb923c',
};


type LayerVis = { investors: boolean; investments: boolean; boutiques: boolean; cargos: boolean; journeys: boolean; partners: boolean };

// Which marker groups are visible per layer
const LAYER_VISIBILITY: Record<GlobeLayer, LayerVis> = {
  all:         { investors: true,  investments: true,  boutiques: true,  cargos: true,  journeys: true,  partners: true  },
  trade:       { investors: false, investments: false, boutiques: false, cargos: true,  journeys: false, partners: false },
  investments: { investors: false, investments: true,  boutiques: false, cargos: false, journeys: false, partners: false },
  shop:        { investors: false, investments: false, boutiques: true,  cargos: false, journeys: false, partners: false },
  community:   { investors: true,  investments: false, boutiques: false, cargos: false, journeys: false, partners: true  },
  journeys:    { investors: false, investments: false, boutiques: false, cargos: false, journeys: true,  partners: false },
};

const LAYER_DEFS: Array<{ id: GlobeLayer; icon: string; label: string; shortLabel: string; color: string; analyticsEvent: string }> = [
  { id: 'all',         icon: '🌍', label: 'All',         shortLabel: 'All',     color: '#94a3b8', analyticsEvent: 'globe_layer_all_viewed'         },
  { id: 'trade',       icon: '🚢', label: 'Trade',       shortLabel: 'Trade',   color: '#38bdf8', analyticsEvent: 'globe_layer_trade_viewed'       },
  { id: 'investments', icon: '💰', label: 'Investments', shortLabel: 'Capital', color: '#e879f9', analyticsEvent: 'globe_layer_investments_viewed' },
  { id: 'shop',        icon: '🛍', label: 'Shop',        shortLabel: 'Shop',    color: '#f59e0b', analyticsEvent: 'globe_layer_shop_viewed'        },
  { id: 'community',   icon: '👥', label: 'Community',   shortLabel: 'People',  color: '#4ade80', analyticsEvent: 'globe_layer_community_viewed'   },
  { id: 'journeys',    icon: '🗺', label: 'Journeys',    shortLabel: 'Trips',   color: '#a78bfa', analyticsEvent: 'globe_layer_journeys_viewed'    },
];

function cargoProgress(cargo: PublicMapCargo): number {
  const start = new Date(cargo.purchaseDate || cargo.createdAt).getTime();
  const end   = new Date(cargo.estimatedTimeOfArrival).getTime();
  const now   = Date.now();
  if (end <= start) return 1;
  return Math.max(0, Math.min(1, (now - start) / (end - start)));
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function makeTooltip(): HTMLDivElement {
  const t = document.createElement('div');
  t.style.cssText = `
    position:absolute;bottom:calc(100% + 12px);left:50%;
    transform:translateX(-50%);
    background:rgba(10,12,20,0.97);
    border:1px solid rgba(255,255,255,0.12);
    border-radius:12px;padding:9px 13px;white-space:nowrap;
    pointer-events:none;opacity:0;transition:opacity 0.18s;
    box-shadow:0 8px 24px rgba(0,0,0,0.7);z-index:200;
  `;
  return t;
}

function applyVisibility(
  groups: { investors: HTMLElement[]; investments: HTMLElement[]; boutiques: HTMLElement[]; cargos: HTMLElement[]; journeys: HTMLElement[]; partners: HTMLElement[] },
  layer: GlobeLayer,
) {
  const vis = LAYER_VISIBILITY[layer];
  const toggle = (els: HTMLElement[], show: boolean) =>
    els.forEach((el) => {
      el.style.opacity = show ? '1' : '0';
      el.style.pointerEvents = show ? 'auto' : 'none';
    });
  toggle(groups.investors,   vis['investors']);
  toggle(groups.investments, vis['investments']);
  toggle(groups.boutiques,   vis['boutiques']);
  toggle(groups.cargos,      vis['cargos']);
  toggle(groups.journeys,    vis['journeys']);
  toggle(groups.partners,    vis['partners']);
}

interface WorldMapProps {
  accentColor?: string;
  onDataLoaded?: (data: PublicMapData) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ accentColor, onDataLoaded }) => {
  const dispatch      = useAppDispatch();
  const activeLayer   = useAppSelector((s: any) => s.globeLayer.activeLayer as GlobeLayer);
  const activeLayerRef = useRef<GlobeLayer>(activeLayer);

  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<maplibregl.Map | null>(null);
  const markerGroupsRef = useRef<{
    investors:   HTMLElement[];
    investments: HTMLElement[];
    boutiques:   HTMLElement[];
    cargos:      HTMLElement[];
    journeys:    HTMLElement[];
    partners:    HTMLElement[];
  }>({ investors: [], investments: [], boutiques: [], cargos: [], journeys: [], partners: [] });

  const [mapError,        setMapError]        = useState(false);
  const [mapReady,        setMapReady]        = useState(false);
  const [dataLoaded,      setDataLoaded]      = useState(false);
  const [investorCount,   setInvestorCount]   = useState(0);
  const [cargoCount,      setCargoCount]      = useState(0);
  const [investmentCount, setInvestmentCount] = useState(0);
  const [boutiqueCount,   setBoutiqueCount]   = useState(0);
  const [journeyCount,    setJourneyCount]    = useState(0);
  const [partnerCount,    setPartnerCount]    = useState(0);
  const [animatingLayer,  setAnimatingLayer]  = useState<GlobeLayer | null>(null);
  const [filterToast,     setFilterToast]     = useState<{ text: string; color: string } | null>(null);
  const filterToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync so map.on('load') closure can read current layer
  useEffect(() => { activeLayerRef.current = activeLayer; }, [activeLayer]);

  // Apply visibility whenever layer changes or data finishes loading
  useEffect(() => {
    if (!dataLoaded) return;
    applyVisibility(markerGroupsRef.current, activeLayer);
  }, [activeLayer, dataLoaded]);

  const showFilterToast = (def: typeof LAYER_DEFS[number]) => {
    if (filterToastTimer.current) clearTimeout(filterToastTimer.current);
    setFilterToast({ text: `${def.icon} ${def.label}`, color: def.color });
    filterToastTimer.current = setTimeout(() => setFilterToast(null), 1600);
  };

  const handleLayerChange = (layer: GlobeLayer) => {
    const def = LAYER_DEFS.find((d) => d.id === layer);
    if (def) showFilterToast(def);
    if (layer === activeLayer) return;
    dispatch(setGlobeLayer(layer));
    setAnimatingLayer(layer);
    setTimeout(() => setAnimatingLayer(null), 300);
    if (def) {
      track('globe_layer_changed', { layer });
      track(def.analyticsEvent as any);
    }
  };

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

    // Re-apply layer visibility after every move/zoom in case MapLibre
    // re-fires load or repositions markers during tile fetching.
    map.on('moveend', () => applyVisibility(markerGroupsRef.current, activeLayerRef.current));
    map.on('zoomend', () => applyVisibility(markerGroupsRef.current, activeLayerRef.current));

    let mapLoaded = false;
    map.on('load', async () => {
      if (mapLoaded) return;
      mapLoaded = true;
      let investors:   PublicMapInvestor[]   = [];
      let cargos:      PublicMapCargo[]      = [];
      let investments: PublicMapInvestment[] = [];
      let boutiques:   PublicMapBoutique[]   = [];
      let journeys:    PublicMapJourney[]    = [];
      let partners:    PublicMapPartner[]    = [];

      try {
        const data = await getPublicMapData();
        investors   = data.investors;
        cargos      = data.cargos;
        investments = data.investments ?? [];
        boutiques   = data.boutiques  ?? [];
        journeys    = data.journeys   ?? [];
        partners    = data.partners   ?? [];
        onDataLoaded?.(data);
      } catch {
        // Map still shows even if data fetch fails
      }

      // Reset marker groups for this load
      const groups = markerGroupsRef.current;
      groups.investors   = [];
      groups.investments = [];
      groups.boutiques   = [];
      groups.cargos      = [];
      groups.partners    = [];
      groups.journeys    = [];

      function groupByCountry<T extends { location: string }>(items: T[]): Map<string, T[]> {
        const m = new Map<string, T[]>();
        for (const item of items) {
          if (!item.location || !findCountryCoords(item.location)) continue;
          const key = item.location.trim().toLowerCase();
          const arr = m.get(key);
          if (arr) arr.push(item);
          else m.set(key, [item]);
        }
        return m;
      }

      function makeMarkerShell(size = 44): { wrapper: HTMLDivElement; inner: HTMLDivElement } {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `cursor:pointer;width:${size}px;height:${size}px;transition:opacity 0.3s ease;`;
        const inner = document.createElement('div');
        inner.style.cssText = `position:relative;width:${size}px;height:${size}px;transition:transform 0.16s ease;`;
        wrapper.appendChild(inner);
        return { wrapper, inner };
      }

      function makeBadge(count: number, color: string): HTMLDivElement {
        const badge = document.createElement('div');
        badge.style.cssText = `
          position:absolute;top:-5px;right:-7px;z-index:20;
          min-width:20px;height:20px;padding:0 5px;border-radius:999px;
          background:${color};color:#0a0c14;
          font-size:0.68rem;font-weight:800;line-height:20px;text-align:center;
          box-shadow:0 0 0 2px #0a0c14,0 2px 8px rgba(0,0,0,0.6);
        `;
        badge.textContent = count > 99 ? '99+' : String(count);
        return badge;
      }

      function makeClusterPopup(location: string, label: string, color: string, rows: string): maplibregl.Popup {
        return new maplibregl.Popup({
          closeButton: true,
          offset: 22,
          className: 'world-map-popup world-map-cluster-popup',
          maxWidth: '270px',
        }).setHTML(
          `<div style="font-weight:800;color:#f1f5f9;font-size:0.86rem;margin-bottom:2px;">📍 ${esc(location)}</div>` +
          `<div style="color:${color};font-size:0.72rem;font-weight:700;margin-bottom:8px;">${label}</div>` +
          `<div style="max-height:220px;overflow-y:auto;margin:0 -4px;">${rows}</div>`
        );
      }

      // ════════════════════════════════════════════════════════════════════════
      // INVESTORS
      // ════════════════════════════════════════════════════════════════════════
      const investorGroups = groupByCountry(investors);
      let visibleInvestors = 0;

      for (const [, group] of investorGroups) {
        const coords = findCountryCoords(group[0]!.location)!;
        const count  = group.length;
        visibleInvestors += count;

        const { wrapper, inner } = makeMarkerShell(44);
        groups.investors.push(wrapper);

        if (count === 1) {
          const av = document.createElement('div');
          av.style.cssText = `
            width:38px;height:38px;margin:3px;border-radius:50%;
            background-image:url(${group[0]!.avatarImageUrl || '/logo192.png'});
            background-size:cover;background-position:center;
            border:2.5px solid ${CLR_INVESTOR};
            box-shadow:0 0 0 3px ${CLR_INVESTOR}44,0 4px 14px rgba(0,0,0,0.8);
          `;
          inner.appendChild(av);
        } else {
          group.slice(0, 3).forEach((inv, i) => {
            const card = document.createElement('div');
            card.style.cssText = `
              position:absolute;top:${5 - i * 2}px;left:${i * 7}px;
              width:32px;height:32px;border-radius:50%;
              background-image:url(${inv.avatarImageUrl || '/logo192.png'});
              background-size:cover;background-position:center;
              border:2px solid #0a0c14;
              box-shadow:0 0 0 1.5px ${CLR_INVESTOR}88,0 3px 10px rgba(0,0,0,0.7);
              z-index:${10 - i};
            `;
            inner.appendChild(card);
          });
          inner.appendChild(makeBadge(count, CLR_INVESTOR));
        }

        const tooltip = makeTooltip();
        if (count === 1) {
          const ic = group[0]!.investmentCount ?? 0;
          tooltip.innerHTML =
            `<div style="font-weight:800;color:#f1f5f9;font-size:0.82rem;margin-bottom:3px;">${esc(group[0]!.name)}</div>` +
            `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(group[0]!.location)} · 💼 ${ic} investment${ic !== 1 ? 's' : ''}</div>`;
        } else {
          tooltip.innerHTML =
            `<div style="font-weight:800;color:${CLR_INVESTOR};font-size:0.82rem;margin-bottom:2px;">${count} investors</div>` +
            `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(group[0]!.location)} · click to expand</div>`;
        }
        wrapper.appendChild(tooltip);

        wrapper.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.16)'; tooltip.style.opacity = '1'; });
        wrapper.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)';    tooltip.style.opacity = '0'; });
        wrapper.addEventListener('click', () => track('map-marker-click', { category: 'investor', location: group[0]!.location, count }));

        const marker = new maplibregl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat(coords as [number, number]);

        if (count > 1) {
          const rows = group.map((inv) => {
            const ic = inv.investmentCount ?? 0;
            return (
              `<div style="display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid rgba(255,255,255,0.06);">` +
                `<img src="${inv.avatarImageUrl || '/logo192.png'}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1.5px solid ${CLR_INVESTOR};flex-shrink:0;" />` +
                `<div style="min-width:0;">` +
                  `<div style="color:#f1f5f9;font-size:0.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(inv.name)}</div>` +
                  `<div style="color:#64748b;font-size:0.67rem;">💼 ${ic} investment${ic !== 1 ? 's' : ''}</div>` +
                `</div>` +
              `</div>`
            );
          }).join('');
          marker.setPopup(makeClusterPopup(group[0]!.location, `${count} investors`, CLR_INVESTOR, rows));
        } else {
          const ic = group[0]!.investmentCount ?? 0;
          marker.setPopup(
            new maplibregl.Popup({ closeButton: false, offset: 14, className: 'world-map-popup' }).setHTML(
              `<strong>${esc(group[0]!.name)}</strong>` +
              `<br/><span>📍 ${esc(group[0]!.location)}</span>` +
              `<br/><span style="color:${CLR_INVESTOR}">💼 ${ic} investment${ic !== 1 ? 's' : ''}</span>`
            )
          );
        }

        marker.addTo(map);
      }
      setInvestorCount(visibleInvestors);

      // ════════════════════════════════════════════════════════════════════════
      // INVESTMENTS
      // ════════════════════════════════════════════════════════════════════════
      const investGroups = groupByCountry(investments);
      let visibleInvestments = 0;

      for (const [, group] of investGroups) {
        const coords = findCountryCoords(group[0]!.location)!;
        const count  = group.length;
        visibleInvestments += count;

        const { wrapper, inner } = makeMarkerShell(44);
        groups.investments.push(wrapper);

        const makeDiamond = (size: number, borderColor: string, zIdx: number, top: number, left: number) => {
          const d = document.createElement('div');
          d.style.cssText = `
            position:${zIdx === 0 ? 'relative' : 'absolute'};
            top:${top}px;left:${left}px;
            width:${size}px;height:${size}px;
            background:rgba(8,10,18,0.92);
            border:2px solid ${borderColor};
            border-radius:5px;
            transform:rotate(45deg);
            box-shadow:0 0 0 2px ${CLR_INVEST}22,0 4px 12px rgba(0,0,0,0.8);
            z-index:${zIdx === 0 ? 'auto' : 10 - zIdx};
            display:flex;align-items:center;justify-content:center;
          `;
          const icon = document.createElement('div');
          icon.style.cssText = `transform:rotate(-45deg);font-size:${Math.round(size * 0.48)}px;line-height:1;`;
          icon.textContent = '💼';
          d.appendChild(icon);
          return d;
        };

        if (count === 1) {
          const d = makeDiamond(30, CLR_INVEST, 0, 7, 7);
          d.style.position = 'absolute';
          d.style.top  = '7px';
          d.style.left = '7px';
          inner.appendChild(d);
        } else {
          group.slice(0, 3).forEach((_, i) => {
            const d = makeDiamond(26, i === 0 ? CLR_INVEST : `${CLR_INVEST}77`, i, 6 - i * 2, i * 6);
            d.style.position = 'absolute';
            d.style.top  = `${6 - i * 2}px`;
            d.style.left = `${i * 6}px`;
            inner.appendChild(d);
          });
          inner.appendChild(makeBadge(count, CLR_INVEST));
        }

        const tooltip = makeTooltip();
        if (count === 1) {
          const inv = group[0]!;
          tooltip.innerHTML =
            `<div style="font-weight:800;color:#f1f5f9;font-size:0.82rem;margin-bottom:3px;">💼 ${esc(inv.title)}</div>` +
            `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(inv.location)} · ${inv.status.replace('_', ' ')}</div>`;
        } else {
          tooltip.innerHTML =
            `<div style="font-weight:800;color:${CLR_INVEST};font-size:0.82rem;margin-bottom:2px;">${count} investments</div>` +
            `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(group[0]!.location)} · click to expand</div>`;
        }
        wrapper.appendChild(tooltip);

        wrapper.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.16)'; tooltip.style.opacity = '1'; });
        wrapper.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)';    tooltip.style.opacity = '0'; });

        const marker = new maplibregl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat(coords as [number, number]);

        if (count === 1) {
          const inv = group[0]!;
          const investmentId = String(inv._id);
          wrapper.addEventListener('click', () => {
            track('map-marker-click', { category: 'investment', investmentId, location: inv.location });
            window.location.href = `/join/${investmentId}`;
          });
        } else {
          wrapper.addEventListener('click', () => track('map-marker-click', { category: 'investment', location: group[0]!.location, count }));
          const rows = group.map((inv) =>
            `<div onclick="window.location.href='/join/${String(inv._id)}'" style="display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;" onmouseenter="this.style.background='rgba(232,121,249,0.06)'" onmouseleave="this.style.background='transparent'">` +
              `<div style="width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">` +
                `<div style="width:22px;height:22px;background:rgba(8,10,18,0.9);border:1.5px solid ${CLR_INVEST};border-radius:4px;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">` +
                  `<span style="transform:rotate(-45deg);font-size:10px;">💼</span>` +
                `</div>` +
              `</div>` +
              `<div style="min-width:0;flex:1;">` +
                `<div style="color:#f1f5f9;font-size:0.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(inv.title)}</div>` +
                `<div style="color:#64748b;font-size:0.67rem;">${inv.cargoCount} cargo${inv.cargoCount !== 1 ? 's' : ''} · ${inv.status.replace('_', ' ')}</div>` +
              `</div>` +
              `<span style="color:${CLR_INVEST};font-size:0.68rem;font-weight:700;flex-shrink:0;">Join →</span>` +
            `</div>`
          ).join('');
          marker.setPopup(makeClusterPopup(group[0]!.location, `${count} investments`, CLR_INVEST, rows));
        }

        marker.addTo(map);
      }
      setInvestmentCount(visibleInvestments);

      // ════════════════════════════════════════════════════════════════════════
      // BOUTIQUES
      // ════════════════════════════════════════════════════════════════════════
      const boutiqueGroups = groupByCountry(boutiques);
      let visibleBoutiques = 0;

      for (const [, group] of boutiqueGroups) {
        const coords = findCountryCoords(group[0]!.location)!;
        const count  = group.length;
        visibleBoutiques += count;

        const { wrapper, inner } = makeMarkerShell(46);
        groups.boutiques.push(wrapper);

        const logoStyle = (b: PublicMapBoutique) =>
          b.logoUrl
            ? `background-image:url(${b.logoUrl});background-size:cover;background-position:center;`
            : `background:#1e2535;`;

        if (count === 1) {
          const av = document.createElement('div');
          av.style.cssText = `
            width:40px;height:40px;margin:3px;border-radius:10px;
            ${logoStyle(group[0]!)}
            border:2.5px solid ${CLR_BOUTIQUE};
            box-shadow:0 0 0 3px ${CLR_BOUTIQUE}44,0 4px 14px rgba(0,0,0,0.8);
            display:flex;align-items:center;justify-content:center;font-size:20px;
          `;
          if (!group[0]!.logoUrl) av.textContent = '🏪';
          inner.appendChild(av);
        } else {
          group.slice(0, 3).forEach((b, i) => {
            const card = document.createElement('div');
            card.style.cssText = `
              position:absolute;top:${5 - i * 2}px;left:${i * 7}px;
              width:32px;height:32px;border-radius:8px;
              ${logoStyle(b)}
              border:2px solid #0a0c14;
              box-shadow:0 0 0 1.5px ${CLR_BOUTIQUE}88,0 3px 10px rgba(0,0,0,0.7);
              z-index:${10 - i};
              display:flex;align-items:center;justify-content:center;font-size:15px;
            `;
            if (!b.logoUrl) card.textContent = '🏪';
            inner.appendChild(card);
          });
          inner.appendChild(makeBadge(count, CLR_BOUTIQUE));
        }

        const tooltip = makeTooltip();
        if (count === 1) {
          tooltip.innerHTML =
            `<div style="font-weight:800;color:#f1f5f9;font-size:0.82rem;margin-bottom:3px;">🏪 ${esc(group[0]!.name)}</div>` +
            `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(group[0]!.location)}</div>`;
        } else {
          tooltip.innerHTML =
            `<div style="font-weight:800;color:${CLR_BOUTIQUE};font-size:0.82rem;margin-bottom:2px;">${count} boutiques</div>` +
            `<div style="color:#64748b;font-size:0.72rem;">📍 ${esc(group[0]!.location)} · click to expand</div>`;
        }
        wrapper.appendChild(tooltip);

        wrapper.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.16)'; tooltip.style.opacity = '1'; });
        wrapper.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)';    tooltip.style.opacity = '0'; });

        const marker = new maplibregl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat(coords as [number, number]);

        if (count === 1) {
          const boutiqueId = String(group[0]!._id);
          wrapper.addEventListener('click', () => {
            track('map-marker-click', { category: 'boutique', boutiqueId, location: group[0]!.location });
            window.location.href = `/shop/boutique/${boutiqueId}`;
          });
        } else {
          wrapper.addEventListener('click', () => track('map-marker-click', { category: 'boutique', location: group[0]!.location, count }));
          const rows = group.map((b) =>
            `<div onclick="window.location.href='/shop/boutique/${String(b._id)}'" style="display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;" onmouseenter="this.style.background='rgba(245,158,11,0.06)'" onmouseleave="this.style.background='transparent'">` +
              (b.logoUrl
                ? `<img src="${b.logoUrl}" style="width:32px;height:32px;border-radius:7px;object-fit:cover;border:1.5px solid ${CLR_BOUTIQUE};flex-shrink:0;" />`
                : `<div style="width:32px;height:32px;border-radius:7px;background:#1e2535;border:1.5px solid ${CLR_BOUTIQUE};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:15px;">🏪</div>`
              ) +
              `<div style="min-width:0;flex:1;">` +
                `<div style="color:#f1f5f9;font-size:0.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(b.name)}</div>` +
                (b.description ? `<div style="color:#64748b;font-size:0.67rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(b.description)}</div>` : '') +
              `</div>` +
              `<span style="color:${CLR_BOUTIQUE};font-size:0.68rem;font-weight:700;flex-shrink:0;">View →</span>` +
            `</div>`
          ).join('');
          marker.setPopup(makeClusterPopup(group[0]!.location, `${count} boutiques`, CLR_BOUTIQUE, rows));
        }

        marker.addTo(map);
      }
      setBoutiqueCount(visibleBoutiques);

      // ════════════════════════════════════════════════════════════════════════
      // CARGOS
      // ════════════════════════════════════════════════════════════════════════
      let visibleCargos = 0;
      for (const cargo of cargos) {
        const shippingType = cargo.shippingType ?? 'sea';
        const route    = buildCargoRoute(cargo.purchaseLocation, cargo.shippingDestination, shippingType);
        const progress = cargoProgress(cargo);
        const pos      = getPositionAtProgress(route, progress);
        const color    = CARGO_COLORS[shippingType] ?? CARGO_COLORS['sea']!;
        const arrived  = progress >= 1;
        visibleCargos++;

        const emojiIcon = shippingType === 'air' ? '✈️' : shippingType === 'land' ? '🚛' : '🚢';

        const pulseEl = document.createElement('div');
        pulseEl.style.cssText = `width:34px;height:34px;cursor:pointer;transition:opacity 0.3s ease;`;
        groups.cargos.push(pulseEl);

        const cargoInner = document.createElement('div');
        cargoInner.style.cssText = `
          width:34px;height:34px;border-radius:50%;
          background:rgba(8,10,18,0.88);
          border:2px solid ${color};
          display:flex;align-items:center;justify-content:center;
          font-size:16px;line-height:1;
          box-shadow:0 0 10px ${color}55,0 3px 10px rgba(0,0,0,0.75);
          transition:transform 0.15s,box-shadow 0.15s;
        `;
        cargoInner.textContent = emojiIcon;
        pulseEl.appendChild(cargoInner);

        if (!arrived) {
          const ring = document.createElement('div');
          ring.style.cssText = `
            position:absolute;top:-3px;left:-3px;width:40px;height:40px;
            border-radius:50%;border:2px solid ${color};
            animation:worldMapPulse 2.8s ease-out infinite;opacity:0.4;
          `;
          pulseEl.style.position = 'relative';
          pulseEl.appendChild(ring);
        }

        const icon       = shippingType === 'air' ? '✈' : shippingType === 'land' ? '🚛' : '🚢';
        const eta        = new Date(cargo.estimatedTimeOfArrival).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const statusText = arrived
          ? '<span style="color:#4ade80">✓ Arrived</span>'
          : `<span style="color:${color}">${Math.round(progress * 100)}% — ETA ${eta}</span>`;

        const popup = new maplibregl.Popup({
          closeButton: false,
          offset: 16,
          className: 'world-map-popup',
        }).setHTML(
          `<strong>${icon} ${esc(cargo.productBeingShipped)}</strong>` +
          `<br/><span style="color:#94a3b8">${esc(cargo.purchaseLocation)} → ${esc(cargo.shippingDestination)}</span>` +
          `<br/>${statusText}`
        );

        pulseEl.addEventListener('mouseenter', () => { cargoInner.style.transform = 'scale(1.22)'; cargoInner.style.boxShadow = `0 0 18px ${color}99,0 4px 14px rgba(0,0,0,0.9)`; });
        pulseEl.addEventListener('mouseleave', () => { cargoInner.style.transform = 'scale(1)';    cargoInner.style.boxShadow = `0 0 10px ${color}55,0 3px 10px rgba(0,0,0,0.75)`; });
        pulseEl.addEventListener('click', () => track('map-marker-click', { category: 'cargo', product: cargo.productBeingShipped, type: shippingType, progress: Math.round(progress * 100) }));

        new maplibregl.Marker({ element: pulseEl, anchor: 'center' })
          .setLngLat(pos as [number, number])
          .setPopup(popup)
          .addTo(map);
      }
      setCargoCount(visibleCargos);

      // ════════════════════════════════════════════════════════════════════════
      // JOURNEYS
      // ════════════════════════════════════════════════════════════════════════
      let visibleJourneys = 0;
      for (const journey of journeys) {
        if (!journey.locationLat || !journey.locationLng) continue;
        visibleJourneys++;

        const el = document.createElement('div');
        el.style.cssText = 'width:38px;height:38px;cursor:pointer;position:relative;transition:opacity 0.3s ease;';
        groups.journeys.push(el);

        const inner = document.createElement('div');
        inner.style.cssText = `
          width:38px;height:38px;border-radius:50%;
          background:rgba(8,10,18,0.88);
          border:2.5px solid ${CLR_JOURNEY};
          display:flex;align-items:center;justify-content:center;
          font-size:17px;line-height:1;
          box-shadow:0 0 12px ${CLR_JOURNEY}66,0 3px 10px rgba(0,0,0,0.75);
          transition:transform 0.15s,box-shadow 0.15s;
        `;
        inner.textContent = '🧭';
        el.appendChild(inner);

        if (journey.status === 'active' && journey.spotsRemaining > 0) {
          const ring = document.createElement('div');
          ring.style.cssText = `
            position:absolute;top:-4px;left:-4px;width:46px;height:46px;
            border-radius:50%;border:2px solid ${CLR_JOURNEY};
            animation:worldMapPulse 2.4s ease-out infinite;opacity:0.45;
          `;
          el.appendChild(ring);
        }

        const spotsText = journey.status === 'full'
          ? '<span style="color:#f87171">Full</span>'
          : journey.spotsRemaining > 0
            ? `<span style="color:${CLR_JOURNEY}">${journey.spotsRemaining} spot${journey.spotsRemaining !== 1 ? 's' : ''} left</span>`
            : '';

        const popup = new maplibregl.Popup({ closeButton: false, offset: 16, className: 'world-map-popup' }).setHTML(
          `<strong>🧭 ${esc(journey.title)}</strong>` +
          `<br/><span style="color:#94a3b8">📍 ${esc(journey.location)}</span>` +
          (spotsText ? `<br/>${spotsText}` : '') +
          `<br/><span style="color:${CLR_JOURNEY};font-size:0.78rem;cursor:pointer;" onclick="window.location.href='/journeys/${journey._id}'">View journey →</span>`
        );

        el.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.22)'; inner.style.boxShadow = `0 0 20px ${CLR_JOURNEY}aa,0 4px 14px rgba(0,0,0,0.9)`; });
        el.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)';    inner.style.boxShadow = `0 0 12px ${CLR_JOURNEY}66,0 3px 10px rgba(0,0,0,0.75)`; });
        el.addEventListener('click', () => { track('journey_card_clicked', { journeyId: journey._id, context: 'globe' }); window.location.href = `/journeys/${journey._id}`; });

        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([journey.locationLng, journey.locationLat])
          .setPopup(popup)
          .addTo(map);
      }
      setJourneyCount(visibleJourneys);

      // ════════════════════════════════════════════════════════════════════════
      // PARTNERS
      // ════════════════════════════════════════════════════════════════════════
      for (const partner of partners) {
        let partnerLngLat: [number, number] | null = null;
        if (partner.locationLat && partner.locationLng) {
          partnerLngLat = [partner.locationLng, partner.locationLat];
        } else if (partner.location) {
          const fallback = findCountryCoords(partner.location);
          if (fallback) partnerLngLat = fallback;
        }
        if (!partnerLngLat) continue;

        const el = document.createElement('div');
        el.style.cssText = 'width:36px;height:36px;cursor:pointer;position:relative;transition:opacity 0.3s ease;';
        groups.partners.push(el);

        const inner = document.createElement('div');
        inner.style.cssText = `
          width:36px;height:36px;border-radius:50%;
          background:rgba(8,10,18,0.88);
          border:2.5px solid ${CLR_PARTNER};
          display:flex;align-items:center;justify-content:center;
          font-size:16px;line-height:1;
          box-shadow:0 0 10px ${CLR_PARTNER}66,0 3px 10px rgba(0,0,0,0.75);
          transition:transform 0.15s,box-shadow 0.15s;
        `;
        inner.textContent = '🤝';
        el.appendChild(inner);

        const popup = new maplibregl.Popup({ closeButton: false, offset: 16, className: 'world-map-popup' }).setHTML(
          `<strong>🤝 ${esc(partner.name)}</strong>` +
          (partner.location ? `<br/><span style="color:#94a3b8">📍 ${esc(partner.location)}</span>` : '') +
          `<br/><span style="color:${CLR_PARTNER};font-size:0.78rem;">NomadMe partner</span>`
        );

        el.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.22)'; inner.style.boxShadow = `0 0 18px ${CLR_PARTNER}aa,0 4px 14px rgba(0,0,0,0.9)`; });
        el.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)';    inner.style.boxShadow = `0 0 10px ${CLR_PARTNER}66,0 3px 10px rgba(0,0,0,0.75)`; });

        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(partnerLngLat)
          .setPopup(popup)
          .addTo(map);
      }
      setPartnerCount(groups.partners.length);

      setDataLoaded(true);
      // Apply the layer that was active when the map finished loading
      applyVisibility(groups, activeLayerRef.current);
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

  const accent = accentColor ?? '#38bdf8';

  const hasData = investorCount > 0 || cargoCount > 0 || investmentCount > 0 || boutiqueCount > 0 || journeyCount > 0 || partnerCount > 0;

  // Count of visible markers per layer — shown in the filter pill
  const layerCount: Record<GlobeLayer, number> = {
    all:         investorCount + investmentCount + boutiqueCount + cargoCount + journeyCount + partnerCount,
    trade:       cargoCount,
    investments: investmentCount,
    shop:        boutiqueCount,
    community:   investorCount + partnerCount,
    journeys:    journeyCount,
  };

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <style>{`
        @keyframes worldMapPulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes globePillSelect {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .world-map-popup .maplibregl-popup-content {
          background: rgba(13,16,26,0.97);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 11px;
          padding: 10px 14px;
          color: #e2e8f0;
          font-size: 0.8rem;
          line-height: 1.55;
          box-shadow: 0 8px 28px rgba(0,0,0,0.65);
        }
        .world-map-popup .maplibregl-popup-content strong { color: #fff; display: block; margin-bottom: 3px; }
        .world-map-popup .maplibregl-popup-tip { border-top-color: rgba(13,16,26,0.97) !important; }
        .maplibregl-ctrl-bottom-right { bottom: 28px !important; right: 10px !important; }
        .world-map-cluster-popup .maplibregl-popup-content { padding: 13px 15px; }
        .world-map-cluster-popup .maplibregl-popup-content > div:last-child::-webkit-scrollbar { width: 4px; }
        .world-map-cluster-popup .maplibregl-popup-content > div:last-child::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
        .world-map-cluster-popup .maplibregl-popup-close-button { color: #94a3b8; font-size: 18px; padding: 2px 7px; border-radius: 6px; }
        .world-map-cluster-popup .maplibregl-popup-close-button:hover { background: rgba(255,255,255,0.08); color: #fff; }

        .globe-layer-bar {
          position: absolute;
          bottom: 54px;
          left: 14px;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          max-width: calc(100% - 90px);
          padding: 8px 10px;
          border-radius: 14px;
          background: rgba(10, 12, 20, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 20px rgba(0,0,0,0.55);
          scrollbar-width: none;
          z-index: 10;
        }
        .globe-layer-bar::-webkit-scrollbar { display: none; }

        .globe-layer-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.5);
          transition: all 0.2s ease;
          user-select: none;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .globe-layer-pill:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
        }
        .globe-layer-pill.active {
          color: #000;
          opacity: 1;
          border-color: transparent;
          box-shadow: 0 0 14px var(--pill-glow, rgba(56,189,248,0.5));
        }
        .globe-layer-pill.animating {
          animation: globePillSelect 0.28s ease;
        }
        .globe-layer-pill-icon {
          font-size: 14px;
          line-height: 1;
        }

        @media (max-width: 480px) {
          .globe-layer-bar {
            bottom: 50px;
            padding: 6px 8px;
            gap: 5px;
          }
          .globe-layer-pill {
            padding: 4px 10px;
            font-size: 0.68rem;
          }
        }
        @media (max-width: 380px) {
          .globe-layer-pill-label { display: none; }
          .globe-layer-pill { padding: 5px 8px; }
        }

        [dir="rtl"] .globe-layer-bar {
          flex-direction: row-reverse;
          left: auto;
          right: 14px;
        }

        @keyframes filterToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.92); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);   }
        }
        @keyframes filterToastOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

      {/* Map canvas */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, opacity: mapReady ? 1 : 0, transition: 'opacity 0.7s ease' }} />

      {/* Loading overlay */}
      {!mapReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0c14', gap: 16, zIndex: 1 }}>
          <img src="/logo192.png" alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', opacity: 0.7 }} />
          <p style={{ color: '#475569', fontSize: '0.82rem', margin: 0 }}>Loading map…</p>
        </div>
      )}

      {/* Empty state */}
      {mapReady && dataLoaded && !hasData && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 14, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '2.4rem', lineHeight: 1, opacity: 0.5 }}>🌍</div>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, fontWeight: 700 }}>The globe wakes up when cargo moves</p>
          <p style={{ color: '#475569', fontSize: '0.72rem', margin: 0, maxWidth: 240, lineHeight: 1.6 }}>
            Investors, cargos, and boutiques appear here as they go live — check back once an investment round is active.
          </p>
        </div>
      )}

      {/* Filter toast — shown briefly after clicking a layer pill */}
      {filterToast && (
        <div style={{
          position: 'absolute', bottom: 110, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10,12,20,0.92)',
          border: `1px solid ${filterToast.color}55`,
          borderRadius: 999,
          padding: '7px 20px',
          color: filterToast.color,
          fontSize: '0.84rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 30,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px ${filterToast.color}22`,
          animation: 'filterToastIn 0.22s cubic-bezier(0.22,1,0.36,1) both',
          letterSpacing: '0.02em',
        }}>
          {filterToast.text}
        </div>
      )}

      {/* Layer filter bar */}
      {mapReady && (
        <div className="globe-layer-bar" role="tablist" aria-label="Globe layer filter">
          {LAYER_DEFS.map((def) => {
            const isActive = activeLayer === def.id;
            const isAnimating = animatingLayer === def.id;
            return (
              <button
                key={def.id}
                role="tab"
                aria-selected={isActive}
                className={`globe-layer-pill${isActive ? ' active' : ''}${isAnimating ? ' animating' : ''}`}
                style={isActive ? {
                  background: accent,
                  // @ts-ignore CSS custom property
                  '--pill-glow': `${accent}55`,
                } : {}}
                onClick={() => handleLayerChange(def.id)}
              >
                <span className="globe-layer-pill-icon">{def.icon}</span>
                <span className="globe-layer-pill-label">{def.label}</span>
                {dataLoaded && layerCount[def.id] > 0 && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.75, marginLeft: 1 }}>
                    {layerCount[def.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default WorldMap;
