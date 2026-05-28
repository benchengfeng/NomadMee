export type DashboardTheme = {
  background: string;
  surface: string;
  accent: string;
  accentSoft: string;
  text: string;
  secondaryText: string;
  panelGlow: string;
};

export const dashboardThemes: DashboardTheme[] = [
  {
    background: '#06131F',
    surface: '#0F2434',
    accent: '#4ED3C9',
    accentSoft: '#1E7F8B',
    text: '#F3F7FB',
    secondaryText: '#B8D9EA',
    panelGlow: 'rgba(78, 211, 201, 0.14)',
  },
  {
    background: '#120F1C',
    surface: '#251D33',
    accent: '#F48FB1',
    accentSoft: '#B57CA3',
    text: '#FDF8FB',
    secondaryText: '#D9C9E3',
    panelGlow: 'rgba(244, 143, 177, 0.16)',
  },
  {
    background: '#0F1E2A',
    surface: '#162834',
    accent: '#F2C94C',
    accentSoft: '#7C6B32',
    text: '#F2F7FA',
    secondaryText: '#D7D9E0',
    panelGlow: 'rgba(242, 201, 76, 0.16)',
  },
  {
    background: '#1B202D',
    surface: '#273046',
    accent: '#86E6B8',
    accentSoft: '#4C8F72',
    text: '#E9F1F8',
    secondaryText: '#B7C7D8',
    panelGlow: 'rgba(134, 230, 184, 0.16)',
  },
];
