import { project } from '@/domain/geo/meta';

// Fast-travel network. A curated set of central Gothenburg hubs and landmarks
// the player can jump between from the travel menu (key T). Coordinates are
// projected from real lon/lat to world metres.
export interface Portal {
  readonly id: string;
  readonly name: string;
  readonly hint: string;
  readonly color: string;
  readonly x: number;
  readonly z: number;
}

interface PortalSeed {
  readonly id: string;
  readonly name: string;
  readonly hint: string;
  readonly color: string;
  readonly lon: number;
  readonly lat: number;
}

const SEEDS: readonly PortalSeed[] = [
  { id: 'brunnsparken', name: 'Brunnsparken', hint: 'Centrala knutpunkten', color: '#f2c200', lon: 11.967, lat: 57.7072 },
  { id: 'nordstan', name: 'Nordstan', hint: 'Köpcentrum', color: '#1fa0e0', lon: 11.9686, lat: 57.7086 },
  { id: 'centralen', name: 'Centralstationen', hint: 'Tåg & bussar', color: '#e4002b', lon: 11.9736, lat: 57.7089 },
  { id: 'jarntorget', name: 'Järntorget', hint: 'Långgatorna & nöjen', color: '#f58220', lon: 11.9503, lat: 57.6996 },
  { id: 'haga', name: 'Haga', hint: 'Fik & kullersten', color: '#8b5e3c', lon: 11.9552, lat: 57.6989 },
  { id: 'avenyn', name: 'Kungsportsavenyen', hint: 'Paradgatan', color: '#e5007e', lon: 11.9745, lat: 57.7009 },
  { id: 'gotaplatsen', name: 'Götaplatsen', hint: 'Poseidon & kultur', color: '#7a3f9e', lon: 11.9793, lat: 57.6975 },
  { id: 'liseberg', name: 'Liseberg', hint: 'Nöjespark', color: '#009e49', lon: 11.9913, lat: 57.6949 },
  { id: 'slottskogen', name: 'Slottskogen', hint: 'Stadens gröna lunga', color: '#4b9e3a', lon: 11.943, lat: 57.6857 },
  { id: 'feske', name: 'Feskekörka', hint: 'Fiskhallen', color: '#00a0c8', lon: 11.9557, lat: 57.6996 },
  { id: 'lillabommen', name: 'Läppstiftet', hint: 'Hamnen & Operan', color: '#c8a000', lon: 11.969, lat: 57.7115 },
  { id: 'skansen', name: 'Skansen Kronan', hint: 'Utsikt över stan', color: '#a0522d', lon: 11.952, lat: 57.6975 },
];

export const PORTALS: readonly Portal[] = SEEDS.map((s) => {
  const { x, z } = project(s.lon, s.lat);
  return { id: s.id, name: s.name, hint: s.hint, color: s.color, x, z };
});
