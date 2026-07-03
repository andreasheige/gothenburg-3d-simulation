import type {
  DistrictKind,
  InteractionKind,
  ItemId,
  LandmarkType,
  ShopKind,
  StationId,
  StreetDir,
  ToastKind,
  VenueKind,
  VenueTheme,
} from './ids';

/**
 * Coordinate aliases. `Tile` values live on the 2D design grid; `World` values are
 * three.js world units. They are documentation-level aliases (not branded) so the
 * heavy tile<->world arithmetic stays ergonomic while still reading intentionally.
 */
export type Tile = number;
export type World = number;

/** A `[cx, cy]` tile coordinate pair. */
export type TilePoint = readonly [Tile, Tile];

/** A `[x0, y0, x1, y1]` tile rectangle (half-open on the far edges). */
export type TileRect = readonly [Tile, Tile, Tile, Tile];

/** A purchasable / carryable item. */
export interface Item {
  readonly icon: string;
  readonly label: string;
  readonly price: number;
  readonly food?: boolean;
  readonly sellable?: boolean;
}

/** A coloured district zone used for ground tinting, labels and building density. */
export interface District {
  readonly id: string;
  readonly name: string;
  readonly rect: TileRect;
  readonly kind: DistrictKind;
  readonly color: string;
}

/** A tram/bus stop anchored to a tile coordinate. */
export interface Station {
  readonly name: string;
  readonly cx: Tile;
  readonly cy: Tile;
}

/** A tram line: coloured polyline of tile waypoints plus the stops it calls at. */
export interface TramLine {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly waypoints: readonly TilePoint[];
  readonly stops: readonly StationId[];
}

/** A bus line: coloured polyline of tile waypoints (no station dwell logic). */
export interface BusLine {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly waypoints: readonly TilePoint[];
}

/** An enterable nightlife venue with its own interior scene. */
export interface Venue {
  readonly id: string;
  readonly name: string;
  readonly kind: VenueKind;
  readonly x: World;
  readonly z: World;
  readonly theme: VenueTheme;
  readonly sells: readonly ItemId[];
}

/** A non-enterable shop/kiosk/cafe/pawnshop sold at the door. */
export interface Shop {
  readonly id: string;
  readonly name: string;
  readonly kind: ShopKind;
  readonly x: World;
  readonly z: World;
  readonly sells: readonly ItemId[];
  readonly buysLoot?: boolean;
}

/** A 3D landmark placed around the city. */
export interface Landmark {
  readonly id: string;
  readonly name: string;
  readonly type: LandmarkType;
  readonly x: World;
  readonly z: World;
  /** When true, pressing E enters a dedicated interior scene instead of a photo. */
  readonly enterable?: boolean;
}

/** A floating street-name label. */
export interface Street {
  readonly name: string;
  readonly cx: Tile;
  readonly cy: Tile;
  readonly dir: StreetDir;
}

/** A road segment rendered as an asphalt ribbon. */
export interface Road {
  readonly pts: readonly TilePoint[];
  readonly w: number;
}

/** Interior theming for a venue theme. */
export interface Theme {
  readonly label: string;
  readonly floor: string;
  readonly wall: string;
  readonly accent: string;
  readonly ambient: string;
  readonly stage: boolean;
  readonly dancefloor: boolean;
  readonly music: string;
}

/** A generated building footprint (world-space, produced by worldgen). */
export interface Building {
  readonly x: World;
  readonly z: World;
  readonly w: number;
  readonly d: number;
  readonly h: number;
  readonly color: string;
  readonly roof: boolean;
  readonly cx: Tile;
  readonly cy: Tile;
}

/** A live mutable 2D position shared between systems (kept out of React state). */
export interface Vec2 {
  x: World;
  z: World;
}

/** Runtime state of a single tram, registered so systems can query dwell/doors. */
export interface TramRuntime {
  readonly line: { readonly id: string; readonly name: string; readonly color: string };
  dir: 1 | -1;
  dwell: number;
  dist: number;
  lastStopD: number;
  stationName: string;
  doorsOpen: boolean;
  pos: Vec2;
  /** World heading (radians), so the rider camera + cabin can orient. */
  angle: number;
}

/** Runtime state of a pickpocketable tourist, registered for proximity checks. */
export interface TouristRuntime {
  x: World;
  z: World;
  harassed: number;
}

/** A proximity interaction candidate surfaced to the HUD. */
export interface Interaction {
  readonly kind: InteractionKind;
  readonly label: string;
  readonly ref?: unknown;
}

/** A transient on-screen toast message. */
export interface Toast {
  readonly id: number;
  readonly msg: string;
  readonly kind: ToastKind;
}
