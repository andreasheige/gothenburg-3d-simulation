// Core world constants. Geometry now comes from the OSM snapshot (see
// src/domain/geo), so this module only holds palette + time-of-day config.

/** One in-game day lasts this many real seconds. */
export const DAY_LENGTH = 180;

/** Palette + world material colours. */
export const COLORS = {
  grass: '#4b6b3a',
  grassDark: '#3f5d32',
  water: '#2a6b8f',
  waterDeep: '#1d4f6e',
  road: '#3a3f45',
  roadLine: '#c9b458',
  pavement: '#8b9199',
  plaza: '#9a8f7a',
  park: '#4f7a3d',
  sand: '#c9b98f',
  bridge: '#5a5148',
  ground: '#2f3a30',
} as const;
