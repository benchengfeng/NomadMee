export type LandingThemePalette = {
  name: string;
  emoji: string;
  tagline: string;
  // Core palette (used in existing code too)
  background: string;
  surface: string;
  accent: string;
  accentSoft: string;
  border: string;
  text: string;
  highlight: string;
  // Extended — feed into CSS custom properties
  textMuted: string;
  navBg: string;
  navBorder: string;
  navLinkColor: string;
  cardBg: string;
  cardBorder: string;
  tagBg: string;
  tagText: string;
  glow: string;
  /** CSS gradient string for the fullscreen atmospheric overlay */
  ambient: string;
  /** Whether this is a light-background theme (affects skeleton, muted fallbacks) */
  light?: boolean;
};

export const landingThemes: LandingThemePalette[] = [
  {
    name: "Popeye's Harbor Crew",
    emoji: '⚓',
    tagline: 'Midnight dock. Salt. Danger.',
    background: '#000000',
    surface: '#1A1A1A',
    accent: '#A70000',
    accentSoft: '#907163',
    border: '#FFD700',
    text: '#FFFFFF',
    highlight: '#FFD700',
    textMuted: '#8B7B6B',
    navBg: 'rgba(0,0,0,0.97)',
    navBorder: 'rgba(255,215,0,0.18)',
    navLinkColor: '#8B8B8B',
    cardBg: 'rgba(167,0,0,0.12)',
    cardBorder: 'rgba(255,215,0,0.2)',
    tagBg: 'rgba(255,215,0,0.08)',
    tagText: '#B89B00',
    glow: 'rgba(167,0,0,0.65)',
    ambient:
      'radial-gradient(ellipse at 88% 100%, rgba(167,0,0,0.45) 0%, transparent 55%), radial-gradient(ellipse at 12% 0%, rgba(255,215,0,0.07) 0%, transparent 48%)',
  },
  {
    name: "Olive's Dream Market",
    emoji: '🏺',
    tagline: 'Spice, sun, and warm stone.',
    background: '#EAE7DC',
    surface: '#FDF9F4',
    accent: '#C94C3F',
    accentSoft: '#D8C3A5',
    border: '#E98074',
    text: '#1B1B1B',
    highlight: '#E85A4F',
    light: true,
    textMuted: '#7A6050',
    navBg: 'rgba(234,231,220,0.97)',
    navBorder: 'rgba(232,128,116,0.32)',
    navLinkColor: '#6B5B4E',
    cardBg: 'rgba(253,249,244,0.88)',
    cardBorder: 'rgba(201,76,63,0.28)',
    tagBg: 'rgba(201,76,63,0.1)',
    tagText: '#8B3028',
    glow: 'rgba(232,90,79,0.35)',
    ambient:
      'radial-gradient(ellipse at 50% 110%, rgba(232,128,116,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% -10%, rgba(215,190,150,0.3) 0%, transparent 50%)',
  },
  {
    name: "Curto's Sunset Drift",
    emoji: '🌅',
    tagline: 'The sea glows, time slows.',
    background: '#D96B4A',
    surface: '#F0A896',
    accent: '#41B3A3',
    accentSoft: '#C38D9E',
    border: '#FFFFFF',
    text: '#1E0E0B',
    highlight: '#FFE8D6',
    textMuted: 'rgba(30,14,11,0.58)',
    navBg: 'rgba(185,75,55,0.95)',
    navBorder: 'rgba(255,255,255,0.25)',
    navLinkColor: 'rgba(255,255,255,0.82)',
    cardBg: 'rgba(255,255,255,0.2)',
    cardBorder: 'rgba(255,255,255,0.42)',
    tagBg: 'rgba(65,179,163,0.2)',
    tagText: '#1A6B63',
    glow: 'rgba(65,179,163,0.5)',
    ambient:
      'radial-gradient(ellipse at 50% -5%, rgba(255,220,190,0.45) 0%, transparent 52%), radial-gradient(ellipse at 50% 105%, rgba(65,179,163,0.22) 0%, transparent 52%)',
  },
  {
    name: 'Midnight Navigator',
    emoji: '🧭',
    tagline: 'Stars and electric charts.',
    background: '#0C0032',
    surface: '#150648',
    accent: '#3500D3',
    accentSoft: '#5B20FF',
    border: '#FFE400',
    text: '#FFFFFF',
    highlight: '#FFE400',
    textMuted: '#5B6B9B',
    navBg: 'rgba(10,0,42,0.98)',
    navBorder: 'rgba(53,0,211,0.5)',
    navLinkColor: '#7B8BBB',
    cardBg: 'rgba(53,0,211,0.18)',
    cardBorder: 'rgba(255,228,0,0.22)',
    tagBg: 'rgba(255,228,0,0.09)',
    tagText: '#C4B200',
    glow: 'rgba(255,228,0,0.45)',
    ambient:
      'radial-gradient(ellipse at 62% 38%, rgba(53,0,211,0.45) 0%, transparent 55%), radial-gradient(ellipse at 82% 12%, rgba(255,228,0,0.14) 0%, transparent 38%)',
  },
  {
    name: 'Noir Harbor Spy',
    emoji: '🕵️',
    tagline: 'Rain. Shadows. No witnesses.',
    background: '#111115',
    surface: '#1E1E24',
    accent: '#C3073F',
    accentSoft: '#950740',
    border: '#C3073F',
    text: '#E8E8EE',
    highlight: '#FFFFFF',
    textMuted: '#6A6A78',
    navBg: 'rgba(8,8,12,0.99)',
    navBorder: 'rgba(195,7,63,0.22)',
    navLinkColor: '#787880',
    cardBg: 'rgba(30,30,36,0.95)',
    cardBorder: 'rgba(195,7,63,0.28)',
    tagBg: 'rgba(195,7,63,0.1)',
    tagText: '#C3073F',
    glow: 'rgba(195,7,63,0.6)',
    ambient:
      'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.72) 100%), radial-gradient(ellipse at 72% 82%, rgba(195,7,63,0.28) 0%, transparent 42%)',
  },
  {
    name: 'Golden Trader',
    emoji: '💰',
    tagline: 'Silk roads and golden dust.',
    background: '#C88B10',
    surface: '#EDCC70',
    accent: '#1E3A8A',
    accentSoft: '#4056A1',
    border: '#FFFFFF',
    text: '#1A1008',
    highlight: '#FFFFFF',
    light: true,
    textMuted: '#7A5018',
    navBg: 'rgba(175,118,8,0.97)',
    navBorder: 'rgba(255,255,255,0.25)',
    navLinkColor: 'rgba(26,16,8,0.78)',
    cardBg: 'rgba(255,255,255,0.25)',
    cardBorder: 'rgba(30,58,138,0.28)',
    tagBg: 'rgba(30,58,138,0.14)',
    tagText: '#1E3A8A',
    glow: 'rgba(200,139,16,0.6)',
    ambient:
      'radial-gradient(ellipse at 50% -5%, rgba(255,240,160,0.5) 0%, transparent 55%), radial-gradient(ellipse at 50% 108%, rgba(160,90,0,0.45) 0%, transparent 52%)',
  },
  {
    name: 'Neon Dockhand',
    emoji: '⚡',
    tagline: 'Third shift. Neon burns.',
    background: '#1C1C1C',
    surface: '#2C2C2C',
    accent: '#FF4500',
    accentSoft: '#FFD700',
    border: '#14A76C',
    text: '#F0F0F0',
    highlight: '#FFD700',
    textMuted: '#808070',
    navBg: 'rgba(12,12,12,0.98)',
    navBorder: 'rgba(255,69,0,0.28)',
    navLinkColor: '#888880',
    cardBg: 'rgba(44,44,44,0.92)',
    cardBorder: 'rgba(255,69,0,0.32)',
    tagBg: 'rgba(255,69,0,0.12)',
    tagText: '#FF5520',
    glow: 'rgba(255,69,0,0.6)',
    ambient:
      'radial-gradient(ellipse at 82% 98%, rgba(255,69,0,0.28) 0%, transparent 48%), radial-gradient(ellipse at 18% 15%, rgba(20,167,108,0.12) 0%, transparent 42%)',
  },
  {
    name: 'Verdant Cargo Captain',
    emoji: '🌿',
    tagline: 'Jungle trail. Cargo moving.',
    background: '#2E5016',
    surface: '#3D6820',
    accent: '#86C232',
    accentSoft: '#A8D85A',
    border: '#86C232',
    text: '#F0F8E8',
    highlight: '#D4F088',
    textMuted: 'rgba(240,248,232,0.6)',
    navBg: 'rgba(22,38,10,0.97)',
    navBorder: 'rgba(134,194,50,0.3)',
    navLinkColor: 'rgba(240,248,232,0.68)',
    cardBg: 'rgba(0,0,0,0.22)',
    cardBorder: 'rgba(134,194,50,0.35)',
    tagBg: 'rgba(134,194,50,0.15)',
    tagText: '#86C232',
    glow: 'rgba(134,194,50,0.5)',
    ambient:
      'radial-gradient(ellipse at 50% 108%, rgba(20,40,5,0.6) 0%, transparent 55%), radial-gradient(ellipse at 50% -5%, rgba(134,194,50,0.22) 0%, transparent 48%)',
  },
];
