import type { ConcertGenre } from '@/core/types';

/** Everything that makes one concert night visually + tonally distinct. */
export interface ConcertDef {
  readonly genre: ConcertGenre;
  /** Swedish genre label for the poster / HUD. */
  readonly label: string;
  /** Fictional headliner playing tonight. */
  readonly band: string;
  /** Primary stage light colour. */
  readonly light: string;
  /** Secondary wash colour. */
  readonly wash: string;
  /** Backdrop / poster panel colour. */
  readonly backdrop: string;
  /** HUD music line (with emoji). */
  readonly music: string;
  /** Extra patrons in the crowd vs. a normal club. */
  readonly crowd: number;
  /** Crowd energy 0..1 — drives bounce/headbang amplitude. */
  readonly energy: number;
  /** Beat tempo (rad/s) for light + crowd animation. */
  readonly bpm: number;
  /** How much haze fills the room (emissive fog planes). */
  readonly haze: number;
}

export const CONCERTS: Record<ConcertGenre, ConcertDef> = {
  blackmetal: {
    genre: 'blackmetal',
    label: 'Black metal',
    band: 'Grafvitnir',
    light: '#c02020',
    wash: '#3a0d0d',
    backdrop: '#0a0a0c',
    music: '🤘 Black metal — blast beats',
    crowd: 6,
    energy: 1.0,
    bpm: 11,
    haze: 0.7,
  },
  hiphop: {
    genre: 'hiphop',
    label: 'Hiphop',
    band: 'Göteborgs Finest',
    light: '#e0a020',
    wash: '#2a1c00',
    backdrop: '#141018',
    music: '🎤 Hiphop — tunga beats',
    crowd: 8,
    energy: 0.8,
    bpm: 5.4,
    haze: 0.35,
  },
  indie: {
    genre: 'indie',
    label: 'Indie',
    band: 'Kajsa & Kometerna',
    light: '#4fd0c0',
    wash: '#0d2a2f',
    backdrop: '#161c22',
    music: '🎸 Indie — jingel-jangel',
    crowd: 4,
    energy: 0.55,
    bpm: 4.2,
    haze: 0.25,
  },
  singer: {
    genre: 'singer',
    label: 'Singer-songwriter',
    band: 'Elin Vira',
    light: '#e8c060',
    wash: '#2a2010',
    backdrop: '#1a1712',
    music: '🎶 Singer-songwriter — akustiskt',
    crowd: 2,
    energy: 0.3,
    bpm: 2.6,
    haze: 0.15,
  },
  techno: {
    genre: 'techno',
    label: 'Techno',
    band: 'DJ Hisingen',
    light: '#7f5fff',
    wash: '#12081f',
    backdrop: '#0c0a14',
    music: '🪩 Techno — 4/4 kick',
    crowd: 9,
    energy: 0.95,
    bpm: 7.2,
    haze: 0.55,
  },
};

const GENRES: readonly ConcertGenre[] = ['blackmetal', 'hiphop', 'indie', 'singer', 'techno'];

/** Small deterministic string hash (FNV-1a) so a date+venue maps to a stable genre. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The concert playing at `venueId` on the given calendar day. Deterministic per
 * (venue, date): Pustervik and Stora Teatern get different bills on the same
 * night, and each venue rotates genre day to day — sometimes black metal,
 * sometimes hiphop, indie, singer-songwriter or techno.
 */
export function currentConcert(venueId: string, date: Date = new Date()): ConcertDef {
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const idx = hash(`${venueId}|${day}`) % GENRES.length;
  return CONCERTS[GENRES[idx]!];
}
