import type { District, Tile } from '@/core/types';

// District zones (tile rectangles) used for ground colouring, building density and labels.
export const DISTRICTS: readonly District[] = [
  { id: 'eriksberg', name: 'Eriksberg', rect: [0, 0, 20, 7], kind: 'industrial', color: '#5a6470' },
  { id: 'lindholmen', name: 'Lindholmen', rect: [20, 0, 42, 7], kind: 'urban', color: '#5f6b78' },
  { id: 'kvillebacken', name: 'Kvillebäcken', rect: [42, 0, 60, 7], kind: 'urban', color: '#5a6672' },
  { id: 'nordstan', name: 'Nordstan', rect: [30, 12, 40, 17], kind: 'urban', color: '#7a6f5a' },
  { id: 'centralen', name: 'Centralstationen', rect: [23, 12, 30, 16], kind: 'urban', color: '#726a58' },
  { id: 'brunns', name: 'Brunnsparken', rect: [26, 16, 34, 20], kind: 'urban', color: '#7d7360' },
  { id: 'inomvallgr', name: 'Inom Vallgraven', rect: [24, 17, 34, 24], kind: 'urban', color: '#7c7058' },
  { id: 'avenyn', name: 'Kungsportsavenyn', rect: [29, 21, 36, 40], kind: 'urban', color: '#84775c' },
  { id: 'lorensberg', name: 'Lorensberg', rect: [34, 30, 44, 42], kind: 'urban', color: '#7a7058' },
  { id: 'jarntorget', name: 'Järntorget', rect: [8, 19, 20, 24], kind: 'urban', color: '#77694f' },
  { id: 'haga', name: 'Haga', rect: [12, 24, 22, 31], kind: 'urban', color: '#8a6a45' },
  { id: 'langgator', name: 'Långgatorna', rect: [4, 23, 16, 29], kind: 'urban', color: '#6f5f48' },
  { id: 'linne', name: 'Linnéstaden', rect: [4, 24, 14, 33], kind: 'urban', color: '#77694f' },
  { id: 'masthugget', name: 'Masthugget', rect: [2, 28, 14, 34], kind: 'urban', color: '#6c6152' },
  { id: 'majorna', name: 'Majorna', rect: [0, 32, 16, 45], kind: 'urban', color: '#6a6552' },
  { id: 'slottskogen', name: 'Slottskogen', rect: [1, 11, 14, 23], kind: 'park', color: '#3f6a30' },
  { id: 'vasastan', name: 'Vasastan', rect: [20, 25, 30, 33], kind: 'urban', color: '#7f7058' },
  { id: 'korsvagen', name: 'Korsvägen', rect: [40, 30, 52, 40], kind: 'urban', color: '#77694f' },
  { id: 'liseberg', name: 'Liseberg', rect: [42, 27, 54, 40], kind: 'park', color: '#4a7a35' },
  { id: 'orgryte', name: 'Örgryte', rect: [56, 38, 72, 50], kind: 'suburb', color: '#5f7040' },
  { id: 'redberg', name: 'Redbergslid', rect: [52, 14, 62, 22], kind: 'urban', color: '#6f6450' },
  { id: 'gamlestaden', name: 'Gamlestaden', rect: [60, 10, 72, 20], kind: 'urban', color: '#6c6152' },
  { id: 'kviberg', name: 'Kviberg', rect: [74, 10, 88, 20], kind: 'park', color: '#456a33' },
  { id: 'kortedala', name: 'Kortedala', rect: [80, 12, 90, 20], kind: 'suburb', color: '#63705a' },
  { id: 'bergsjon', name: 'Bergsjön', rect: [88, 16, 98, 26], kind: 'suburb', color: '#5c6a4c' },
  { id: 'angered', name: 'Angered', rect: [92, 10, 102, 20], kind: 'suburb', color: '#5f6660' },
  { id: 'frolunda', name: 'Frölunda', rect: [22, 50, 42, 64], kind: 'suburb', color: '#5a6660' },
];

/** True if a tile row falls inside the river (water) band. */
export function isRiverRow(cy: Tile): boolean {
  return cy >= 8 && cy < 12;
}
