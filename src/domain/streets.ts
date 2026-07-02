import type { Road, Street } from '@/core/types';

// Real street-name labels drawn floating over the roads.
// dir: 'h' (runs east-west) or 'v' (runs north-south).
export const STREETS: readonly Street[] = [
  { name: 'Kungsportsavenyn', cx: 33, cy: 30, dir: 'v' },
  { name: 'Första Långgatan', cx: 10, cy: 23, dir: 'h' },
  { name: 'Andra Långgatan', cx: 11, cy: 25, dir: 'h' },
  { name: 'Tredje Långgatan', cx: 10, cy: 27, dir: 'h' },
  { name: 'Fjärde Långgatan', cx: 10, cy: 28, dir: 'h' },
  { name: 'Järntorgsgatan', cx: 13, cy: 21, dir: 'h' },
  { name: 'Haga Nygata', cx: 16, cy: 28, dir: 'h' },
  { name: 'Linnégatan', cx: 9, cy: 30, dir: 'v' },
  { name: 'Övre Husargatan', cx: 14, cy: 23, dir: 'h' },
  { name: 'Vallgatan', cx: 28, cy: 20, dir: 'h' },
  { name: 'Magasinsgatan', cx: 29, cy: 18, dir: 'h' },
  { name: 'Vasagatan', cx: 30, cy: 27, dir: 'h' },
  { name: 'Kungsgatan', cx: 26, cy: 22, dir: 'h' },
  { name: 'Nya Allén', cx: 35, cy: 20, dir: 'h' },
  { name: 'Södra vägen', cx: 36, cy: 33, dir: 'v' },
  { name: 'Hisingsbron', cx: 31, cy: 10, dir: 'v' },
];

// Major road segments (tile polylines) rendered as asphalt ribbons.
export const ROADS: readonly Road[] = [
  // Central east-west spine (Norra Hamngatan / Kungsgatan corridor)
  { pts: [[4, 18], [30, 18], [60, 18], [100, 18]], w: 2.4 },
  // Avenyn (Kungsportsplatsen -> Götaplatsen)
  { pts: [[32, 18], [32, 40]], w: 2.4 },
  // Långgatorna / Linné corridor
  { pts: [[4, 24], [16, 24]], w: 1.6 },
  { pts: [[4, 26], [16, 26]], w: 1.6 },
  { pts: [[8, 18], [8, 44]], w: 1.8 },
  // Järntorget hub
  { pts: [[12, 18], [12, 30]], w: 1.8 },
  // Korsvägen / Liseberg / Mölndal
  { pts: [[32, 34], [44, 34], [52, 34]], w: 2.0 },
  { pts: [[44, 34], [50, 44]], w: 1.8 },
  // Bridge over the river to Hisingen
  { pts: [[31, 4], [31, 18]], w: 2.2 },
  { pts: [[27, 13], [33, 13], [33, 4]], w: 1.8 },
  // Eastern arterial to Gamlestaden / Kviberg / Angered
  { pts: [[30, 18], [58, 18], [66, 14], [78, 14], [96, 15]], w: 2.2 },
  // South to Frölunda
  { pts: [[32, 40], [32, 58]], w: 2.0 },
  // Majorna / Kungssten
  { pts: [[4, 34], [16, 34]], w: 1.6 },
];
