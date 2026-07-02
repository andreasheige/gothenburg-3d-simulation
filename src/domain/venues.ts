import type { Shop, Venue } from '@/core/types';
import { project } from '@/domain/geo/meta';

// Real Gothenburg nightlife venues at their true lon/lat, projected to world metres.
// Each venue is enterable (has an interior scene).
interface VenueSeed {
  readonly id: string;
  readonly name: string;
  readonly kind: Venue['kind'];
  readonly lon: number;
  readonly lat: number;
  readonly theme: Venue['theme'];
  readonly sells: Venue['sells'];
}

const VENUE_SEEDS: readonly VenueSeed[] = [
  { id: 'pustervik', name: 'Pustervik', kind: 'club', lon: 11.9527, lat: 57.6994, theme: 'concert', sells: ['beer', 'drink'] },
  { id: 'olrepubliken', name: 'Ölrepubliken', kind: 'bar', lon: 11.9505, lat: 57.6992, theme: 'pub', sells: ['beer'] },
  { id: 'brewers', name: 'Brewers Beer Bar', kind: 'bar', lon: 11.949, lat: 57.6997, theme: 'pub', sells: ['beer'] },
  { id: 'santo', name: 'Santo', kind: 'bar', lon: 11.9512, lat: 57.6989, theme: 'cocktail', sells: ['beer', 'drink'] },
  { id: 'nefertiti', name: 'Nefertiti', kind: 'club', lon: 11.9612, lat: 57.7016, theme: 'jazz', sells: ['beer', 'drink'] },
  { id: 'jazzhuset', name: 'Jazzhuset', kind: 'bar', lon: 11.966, lat: 57.6998, theme: 'jazz', sells: ['beer', 'drink'] },
  { id: 'yakida', name: 'Yaki-Da', kind: 'club', lon: 11.9668, lat: 57.6997, theme: 'disco', sells: ['beer', 'drink'] },
  { id: 'storan', name: 'Stora Teatern', kind: 'club', lon: 11.9707, lat: 57.7009, theme: 'concert', sells: ['beer', 'drink'] },
  { id: 'valand', name: 'Valand', kind: 'club', lon: 11.9718, lat: 57.7011, theme: 'disco', sells: ['beer', 'drink'] },
  { id: 'bruce', name: 'Bruce', kind: 'club', lon: 11.972, lat: 57.7005, theme: 'disco', sells: ['beer', 'drink'] },
  { id: 'tradgarn', name: "Trädgår'n", kind: 'club', lon: 11.9767, lat: 57.7006, theme: 'disco', sells: ['beer', 'drink'] },
  { id: 'parklane', name: 'Park Lane', kind: 'club', lon: 11.9761, lat: 57.7015, theme: 'cocktail', sells: ['beer', 'drink'] },
  { id: 'bishops', name: 'Bishops Arms', kind: 'bar', lon: 11.9686, lat: 57.7035, theme: 'pub', sells: ['beer'] },
];

export const VENUES: readonly Venue[] = VENUE_SEEDS.map((v) => {
  const { x, z } = project(v.lon, v.lat);
  return { id: v.id, name: v.name, kind: v.kind, x, z, theme: v.theme, sells: v.sells };
});

interface ShopSeed {
  readonly id: string;
  readonly name: string;
  readonly kind: Shop['kind'];
  readonly lon: number;
  readonly lat: number;
  readonly sells: Shop['sells'];
  readonly buysLoot?: boolean;
}

// Ordinary shops/cafes (not enterable — sold at the door like the 2D game).
const SHOP_SEEDS: readonly ShopSeed[] = [
  { id: 'husaren', name: 'Café Husaren', kind: 'cafe', lon: 11.9563, lat: 57.6999, sells: ['kanelbulle', 'coffee'] },
  { id: 'brunnskorv', name: 'Korvkiosk Brunnsparken', kind: 'kiosk', lon: 11.9668, lat: 57.7069, sells: ['korv', 'coffee'] },
  { id: 'feske', name: 'Feskekörka Fiskdisk', kind: 'fish', lon: 11.9557, lat: 57.6996, sells: ['fish'] },
  { id: 'avenyfik', name: 'Condeco Avenyn', kind: 'cafe', lon: 11.97, lat: 57.701, sells: ['kanelbulle', 'coffee'] },
  { id: 'lisesouv', name: 'Liseberg Souvenir', kind: 'shop', lon: 11.9905, lat: 57.6952, sells: ['souvenir'] },
  { id: 'nordkiosk', name: 'Nordstan Pressbyrå', kind: 'kiosk', lon: 11.9685, lat: 57.7085, sells: ['korv', 'kanelbulle'] },
  { id: 'pant1', name: 'Pantbanken Vasa', kind: 'pawn', lon: 11.963, lat: 57.702, sells: [], buysLoot: true },
  { id: 'hagakorv', name: 'Haga Korvkiosk', kind: 'kiosk', lon: 11.9548, lat: 57.6994, sells: ['korv', 'coffee'] },
  { id: 'majfik', name: 'Majorna Fik', kind: 'cafe', lon: 11.9285, lat: 57.6942, sells: ['kanelbulle', 'coffee'] },
  { id: 'sevenavenyn', name: '7-Eleven Avenyn', kind: 'kiosk', lon: 11.971, lat: 57.7, sells: ['korv', 'coffee'] },
  { id: 'pant2', name: 'Pantbanken Järntorget', kind: 'pawn', lon: 11.9518, lat: 57.6998, sells: [], buysLoot: true },
];

export const SHOPS: readonly Shop[] = SHOP_SEEDS.map((s) => {
  const { x, z } = project(s.lon, s.lat);
  const base = { id: s.id, name: s.name, kind: s.kind, x, z, sells: s.sells };
  return s.buysLoot === undefined ? base : { ...base, buysLoot: s.buysLoot };
});
