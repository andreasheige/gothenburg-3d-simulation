import type { InteriorKind, Venue } from '@/core/types';
import { VENUES } from '@/domain/venues';
import { LANDMARKS } from '@/domain/landmarks';

/**
 * A resolved enterable place. `interiorId` (in the store) is looked up here to
 * decide which interior scene to render and with what data.
 */
export type InteriorDef =
  | { readonly kind: Extract<InteriorKind, 'nightlife'>; readonly id: string; readonly name: string; readonly venue: Venue }
  | { readonly kind: Extract<InteriorKind, 'fishmarket'>; readonly id: string; readonly name: string }
  | { readonly kind: Extract<InteriorKind, 'amusement'>; readonly id: string; readonly name: string };

/** Landmark ids that open a bespoke interior scene rather than a photo. */
export const AMUSEMENT_ID = 'liseberg';
export const FISHMARKET_ID = 'feske';

/** Resolve an `interiorId` to its scene kind + data, or null if not enterable. */
export function resolveInterior(id: string | null): InteriorDef | null {
  if (!id) return null;
  if (id === AMUSEMENT_ID) return { kind: 'amusement', id, name: 'Liseberg' };
  if (id === FISHMARKET_ID) return { kind: 'fishmarket', id, name: 'Feskekörka' };
  const venue = VENUES.find((v) => v.id === id);
  return venue ? { kind: 'nightlife', id, name: venue.name, venue } : null;
}

/** World position to drop the player just outside a place when they leave. */
export function interiorExit(id: string | null): { x: number; z: number } | null {
  if (!id) return null;
  const v = VENUES.find((x) => x.id === id);
  if (v) return { x: v.x, z: v.z + 3 };
  const l = LANDMARKS.find((x) => x.id === id);
  if (l) return { x: l.x, z: l.z + 8 };
  return null;
}

/** Stable per-venue seed so two venues of the same theme never look identical. */
export function venueSeed(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** True for venues that host a live concert (drives the concert-genre visuals). */
export function isConcertVenue(venue: Venue): boolean {
  return venue.theme === 'concert';
}
