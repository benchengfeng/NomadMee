import { landingThemes } from './utils/landingThemes';

export type DashboardTheme = {
  name: string;
  emoji: string;
  background: string;
  surface: string;
  accent: string;
  accentSoft: string;
  text: string;
  secondaryText: string;
  panelGlow: string;
};

export const dashboardThemes: DashboardTheme[] = landingThemes.map((t) => ({
  name:          t.name,
  emoji:         t.emoji,
  background:    t.background,
  surface:       t.surface,
  accent:        t.accent,
  accentSoft:    t.accentSoft,
  text:          t.text,
  secondaryText: t.textMuted,
  panelGlow:     t.glow,
}));
