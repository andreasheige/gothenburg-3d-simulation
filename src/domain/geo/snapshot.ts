// Typed view over the committed OSM snapshot in public/geo/gothenburg.json,
// plus a loader. Coordinates are already projected to world metres ([x, z]).

/** A projected `[x, z]` point in world metres. */
export type Pt = readonly [number, number];

export interface GeoRoad {
  /** Street name, when tagged. */
  readonly n?: string;
  /** OSM `highway` class. */
  readonly k: string;
  readonly p: readonly Pt[];
}

export interface GeoTramLine {
  readonly ref: string;
  readonly name: string;
  readonly colour: string | null;
  readonly from: string;
  readonly to: string;
  /** Member track ways (each an unordered polyline), stitched at load time. */
  readonly ways: readonly (readonly Pt[])[];
}

export interface GeoArea {
  readonly n?: string;
  readonly k?: string;
  readonly p: readonly Pt[];
}

export interface GeoFerry {
  readonly n: string;
  readonly p: readonly Pt[];
}

export interface GeoBuilding {
  readonly p: readonly Pt[];
  /** Height in metres (0 when untagged; a default is applied at build time). */
  readonly h: number;
}

export interface GeoHood {
  readonly n: string;
  readonly p: Pt;
}

export interface GeoSnapshot {
  readonly roads: readonly GeoRoad[];
  readonly tramTracks: readonly (readonly Pt[])[];
  readonly tramLines: readonly GeoTramLine[];
  readonly ferries: readonly GeoFerry[];
  readonly water: readonly (readonly Pt[])[];
  readonly parks: readonly GeoArea[];
  readonly squares: readonly GeoArea[];
  readonly hoods: readonly GeoHood[];
  readonly buildings: readonly GeoBuilding[];
}

/** Fetch the committed snapshot asset (deterministic, offline-capable). */
export async function loadSnapshot(): Promise<GeoSnapshot> {
  const res = await fetch(`${import.meta.env.BASE_URL}geo/gothenburg.json`);
  if (!res.ok) throw new Error(`Failed to load geo snapshot: HTTP ${res.status}`);
  return (await res.json()) as GeoSnapshot;
}
