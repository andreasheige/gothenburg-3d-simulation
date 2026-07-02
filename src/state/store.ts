import { create } from 'zustand';
import { ITEMS } from '@/core/config/items';
import { project } from '@/domain/geo/meta';
import { geo } from '@/core/systems/geoWorld';
import { VENUES } from '@/domain/venues';
import type {
  Interaction,
  ItemId,
  Landmark,
  SceneId,
  Shop,
  Toast,
  ToastKind,
  TramRuntime,
  Venue,
} from '@/core/types';

// Initial spawn: Brunnsparken, the central transit hub. Refined against real
// building collision once the OSM world has loaded (see resolveSpawn).
const SPAWN = project(11.967, 57.7072);

/**
 * Snap the spawn to the nearest walkable spot (spiral search in metres) so the
 * player never starts inside a building footprint. Call after the geo world loads.
 */
export function resolveSpawn(): void {
  const w = geo();
  const step = 4;
  for (let r = 0; r < 80; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = SPAWN.x + dx * step;
        const z = SPAWN.z + dy * step;
        if (!w.blocked(x, z, 1.2)) {
          player.x = x;
          player.z = z;
          player.spawn.x = x;
          player.spawn.z = z;
          return;
        }
      }
    }
  }
}

/** Live player transform mutated every frame, read by systems (kept out of React state). */
export interface PlayerTransform {
  x: number;
  z: number;
  angle: number;
  vx: number;
  vz: number;
  onTram: TramRuntime | null;
  spawn: { x: number; z: number };
}

// Non-reactive shared player transform. Kept out of the reactive store to avoid
// per-frame re-renders.
export const player: PlayerTransform = {
  x: SPAWN.x,
  z: SPAWN.z,
  angle: 0,
  vx: 0,
  vz: 0,
  onTram: null,
  spawn: { x: SPAWN.x, z: SPAWN.z },
};

let toastId = 0;

export interface GameState {
  // --- world state ---
  scene: SceneId;
  interiorId: string | null;
  dayT: number;
  paused: boolean;

  // --- player economy ---
  wallet: number;
  score: number;
  wanted: number;
  inventory: Partial<Record<ItemId, number>>;
  district: string;

  // --- interaction / feedback ---
  nearby: Interaction | null;
  toasts: Toast[];
  riding: string | null;

  // --- actions ---
  advanceTime: (dt: number, dayLength: number) => void;
  setDistrict: (d: string) => void;
  setNearby: (n: Interaction | null) => void;
  setRiding: (id: string | null) => void;
  earn: (n: number) => void;
  pay: (n: number) => boolean;
  addItem: (id: ItemId, k?: number) => void;
  removeItem: (id: ItemId, k?: number) => void;
  hasItem: (id: ItemId) => boolean;
  addScore: (n: number) => void;
  addWanted: (n: number, reason?: string) => void;
  decayWanted: (dt: number) => void;
  clearWanted: () => void;
  toast: (msg: string, kind?: ToastKind) => void;
  enterInterior: (venueId: string) => void;
  exitInterior: () => void;
  buyFromShop: (shop: Shop) => void;
  buyDrink: (venue: Venue) => void;
  pickpocket: () => void;
  giveChange: () => void;
  visitLandmark: (lm: Landmark) => void;
  boardTram: (tram: TramRuntime) => void;
  exitTram: (stationName: string) => void;
}

export const useGame = create<GameState>()((set, get) => ({
  // --- world state ---
  scene: 'city',
  interiorId: null,
  dayT: 20 / 24, // start at 20:00 for nightlife vibes
  paused: false,

  // --- player economy ---
  wallet: 320,
  score: 0,
  wanted: 0,
  inventory: { ticket: 1, korv: 0 },
  district: 'Järntorget',

  // --- interaction / feedback ---
  nearby: null,
  toasts: [],
  riding: null,

  // ---------- time ----------
  advanceTime: (dt, dayLength) => set((s) => ({ dayT: (s.dayT + dt / dayLength) % 1 })),

  setDistrict: (d) => {
    if (get().district !== d) set({ district: d });
  },
  setNearby: (n) => set({ nearby: n }),
  setRiding: (id) => set({ riding: id }),

  // ---------- money / items ----------
  earn: (n) => set((s) => ({ wallet: s.wallet + n })),
  pay: (n) => {
    if (get().wallet < n) return false;
    set((s) => ({ wallet: s.wallet - n }));
    return true;
  },
  addItem: (id, k = 1) =>
    set((s) => ({ inventory: { ...s.inventory, [id]: (s.inventory[id] ?? 0) + k } })),
  removeItem: (id, k = 1) =>
    set((s) => {
      const cur = s.inventory[id] ?? 0;
      const next = Math.max(0, cur - k);
      const inv = { ...s.inventory };
      if (next <= 0) delete inv[id];
      else inv[id] = next;
      return { inventory: inv };
    }),
  hasItem: (id) => (get().inventory[id] ?? 0) > 0,
  addScore: (n) => set((s) => ({ score: s.score + n })),

  // ---------- wanted level ----------
  addWanted: (n, reason) => {
    set((s) => ({ wanted: Math.min(5, s.wanted + n) }));
    if (reason) get().toast(`⚠ ${reason}`, 'bad');
  },
  decayWanted: (dt) =>
    set((s) => (s.wanted > 0 ? { wanted: Math.max(0, s.wanted - dt * 0.03) } : {})),
  clearWanted: () => set({ wanted: 0 }),

  // ---------- toasts ----------
  toast: (msg, kind = 'info') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3800);
  },

  // ---------- scene transitions ----------
  enterInterior: (venueId) => {
    const v = VENUES.find((x) => x.id === venueId);
    if (!v) return;
    set({ scene: 'interior', interiorId: venueId });
    get().toast(`Du gick in på ${v.name}.`, 'info');
  },
  exitInterior: () => {
    const v = VENUES.find((x) => x.id === get().interiorId);
    set({ scene: 'city', interiorId: null });
    if (v) {
      // Place the player just outside the door.
      player.x = v.x;
      player.z = v.z + 3;
    }
  },

  // ---------- commerce actions ----------
  buyFromShop: (shop) => {
    const g = get();
    if (shop.buysLoot) {
      let total = 0;
      let sold = 0;
      const inv = { ...g.inventory };
      for (const id of Object.keys(inv) as ItemId[]) {
        const it = ITEMS[id];
        const qty = inv[id] ?? 0;
        if (it.sellable && qty > 0) {
          const unit = id === 'wallet' ? 30 + Math.floor(Math.random() * 40) : it.price;
          total += unit * qty;
          sold += qty;
          delete inv[id];
        }
      }
      if (sold > 0) {
        set({ inventory: inv, wallet: g.wallet + total, score: g.score + Math.round(total / 10) });
        g.toast(`Sålde ${sold} sak(er) för ${total} kr på Pantbanken.`, 'good');
      } else {
        g.toast('Du har inget att sälja här.', 'warn');
      }
      return;
    }
    for (const id of shop.sells) {
      const it = ITEMS[id];
      if (g.wallet >= it.price) {
        if (g.pay(it.price)) {
          g.addItem(id);
          g.addScore(3);
          g.toast(`Köpte ${it.icon} ${it.label} (${it.price} kr).`, 'good');
        }
        return;
      }
    }
    g.toast('Inte råd med något här just nu.', 'warn');
  },

  buyDrink: (venue) => {
    const g = get();
    const sells = venue.sells;
    const id: ItemId = sells.includes('drink') && g.wallet >= ITEMS.drink.price ? 'drink' : 'beer';
    const it = ITEMS[id];
    if (g.wallet < it.price) {
      g.toast(`Inte råd med ${it.label} här.`, 'warn');
      return;
    }
    if (!g.pay(it.price)) return;
    g.addItem(id);
    const hour = (g.dayT * 24) % 24;
    const night = hour >= 20 || hour < 4;
    const bonus = 5 + (venue.kind === 'club' ? 5 : 0) + (night ? 8 : 0);
    g.addScore(bonus);
    g.toast(`${it.icon} ${it.label} på ${venue.name}. +${bonus} poäng.`, 'good');
    if (night && venue.kind === 'club' && Math.random() < 0.15) {
      g.addWanted(1.0, 'Fyllestök utanför klubben');
    }
  },

  pickpocket: () => {
    const g = get();
    const loot: ItemId = Math.random() < 0.5 ? 'wallet' : 'souvenir';
    g.addItem(loot);
    const cash = 20 + Math.floor(Math.random() * 70);
    set({ wallet: g.wallet + cash });
    g.addWanted(1.5, 'Ficktjuveri — polisen är alarmerad!');
    g.toast(`Du rånade en turist: +${cash} kr + ${ITEMS[loot].icon}.`, 'bad');
  },

  giveChange: () => {
    const g = get();
    if (g.wallet < 5) {
      g.toast('Du har ingen växel att ge.', 'warn');
      return;
    }
    set({ wallet: g.wallet - 5, score: g.score + 8 });
    g.toast('Du gav 5 kr. (+8 poäng, god karma)', 'good');
  },

  visitLandmark: (lm) => {
    const g = get();
    g.addScore(10);
    g.toast(`📸 Du besökte ${lm.name}! (+10 poäng)`, 'good');
  },

  boardTram: (tram) => {
    const g = get();
    if (g.hasItem('ticket')) {
      g.removeItem('ticket');
      g.toast(`Ombord på ${tram.line.name}. Biljett stämplad.`, 'good');
    } else {
      g.addWanted(1.0, 'Plankning utan biljett!');
    }
    player.onTram = tram;
    set({ riding: tram.line.id });
  },
  exitTram: (stationName) => {
    const g = get();
    player.onTram = null;
    set({ riding: null });
    g.addScore(6);
    g.toast(`Steg av vid ${stationName}. (+6 poäng)`, 'good');
  },
}));
