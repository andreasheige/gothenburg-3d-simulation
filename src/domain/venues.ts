import type { Shop, Venue } from '@/core/types';

// Real Gothenburg nightlife venues. Each is enterable (has an interior scene).
export const VENUES: readonly Venue[] = [
  { id: 'pustervik', name: 'Pustervik', kind: 'club', cx: 11, cy: 21, theme: 'concert', sells: ['beer', 'drink'] },
  { id: 'publik', name: 'Café Publik', kind: 'bar', cx: 10, cy: 24, theme: 'pub', sells: ['beer'] },
  { id: 'rover', name: 'The Rover', kind: 'bar', cx: 12, cy: 24, theme: 'pub', sells: ['beer'] },
  { id: 'holymoly', name: 'Holy Moly', kind: 'bar', cx: 14, cy: 24, theme: 'pub', sells: ['beer'] },
  { id: 'tullen', name: 'Ölstugan Tullen', kind: 'bar', cx: 14, cy: 27, theme: 'pub', sells: ['beer'] },
  { id: 'sticky', name: 'Sticky Fingers', kind: 'club', cx: 24, cy: 22, theme: 'rock', sells: ['beer', 'drink'] },
  { id: 'bishops', name: 'Bishops Arms', kind: 'bar', cx: 28, cy: 19, theme: 'pub', sells: ['beer'] },
  { id: 'nefertiti', name: 'Nefertiti', kind: 'club', cx: 25, cy: 20, theme: 'jazz', sells: ['beer', 'drink'] },
  { id: 'tradgarn', name: "Trädgår'n", kind: 'club', cx: 36, cy: 21, theme: 'disco', sells: ['beer', 'drink'] },
  { id: 'yakida', name: 'Yaki-Da', kind: 'bar', cx: 30, cy: 25, theme: 'cocktail', sells: ['beer', 'drink'] },
  { id: 'valand', name: 'Valand', kind: 'club', cx: 33, cy: 28, theme: 'disco', sells: ['beer', 'drink'] },
  { id: 'parklane', name: 'Park Lane', kind: 'club', cx: 33, cy: 31, theme: 'disco', sells: ['beer', 'drink'] },
];

// Ordinary shops/cafes (not enterable — sold at the door like the 2D game).
export const SHOPS: readonly Shop[] = [
  { id: 'husaren', name: 'Café Husaren', kind: 'cafe', cx: 12, cy: 28, sells: ['kanelbulle', 'coffee'] },
  { id: 'brunnskorv', name: 'Korvkiosk Brunnsparken', kind: 'kiosk', cx: 28, cy: 16, sells: ['korv', 'coffee'] },
  { id: 'feske', name: 'Feskekörka Fiskdisk', kind: 'fish', cx: 18, cy: 13, sells: ['fish'] },
  { id: 'avenyfik', name: 'Avenyn Café', kind: 'cafe', cx: 32, cy: 24, sells: ['kanelbulle', 'coffee'] },
  { id: 'lisesouv', name: 'Liseberg Souvenir', kind: 'shop', cx: 50, cy: 32, sells: ['souvenir'] },
  { id: 'nordkiosk', name: 'Nordstan Kiosk', kind: 'kiosk', cx: 34, cy: 15, sells: ['korv', 'kanelbulle'] },
  { id: 'pant1', name: 'Pantbank', kind: 'pawn', cx: 16, cy: 23, sells: [], buysLoot: true },
  { id: 'linnekorv', name: 'Linné Korvkiosk', kind: 'kiosk', cx: 10, cy: 27, sells: ['korv', 'coffee'] },
  { id: 'majfik', name: 'Majorna Fik', kind: 'cafe', cx: 6, cy: 34, sells: ['kanelbulle', 'coffee'] },
  { id: 'frolshop', name: 'Frölunda Torg', kind: 'shop', cx: 33, cy: 57, sells: ['souvenir'] },
  { id: 'pant2', name: 'Pantbank Gamlestaden', kind: 'pawn', cx: 68, cy: 18, sells: [], buysLoot: true },
];
