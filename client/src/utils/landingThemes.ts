export type LandingThemePalette = {
  name: string;
  background: string;
  surface: string;
  accent: string;
  accentSoft: string;
  border: string;
  text: string;
  highlight: string;
};

export const landingThemes: LandingThemePalette[] = [
  {
    name: 'Classic pirate',
    background: '#000000',
    surface: '#1A1A1A',
    accent: '#A70000',
    accentSoft: '#907163',
    border: '#FFD700',
    text: '#FFFFFF',
    highlight: '#FFD700',
  },
  {
    name: 'Soft sand',
    background: '#EAE7DC',
    surface: '#FDF9F4',
    accent: '#8E8D8A',
    accentSoft: '#D8C3A5',
    border: '#E98074',
    text: '#1B1B1B',
    highlight: '#E85A4F',
  },
  {
    name: 'Sunset coral',
    background: '#E27D60',
    surface: '#F6B1A2',
    accent: '#85DCBA',
    accentSoft: '#C38D9E',
    border: '#FFFFFF',
    text: '#2B1B1A',
    highlight: '#41B3A3',
  },
  {
    name: 'Midnight pulse',
    background: '#0C0032',
    surface: '#150648',
    accent: '#240090',
    accentSoft: '#3500D3',
    border: '#FFFFFF',
    text: '#FFFFFF',
    highlight: '#FFE400',
  },
  {
    name: 'Starlight noir',
    background: '#1A1A1D',
    surface: '#2A2A30',
    accent: '#6F2232',
    accentSoft: '#950740',
    border: '#C3073F',
    text: '#FFFFFF',
    highlight: '#FFFFFF',
  },
  {
    name: 'Golden grain',
    background: '#D79922',
    surface: '#F2E0A8',
    accent: '#F13C20',
    accentSoft: '#4056A1',
    border: '#FFFFFF',
    text: '#1F1F1F',
    highlight: '#FFFFFF',
  },
  {
    name: 'Neon street',
    background: '#272727',
    surface: '#383838',
    accent: '#FF652F',
    accentSoft: '#FFE400',
    border: '#14A76C',
    text: '#FFFFFF',
    highlight: '#FFE400',
  },
  {
    name: 'Green route',
    background: '#61892F',
    surface: '#76963B',
    accent: '#222629',
    accentSoft: '#474B4F',
    border: '#86C232',
    text: '#FFFFFF',
    highlight: '#FFFFFF',
  },
];
