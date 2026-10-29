import { ModeId } from '../engine/types';

export type ColorScheme = 'light' | 'dark';

export interface AppPalette {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textDim: string;
  teal: string;
  crimson: string;
  amber: string;
  blue: string;
  accent: string;
  success: string;
  personal: string;
  business: string;
  essentials: string;
  track: string;
  overlay: string;
  grid: string;
}

export const palettes: Record<ColorScheme, AppPalette> = {
  light: {
    bg: '#F5F7F7',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF2F2',
    border: '#DEE5E4',
    text: '#172033',
    textDim: '#637087',
    teal: '#25804A',
    crimson: '#C83F50',
    amber: '#80552E',
    blue: '#637F98',
    accent: '#25804A',
    success: '#25804A',
    personal: '#637F98',
    business: '#80552E',
    essentials: '#25804A',
    track: '#E8EEEC',
    overlay: 'rgba(255,255,255,0.96)',
    grid: 'rgba(23,32,51,0.10)',
  },
  dark: {
    bg: '#0B1220',
    surface: '#111C2E',
    surfaceMuted: '#1A2940',
    border: '#26364E',
    text: '#F0F4FA',
    textDim: '#A4B1C4',
    teal: '#67C98B',
    crimson: '#F06B7A',
    amber: '#C99A6A',
    blue: '#91B0C7',
    accent: '#67C98B',
    success: '#67C98B',
    personal: '#91B0C7',
    business: '#C99A6A',
    essentials: '#67C98B',
    track: '#26364E',
    overlay: 'rgba(17,28,46,0.97)',
    grid: 'rgba(240,244,250,0.12)',
  },
};

export interface ModeTheme {
  id: ModeId;
  name: string;
  icon: string;
  accent: string;
  accent2: string;
  radius: number;
}

export const modeThemes: Record<ModeId, ModeTheme> = {
  seed: { id: 'seed', name: 'Essentials', icon: 'wallet-outline', accent: '#25804A', accent2: '#25804A', radius: 16 },
  growth: { id: 'growth', name: 'Personal', icon: 'person-outline', accent: '#637F98', accent2: '#637F98', radius: 16 },
  vanguard: { id: 'vanguard', name: 'Business', icon: 'business-outline', accent: '#80552E', accent2: '#80552E', radius: 12 },
};

const CATEGORY_COLORS = {
  light: ['#6F9B8C', '#C18A5A', '#7F8EAB', '#9B7D9D', '#B66E68', '#6D9AAA', '#8E9872', '#A67F68', '#5D8F86', '#AE8293', '#7D90A6', '#B08D53'],
  dark: ['#83B6A4', '#D6A36F', '#9EAFCE', '#C19AC3', '#D88980', '#83B9C9', '#AAB68B', '#C1967A', '#78B2A7', '#D1A0B1', '#9DADC4', '#D2AE6F'],
} as const;

export const categoryColor = (categoryId: string, scheme: ColorScheme, index?: number): string => {
  if (index !== undefined) return CATEGORY_COLORS[scheme][index % CATEGORY_COLORS[scheme].length];
  let hash = 0;
  for (const character of categoryId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return CATEGORY_COLORS[scheme][hash % CATEGORY_COLORS[scheme].length];
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const font = { tiny: 11, small: 13, body: 15, h3: 18, h2: 22, h1: 30, hero: 38 };
