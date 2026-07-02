import type { BusLine, Station, StationId, TramLine } from '@/core/types';

// Real Göteborg tram network (stylised onto the tile grid).
// Each station has a tile coordinate; each line lists tile waypoints + the stations it calls at.

export const STATIONS: Record<StationId, Station> = {
  hjalmar: { name: 'Hjalmar Brantingsplatsen', cx: 31, cy: 4 },
  lindholmen: { name: 'Lindholmen', cx: 28, cy: 5 },
  centralen: { name: 'Centralstationen', cx: 27, cy: 13 },
  nordstan: { name: 'Nordstan', cx: 33, cy: 15 },
  brunns: { name: 'Brunnsparken', cx: 30, cy: 18 },
  gronsak: { name: 'Grönsakstorget', cx: 26, cy: 20 },
  kungsport: { name: 'Kungsportsplatsen', cx: 32, cy: 21 },
  vasa: { name: 'Vasaplatsen', cx: 32, cy: 26 },
  valand: { name: 'Valand', cx: 32, cy: 28 },
  korsvagen: { name: 'Korsvägen', cx: 44, cy: 34 },
  liseberg: { name: 'Liseberg', cx: 46, cy: 34 },
  molndal: { name: 'Mölndal', cx: 50, cy: 44 },
  jarntorget: { name: 'Järntorget', cx: 12, cy: 22 },
  hagakyrkan: { name: 'Hagakyrkan', cx: 16, cy: 26 },
  linne: { name: 'Linnéplatsen', cx: 10, cy: 26 },
  masthugget: { name: 'Masthuggstorget', cx: 8, cy: 30 },
  markland: { name: 'Marklandsgatan', cx: 8, cy: 34 },
  mariaplan: { name: 'Mariaplan', cx: 6, cy: 40 },
  kungssten: { name: 'Kungssten', cx: 4, cy: 34 },
  gotaplatsen: { name: 'Götaplatsen', cx: 32, cy: 40 },
  frolunda: { name: 'Frölunda Torg', cx: 32, cy: 58 },
  opaltorget: { name: 'Opaltorget', cx: 28, cy: 60 },
  redberg: { name: 'Redbergsplatsen', cx: 58, cy: 18 },
  gamlestaden: { name: 'Gamlestads Torg', cx: 66, cy: 14 },
  kviberg: { name: 'Kviberg', cx: 78, cy: 14 },
  kortedala: { name: 'Kortedala', cx: 84, cy: 16 },
  bergsjon: { name: 'Bergsjön Komettorget', cx: 92, cy: 20 },
  angered: { name: 'Angered Centrum', cx: 96, cy: 15 },
  ostra: { name: 'Östra Sjukhuset', cx: 55, cy: 26 },
};

export const TRAM_LINES: readonly TramLine[] = [
  {
    id: '1',
    name: 'Spårvagn 1',
    color: '#8f9aa3',
    waypoints: [
      [28, 60], [32, 58], [32, 52], [32, 46], [24, 42], [16, 42], [8, 42], [8, 38], [8, 34], [8, 30],
      [10, 26], [12, 24], [12, 22], [12, 18], [20, 18], [30, 18], [32, 21], [32, 26], [36, 30], [40, 34], [44, 34], [50, 30], [55, 26],
    ],
    stops: ['opaltorget', 'frolunda', 'markland', 'masthugget', 'linne', 'jarntorget', 'brunns', 'kungsport', 'vasa', 'korsvagen', 'ostra'],
  },
  {
    id: '2',
    name: 'Spårvagn 2',
    color: '#f0c020',
    waypoints: [
      [50, 44], [48, 38], [46, 34], [44, 34], [40, 30], [36, 28], [32, 28], [32, 21], [30, 18], [28, 15], [27, 13], [29, 11], [31, 9], [31, 6], [31, 4],
    ],
    stops: ['molndal', 'liseberg', 'korsvagen', 'valand', 'kungsport', 'brunns', 'centralen', 'hjalmar'],
  },
  {
    id: '3',
    name: 'Spårvagn 3',
    color: '#2f6db3',
    waypoints: [
      [8, 34], [8, 30], [10, 26], [12, 22], [12, 18], [24, 18], [30, 18], [33, 15], [40, 16], [52, 17], [58, 18], [62, 16], [66, 14],
    ],
    stops: ['markland', 'masthugget', 'jarntorget', 'brunns', 'nordstan', 'redberg', 'gamlestaden'],
  },
  {
    id: '4',
    name: 'Spårvagn 4',
    color: '#2f8f6d',
    waypoints: [
      [50, 44], [48, 38], [44, 34], [40, 30], [32, 28], [32, 21], [30, 18], [33, 15], [44, 16], [58, 18], [66, 14], [76, 14], [78, 14], [86, 14], [96, 15],
    ],
    stops: ['molndal', 'korsvagen', 'valand', 'kungsport', 'brunns', 'gamlestaden', 'kviberg', 'angered'],
  },
  {
    id: '6',
    name: 'Spårvagn 6',
    color: '#e2762f',
    waypoints: [
      [31, 4], [31, 7], [31, 10], [30, 13], [30, 18], [32, 21], [32, 28], [40, 32], [44, 34], [52, 28], [58, 20], [66, 14], [78, 14], [82, 15], [84, 16],
    ],
    stops: ['hjalmar', 'brunns', 'kungsport', 'valand', 'korsvagen', 'gamlestaden', 'kviberg', 'kortedala'],
  },
  {
    id: '9',
    name: 'Spårvagn 9',
    color: '#17b0a6',
    waypoints: [
      [4, 34], [8, 34], [8, 30], [12, 26], [12, 22], [12, 18], [24, 18], [30, 18], [33, 15], [44, 16], [58, 18], [66, 14], [76, 14], [78, 14], [86, 14], [96, 15],
    ],
    stops: ['kungssten', 'markland', 'jarntorget', 'brunns', 'gamlestaden', 'kviberg', 'angered'],
  },
  {
    id: '11',
    name: 'Spårvagn 11',
    color: '#d0407f',
    waypoints: [
      [6, 40], [8, 38], [8, 34], [8, 30], [12, 26], [12, 22], [12, 18], [24, 18], [30, 18], [32, 21], [32, 28], [40, 32], [44, 34], [52, 28], [62, 20], [78, 14], [86, 16], [92, 20],
    ],
    stops: ['mariaplan', 'markland', 'jarntorget', 'brunns', 'kungsport', 'korsvagen', 'kviberg', 'bergsjon'],
  },
];

export const BUS_LINES: readonly BusLine[] = [
  { id: '16', name: 'Buss 16', color: '#2f8f6d', waypoints: [[8, 12], [8, 26], [16, 26], [24, 26], [32, 26], [44, 26], [52, 26], [52, 34], [44, 34]] },
  { id: '25', name: 'Buss 25', color: '#3a7f8f', waypoints: [[24, 34], [24, 18], [32, 18], [44, 18], [44, 34], [32, 34], [24, 34]] },
  { id: '52', name: 'Buss 52', color: '#3a7f8f', waypoints: [[8, 26], [8, 42], [16, 50], [24, 58], [32, 58], [44, 50], [44, 42], [32, 42], [16, 42], [8, 42]] },
  { id: '60', name: 'Buss 60', color: '#4a7f6f', waypoints: [[60, 12], [60, 26], [68, 34], [76, 26], [84, 18], [92, 26], [84, 34], [76, 42], [68, 34], [60, 26]] },
];
