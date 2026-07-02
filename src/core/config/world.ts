import type { Tile, World } from '@/core/types';

// Core world constants and the tile -> 3D world mapping.
// The tile grid is reused from the original 2D game so the geography stays faithful.

/** World units per tile. */
export const TILE = 4;
export const COLS = 104;
export const ROWS = 68;
export const WORLD_W = COLS * TILE;
export const WORLD_D = ROWS * TILE;

/** River band (Göta Älv) occupies tile rows 8..11 across the whole width. */
export const RIVER_ROW0 = 8;
/** Exclusive upper bound of the river band. */
export const RIVER_ROW1 = 12;

/** Convert tile coords to the world-space centre of that tile. Y is up. */
export function tileToWorld(cx: Tile, cy: Tile): { x: World; z: World } {
  return { x: cx * TILE + TILE / 2, z: cy * TILE + TILE / 2 };
}

/** Tile column -> world X (tile centre). */
export const tx = (cx: Tile): World => cx * TILE + TILE / 2;
/** Tile row -> world Z (tile centre). */
export const tz = (cy: Tile): World => cy * TILE + TILE / 2;

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
} as const;
