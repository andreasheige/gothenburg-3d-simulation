import type { Theme, VenueTheme } from '@/core/types';

// Interior theming per venue theme. Drives décor, lighting colour and music.
export const THEMES: Record<VenueTheme, Theme> = {
  pub: {
    label: 'Pub', floor: '#4a3524', wall: '#5c4632', accent: '#e0a24f',
    ambient: '#ffdca8', stage: false, dancefloor: false, music: 'Snack & öl',
  },
  rock: {
    label: 'Rockklubb', floor: '#1c1c22', wall: '#2a2a33', accent: '#c1272d',
    ambient: '#ff7060', stage: true, dancefloor: false, music: '🎸 Live rock',
  },
  jazz: {
    label: 'Jazzklubb', floor: '#191f2b', wall: '#22303f', accent: '#4f8fd0',
    ambient: '#6fa8e0', stage: true, dancefloor: false, music: '🎷 Live jazz',
  },
  disco: {
    label: 'Nattklubb', floor: '#14121c', wall: '#241a2e', accent: '#ff4fa3',
    ambient: '#b060ff', stage: false, dancefloor: true, music: '🪩 House / disco',
  },
  concert: {
    label: 'Konserthus', floor: '#181820', wall: '#26262f', accent: '#e2762f',
    ambient: '#ffa860', stage: true, dancefloor: true, music: '🎶 Livekonsert',
  },
  cocktail: {
    label: 'Cocktailbar', floor: '#20222a', wall: '#2c2f3a', accent: '#5fd0c0',
    ambient: '#7fe0d0', stage: false, dancefloor: false, music: '🍸 Loungebeats',
  },
};

/** Interior room dimensions (world units). */
export const ROOM = { W: 26, D: 18, H: 5.5 } as const;
